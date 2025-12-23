"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Key, Building2, FolderKanban, Globe, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { MCPKey, MCPKeyScope } from "@/lib/api-mcp-keys"
import { createMCPKey, updateMCPKey } from "@/lib/api-mcp-keys"
import { listAccounts, type Account as ApiAccount } from "@/lib/api-accounts"
import { listProjects } from "@/lib/api-projects"
// Removido import de markKeyAsViewed - não marcamos automaticamente após criação
import { getCurrentAccountId } from "@/components/accounts/account-selector"

interface MCPKeyScopeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  existingKey?: MCPKey
}

interface AccountWithProjects extends ApiAccount {
  projects?: Array<{ id: string; name: string; description?: string }>
}

export function MCPKeyScopeDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  existingKey,
}: MCPKeyScopeDialogProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [accounts, setAccounts] = useState<AccountWithProjects[]>([])
  const [hasLoadedProjectsForScope, setHasLoadedProjectsForScope] = useState(false)
  const loadingProjectsRef = useRef<Set<string>>(new Set())
  const loadedAccountsRef = useRef<Set<string>>(new Set())
  const [hasAttemptedToLoadAccounts, setHasAttemptedToLoadAccounts] = useState(false)
  const accountsRef = useRef<AccountWithProjects[]>([])
  const isInitializingRef = useRef(false)
  const hasInitializedRef = useRef(false)
  const prevIsOpenRef = useRef(isOpen)
  const prevExistingKeyIdRef = useRef<string | undefined>(existingKey?.id)
  
  // Sincronizar ref com state para evitar loops
  useEffect(() => {
    accountsRef.current = accounts
  }, [accounts])
  
  // Detectar mudança de isOpen
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    prevIsOpenRef.current = isOpen
    
    // Se fechou, resetar flags
    if (wasOpen && !isOpen) {
      hasInitializedRef.current = false
      isInitializingRef.current = false
      prevExistingKeyIdRef.current = undefined
    }
  }, [isOpen])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scope: "all_projects" as MCPKeyScope,
    accountIds: [] as string[],
    projectSelectionMode: "all" as "all" | "specific", // Para organizações: todos os projetos ou específicos
    projectIds: [] as string[],
  })

  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true)
    try {
      const response = await listAccounts()
      if (response.success && response.data) {
        setAccounts((prev) => {
          // Verificar se realmente precisa atualizar
          const newAccounts = (response.data || []).map((acc: any) => ({ ...acc, projects: [] }))
          // Comparar se mudou
          if (prev.length === newAccounts.length &&
            prev.every((acc, i) => acc.id === newAccounts[i]?.id)) {
            return prev // Não mudou, retornar o mesmo array
          }
          // Reset refs quando carregar novos accounts
          loadedAccountsRef.current.clear()
          return newAccounts
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load organizations",
        })
      }
    } catch (error) {
      console.error("Error loading accounts:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load organizations",
      })
    } finally {
      setIsLoadingAccounts(false)
      setHasAttemptedToLoadAccounts(true)
    }
  }, [toast])

  const loadProjectsForAccounts = useCallback(async (accountIds: string[]): Promise<void> => {
    if (accountIds.length === 0) return

    // Filtrar accounts que já estão sendo carregados ou já foram carregados
    const accountsToLoad = accountIds.filter((id) => {
      return !loadingProjectsRef.current.has(id) && !loadedAccountsRef.current.has(id)
    })

    if (accountsToLoad.length === 0) return

    // Marcar como carregando ANTES de fazer qualquer setState
    accountsToLoad.forEach((id) => loadingProjectsRef.current.add(id))
    setIsLoadingProjects(true)

    try {
      const projectsPromises = accountsToLoad.map(async (accountId) => {
        const response = await listProjects(accountId)
        return { accountId, projects: response.success && response.data ? response.data : [] }
      })

      const results = await Promise.all(projectsPromises)

      // Usar função de atualização para evitar dependências e loops
      // Usar ref para obter o estado atual sem causar re-renderizações
      setAccounts((prev) => {
        // Verificar se realmente precisa atualizar
        let needsUpdate = false
        const updated = prev.map((acc) => {
          const result = results.find((r) => r.accountId === acc.id)
          if (result) {
            const newProjects = result.projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description,
            }))
            const currentProjects = acc.projects || []
            // Comparar se realmente mudou usando comparação profunda
            const projectsChanged = 
              currentProjects.length !== newProjects.length ||
              !currentProjects.every((p, i) => p.id === newProjects[i]?.id)
            
            if (projectsChanged) {
              needsUpdate = true
              return {
                ...acc,
                projects: newProjects,
              }
            }
          }
          return acc
        })
        // Só retornar novo array se realmente mudou - isso evita loops
        if (!needsUpdate) {
          return prev
        }
        return updated
      })

      // Marcar como carregados DEPOIS de atualizar o estado
      accountsToLoad.forEach((id) => {
        loadingProjectsRef.current.delete(id)
        loadedAccountsRef.current.add(id)
      })
    } catch (error) {
      console.error("Error loading projects:", error)
      // Remover da lista de carregando em caso de erro
      accountsToLoad.forEach((id) => loadingProjectsRef.current.delete(id))
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects",
      })
    } finally {
      setIsLoadingProjects(false)
    }
  }, [toast])

  // Carregar organizações ao abrir o diálogo
  useEffect(() => {
    if (!isOpen) return
    
    // Só carregar uma vez quando abrir
    if (!hasAttemptedToLoadAccounts && !isLoadingAccounts && !isInitializingRef.current) {
      loadAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasAttemptedToLoadAccounts, isLoadingAccounts])

  // Carregar projetos das organizações selecionadas (para account com projetos específicos)
  useEffect(() => {
    // Verificar condições antes de executar
    if (formData.scope !== "account" || formData.projectSelectionMode !== "specific" || isLoadingProjects) {
      return
    }

    if (formData.accountIds.length === 0) {
      return
    }

    // Verificar se já temos os projetos carregados usando apenas refs para evitar loops
    const currentAccounts = accountsRef.current
    const accountIdsToLoad = formData.accountIds.filter((accountId) => {
      // Se já está carregando ou já foi carregado, não precisa carregar novamente
      if (loadingProjectsRef.current.has(accountId) || loadedAccountsRef.current.has(accountId)) {
        return false
      }
      // Verificar se já tem projetos carregados
      const account = currentAccounts.find((acc) => acc.id === accountId)
      if (account && account.projects && account.projects.length > 0) {
        return false
      }
      return true
    })

    if (accountIdsToLoad.length > 0) {
      // Usar setTimeout para evitar atualizações síncronas que causam loops
      const timeoutId = setTimeout(() => {
        loadProjectsForAccounts(accountIdsToLoad)
      }, 0)
      
      return () => clearTimeout(timeoutId)
    }
    // Remover loadProjectsForAccounts das dependências para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountIds, formData.projectSelectionMode, formData.scope, isLoadingProjects])

  // Carregar projetos de todas as organizações (para scope project)
  useEffect(() => {
    if (!isOpen || isInitializingRef.current) {
      if (hasLoadedProjectsForScope) {
        setHasLoadedProjectsForScope(false)
      }
      return
    }
    
    if (formData.scope !== "project" || isLoadingProjects || hasLoadedProjectsForScope) {
      return
    }

    // Usar ref em vez de state para evitar loops
    const currentAccounts = accountsRef.current
    const accountIdsToLoad = currentAccounts
      .filter((acc) => {
        // Verificar se já está carregando ou já foi carregado
        if (loadingProjectsRef.current.has(acc.id) || loadedAccountsRef.current.has(acc.id)) {
          return false
        }
        return !acc.projects || acc.projects.length === 0
      })
      .map((acc) => acc.id)
      
    if (accountIdsToLoad.length > 0 && currentAccounts.length > 0) {
      setHasLoadedProjectsForScope(true)
      // Usar setTimeout para evitar atualizações síncronas
      setTimeout(() => {
        loadProjectsForAccounts(accountIdsToLoad)
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.scope, isOpen, isLoadingProjects, hasLoadedProjectsForScope])

  // Inicializar formData quando abrir o diálogo
  useEffect(() => {
    if (!isOpen) {
      // Reset quando fechar o diálogo - usar um timeout para evitar loops
      if (hasInitializedRef.current) {
        // Reset assíncrono para evitar loops
        const timeoutId = setTimeout(() => {
          setFormData({
            name: "",
            description: "",
            scope: "all_projects",
            accountIds: [],
            projectSelectionMode: "all",
            projectIds: [],
          })
          setAccounts([])
          setHasLoadedProjectsForScope(false)
          setHasAttemptedToLoadAccounts(false)
          loadingProjectsRef.current.clear()
          loadedAccountsRef.current.clear()
          hasInitializedRef.current = false
          isInitializingRef.current = false
        }, 100)
        return () => clearTimeout(timeoutId)
      }
      return
    }

    // Verificar se já inicializou para este estado
    const currentKeyId = existingKey?.id
    const keyChanged = prevExistingKeyIdRef.current !== currentKeyId
    
    // Só inicializar se:
    // 1. Ainda não inicializou OU
    // 2. A chave sendo editada mudou
    if (hasInitializedRef.current && !keyChanged) {
      return
    }

    // Marcar como inicializando
    isInitializingRef.current = true
    prevExistingKeyIdRef.current = currentKeyId

    if (existingKey) {
      // Modo edição
      setFormData({
        name: existingKey.name,
        description: existingKey.description || "",
        scope: existingKey.scope,
        accountIds: existingKey.accountIds || (existingKey.accountId ? [existingKey.accountId] : []),
        projectSelectionMode: existingKey.projectIds && existingKey.projectIds.length > 0 ? "specific" : "all",
        projectIds: existingKey.projectIds || [],
      })
      
      // Carregar accounts e projects apenas uma vez quando abrir em modo edição
      if (accounts.length === 0 && !isLoadingAccounts && !hasAttemptedToLoadAccounts) {
        // Usar setTimeout para evitar atualizações síncronas
        setTimeout(() => {
          loadAccounts().then(() => {
            if (existingKey.projectIds && existingKey.projectIds.length > 0) {
              const accountIdsToLoad = existingKey.accountIds || (existingKey.accountId ? [existingKey.accountId] : [])
              if (accountIdsToLoad.length > 0) {
                setTimeout(() => {
                  loadProjectsForAccounts(accountIdsToLoad)
                }, 200)
              }
            }
          })
        }, 0)
      }
    } else {
      // Modo criação - reset
      setFormData({
        name: "",
        description: "",
        scope: "all_projects",
        accountIds: [],
        projectSelectionMode: "all",
        projectIds: [],
      })
    }
    
    // Marcar como inicializado após um pequeno delay
    setTimeout(() => {
      hasInitializedRef.current = true
      isInitializingRef.current = false
    }, 50)
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingKey?.id])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      // Validações
      if (!formData.name.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Key name is required",
        })
        return
      }

      if (formData.scope === "account" && formData.accountIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one organization",
        })
        return
      }

      if (formData.scope === "account" && formData.projectSelectionMode === "specific" && formData.projectIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one project",
        })
        return
      }

      if (formData.scope === "project" && formData.projectIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one project",
        })
        return
      }

      try {
        setIsSaving(true)

        const baseData: any = {
          name: formData.name,
          description: formData.description,
          scope: formData.scope,
        }

        if (formData.scope === "account") {
          // Múltiplas organizações
          baseData.accountIds = formData.accountIds
          if (formData.projectSelectionMode === "specific") {
            baseData.projectIds = formData.projectIds
          }
        } else if (formData.scope === "project") {
          baseData.projectIds = formData.projectIds
        }

        if (existingKey) {
          const response = await updateMCPKey(existingKey.id, baseData)
          if (response.success) {
            toast({
              title: "Success",
              description: "MCP key updated successfully",
            })
            onSuccess()
            onOpenChange(false)
          }
        } else {
          const response = await createMCPKey(baseData)
          if (response.success && response.data) {
            // Não marcar como vista automaticamente - o usuário deve clicar em "Reveal" na página principal
            toast({
              title: "Success",
              description: "MCP key created successfully! Click 'Reveal' to view the key. It will only be shown once.",
              duration: 8000,
            })
            onSuccess()
            onOpenChange(false)
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: existingKey ? "Failed to update MCP key" : "Failed to create MCP key",
        })
      } finally {
        setIsSaving(false)
      }
    }

    const getScopeIcon = (scope: MCPKeyScope) => {
      switch (scope) {
        case "all_projects":
          return <Globe className="h-5 w-5 text-blue-500" />
        case "account":
          return <Building2 className="h-5 w-5 text-purple-500" />
        case "project":
          return <FolderKanban className="h-5 w-5 text-green-500" />
      }
    }

    const getScopeDescription = (scope: MCPKeyScope) => {
      switch (scope) {
        case "all_projects":
          return "Access to all projects across all your organizations"
        case "account":
          return formData.accountIds.length > 0
            ? `Access to ${formData.projectSelectionMode === "all" ? "all projects" : "selected projects"} in ${formData.accountIds.length} organization(s)`
            : "Select one or more organizations to grant access"
        case "project":
          return formData.projectIds.length > 0
            ? `Access to ${formData.projectIds.length} selected project(s)`
            : "Select specific project(s) to grant access"
      }
    }

    // Obter todos os projetos disponíveis das organizações selecionadas
    const getAvailableProjects = () => {
      if (formData.scope === "account" && formData.accountIds.length > 0) {
        return accounts
          .filter((acc) => formData.accountIds.includes(acc.id))
          .flatMap((acc) =>
            (acc.projects || []).map((p) => ({
              ...p,
              accountId: acc.id,
              accountName: acc.name,
            }))
          )
      }
      return []
    }

    const availableProjects = getAvailableProjects()

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              {existingKey ? "Edit MCP Key Scope" : "Create New MCP Key"}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {existingKey
                ? "Update the scope and permissions for this MCP key"
                : "Create a new MCP API key. The key will be generated automatically by the backend and shown only once after creation."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="key-name" className="text-sm font-semibold">
                  Key Name *
                </Label>
                <Input
                  id="key-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production Key, Development Key"
                  className="h-11"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="key-description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="key-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this key for?"
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Scope Selection */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Access Scope *</Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* All Projects */}
                  <Card
                    className={`cursor-pointer transition-all hover:border-primary/50 ${formData.scope === "all_projects" ? "border-primary border-2 bg-primary/5" : ""
                      }`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        scope: "all_projects",
                        accountIds: [],
                        projectIds: [],
                      }))
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getScopeIcon("all_projects")}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">All Projects</span>
                            {formData.scope === "all_projects" && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Access to all projects across all organizations
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Organization */}
                  <Card
                    className={`cursor-pointer transition-all hover:border-primary/50 ${formData.scope === "account" ? "border-primary border-2 bg-primary/5" : ""
                      }`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        scope: "account",
                        projectIds: [],
                      }))
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getScopeIcon("account")}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">Organization(s)</span>
                            {formData.scope === "account" && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select one or more organizations
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specific Projects */}
                  <Card
                    className={`cursor-pointer transition-all hover:border-primary/50 ${formData.scope === "project" ? "border-primary border-2 bg-primary/5" : ""
                      }`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        scope: "project",
                        accountIds: [],
                        projectSelectionMode: "all",
                      }))
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getScopeIcon("project")}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">Specific Project(s)</span>
                            {formData.scope === "project" && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select specific project(s) only
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scope Description */}
                <div className="p-4 bg-muted/50 rounded-lg border flex items-start gap-3">
                  {getScopeIcon(formData.scope)}
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{getScopeDescription(formData.scope)}</p>
                  </div>
                </div>

                {/* Organization Selection (if scope is account) */}
                {formData.scope === "account" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Select Organization(s) *</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose one or more organizations this key can access
                        </p>
                      </div>
                      {formData.accountIds.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formData.accountIds.length} selected
                        </Badge>
                      )}
                    </div>

                    {isLoadingAccounts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {accounts.map((account) => {
                          const isSelected = formData.accountIds.includes(account.id)
                          return (
                            <div
                              key={account.id}
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                                }`}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    accountIds: prev.accountIds.filter((id) => id !== account.id),
                                    projectIds: prev.projectIds.filter(
                                      (pid) => !account.projects?.some((p) => p.id === pid)
                                    ),
                                  }))
                                } else {
                                  setFormData((prev) => {
                                    const newAccountIds = [...prev.accountIds, account.id]
                                    // Carregar projetos se necessário e se estiver em modo específico
                                    if (prev.scope === "account" && prev.projectSelectionMode === "specific") {
                                      // Verificar se precisa carregar projetos para esta organização
                                      if (!account.projects || account.projects.length === 0) {
                                        if (!loadingProjectsRef.current.has(account.id) && !loadedAccountsRef.current.has(account.id)) {
                                          // Usar setTimeout para evitar loops de atualização
                                          setTimeout(() => {
                                            loadProjectsForAccounts([account.id])
                                          }, 50)
                                        }
                                      }
                                    }
                                    return {
                                      ...prev,
                                      accountIds: newAccountIds,
                                    }
                                  })
                                }
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData((prev) => {
                                      const newAccountIds = [...prev.accountIds, account.id]
                                      // Carregar projetos se necessário e se estiver em modo específico
                                      if (prev.scope === "account" && prev.projectSelectionMode === "specific") {
                                        // Verificar se precisa carregar projetos para esta organização
                                        if (!account.projects || account.projects.length === 0) {
                                          if (!loadingProjectsRef.current.has(account.id) && !loadedAccountsRef.current.has(account.id)) {
                                            // Usar setTimeout para evitar loops de atualização
                                            setTimeout(() => {
                                              loadProjectsForAccounts([account.id])
                                            }, 50)
                                          }
                                        }
                                      }
                                      return {
                                        ...prev,
                                        accountIds: newAccountIds,
                                      }
                                    })
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      accountIds: prev.accountIds.filter((id) => id !== account.id),
                                      projectIds: prev.projectIds.filter(
                                        (pid) => !account.projects?.some((p) => p.id === pid)
                                      ),
                                    }))
                                  }
                                }}
                              />
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{account.name}</p>
                                <p className="text-xs text-muted-foreground">{account.slug}</p>
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Project Selection Mode (if organizations selected) */}
                    {formData.accountIds.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Project Access</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Card
                              className={`cursor-pointer transition-all ${formData.projectSelectionMode === "all"
                                ? "border-primary border-2 bg-primary/5"
                                : "hover:border-primary/50"
                                }`}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  projectSelectionMode: "all",
                                  projectIds: [],
                                }))
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">All Projects</span>
                                  {formData.projectSelectionMode === "all" && (
                                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Access to all projects in selected organizations
                                </p>
                              </CardContent>
                            </Card>

                            <Card
                              className={`cursor-pointer transition-all ${formData.projectSelectionMode === "specific"
                                ? "border-primary border-2 bg-primary/5"
                                : "hover:border-primary/50"
                                }`}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  projectSelectionMode: "specific",
                                }))
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Specific Projects</span>
                                  {formData.projectSelectionMode === "specific" && (
                                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Choose specific projects to grant access
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Project Selection (if specific mode) */}
                          {formData.projectSelectionMode === "specific" && (
                            <div className="space-y-3 mt-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Select Project(s) *</Label>
                                {formData.projectIds.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {formData.projectIds.length} selected
                                  </Badge>
                                )}
                              </div>

                              {isLoadingProjects ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : availableProjects.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  No projects available in selected organizations
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                                  {formData.accountIds.map((accountId) => {
                                    const account = accounts.find((a) => a.id === accountId)
                                    const accountProjects = account?.projects || []
                                    if (accountProjects.length === 0) return null

                                    return (
                                      <div key={accountId} className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Building2 className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            {account?.name}
                                          </span>
                                        </div>
                                        {accountProjects.map((project) => {
                                          const isSelected = formData.projectIds.includes(project.id)
                                          return (
                                            <div
                                              key={project.id}
                                              className={`flex items-center space-x-2 p-2 rounded transition-all cursor-pointer ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                                                }`}
                                              onClick={() => {
                                                if (isSelected) {
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    projectIds: prev.projectIds.filter(
                                                      (id) => id !== project.id
                                                    ),
                                                  }))
                                                } else {
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    projectIds: [...prev.projectIds, project.id],
                                                  }))
                                                }
                                              }}
                                            >
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      projectIds: [...prev.projectIds, project.id],
                                                    }))
                                                  } else {
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      projectIds: prev.projectIds.filter(
                                                        (id) => id !== project.id
                                                      ),
                                                    }))
                                                  }
                                                }}
                                              />
                                              <FolderKanban className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{project.name}</p>
                                                {project.description && (
                                                  <p className="text-xs text-muted-foreground truncate">
                                                    {project.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {formData.projectIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {formData.projectIds.slice(0, 5).map((projectId) => {
                                    const project = availableProjects.find((p) => p.id === projectId)
                                    return (
                                      <Badge key={projectId} variant="secondary" className="text-xs">
                                        {project?.name || projectId}
                                      </Badge>
                                    )
                                  })}
                                  {formData.projectIds.length > 5 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{formData.projectIds.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Project Selection (if scope is project) */}
                {formData.scope === "project" && (
                  <div className="space-y-3 p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Select Project(s) *</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose one or more projects this key can access
                        </p>
                      </div>
                      {formData.projectIds.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formData.projectIds.length} selected
                        </Badge>
                      )}
                    </div>

                    {isLoadingAccounts || isLoadingProjects ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : accounts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No organizations available
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                        {accounts.map((account) => {
                          const accountProjects = account.projects || []

                          // Não renderizar se ainda não carregou projetos (será carregado pelo useEffect)
                          if (accountProjects.length === 0 && !isLoadingProjects) {
                            return null
                          }

                          return (
                            <div key={account.id} className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                  {account.name}
                                </span>
                              </div>
                              {accountProjects.map((project) => {
                                const isSelected = formData.projectIds.includes(project.id)
                                return (
                                  <div
                                    key={project.id}
                                    className={`flex items-center space-x-2 p-2 rounded transition-all cursor-pointer ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                                      }`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          projectIds: prev.projectIds.filter((id) => id !== project.id),
                                        }))
                                      } else {
                                        setFormData((prev) => ({
                                          ...prev,
                                          projectIds: [...prev.projectIds, project.id],
                                        }))
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFormData((prev) => ({
                                            ...prev,
                                            projectIds: [...prev.projectIds, project.id],
                                          }))
                                        } else {
                                          setFormData((prev) => ({
                                            ...prev,
                                            projectIds: prev.projectIds.filter((id) => id !== project.id),
                                          }))
                                        }
                                      }}
                                    />
                                    <FolderKanban className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{project.name}</p>
                                      {project.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {project.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {formData.projectIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.projectIds.slice(0, 5).map((projectId) => {
                          const project = accounts
                            .flatMap((acc) => acc.projects || [])
                            .find((p) => p.id === projectId)
                          return (
                            <Badge key={projectId} variant="secondary" className="text-xs">
                              {project?.name || projectId}
                            </Badge>
                          )
                        })}
                        {formData.projectIds.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{formData.projectIds.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="h-11 w-full sm:w-auto sm:min-w-[120px]">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : existingKey ? (
                  "Update Key"
                ) : (
                  "Create Key"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
}

