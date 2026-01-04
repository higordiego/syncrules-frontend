"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { createAccount } from "@/lib/api-accounts"
import { useAccount } from "@/context/AccountContext"

const DEFAULT_ACCOUNT_STORAGE_KEY = "syncrules_default_account"

export function getDefaultAccountId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEFAULT_ACCOUNT_STORAGE_KEY)
}

export function setDefaultAccountId(accountId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(DEFAULT_ACCOUNT_STORAGE_KEY, accountId)
}

export function AccountSelector() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedAccountId, selectedAccount, accounts, isLoading, switchAccount, refreshAccounts } = useAccount()
  const [open, setOpen] = useState(false)

  // Estados para criar organização
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleSelectAccount = (accountId: string) => {
    switchAccount(accountId)
    setOpen(false)
  }

  const handleSetAsDefault = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDefaultAccountId(accountId)
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
        await refreshAccounts()
        switchAccount(response.data.id)

        setIsCreateDialogOpen(false)
        setNewAccountName("")
        setOpen(false)

        toast({
          title: "Organization created",
          description: `${response.data.name} has been created and selected.`,
        })
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

  const isDefault = getDefaultAccountId() === selectedAccountId

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] sm:w-[240px] justify-between bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-blue-400" />
            <span className="truncate font-medium">{selectedAccount?.name || "Select Organization"}</span>
            {isDefault && selectedAccountId && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0 bg-blue-500/20 text-blue-300 border-none">
                Default
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] sm:w-[280px] p-0 bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 text-gray-900 dark:text-slate-200" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search organizations..." className="text-gray-900 dark:text-white" />
          <CommandList>
            <CommandEmpty className="text-gray-600 dark:text-slate-400">No organizations found.</CommandEmpty>
            <CommandGroup heading="Organizations" className="text-gray-600 dark:text-slate-400">
              {Array.isArray(accounts) && accounts.map((account) => {
                const isSelected = account.id === selectedAccountId
                const isAccountDefault = getDefaultAccountId() === account.id

                return (
                  <CommandItem
                    key={account.id}
                    value={account.name}
                    onSelect={() => handleSelectAccount(account.id)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={`h-4 w-4 shrink-0 text-blue-500 ${isSelected ? "opacity-100" : "opacity-0"
                          }`}
                      />
                      <span className="truncate text-gray-900 dark:text-slate-200">{account.name}</span>
                      {isAccountDefault && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0 bg-blue-500/10 text-blue-400 border-none">
                          Default
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 shrink-0 hover:bg-gray-100 dark:hover:bg-white/10 text-xs text-gray-600 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-200"
                      onClick={(e) => handleSetAsDefault(account.id, e)}
                      title="Set as default organization"
                    >
                      Set default
                    </Button>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator className="bg-gray-200 dark:bg-white/10" />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setIsCreateDialogOpen(true)
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 text-blue-600 dark:text-blue-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create new organization</span>
              </CommandItem>
              <CommandItem
                onSelect={handleManageOrganizations}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-slate-400"
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
        <DialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
          <form onSubmit={handleCreateAccount}>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-slate-400">
                Create a new organization to manage your projects and teams.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account-name" className="text-gray-700 dark:text-slate-300">Organization Name *</Label>
                <Input
                  id="account-name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g., My Company, Tech Startup Inc"
                  required
                  autoFocus
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-600 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-slate-500">
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
                className="w-full sm:w-auto border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newAccountName.trim()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500">
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
