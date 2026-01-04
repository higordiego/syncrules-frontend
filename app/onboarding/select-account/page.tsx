"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Plus, ArrowRight, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createAccount } from "@/lib/api-accounts"
import { useAccount } from "@/context/AccountContext"

function SelectAccountContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { accounts, isLoading: isAccountsLoading, switchAccount, refreshAccounts } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [accountName, setAccountName] = useState("")

  // Se não tiver accounts, mostrar formulário de criação automaticamente
  useEffect(() => {
    if (!isAccountsLoading && accounts.length === 0) {
      setShowCreateForm(true)
    }
  }, [isAccountsLoading, accounts])

  const handleSelectAccount = (accountId: string) => {
    switchAccount(accountId)
    // Redirecionamento é tratado pelo switchAccount ou useEffect se necessário, 
    // mas aqui fazemos manual para garantir
    router.push("/account")
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return

    setIsCreating(true)
    try {
      const response = await createAccount({ name: accountName.trim() })
      if (response.success && response.data) {
        toast({
          title: "Organization created",
          description: `${response.data.name} has been created successfully.`,
        })

        // Recarregar lista no context
        await refreshAccounts()
        setShowCreateForm(false)
        setAccountName("")

        // Selecionar automaticamente
        switchAccount(response.data.id)

        setTimeout(() => {
          router.push("/account")
        }, 500)
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

  if (isAccountsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="w-full max-w-2xl">
          <Card className="border-2 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading organizations...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">
                {showCreateForm && accounts.length === 0
                  ? "Create Your Organization"
                  : "Select Your Organization"}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {showCreateForm && accounts.length === 0
                  ? "Create your first organization to get started"
                  : accounts.length > 0
                    ? "Choose an organization to continue, or create a new one"
                    : "Create your first organization to get started"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mostrar lista de organizações apenas se não estiver no modo criação e houver organizações */}
            {!showCreateForm && accounts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Your Organizations</Label>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectAccount(account.id)}
                      className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div className="text-left">
                          <p className="font-semibold text-base">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.slug}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário de criação - sempre visível se não houver organizações ou se usuário clicar em criar */}
            {showCreateForm ? (
              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="account-name" className="text-sm font-semibold">
                    Organization Name *
                  </Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g., My Company, Tech Startup Inc"
                    className="h-11 text-base"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a name for your organization
                  </p>
                </div>

                <div className="flex gap-3">
                  {accounts.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        setAccountName("")
                      }}
                      className="flex-1"
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isCreating || !accountName.trim()}
                    className={accounts.length > 0 ? "flex-1" : "w-full"}
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        {accounts.length === 0 ? "Create Your First Organization" : "Create Organization"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              accounts.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Organization
                </Button>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SelectAccountPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <div className="w-full max-w-2xl">
              <Card className="border-2 shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        }
      >
        <SelectAccountContent />
      </Suspense>
    </ProtectedRoute>
  )
}

