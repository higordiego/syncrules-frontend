"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Plus, Folder as FolderIcon, FileText, Users, TrendingUp, Loader2, ArrowRight, Trash2, Globe, MoreVertical, Share2, Info } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getUserProjects, addUserProject } from "@/components/projects/project-requirement-check"
import { GovernanceBadge } from "@/components/governance/governance-badge"
import { ShareFolderDialog, FolderDetailsDialog } from "@/components/folders/folder-sharing-dialogs"
import { useAccountActions } from "@/lib/actions/account-actions"
import { useAccount } from "@/context/AccountContext"
import { listProjects } from "@/lib/api-projects"
import { listFolders, createFolder, deleteFolder, shareFolderWithProjects, unshareFolderFromProject, getSharedProjects } from "@/lib/api-folders"
import { listRulesByFolder } from "@/lib/api-rules"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Project, Folder } from "@/lib/types/governance"
import type { Account } from "@/lib/types/governance"

export default function AccountPage() {
  const { toast } = useToast()
  const router = useRouter()
  const {
    selectedAccount: account,
    isLoading: isLoadingAccount,
    refreshAccounts
  } = useAccount()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  const [metrics, setMetrics] = useState({ totalCalls: 0 })

  // Folder sharing states
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [sharedProjects, setSharedProjects] = useState<string[]>([])
  const [isSharingFolder, setIsSharingFolder] = useState(false)
  const [isLoadingSharedProjects, setIsLoadingSharedProjects] = useState(false)
  const { createProject } = useAccountActions()

  // Delete folder dialog state
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeletingFolder, setIsDeletingFolder] = useState(false)

  // Carregar dados quando a organização mudar
  useEffect(() => {
    if (account) {
      fetchProjects()
      fetchFolders()
    }
  }, [account])

  // Limpar estados quando dialog de detalhes fechar
  useEffect(() => {
    if (!isDetailsDialogOpen) {
      setSelectedFolder(null)
      setSharedProjects([])
      setIsSharingFolder(false)
      setIsLoadingSharedProjects(false)
    }
  }, [isDetailsDialogOpen])

  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    try {
      const response = await listProjects()
      if (response.success && response.data) {
        // Garantir que response.data é um array
        const projectsArray = Array.isArray(response.data) ? response.data : []
        const projectsData: Project[] = projectsArray.map((p: any) => ({
          id: p.id,
          accountId: p.accountId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          permissions: [],
          inheritPermissions: false,
          folders: [],
          rules: [],
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
        setProjects(projectsData)
      } else {
        // Se não houver dados ou erro, definir array vazio
        setProjects([])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      setProjects([])
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const fetchFolders = async () => {
    setIsLoadingFolders(true)
    try {
      const response = await listFolders()
      if (response.success && response.data) {
        const allFolders = Array.isArray(response.data) ? response.data : []
        // Filtrar apenas folders root-level (sem parentFolderId) e da Account (sem projectId)
        const rootFolders = allFolders.filter(
          (folder: Folder) => 
            !folder.parentFolderId && // Apenas folders sem parent (root-level)
            !folder.projectId && // Apenas folders da Account (não de projetos)
            folder.accountId // Garantir que tem accountId
        )
        
        // Para cada folder root, calcular estatísticas
        const foldersWithStats = await Promise.all(
          rootFolders.map(async (folder: Folder) => {
            // Buscar subfolders recursivamente
            const buildSubFoldersTree = (parentId: string): Folder[] => {
              const directChildren = allFolders.filter(f => 
                f.parentFolderId === parentId && 
                !f.projectId && 
                f.accountId
              )
              const allDescendants: Folder[] = []
              directChildren.forEach(child => {
                allDescendants.push(child)
                const childDescendants = buildSubFoldersTree(child.id)
                allDescendants.push(...childDescendants)
              })
              return allDescendants
            }
            const subFolders = buildSubFoldersTree(folder.id)
            const allFolderIds = [folder.id, ...subFolders.map(f => f.id)]
            
            // Buscar rules de todos os folders (principal + subfolders)
            const rulesPromises = allFolderIds.map(folderId => listRulesByFolder(folderId))
            const rulesResponses = await Promise.all(rulesPromises)
            const allRules = rulesResponses.flatMap(response => 
              response.success && response.data ? (Array.isArray(response.data) ? response.data : []) : []
            )
            
            // Buscar projetos compartilhados
            let sharedProjectsCount = 0
            try {
              const sharedResponse = await getSharedProjects(folder.id)
              if (sharedResponse.success && sharedResponse.data) {
                sharedProjectsCount = Array.isArray(sharedResponse.data) ? sharedResponse.data.length : 0
              }
            } catch (error) {
              console.error(`Failed to get shared projects for folder ${folder.id}:`, error)
            }
            
            return {
              ...folder,
              subFolderCount: subFolders.length,
              ruleCount: allRules.length,
              sharedProjectsCount: sharedProjectsCount,
            }
          })
        )
        
        setFolders(foldersWithStats)
        console.log("Loaded root folders with stats:", foldersWithStats.length)
      } else {
        setFolders([])
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error)
      setFolders([])
    } finally {
      setIsLoadingFolders(false)
    }
  }

  // State for create project dialog
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // State for create folder dialog
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderPath, setNewFolderPath] = useState("/")
  const [newFolderInherit, setNewFolderInherit] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!account || !newFolderName.trim()) return

    setIsCreatingFolder(true)
    try {
      const response = await createFolder({
        name: newFolderName.trim(),
        path: newFolderPath.trim(),
        inheritPermissions: newFolderInherit,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        await fetchFolders()
        setIsCreateFolderOpen(false)
        setNewFolderName("")
        setNewFolderPath("/")
        setNewFolderInherit(false)
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to create folder",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    if (folder) {
      setFolderToDelete({ id: folderId, name: folder.name })
    }
  }

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return

    setIsDeletingFolder(true)
    try {
      const response = await deleteFolder(folderToDelete.id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Folder deleted successfully",
        })
        await fetchFolders()
        setFolderToDelete(null)
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to delete folder",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      })
    } finally {
      setIsDeletingFolder(false)
    }
  }

  const handleManageRules = (folderId: string) => {
    // Navegar diretamente para a página de gerenciamento do folder Account-level
    router.push(`/account/folders/${folderId}`)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!account || !newProjectName.trim()) return

    setIsCreating(true)
    await createProject({
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
      onSuccess: async (projectId: string) => {
        // Recarregar projetos após criar
        await fetchProjects()

        setIsCreateProjectOpen(false)
        setNewProjectName("")
        setNewProjectDescription("")
      },
    })
    setIsCreating(false)
  }

  if (isLoadingAccount) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-6 bg-background">
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!account) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-6 bg-background">
              <div className="flex flex-col items-center justify-center h-full">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
                <p className="text-muted-foreground mb-4">Please select an organization to continue.</p>
                <Button asChild>
                  <Link href="/account/organizations">Manage Organizations</Link>
                </Button>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
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
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-8 w-8" />
                    {account.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">Account Overview</p>
                </div>
                <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] sm:max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                    <form onSubmit={handleCreateProject} className="flex flex-col h-full">
                      <DialogHeader className="flex-shrink-0 pb-4">
                        <DialogTitle className="text-2xl">Create New Project</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                          Create a new project to organize your context rules and manage inheritance from your account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
                        <div className="space-y-2">
                          <Label htmlFor="project-name" className="text-sm font-semibold">
                            Project Name *
                          </Label>
                          <Input
                            id="project-name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., Frontend Team, API Documentation, Design System"
                            className="h-11 text-base"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Choose a descriptive name for your project
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="project-description" className="text-sm font-semibold">
                            Description
                          </Label>
                          <Textarea
                            id="project-description"
                            value={newProjectDescription}
                            onChange={(e) => setNewProjectDescription(e.target.value)}
                            placeholder="Describe the purpose and scope of this project..."
                            rows={4}
                            className="text-base resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional: Add context about what this project is for
                          </p>
                        </div>

                      </div>
                      <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 pt-4 mt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateProjectOpen(false)}
                          className="h-11"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || !newProjectName.trim()} className="h-11 min-w-[120px]">
                          {isCreating ? (
                            <>
                              <span className="mr-2">Creating...</span>
                            </>
                          ) : (
                            "Create Project"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Projects</CardTitle>
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight">{projects.length}</div>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1 font-medium italic">Active governance projects</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Base Folders</CardTitle>
                    <div className="bg-indigo-500/10 p-2 rounded-lg">
                      <FolderIcon className="h-4 w-4 text-indigo-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight">{folders.length}</div>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1 font-medium italic">Shared resources across org</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Members</CardTitle>
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-emerald-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight">1</div>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1 font-medium italic">Collaborators & admins</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Requests</CardTitle>
                    <div className="bg-purple-500/10 p-2 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight">0</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">Last 30 days usage</p>
                  </CardContent>
                </Card>
              </div>

              {/* Projects List */}
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Projects within this account</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-gray-300 dark:border-border rounded-3xl bg-gray-50 dark:bg-muted/20 text-center animate-in fade-in zoom-in duration-300">
                      <div className="bg-white dark:bg-background p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-border mb-4">
                        <FileText className="h-10 w-10 text-gray-400 dark:text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Build your first project</h3>
                      <p className="text-gray-600 dark:text-muted-foreground max-w-sm mb-8">
                        Projects help you group and manage AI context rules for specific codebases or teams.
                      </p>
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-12 px-8 shadow-lg shadow-blue-500/20 transition-all border-none"
                        onClick={() => setIsCreateProjectOpen(true)}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project: Project) => (
                        <Link
                          key={project.id}
                          href={`/account/projects/${project.id}`}
                          className="block p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{project.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                {project.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-muted-foreground">
                                <span>{project.folders.length} folders</span>
                                <span>{project.rules.length} rules</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              View →
                            </Button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Folders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Account-Level Folders</CardTitle>
                    <CardDescription>Base folders defined at account level</CardDescription>
                  </div>
                  <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Base Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] sm:max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col p-0">
                      <form onSubmit={handleCreateFolder} className="flex flex-col h-full">
                        <DialogHeader className="p-6 border-b">
                          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FolderIcon className="h-6 w-6 text-blue-500" />
                            Create Account-Level Folder
                          </DialogTitle>
                          <DialogDescription className="text-base pt-2 text-muted-foreground">
                            Define a base folder that can be shared across multiple projects.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                          <div className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="folder-name" className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Folder Name *
                              </Label>
                            <Input
                              id="folder-name"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="e.g., Global Security Rules, Base Utils"
                                className="h-11 text-base border-muted focus:border-blue-500 transition-all font-medium"
                              required
                            />
                              <p className="text-xs text-muted-foreground">A clear name for this shared ruleset.</p>
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="folder-path" className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Internal Path *
                              </Label>
                            <Input
                              id="folder-path"
                              value={newFolderPath}
                              onChange={(e) => setNewFolderPath(e.target.value)}
                                placeholder="e.g. /shared/security"
                                className="h-11 text-base font-mono bg-gray-50 dark:bg-muted/30 border-gray-200 dark:border-muted"
                              required
                            />
                              <p className="text-xs text-muted-foreground">Virtual path used by AI context rules.</p>
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-3">
                            <div className="bg-blue-100 dark:bg-blue-500/10 p-2 rounded-lg h-fit">
                              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Auto-Sharing Active</p>
                              <p className="text-xs text-blue-700 dark:text-blue-300/80 leading-relaxed">
                                This folder will appear in projects using "Full Inheritance" (Standard) and can be manually added in "Partial" mode.
                              </p>
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="p-6 border-t bg-gray-50 dark:bg-muted/10">
                          <div className="flex w-full items-center justify-between gap-3 flex-col sm:flex-row">
                            <p className="text-xs text-gray-600 dark:text-muted-foreground italic sm:block hidden">
                              * All fields are required
                            </p>
                            <div className="flex gap-3 w-full sm:w-auto">
                          <Button
                            type="button"
                                variant="ghost"
                            onClick={() => setIsCreateFolderOpen(false)}
                                className="flex-1 sm:flex-none border border-transparent hover:border-muted px-6 h-11"
                          >
                            Cancel
                          </Button>
                              <Button
                                type="submit"
                                disabled={isCreatingFolder || !newFolderName.trim()}
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-500/20 px-8 h-11"
                              >
                                {isCreatingFolder ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                  </span>
                                ) : "Create Folder"}
                          </Button>
                            </div>
                          </div>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {isLoadingFolders ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !Array.isArray(folders) || folders.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No folders found</p>
                      <Button variant="link" onClick={() => setIsCreateFolderOpen(true)}>
                        Create your first folder
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Array.isArray(folders) && folders.map((folder: Folder) => (
                        <div
                          key={folder.id}
                          className="group relative flex flex-col p-5 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl hover:border-blue-400 dark:hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-blue-100 dark:bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                                <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-lg text-foreground leading-none">{folder.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 font-mono text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-muted/40 px-2 py-0.5 rounded w-fit">
                                  <Globe className="h-3 w-3" />
                                  {folder.path || "/"}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-gray-200 dark:border-muted/20 shadow-xl bg-white dark:bg-popover">
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer text-gray-700 dark:text-foreground hover:bg-gray-100 dark:hover:bg-accent"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleManageRules(folder.id);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2 text-gray-500 dark:text-muted-foreground" />
                                  Manage Rules
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer text-red-600 dark:text-red-500 focus:text-red-700 dark:focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteFolder(folder.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-muted/30 pt-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                <FolderIcon className="h-4 w-4" />
                                <span>{(folder as any).subFolderCount || 0}</span>
                                <span className="text-xs font-normal opacity-70">Folders</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>{(folder as any).ruleCount || 0}</span>
                                <span className="text-xs font-normal opacity-70">Rules</span>
                              </div>
                              {((folder as any).sharedProjectsCount || 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
                                  <Globe className="h-4 w-4" />
                                  <span>{(folder as any).sharedProjectsCount}</span>
                                  <span className="text-xs font-normal opacity-70">Projects</span>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="group/btn h-8 px-3 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-semibold text-xs uppercase tracking-wider"
                              onClick={async () => {
                                setSelectedFolder(folder)
                                setIsDetailsDialogOpen(true)
                                // Carregar projetos compartilhados
                                setIsLoadingSharedProjects(true)
                                try {
                                  const response = await getSharedProjects(folder.id)
                                  if (response.success && response.data) {
                                    setSharedProjects(Array.isArray(response.data) ? response.data : [])
                                  }
                                } catch (error) {
                                  console.error("Error loading shared projects:", error)
                                } finally {
                                  setIsLoadingSharedProjects(false)
                                }
                              }}
                            >
                              Details
                              <ArrowRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the folder "{folderToDelete?.name}"? This action cannot be undone and will remove all rules within this folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFolder}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFolder}
              disabled={isDeletingFolder}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingFolder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Details Dialog - Tudo interativo em um único modal */}
      <FolderDetailsDialog
        folder={selectedFolder}
        projects={projects}
        sharedProjects={sharedProjects}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false)
          setSelectedFolder(null)
          setSharedProjects([])
        }}
        isLoading={isLoadingSharedProjects}
        onShare={async (projectIds: string[]) => {
          if (!selectedFolder) return
          
          setIsSharingFolder(true)
          try {
            // Primeiro, remover compartilhamento de projetos que não estão mais selecionados
            const projectsToUnshare = sharedProjects.filter(id => !projectIds.includes(id))
            for (const projectId of projectsToUnshare) {
              await unshareFolderFromProject(selectedFolder.id, projectId)
            }

            // Depois, adicionar compartilhamento para projetos novos
            const projectsToShare = projectIds.filter(id => !sharedProjects.includes(id))
            if (projectsToShare.length > 0) {
              await shareFolderWithProjects(selectedFolder.id, projectsToShare)
            }

            toast({
              title: "Success",
              description: "Folder sharing updated successfully",
            })

            // Recarregar projetos compartilhados
            const response = await getSharedProjects(selectedFolder.id)
            if (response.success && response.data) {
              setSharedProjects(Array.isArray(response.data) ? response.data : [])
            }
            
            // Recarregar folders para atualizar estatísticas
            await fetchFolders()
          } catch (error) {
            console.error("Error sharing folder:", error)
            toast({
              title: "Error",
              description: "Failed to update folder sharing",
              variant: "destructive",
            })
            // Re-throw para que o componente possa tratar (fechar ou não o modal)
            throw error
          } finally {
            setIsSharingFolder(false)
          }
        }}
        isSharing={isSharingFolder}
      />
    </ProtectedRoute>
  )
}

