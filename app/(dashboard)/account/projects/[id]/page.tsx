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
  ArrowDown,
  Loader2,
  Users,
  TrendingUp,
  Share2,
} from "lucide-react"
// Removed mock imports - using API calls instead
import { PermissionManager } from "@/components/governance/permission-manager"
import { PermissionBadge } from "@/components/governance/permission-badge"
import { RulesManager } from "@/components/projects/rules-manager"
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog"
import { ProjectGeneralSettings } from "@/components/projects/project-general-settings"

import { useProjectActions } from "@/lib/actions/project-actions"
import { usePermissionActions } from "@/lib/actions/permission-actions"
import { useFolderActions } from "@/lib/actions/folder-actions"
import { useUserSearchActions } from "@/lib/actions/user-search-actions"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { useAccount } from "@/context/AccountContext"
import { getProject, listProjects } from "@/lib/api-projects"
import { listFolders } from "@/lib/api-folders"
import { listRulesByProject } from "@/lib/api-rules"
import { listGroups, listGroupMembers } from "@/lib/api-groups"
import { listAccountMembers } from "@/lib/api-account-members"
import { searchUserByEmail as searchUserAPI } from "@/lib/api-users"
import { getMe } from "@/lib/api"
import { listProjectPermissions } from "@/lib/api-project-permissions"
import { useToast } from "@/components/ui/use-toast"
import type { Permission, PermissionType, User, Project, Folder, Rule } from "@/lib/types/governance"
import type { Group as ApiGroup } from "@/lib/api-groups"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { selectedAccountId: currentAccountId } = useAccount()
  const projectId = params.id as string
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
  const [activeTab, setActiveTab] = useState<string>("folders")

  // Actions hooks - TODOS OS HOOKS DEVEM SER CHAMADOS ANTES DE QUALQUER EARLY RETURN
  const { ConfirmDialog: ProjectConfirmDialog } = useProjectActions()
  const {
    addPermission,
    updatePermission,
    removePermission,
    ConfirmDialog: PermissionConfirmDialog,
  } = usePermissionActions()
  const { manageFolder } = useFolderActions()
  const { searchUserByEmail } = useUserSearchActions()


  // State for permissions
  const [projectPermissions, setProjectPermissions] = useState<Permission[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)

  // Função para buscar permissões (extraída para poder chamar quando trocar de aba)
  const fetchPermissions = async () => {
    if (!projectId) return

    setIsLoadingPermissions(true)
    try {
      const response = await listProjectPermissions(projectId)
      if (response.success && response.data) {
        const permissionsArray = Array.isArray(response.data) ? response.data : []
        setProjectPermissions(permissionsArray)
      }
    } catch (error) {
      console.error("Failed to fetch project permissions:", error)
      setProjectPermissions([])
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  // Função para buscar projeto (extraída para poder chamar quando trocar de aba)
  const fetchProject = async () => {
    if (!projectId) {
      setIsLoadingProject(false)
      return
    }

    setIsLoadingProject(true)
    try {
      const response = await getProject(projectId)
      if (response.success && response.data) {
        const projectData: Project = {
          id: response.data.id,
          accountId: response.data.accountId,
          name: response.data.name,
          slug: response.data.slug,
          description: response.data.description,
          permissions: [],
          folders: [],
          rules: [],
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        }
        setProject(projectData)
        // Permissões serão buscadas em useEffect separado
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

  // Buscar permissões do projeto ao carregar
  useEffect(() => {
    fetchPermissions()
  }, [projectId])

  // Buscar projeto da API ao carregar
  useEffect(() => {
    fetchProject()
  }, [projectId, currentAccountId, router, toast])

  // Buscar projetos da organização atual
  useEffect(() => {
    const fetchAccountProjects = async () => {
      try {
        const response = await listProjects()
        if (response.success && response.data) {
          const projectsArray = Array.isArray(response.data) ? response.data : []
          const projectsData: Project[] = projectsArray.map((p: any) => ({
            id: p.id,
            accountId: p.accountId,
            name: p.name,
            slug: p.slug,
            description: p.description,
            permissions: [],
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

  // Funções para buscar dados de cada aba (extraídas para poder chamar quando trocar de aba)
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

  // Buscar folders do projeto ao carregar
  useEffect(() => {
    fetchFolders()
  }, [projectId])

  // Buscar rules do projeto ao carregar
  useEffect(() => {
    fetchRules()
  }, [projectId])

  // Buscar grupos da organização
  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoadingGroups(true)
      try {
        const response = await listGroups()
        if (response.success && response.data) {
          const groupsArray = Array.isArray(response.data) ? response.data : []
          // Converter ApiGroup para Group do tipo governance
          const groupsWithMembers: ApiGroup[] = []
          for (const group of groupsArray) {
            try {
              const membersResponse = await listGroupMembers(group.id)
              if (membersResponse.success && membersResponse.data) {
                groupsWithMembers.push(group)
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
    if (!currentAccountId) return

    const fetchAccountMembers = async () => {
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
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Project not found or doesn't belong to current organization</p>
        </div>
      </div>
    )
  }

  // Folders e rules já estão nos estados, buscados da API
  // Metrics será implementado depois via API de usage


  const handleAddPermission = async (permission: Omit<Permission, "id" | "grantedAt" | "grantedBy">) => {
    if (!project) return
    
    await addPermission({
      resourceType: "project",
      resourceId: projectId,
      resourceName: project.name,
      permission,
      onSuccess: async () => {
        // Buscar permissões atualizadas da API
        try {
          const response = await listProjectPermissions(projectId)
          if (response.success && response.data) {
            const permissionsArray = Array.isArray(response.data) ? response.data : []
            setProjectPermissions(permissionsArray)
          }
        } catch (error) {
          console.error("Failed to refresh permissions:", error)
        }
      },
    })
  }

  const handleUpdatePermission = async (permissionId: string, permissionType: PermissionType) => {
    await updatePermission({
      permissionId,
      resourceType: "project",
      resourceId: projectId,
      permissionType,
      onSuccess: async () => {
        // Buscar permissões atualizadas da API
        try {
          const response = await listProjectPermissions(projectId)
          if (response.success && response.data) {
            const permissionsArray = Array.isArray(response.data) ? response.data : []
            setProjectPermissions(permissionsArray)
          }
        } catch (error) {
          console.error("Failed to refresh permissions:", error)
        }
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
      onSuccess: async () => {
        // Buscar permissões atualizadas da API
        try {
          const response = await listProjectPermissions(projectId)
          if (response.success && response.data) {
            const permissionsArray = Array.isArray(response.data) ? response.data : []
            setProjectPermissions(permissionsArray)
          }
        } catch (error) {
          console.error("Failed to refresh permissions:", error)
        }
      },
    })
  }


  return (
    <div className="flex flex-col">
      <main className="flex-1 p-4 lg:p-6 bg-background">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="bg-background/40 backdrop-blur-sm border border-muted/20 p-6 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="bg-blue-600/10 dark:bg-blue-500/20 p-4 rounded-2xl shadow-inner">
                  <FolderKanban className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                      {project.name}
                    </h1>
                  </div>
                  <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 opacity-50" />
                    {project.description || "No description provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-muted/50">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-background hover:shadow-sm" asChild>
                  <Link href="/account">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Folders</CardTitle>
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <FolderIcon className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingFolders ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-3xl font-bold tracking-tight">{folders.length}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">Active paths in project</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Rules</CardTitle>
                <div className="bg-indigo-500/10 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRules ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-3xl font-bold tracking-tight">{rules.length}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">Active AI context rules</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Collaboration</CardTitle>
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{projectPermissions.length}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium italic">Users with explicit access</p>
              </CardContent>
            </Card>


          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value)
              // Buscar dados atualizados quando trocar de aba
              switch (value) {
                case "folders":
                  fetchFolders()
                  break
                case "rules":
                  fetchRules()
                  break
                case "permissions":
                  fetchPermissions()
                  break
                case "settings":
                  fetchProject()
                  break

                default:
                  break
              }
            }}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="folders">Folders</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>

              <TabsTrigger value="settings">General Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="folders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Folders</CardTitle>
                  <CardDescription>
                    Manage folders in this project
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
                  accountId: g.accountIds?.[0] || "",
                  name: g.name,
                  description: g.description,
                  members: [],
                  createdAt: g.createdAt,
                  updatedAt: g.updatedAt,
                }))}
              />
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <PermissionManager
                permissions={projectPermissions}
                onAddPermission={handleAddPermission}
                onRemovePermission={handleRemovePermission}
                onUpdatePermission={handleUpdatePermission}
                availableUsers={availableUsers}
                availableGroups={groups.map((g) => ({
                  id: g.id,
                  accountId: g.accountIds?.[0] || "",
                  name: g.name,
                  description: g.description,
                  members: [], // TODO: Buscar membros do grupo
                  createdAt: g.createdAt,
                  updatedAt: g.updatedAt,
                }))}
                currentUserId={currentUserId || undefined}
                userGroups={userGroups.map((g) => ({
                  id: g.id,
                  accountId: g.accountIds?.[0] || "",
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
                resourceName={project?.name || ""}
              />
            </TabsContent>



            <TabsContent value="settings" className="space-y-4">
              {project && (
                <ProjectGeneralSettings
                  project={project}
                  onUpdate={(updatedProject) => {
                    setProject(updatedProject)
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* Confirm Dialogs */}
      < ProjectConfirmDialog />
      <PermissionConfirmDialog />
    </div >
  )
}

