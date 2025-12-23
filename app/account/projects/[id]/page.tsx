"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FolderKanban,
  Folder as FolderIcon,
  FileText,
  Settings,
  BarChart3,
  GitBranch,
  ArrowLeft,
  Loader2,
} from "lucide-react"
// Removed mock imports - using API calls instead
import { GovernanceBadge } from "@/components/governance/governance-badge"
import { InheritanceIndicator } from "@/components/governance/inheritance-indicator"
import { SourceOfTruthIndicator } from "@/components/governance/source-of-truth-indicator"
import { PermissionManager } from "@/components/governance/permission-manager"
import { PermissionBadge } from "@/components/governance/permission-badge"
import { RulesManager } from "@/components/projects/rules-manager"
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog"
import { ProjectGeneralSettings } from "@/components/projects/project-general-settings"
import { ProjectMetricsTab } from "@/components/metrics/project-metrics-tab"
import { ProjectSyncSettings } from "@/components/projects/project-sync-settings"
import { useProjectActions } from "@/lib/actions/project-actions"
import { usePermissionActions } from "@/lib/actions/permission-actions"
import { useFolderActions } from "@/lib/actions/folder-actions"
import { useUserSearchActions } from "@/lib/actions/user-search-actions"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { getCurrentAccountId } from "@/components/accounts/account-selector"
import { getProject, listProjects } from "@/lib/api-projects"
import { listFolders } from "@/lib/api-folders"
import { listRulesByProject } from "@/lib/api-rules"
import { listGroups, listGroupMembers } from "@/lib/api-groups"
import { listAccountMembers } from "@/lib/api-account-members"
import { searchUserByEmail as searchUserAPI } from "@/lib/api-users"
import { getMe } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { InheritanceMode, Permission, PermissionType, User, Project, Folder, Rule } from "@/lib/types/governance"
import type { Group as ApiGroup } from "@/lib/api-groups"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const projectId = params.id as string
  const currentAccountId = getCurrentAccountId()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [accountProjects, setAccountProjects] = useState<Project[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [groups, setGroups] = useState<ApiGroup[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [userGroups, setUserGroups] = useState<ApiGroup[]>([])
  const [recentlyInvited, setRecentlyInvited] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [isLoadingRules, setIsLoadingRules] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)

  // Actions hooks - TODOS OS HOOKS DEVEM SER CHAMADOS ANTES DE QUALQUER EARLY RETURN
  const { updateInheritanceMode, detachFolder, reSyncFolder, ConfirmDialog: ProjectConfirmDialog } = useProjectActions()
  const {
    addPermission,
    updatePermission,
    removePermission,
    toggleInheritPermissions,
    ConfirmDialog: PermissionConfirmDialog,
  } = usePermissionActions()
  const { manageFolder } = useFolderActions()
  const { searchUserByEmail } = useUserSearchActions()

  // State for inheritance mode change - usar valores padrão que serão atualizados quando project for carregado
  const [newInheritanceMode, setNewInheritanceMode] = useState<InheritanceMode>("full")
  const [isChangingInheritance, setIsChangingInheritance] = useState(false)

  // State for permissions (simulado - em produção viria do estado global/API)
  const [projectPermissions, setProjectPermissions] = useState<Permission[]>([])
  const [inheritPermissions, setInheritPermissions] = useState<boolean>(false)

  // Buscar projeto da API
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !currentAccountId) {
        setIsLoadingProject(false)
        return
      }

      setIsLoadingProject(true)
      try {
        const response = await getProject(projectId)
        if (response.success && response.data) {
          // Verificar se o projeto pertence à organização atual
          if (response.data.accountId !== currentAccountId) {
            toast({
              title: "Access Denied",
              description: "This project doesn't belong to the current organization.",
              variant: "destructive",
            })
            router.push("/account")
            return
          }

          const projectData: Project = {
            id: response.data.id,
            accountId: response.data.accountId,
            name: response.data.name,
            slug: response.data.slug,
            description: response.data.description,
            inheritanceMode: response.data.inheritanceMode || "full",
            permissions: [],
            inheritPermissions: false,
            folders: [],
            rules: [],
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          }
          setProject(projectData)
          // Atualizar estados dependentes do projeto
          setNewInheritanceMode(projectData.inheritanceMode)
          setProjectPermissions(projectData.permissions || [])
          setInheritPermissions(projectData.inheritPermissions || false)
        } else {
          toast({
            title: "Project Not Found",
            description: response.error?.message || "The project you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/account")
        }
      } catch (error) {
        console.error("Failed to fetch project:", error)
        toast({
          title: "Error",
          description: "Failed to load project. Please try again.",
          variant: "destructive",
        })
        router.push("/account")
      } finally {
        setIsLoadingProject(false)
      }
    }

    fetchProject()
  }, [projectId, currentAccountId, router, toast])

  // Buscar projetos da organização atual
  useEffect(() => {
    const fetchAccountProjects = async () => {
      if (!currentAccountId) return

      try {
        const response = await listProjects(currentAccountId)
        if (response.success && response.data) {
          const projectsArray = Array.isArray(response.data) ? response.data : []
          const projectsData: Project[] = projectsArray.map((p: any) => ({
            id: p.id,
            accountId: p.accountId,
            name: p.name,
            slug: p.slug,
            description: p.description,
            inheritanceMode: p.inheritanceMode || "full",
            permissions: [],
            inheritPermissions: false,
            folders: [],
            rules: [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }))
          setAccountProjects(projectsData)
        }
      } catch (error) {
        console.error("Failed to fetch account projects:", error)
      }
    }

    fetchAccountProjects()
  }, [currentAccountId])

  // Buscar folders do projeto
  useEffect(() => {
    const fetchFolders = async () => {
      if (!projectId) return

      setIsLoadingFolders(true)
      try {
        const response = await listFolders({ projectId })
        if (response.success && response.data) {
          const foldersArray = Array.isArray(response.data) ? response.data : []
          setFolders(foldersArray)
        }
      } catch (error) {
        console.error("Failed to fetch folders:", error)
        setFolders([])
      } finally {
        setIsLoadingFolders(false)
      }
    }

    fetchFolders()
  }, [projectId])

  // Buscar rules do projeto
  useEffect(() => {
    const fetchRules = async () => {
      if (!projectId) return

      setIsLoadingRules(true)
      try {
        const response = await listRulesByProject(projectId)
        if (response.success && response.data) {
          const rulesArray = Array.isArray(response.data) ? response.data : []
          setRules(rulesArray)
        }
      } catch (error) {
        console.error("Failed to fetch rules:", error)
        setRules([])
      } finally {
        setIsLoadingRules(false)
      }
    }

    fetchRules()
  }, [projectId])

  // Buscar grupos da organização
  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentAccountId) return

      setIsLoadingGroups(true)
      try {
        const response = await listGroups(currentAccountId)
        if (response.success && response.data) {
          const groupsArray = Array.isArray(response.data) ? response.data : []
          // Converter ApiGroup para Group do tipo governance
          const groupsWithMembers: ApiGroup[] = []
          for (const group of groupsArray) {
            try {
              const membersResponse = await listGroupMembers(group.id)
              if (membersResponse.success && membersResponse.data) {
                const membersArray = Array.isArray(membersResponse.data) ? membersResponse.data : []
                groupsWithMembers.push({
                  ...group,
                  // Adicionar membros se necessário
                })
              } else {
                groupsWithMembers.push(group)
              }
            } catch {
              groupsWithMembers.push(group)
            }
          }
          setGroups(groupsWithMembers)
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error)
        setGroups([])
      } finally {
        setIsLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [currentAccountId])

  // Buscar usuário atual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await getMe()
        if (response.success && response.data) {
          setCurrentUserId(response.data.id)
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error)
      }
    }

    fetchCurrentUser()
  }, [])

  // Buscar membros da organização (availableUsers)
  useEffect(() => {
    const fetchAccountMembers = async () => {
      if (!currentAccountId) return

      try {
        const response = await listAccountMembers(currentAccountId)
        if (response.success && response.data) {
          const membersArray = Array.isArray(response.data) ? response.data : []
          const users: User[] = membersArray.map((m: any) => ({
            id: m.userId,
            email: m.userEmail || "",
            name: m.userName || "",
            picture: m.userPicture,
          }))
          setAvailableUsers(users)
        }
      } catch (error) {
        console.error("Failed to fetch account members:", error)
        setAvailableUsers([])
      }
    }

    fetchAccountMembers()
  }, [currentAccountId])

  // Buscar grupos do usuário atual
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUserId || !groups.length) return

      try {
        const userGroupsList: ApiGroup[] = []
        for (const group of groups) {
          const response = await listGroupMembers(group.id)
          if (response.success && response.data) {
            const membersArray = Array.isArray(response.data) ? response.data : []
            const isMember = membersArray.some((m: any) => m.userId === currentUserId)
            if (isMember) {
              userGroupsList.push(group)
            }
          }
        }
        setUserGroups(userGroupsList)
      } catch (error) {
        console.error("Failed to fetch user groups:", error)
        setUserGroups([])
      }
    }

    fetchUserGroups()
  }, [currentUserId, groups])

  // Buscar convites recentes
  useEffect(() => {
    const fetchRecentInvites = async () => {
      if (!currentAccountId) return

      try {
        // TODO: Implementar API para buscar convites recentes
        // Por enquanto, deixar vazio
        setRecentlyInvited([])
      } catch (error) {
        console.error("Failed to fetch recent invites:", error)
        setRecentlyInvited([])
      }
    }

    fetchRecentInvites()
  }, [currentAccountId])

  // Verificar se usuário tem permissão para ver outros usuários
  // TODO: Implementar verificação real de permissões via API
  const canViewOtherUsers = true // Por enquanto sempre true, implementar verificação real depois

  const handleEmailSearch = async (email: string): Promise<User | null> => {
    try {
      const response = await searchUserAPI(email)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (error) {
      console.error("Failed to search user:", error)
      return null
    }
  }

  if (isLoadingProject) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Project not found or doesn't belong to current organization</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Folders e rules já estão nos estados, buscados da API
  // Metrics será implementado depois via API de usage
  const metrics = {
    projectId: projectId,
    totalCalls: 0,
    callsByRule: [],
    callsByIDE: [],
    adoptionTrend: [],
  }

  const syncedCount = folders.filter((f) => f.syncStatus === "synced").length
  const detachedCount = folders.filter((f) => f.syncStatus === "detached").length

  const handleInheritanceChange = async () => {
    setIsChangingInheritance(true)
    await updateInheritanceMode({
      projectId,
      mode: newInheritanceMode,
      onSuccess: async () => {
        // Recarregar projeto para obter dados atualizados
        try {
          const response = await getProject(projectId)
          if (response.success && response.data) {
            const projectData: Project = {
              id: response.data.id,
              accountId: response.data.accountId,
              name: response.data.name,
              slug: response.data.slug,
              description: response.data.description,
              inheritanceMode: response.data.inheritanceMode || "full",
              permissions: [],
              inheritPermissions: false,
              folders: [],
              rules: [],
              createdAt: response.data.createdAt,
              updatedAt: response.data.updatedAt,
            }
            setProject(projectData)
            setNewInheritanceMode(projectData.inheritanceMode)
            // Recarregar folders também
            const foldersResponse = await listFolders({ projectId })
            if (foldersResponse.success && foldersResponse.data) {
              const foldersArray = Array.isArray(foldersResponse.data) ? foldersResponse.data : []
              setFolders(foldersArray)
            }
          }
        } catch (error) {
          console.error("Failed to reload project:", error)
        } finally {
          setIsChangingInheritance(false)
        }
      },
    })
  }

  const handleDetachFolder = async (folderId: string, folderName: string) => {
    await detachFolder({
      folderId,
      projectId,
      folderName,
      onSuccess: async () => {
        // Recarregar folders
        try {
          const response = await listFolders({ projectId })
          if (response.success && response.data) {
            const foldersArray = Array.isArray(response.data) ? response.data : []
            setFolders(foldersArray)
          }
        } catch (error) {
          console.error("Failed to reload folders:", error)
        }
      },
    })
  }

  const handleReSyncFolder = async (folderId: string, folderName: string) => {
    await reSyncFolder({
      folderId,
      projectId,
      folderName,
      onSuccess: async () => {
        // Recarregar folders
        try {
          const response = await listFolders({ projectId })
          if (response.success && response.data) {
            const foldersArray = Array.isArray(response.data) ? response.data : []
            setFolders(foldersArray)
          }
        } catch (error) {
          console.error("Failed to reload folders:", error)
        }
      },
    })
  }

  const handleAddPermission = async (permission: Omit<Permission, "id" | "grantedAt" | "grantedBy">) => {
    await addPermission({
      resourceType: "project",
      resourceId: projectId,
      resourceName: project.name,
      permission,
      onSuccess: () => {
        // Adicionar permissão ao estado local
        const newPermission: Permission = {
          ...permission,
          id: `perm-${Date.now()}`,
          grantedBy: "current-user-id", // Em produção viria do contexto
          grantedAt: new Date().toISOString(),
        }
        setProjectPermissions([...projectPermissions, newPermission])
      },
    })
  }

  const handleUpdatePermission = async (permissionId: string, permissionType: PermissionType) => {
    await updatePermission({
      permissionId,
      resourceType: "project",
      resourceId: projectId,
      permissionType,
      onSuccess: () => {
        // Atualizar permissão no estado local
        setProjectPermissions(
          projectPermissions.map((p) =>
            p.id === permissionId ? { ...p, permissionType } : p
          )
        )
      },
    })
  }

  const handleRemovePermission = async (permissionId: string) => {
    const permission = projectPermissions.find((p) => p.id === permissionId)
    if (!permission) return

    await removePermission({
      permissionId,
      resourceType: "project",
      resourceId: projectId,
      targetName: permission.targetName,
      onSuccess: () => {
        // Remover permissão do estado local
        setProjectPermissions(projectPermissions.filter((p) => p.id !== permissionId))
      },
    })
  }

  const handleToggleInheritPermissions = async (enabled: boolean) => {
    await toggleInheritPermissions({
      resourceType: "project",
      resourceId: projectId,
      enabled,
      onSuccess: () => {
        setInheritPermissions(enabled)
      },
    })
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/account">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Account
                    </Link>
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                      <FolderKanban className="h-8 w-8" />
                      {project.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InheritanceIndicator
                    mode={project.inheritanceMode}
                    syncedCount={syncedCount}
                    detachedCount={detachedCount}
                  />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Folders</CardTitle>
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{folders.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {syncedCount} synced, {detachedCount} detached
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rules</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{rules.length}</div>
                    <p className="text-xs text-muted-foreground">Total rules</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MCP Calls</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalCalls.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total usage</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inheritance</CardTitle>
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{project.inheritanceMode}</div>
                    <p className="text-xs text-muted-foreground">Mode</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="folders" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="folders">Folders</TabsTrigger>
                  <TabsTrigger value="rules">Rules</TabsTrigger>
                  <TabsTrigger value="inheritance">Inheritance</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="sync">Sync Settings</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="settings">General Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="folders" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Folders</CardTitle>
                      <CardDescription>
                        Manage folders and their inheritance status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {folders.map((folder) => (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <FolderIcon className="h-5 w-5 text-blue-500" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{folder.name}</span>
                                  <GovernanceBadge
                                    syncStatus={folder.syncStatus}
                                    folderStatus={folder.folderStatus}
                                    inheritedFrom={folder.inheritedFrom}
                                    sourceOfTruth={folder.sourceOfTruth}
                                  />
                                  <SourceOfTruthIndicator source={folder.sourceOfTruth} />
                                  {folder.permissions && folder.permissions.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {folder.permissions.slice(0, 2).map((perm) => (
                                        <PermissionBadge
                                          key={perm.id}
                                          permissionType={perm.permissionType}
                                          targetType={perm.targetType}
                                        />
                                      ))}
                                      {folder.permissions.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{folder.permissions.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{folder.path}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {folder.ruleCount} rules
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {folder.syncStatus === "synced" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDetachFolder(folder.id, folder.name)}
                                >
                                  Detach
                                </Button>
                              )}
                              {folder.syncStatus === "detached" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReSyncFolder(folder.id, folder.name)}
                                >
                                  Re-sync
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                  <RulesManager
                    projectId={projectId}
                    folders={folders}
                    availableUsers={availableUsers}
                    availableGroups={groups.map((g) => ({
                      id: g.id,
                      accountId: g.accountIds?.[0] || currentAccountId || "",
                      name: g.name,
                      description: g.description,
                      members: [],
                      createdAt: g.createdAt,
                      updatedAt: g.updatedAt,
                    }))}
                  />
                </TabsContent>

                <TabsContent value="inheritance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inheritance Configuration</CardTitle>
                      <CardDescription>
                        Configure how this project inherits from the Account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Current Mode</span>
                            <InheritanceIndicator
                              mode={project.inheritanceMode}
                              syncedCount={syncedCount}
                              detachedCount={detachedCount}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {project.inheritanceMode === "full" &&
                              "All folders are synced from Account. Changes propagate automatically."}
                            {project.inheritanceMode === "partial" &&
                              `Some folders are synced (${syncedCount}), some are detached (${detachedCount}).`}
                            {project.inheritanceMode === "none" &&
                              "No inheritance from Account. All folders are local to this project."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>New Inheritance Mode</Label>
                              <p className="text-xs text-muted-foreground">
                                Choose how this project inherits folders and rules from the Account
                              </p>
                            </div>
                            <Select
                              value={newInheritanceMode}
                              onValueChange={(value) => setNewInheritanceMode(value as InheritanceMode)}
                            >
                              <SelectTrigger className="h-auto min-h-[3.5rem] py-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="p-2">
                                <SelectItem value="full" className="px-3 py-4 rounded-lg cursor-pointer focus:bg-accent">
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <span className="font-semibold text-base leading-tight">Full Inheritance</span>
                                    <span className="text-sm text-muted-foreground leading-relaxed">
                                      All Account folders synced automatically
                                    </span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="partial" className="px-3 py-4 rounded-lg cursor-pointer focus:bg-accent">
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <span className="font-semibold text-base leading-tight">Partial Inheritance</span>
                                    <span className="text-sm text-muted-foreground leading-relaxed">
                                      Choose which folders to sync
                                    </span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="none" className="px-3 py-4 rounded-lg cursor-pointer focus:bg-accent">
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <span className="font-semibold text-base leading-tight">No Inheritance</span>
                                    <span className="text-sm text-muted-foreground leading-relaxed">
                                      All folders local to project
                                    </span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {newInheritanceMode !== project.inheritanceMode && (
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                              <p className="text-sm text-amber-900 dark:text-amber-100">
                                {newInheritanceMode === "none" &&
                                  syncedCount > 0 &&
                                  `⚠️ Warning: ${syncedCount} synced folder(s) will be detached.`}
                                {newInheritanceMode === "full" &&
                                  "All Account folders will be synced to this project."}
                                {newInheritanceMode === "partial" &&
                                  "You can choose which folders to sync or detach."}
                              </p>
                            </div>
                          )}

                          <Button
                            onClick={handleInheritanceChange}
                            disabled={isChangingInheritance || newInheritanceMode === project.inheritanceMode}
                          >
                            {isChangingInheritance ? "Changing..." : "Change Inheritance Mode"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <PermissionManager
                    permissions={projectPermissions}
                    inheritPermissions={inheritPermissions}
                    onInheritToggle={handleToggleInheritPermissions}
                    onAddPermission={handleAddPermission}
                    onRemovePermission={handleRemovePermission}
                    onUpdatePermission={handleUpdatePermission}
                    availableUsers={availableUsers}
                    availableGroups={groups.map((g) => ({
                      id: g.id,
                      accountId: g.accountIds?.[0] || currentAccountId || "",
                      name: g.name,
                      description: g.description,
                      members: [], // TODO: Buscar membros do grupo
                      createdAt: g.createdAt,
                      updatedAt: g.updatedAt,
                    }))}
                    currentUserId={currentUserId || undefined}
                    userGroups={userGroups.map((g) => ({
                      id: g.id,
                      accountId: g.accountIds?.[0] || currentAccountId || "",
                      name: g.name,
                      description: g.description,
                      members: [], // TODO: Buscar membros do grupo
                      createdAt: g.createdAt,
                      updatedAt: g.updatedAt,
                    }))}
                    recentlyInvited={recentlyInvited}
                    usersYouInvited={[]} // TODO: Implementar busca de usuários que você convidou
                    canViewOtherUsers={canViewOtherUsers}
                    onEmailSearch={handleEmailSearch}
                    resourceType="project"
                    resourceName={project.name}
                  />
                </TabsContent>

                <TabsContent value="sync" className="space-y-4">
                  <ProjectSyncSettings
                    projectId={project.id}
                    projectName={project.name}
                    availableProjects={accountProjects}
                    hasPermission={true} // TODO: Verificar permissão real do usuário
                  />
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <ProjectMetricsTab metrics={metrics} />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <ProjectGeneralSettings project={project} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      {/* Confirm Dialogs */}
      <ProjectConfirmDialog />
      <PermissionConfirmDialog />
    </ProtectedRoute>
  )
}

