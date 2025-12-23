"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, Plus, Building2, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import type { Account } from "@/lib/types/governance"
import { listAccounts, createAccount, type Account as ApiAccount } from "@/lib/api-accounts"

const ACCOUNT_STORAGE_KEY = "syncrules_current_account"
const DEFAULT_ACCOUNT_STORAGE_KEY = "syncrules_default_account"

// Converter ApiAccount para Account
function convertApiAccountToAccount(apiAccount: ApiAccount): Account {
  return {
    id: apiAccount.id,
    name: apiAccount.name,
    slug: apiAccount.slug,
    createdAt: apiAccount.createdAt,
    updatedAt: apiAccount.updatedAt,
    baseFolders: [],
    baseRules: [],
  }
}

export function getCurrentAccountId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCOUNT_STORAGE_KEY)
}

export function setCurrentAccountId(accountId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCOUNT_STORAGE_KEY, accountId)
  // Limpar projeto atual ao trocar de organização
  localStorage.removeItem("syncrules_current_project")
  localStorage.removeItem("syncrules_default_project")
}

export function getDefaultAccountId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEFAULT_ACCOUNT_STORAGE_KEY)
}

export function setDefaultAccountId(accountId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(DEFAULT_ACCOUNT_STORAGE_KEY, accountId)
}

export async function getCurrentAccount(): Promise<Account | null> {
  const accountId = getCurrentAccountId()
  if (!accountId) return null
  
  try {
    const response = await listAccounts()
    if (response.success && response.data) {
      const account = response.data.find((a) => a.id === accountId)
      if (account) {
        return convertApiAccountToAccount(account)
      }
    }
  } catch (error) {
    console.error("Failed to fetch current account:", error)
  }
  
  return null
}

interface AccountSelectorProps {
  accounts?: Account[]
  onAccountChange?: (accountId: string) => void
}

export function AccountSelector({ accounts: propAccounts, onAccountChange }: AccountSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [currentAccountId, setCurrentAccountIdState] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>(propAccounts || [])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para criar organização
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Função para buscar accounts da API
  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await listAccounts()
      if (response.success && response.data) {
        const convertedAccounts = response.data.map(convertApiAccountToAccount)
        setAccounts(convertedAccounts)
      } else {
        // Se API falhar, manter array vazio
        setAccounts([])
        toast({
          title: "Error",
          description: response.error?.message || "Failed to load organizations",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      // Se API falhar, manter array vazio
      setAccounts([])
      toast({
        title: "Error",
        description: "Failed to load organizations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar accounts da API ao montar componente
  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    // Prioridade: localStorage > default > primeiro account
    const stored = getCurrentAccountId()
    const defaultAccount = getDefaultAccountId()
    
    let initialAccountId: string | null = null
    
    if (stored) {
      initialAccountId = stored
    } else if (defaultAccount) {
      initialAccountId = defaultAccount
      setCurrentAccountId(defaultAccount)
    } else if (accounts.length > 0) {
      initialAccountId = accounts[0].id
      setCurrentAccountId(accounts[0].id)
    }
    
    if (initialAccountId) {
      setCurrentAccountIdState(initialAccountId)
    }
  }, [accounts])

  const currentAccount = accounts.find((a) => a.id === currentAccountId) || (accounts.length > 0 ? accounts[0] : null)

  const handleSelectAccount = (accountId: string) => {
    setCurrentAccountId(accountId)
    setCurrentAccountIdState(accountId)
    setOpen(false)
    
    if (onAccountChange) {
      onAccountChange(accountId)
    }

    // Redirecionar para a página do account
    router.push("/account")

    toast({
      title: "Organization switched",
      description: `Switched to ${accounts.find((a) => a.id === accountId)?.name || "organization"}`,
    })
  }

  const handleSetAsDefault = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDefaultAccountId(accountId)
    setCurrentAccountId(accountId)
    setCurrentAccountIdState(accountId)
    
    toast({
      title: "Default organization set",
      description: `${accounts.find((a) => a.id === accountId)?.name || "Organization"} is now your default`,
    })
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName.trim()) return

    setIsCreating(true)
    try {
      const response = await createAccount({ name: newAccountName.trim() })
      if (response.success && response.data) {
        // Recarregar lista de accounts da API
        await fetchAccounts()
        
        // Selecionar automaticamente a nova organização
        setCurrentAccountId(response.data.id)
        setCurrentAccountIdState(response.data.id)
        setDefaultAccountId(response.data.id)
        
        // Fechar diálogos
        setIsCreateDialogOpen(false)
        setNewAccountName("")
        setOpen(false)
        
        toast({
          title: "Organization created",
          description: `${response.data.name} has been created and selected.`,
        })
        
        // Redirecionar para a página do account
        router.push("/account")
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to create organization",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleManageOrganizations = () => {
    setOpen(false)
    router.push("/account/organizations")
  }

  if (!currentAccount) {
    return (
      <Button variant="outline" asChild>
        <Link href="/account">
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Link>
      </Button>
    )
  }

  const isDefault = getDefaultAccountId() === currentAccount.id

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] sm:w-[240px] justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{currentAccount.name}</span>
            {isDefault && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Default
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] sm:w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {accounts.map((account) => {
                const isSelected = account.id === currentAccountId
                const isAccountDefault = getDefaultAccountId() === account.id

                return (
                  <CommandItem
                    key={account.id}
                    value={account.name}
                    onSelect={() => handleSelectAccount(account.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span className="truncate">{account.name}</span>
                      {isAccountDefault && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Default
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 shrink-0"
                      onClick={(e) => handleSetAsDefault(account.id, e)}
                      title="Set as default organization"
                    >
                      <span className="text-xs">Set default</span>
                    </Button>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setIsCreateDialogOpen(true)
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create new organization</span>
              </CommandItem>
              <CommandItem
                onSelect={handleManageOrganizations}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Manage organizations</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      
      {/* Dialog para criar organização */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateAccount}>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to manage your projects and teams.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Organization Name *</Label>
                <Input
                  id="account-name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g., My Company, Tech Startup Inc"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Choose a name for your organization
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setNewAccountName("")
                }}
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newAccountName.trim()} className="w-full sm:w-auto">
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Popover>
  )
}

