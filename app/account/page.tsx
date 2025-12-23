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
import { Building2, Plus, Folder, FileText, Users, TrendingUp, Loader2 } from "lucide-react"
import { getUserProjects, addUserProject } from "@/components/projects/project-requirement-check"
import { GovernanceBadge } from "@/components/governance/governance-badge"
import { useAccountActions } from "@/lib/actions/account-actions"
import { getCurrentAccount, getCurrentAccountId } from "@/components/accounts/account-selector"
import { getAccount } from "@/lib/api-accounts"
import { listProjects } from "@/lib/api-projects"
import { listFolders, createFolder, deleteFolder } from "@/lib/api-folders"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import type { InheritanceMode, Project, Folder } from "@/lib/types/governance"
import type { Account } from "@/lib/types/governance"

export default function AccountPage() {
  const { toast } = useToast()
  const [account, setAccount] = useState<Account | null>(null)
  const [isLoadingAccount, setIsLoadingAccount] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  const [metrics, setMetrics] = useState({ totalCalls: 0 }) // TODO: Implementar API de metrics
  const { createProject } = useAccountActions()

  // Buscar account atual da API
  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoadingAccount(true)
      try {
        const accountId = getCurrentAccountId()
        if (!accountId) {
          toast({
            title: "No organization selected",
            description: "Please select an organization first.",
            variant: "destructive",
          })
          setIsLoadingAccount(false)
          return
        }

        const response = await getAccount(accountId)
        if (response.success && response.data) {
          const accountData: Account = {
            id: response.data.id,
            name: response.data.name,
            slug: response.data.slug,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            baseFolders: [],
            baseRules: [],
          }
          setAccount(accountData)

          // Buscar projetos da organização
          await Promise.all([
            fetchProjects(accountId),
            fetchFolders(accountId)
          ])
        } else {
          toast({
            title: "Error",
            description: response.error?.message || "Failed to load organization",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to fetch account:", error)
        toast({
          title: "Error",
          description: "Failed to load organization. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingAccount(false)
      }
    }

    fetchAccount()
  }, [])

  const fetchProjects = async (accountId: string) => {
    setIsLoadingProjects(true)
    try {
      const response = await listProjects(accountId)
      if (response.success && response.data) {
        // Garantir que response.data é um array
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

  const fetchFolders = async (accountId: string) => {
    setIsLoadingFolders(true)
    try {
      const response = await listFolders({ accountId })
      if (response.success && response.data) {
        setFolders(Array.isArray(response.data) ? response.data : [])
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
  const [newProjectInheritance, setNewProjectInheritance] = useState<InheritanceMode>("full")
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
        accountId: account.id,
        name: newFolderName.trim(),
        path: newFolderPath.trim(),
        inheritPermissions: newFolderInherit,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        await fetchFolders(account.id)
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

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return

    try {
      const response = await deleteFolder(folderId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Folder deleted successfully",
        })
        if (account) fetchFolders(account.id)
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
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!account || !newProjectName.trim()) return

    setIsCreating(true)
    await createProject({
      accountId: account.id,
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
      inheritanceMode: newProjectInheritance,
      onSuccess: async (projectId: string) => {
        // Recarregar projetos após criar
        await fetchProjects(account.id)

        setIsCreateProjectOpen(false)
        setNewProjectName("")
        setNewProjectDescription("")
        setNewProjectInheritance("full")
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

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="inheritance-mode" className="text-sm font-semibold">
                              Inheritance Mode *
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Choose how this project inherits folders and rules from the Account
                            </p>
                          </div>
                          <Select
                            value={newProjectInheritance}
                            onValueChange={(value) => setNewProjectInheritance(value as InheritanceMode)}
                          >
                            <SelectTrigger className="h-auto min-h-[3.5rem] text-base py-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="p-2">
                              <SelectItem value="full" className="px-3 py-4 rounded-lg cursor-pointer focus:bg-accent">
                                <div className="flex flex-col gap-1.5 w-full">
                                  <span className="font-semibold text-base leading-tight">Full Inheritance</span>
                                  <span className="text-sm text-muted-foreground leading-relaxed">
                                    All Account folders and rules are automatically synced to this project
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="partial" className="px-3 py-4 rounded-lg cursor-pointer focus:bg-accent">
                                <div className="flex flex-col gap-1.5 w-full">
                                  <span className="font-semibold text-base leading-tight">Partial Inheritance</span>
                                  <span className="text-sm text-muted-foreground leading-relaxed">
                                    Choose which folders and rules to sync from Account
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="none" className="px-3 py-4 rounded-lg cursor-pointer focus:bg-accent">
                                <div className="flex flex-col gap-1.5 w-full">
                                  <span className="font-semibold text-base leading-tight">No Inheritance</span>
                                  <span className="text-sm text-muted-foreground leading-relaxed">
                                    All folders and rules are local to this project only
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              <strong className="text-foreground font-semibold">Note:</strong> You can change this later in project settings, but it may affect existing synced folders.
                            </p>
                          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects</CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingProjects ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{projects.length}</div>
                        <p className="text-xs text-muted-foreground">Active projects</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Folders</CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Array.isArray(folders) ? folders.length : 0}</div>
                    <p className="text-xs text-muted-foreground">Account-level folders</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(folders) ? folders.reduce((sum: number, f: any) => sum + (f.ruleCount || 0), 0) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Across all folders</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MCP Calls</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalCalls.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total bootstrap calls</p>
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
                    <div className="text-center py-12">
                      <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No projects found</p>
                      <Button onClick={() => setIsCreateProjectOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project: Project) => (
                        <Link
                          key={project.id}
                          href={`/account/projects/${project.id}`}
                          className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{project.name}</h3>
                                <Badge variant="outline">{project.inheritanceMode}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {project.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                        New Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreateFolder}>
                        <DialogHeader>
                          <DialogTitle>Create New Folder</DialogTitle>
                          <DialogDescription>
                            Create a base folder available to all projects in this account
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="folder-name">Name</Label>
                            <Input
                              id="folder-name"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              placeholder="e.g. Backend Utils"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="folder-path">Path</Label>
                            <Input
                              id="folder-path"
                              value={newFolderPath}
                              onChange={(e) => setNewFolderPath(e.target.value)}
                              placeholder="e.g. /utils/backend"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateFolderOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}>
                            {isCreatingFolder ? "Creating..." : "Create Folder"}
                          </Button>
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
                      <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No folders found</p>
                      <Button variant="link" onClick={() => setIsCreateFolderOpen(true)}>
                        Create your first folder
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.isArray(folders) && folders.map((folder: Folder) => (
                        <div
                          key={folder.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{folder.name}</span>
                                {folder.syncStatus && (
                                  <GovernanceBadge
                                    syncStatus={folder.syncStatus}
                                    folderStatus={folder.folderStatus}
                                    sourceOfTruth={folder.sourceOfTruth}
                                  />
                                )}
                              </div>
                              {folder.path && (
                                <p className="text-sm text-muted-foreground">{folder.path}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {folder.ruleCount || 0} rules
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteFolder(folder.id)}
                            >
                              Delete
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
    </ProtectedRoute>
  )
}

