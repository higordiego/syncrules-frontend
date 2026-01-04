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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, FolderKanban, Globe, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { MCPKey, MCPKeyScope } from "@/lib/api-mcp-keys"
import { createMCPKey, updateMCPKey } from "@/lib/api-mcp-keys"
import { listProjects } from "@/lib/api-projects"
// Removido import de markKeyAsViewed - não marcamos automaticamente após criação
import { useAccount } from "@/context/AccountContext"

interface MCPKeyScopeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  existingKey?: MCPKey
}


export function MCPKeyScopeDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  existingKey,
}: MCPKeyScopeDialogProps) {
  const { toast } = useToast()
  const { selectedAccountId } = useAccount()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const prevIsOpenRef = useRef(isOpen)
  const prevExistingKeyIdRef = useRef<string | undefined>(existingKey?.id)
  
  // Detectar mudança de isOpen
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    prevIsOpenRef.current = isOpen
    
    // Se fechou, resetar
    if (wasOpen && !isOpen) {
      prevExistingKeyIdRef.current = undefined
    }
  }, [isOpen])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scope: "all_projects" as MCPKeyScope,
    projectIds: [] as string[],
  })

  // Carregar projetos da organização atual
  const loadProjects = useCallback(async () => {
    if (!selectedAccountId) return
    
    setIsLoadingProjects(true)
    try {
      const response = await listProjects()
      if (response.success && response.data) {
        const projectsArray = Array.isArray(response.data) ? response.data : []
        setProjects(projectsArray.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })))
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      setProjects([])
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects",
      })
    } finally {
      setIsLoadingProjects(false)
    }
  }, [selectedAccountId, toast])

  // Carregar projetos quando abrir o diálogo
  const hasLoadedProjectsRef = useRef(false)
  const scopeRef = useRef(formData.scope)
  scopeRef.current = formData.scope
  
  useEffect(() => {
    if (!isOpen || !selectedAccountId) {
      hasLoadedProjectsRef.current = false
      return
    }
    
    // Sempre carregar projetos quando abrir o modal (para verificar se existem)
    if (!isLoadingProjects && !hasLoadedProjectsRef.current) {
      hasLoadedProjectsRef.current = true
      loadProjects()
    }
  }, [isOpen, selectedAccountId, isLoadingProjects, loadProjects])

  // Preservar projectIds quando projetos são carregados (modo edição)
  const savedProjectIdsRef = useRef<string[]>([])
  useEffect(() => {
    if (isOpen && existingKey && formData.scope === "project" && projects.length > 0 && !isLoadingProjects) {
      const existingProjectIds = existingKey.projectIds || []
      
      // Se temos projectIds salvos e eles não estão no formData, restaurar
      if (existingProjectIds.length > 0) {
        const currentIds = formData.projectIds || []
        const allIdsMatch = existingProjectIds.every(id => currentIds.includes(id)) && 
                           currentIds.every(id => existingProjectIds.includes(id))
        
        if (!allIdsMatch) {
          setFormData((prev) => ({
            ...prev,
            projectIds: existingProjectIds,
          }))
        }
      }
    }
  }, [isOpen, existingKey?.projectIds, projects.length, isLoadingProjects, formData.scope])

  // Inicializar formData quando abrir o diálogo
  useEffect(() => {
    if (!isOpen) {
      // Reset quando fechar o diálogo
      setFormData({
        name: "",
        description: "",
        scope: "all_projects",
        projectIds: [],
      })
      setProjects([])
      prevExistingKeyIdRef.current = undefined
      hasLoadedProjectsRef.current = false
      return
    }

    // Verificar se a chave sendo editada mudou
    const currentKeyId = existingKey?.id
    const keyChanged = prevExistingKeyIdRef.current !== currentKeyId
    
    if (keyChanged || (existingKey && prevExistingKeyIdRef.current === undefined)) {
      prevExistingKeyIdRef.current = currentKeyId
      
      if (existingKey) {
        // Modo edição
        // Se o scope for "account", converter para "all_projects" (mesmo comportamento)
        const scope = existingKey.scope === "account" ? "all_projects" : existingKey.scope
        const projectIds = existingKey.projectIds || []
        
        setFormData({
          name: existingKey.name,
          description: existingKey.description || "",
          scope: scope,
          projectIds: projectIds,
        })
        
        // Sempre carregar projetos se scope for "project" (mesmo que não tenha projectIds ainda)
        if (scope === "project" && !hasLoadedProjectsRef.current) {
          hasLoadedProjectsRef.current = true
          // Salvar projectIds para restaurar após carregar projetos
          savedProjectIdsRef.current = projectIds
          loadProjects()
        } else if (scope === "project") {
          // Se já carregou projetos, garantir que projectIds estão corretos
          savedProjectIdsRef.current = projectIds
        }
      } else {
        // Modo criação - reset
        setFormData({
          name: "",
          description: "",
          scope: "all_projects",
          projectIds: [],
        })
      }
    }
  }, [isOpen, existingKey?.id, loadProjects])

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

        // Se o scope for "account", converter para "all_projects" (mesmo comportamento)
        const scope = formData.scope === "account" ? "all_projects" : formData.scope

        const baseData: any = {
          name: formData.name,
          description: formData.description,
          scope: scope,
        }

        // AccountID sempre vem do header X-Account-Id (backend ignora accountIds no body)
        // Não precisamos enviar accountIds, o backend usa automaticamente do header
        if (scope === "project") {
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
        case "project":
          return <FolderKanban className="h-5 w-5 text-green-500" />
        default:
          return <Globe className="h-5 w-5 text-blue-500" />
      }
    }

    const getScopeDescription = (scope: MCPKeyScope) => {
      switch (scope) {
        case "all_projects":
          return "Access to all projects in your current organization"
        case "project":
          return formData.projectIds.length > 0
            ? `Access to ${formData.projectIds.length} selected project(s)`
            : "Select specific project(s) to grant access"
        default:
          return "Access to all projects in your current organization"
      }
    }

    // Obter todos os projetos disponíveis da organização atual
    const getAvailableProjects = () => {
      return projects
    }

    const availableProjects = getAvailableProjects()

    // Handler estável para toggle de projetos - evita loops infinitos
    const handleToggleProject = useCallback((projectId: string) => {
      setFormData((prev) => {
        const isCurrentlySelected = prev.projectIds.includes(projectId)
        
        // Criar novo array para evitar mutação
        if (isCurrentlySelected) {
          return {
            ...prev,
            projectIds: prev.projectIds.filter((id) => id !== projectId),
          }
        } else {
          // Verificar se já está no array antes de adicionar (proteção extra)
          if (prev.projectIds.includes(projectId)) {
            return prev
          }
          return {
            ...prev,
            projectIds: [...prev.projectIds, projectId],
          }
        }
      })
    }, [])

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
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

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
              {/* Alert: Necessário criar projeto */}
              {!existingKey && !isLoadingProjects && projects.length === 0 && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Projeto necessário:</strong> Você precisa criar pelo menos um projeto nesta organização antes de criar uma chave MCP. 
                    Crie um projeto primeiro e depois retorne para criar a chave.
                  </AlertDescription>
                </Alert>
              )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* All Projects */}
                  <Card
                    className={`cursor-pointer transition-all hover:border-primary/50 ${formData.scope === "all_projects" ? "border-primary border-2 bg-primary/5" : ""
                      }`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        scope: "all_projects",
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
                            Access to all projects in your current organization
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
                        projectIds: [],
                      }))
                      // Carregar projetos quando selecionar scope project
                      if (selectedAccountId && projects.length === 0 && !isLoadingProjects && !hasLoadedProjectsRef.current) {
                        hasLoadedProjectsRef.current = true
                        loadProjects()
                      }
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

                    {isLoadingProjects ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No projects available in your organization
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {projects.map((project) => {
                          const isSelected = formData.projectIds.includes(project.id)
                          
                          return (
                            <div
                              key={project.id}
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${isSelected
                                ? "border-primary bg-primary/5"
                                : ""
                                }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  handleToggleProject(project.id)
                                }}
                              />
                              <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{project.name}</p>
                                {project.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {formData.projectIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.projectIds.slice(0, 5).map((projectId) => {
                          const project = projects.find((p) => p.id === projectId)
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

            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="h-11 flex-1 sm:flex-none sm:min-w-[100px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving || (!existingKey && !isLoadingProjects && projects.length === 0)} 
                className="h-11 flex-1 sm:flex-none sm:min-w-[140px]"
              >
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

