"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Info,
  Key,
  RefreshCw,
  Shield,
  AlertTriangle,
  Save,
  Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Project } from "@/lib/types/governance"
import { useRouter } from "next/navigation"
import { useProjectActions } from "@/lib/actions/project-actions"
import { PermissionManager } from "@/components/governance/permission-manager"
import type { Permission, PermissionType } from "@/lib/types/governance"
import {
  listProjectPermissions,
  createProjectPermission,
  updateProjectPermission,
  deleteProjectPermission,
  toggleInheritPermissions,
  type CreateProjectPermissionData,
} from "@/lib/api-project-permissions"
import { deleteProject } from "@/lib/api-projects"
import { getAccountMembers } from "@/lib/api-accounts"
import { listGroups } from "@/lib/api-groups"
import { searchUserByEmail } from "@/lib/api-users"
import type { User, Group } from "@/lib/types/governance"

interface ProjectSettingsDialogProps {
  project: Project
}

export function ProjectSettingsDialog({ project }: ProjectSettingsDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Permissions State
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [isDeleteOpen, setIsDeleteOpen] = useState(false) // For delete confirmation
  const [isDeleting, setIsDeleting] = useState(false)

  // General Settings
  const [projectName, setProjectName] = useState(project.name)
  const [projectDescription, setProjectDescription] = useState(project.description || "")
  const [projectSlug, setProjectSlug] = useState(project.slug)

  // Permissions Settings
  const [inheritPermissions, setInheritPermissions] = useState(project.inheritPermissions)

  // MCP Settings
  const [mcpEnabled, setMcpEnabled] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [syncInterval, setSyncInterval] = useState("5") // minutes

  // Advanced Settings

  const [maxFileSize, setMaxFileSize] = useState("10") // MB

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        variant: "success",
        title: "Settings saved",
        description: "Project settings have been updated successfully.",
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Permission Handlers
  const loadPermissions = async () => {
    setLoadingPermissions(true)
    try {
      // Load data in parallel but don't fail properly if one fails (use allSettled logic effectively)
      const permsPromise = listProjectPermissions(project.id).catch(e => ({ success: false, data: [], error: e }))
      const membersPromise = getAccountMembers(project.accountId).catch(e => ({ success: false, data: [], error: e }))
      const groupsPromise = listGroups().catch(e => ({ success: false, data: [], error: e }))

      const [permsResponse, membersResponse, groupsResponse] = await Promise.all([
        permsPromise,
        membersPromise,
        groupsPromise
      ])

      let users: User[] = []
      // @ts-ignore - catch block above returns object matching structure mostly
      if (membersResponse.success && membersResponse.data) {
        // @ts-ignore
        users = membersResponse.data.map((m: any) => ({
          id: m.userId,
          email: m.userEmail || "",
          name: m.userName || "Unknown",
          picture: m.userPicture
        }))
        setAvailableUsers(users)
      }

      let groups: Group[] = []
      // @ts-ignore
      if (groupsResponse.success && groupsResponse.data) {
        // @ts-ignore
        groups = groupsResponse.data.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          accountId: g.accountIds?.[0] || project.accountId,
          members: [],
          memberCount: 0,
          createdBy: "system",
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        }))
        setAvailableGroups(groups)
      }

      // @ts-ignore
      if (permsResponse.success && permsResponse.data) {
        // @ts-ignore
        const enrichedPermissions = permsResponse.data.map((p) => {
          let targetName = "Unknown"
          if (p.targetType === "user") {
            const u = users.find(user => user.id === p.targetId)
            targetName = u ? u.name : (p.targetName || "Unknown User")
          } else {
            const g = groups.find(group => group.id === p.targetId)
            targetName = g ? g.name : (p.targetName || "Unknown Group")
          }
          return { ...p, targetName }
        })
        setPermissions(enrichedPermissions)
        // console.log("Loaded permissions:", enrichedPermissions.length)
        toast({ variant: "success", title: "Permissions loaded", description: `${enrichedPermissions.length} permissions found.` })
      } else {
        // Fallback or error handling
        if (!permsResponse.success) {
          console.error("List permissions failed:", permsResponse.error)
          toast({ variant: "destructive", title: "Failed to fetch permissions" })
        }
        setPermissions([]) // Clear permissions on failure
      }
    } catch (error) {
      console.error("Critical error loading permissions", error)
      toast({ variant: "destructive", title: "Error loading permissions" })
      setPermissions([]) // Clear permissions on critical error
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleAddPermission = async (data: Omit<Permission, "id" | "grantedAt" | "grantedBy">) => {
    try {
      const reqData: CreateProjectPermissionData = {
        projectId: project.id,
        targetType: data.targetType,
        targetId: data.targetId,
        permissionType: data.permissionType,
      }
      const response = await createProjectPermission(reqData)
      if (response.success && response.data) {
        // Enforce name from input if missing from backend
        const newPerm = {
          ...response.data,
          targetName: data.targetName || response.data.targetName
        }
        setPermissions([...permissions, newPerm])
        toast({ variant: "success", title: "Permission added" })
      } else {
        toast({ variant: "destructive", title: "Failed to add permission", description: response.error?.message })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to add permission" })
    }
  }

  const handleUpdatePermission = async (id: string, type: PermissionType) => {
    try {
      const response = await updateProjectPermission(id, { permissionType: type })
      if (response.success && response.data) {
        setPermissions(permissions.map(p => p.id === id ? { ...response.data!, targetName: p.targetName } : p))
        toast({ variant: "success", title: "Permission updated" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update permission" })
    }
  }

  const handleRemovePermission = async (id: string) => {
    try {
      const response = await deleteProjectPermission(id)
      if (response.success) {
        setPermissions(permissions.filter(p => p.id !== id))
        toast({ variant: "success", title: "Permission removed" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to remove permission" })
    }
  }

  const handleToggleInheritPermissions = async () => {
    const newValue = !inheritPermissions
    setInheritPermissions(newValue)
    // If we want immediate effect, we can call API here. 
    // But current flow saves on "Save Changes". 
    // However, permission manager toggles usually act immediately or we need to sync.
    // Let's implement immediate toggle for better UX in permissions tab? 
    // Wait, inheritPermissions is state for "General/Inheritance" save.
    // Let's keep it as is for "Unified Save" or make it independent?
    // The list toggle calls `onInheritToggle`.

    // Actually, let's make it immediate if called from PermissionManager
    try {
      await toggleInheritPermissions({ projectId: project.id, enabled: newValue })
      toast({ variant: "success", title: `Permission inheritance ${newValue ? 'enabled' : 'disabled'}` })
    } catch (e) {
      setInheritPermissions(!newValue) // Revert
      toast({ variant: "destructive", title: "Failed to toggle inheritance" })
    }
  }

  const handleDeleteProject = async () => {
    setIsDeleting(true)
    try {
      const response = await deleteProject(project.id)
      if (response.success) {
        toast({ variant: "success", title: "Project deleted", description: "Redirecting..." })
        setIsOpen(false)
        router.push("/projects") // redirect to projects list
      } else {
        toast({ variant: "destructive", title: "Error", description: response.error?.message || "Failed to delete project" })
        setIsDeleting(false)
      }
    } catch (e) {
      console.error(e)
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred" })
      setIsDeleting(false)
    }
  }

  // Resetar todos os estados quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      // Resetar todos os formulários para valores iniciais
      setProjectName(project.name)
      setProjectDescription(project.description || "")
      setProjectSlug(project.slug)
      setInheritPermissions(project.inheritPermissions)
      setPermissions([])
      setLoadingPermissions(false)
      setIsSaving(false)
      setIsDeleting(false)
      setIsDeleteOpen(false)
      // Resetar MCP settings para valores padrão
      setMcpEnabled(true)
      setAutoSync(true)
      setSyncInterval("5")
      // Resetar Advanced settings para valores padrão
      setEnableAuditLog(true)
      setEnableMetrics(true)
      setMaxFileSize("10")
    }
  }, [isOpen, project])

  const hasChanges =
    projectName !== project.name ||
    projectDescription !== (project.description || "") ||
    projectSlug !== project.slug ||
    inheritPermissions !== project.inheritPermissions

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Settings
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Configure project settings, MCP integration, and advanced options
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden" onValueChange={(val) => {
          if (val === 'permissions') loadPermissions()
        }}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 flex-shrink-0">
            <TabsTrigger value="general" className="flex items-center gap-2 text-xs sm:text-sm">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
              <span className="sm:hidden">Gen</span>
            </TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-2 text-xs sm:text-sm">
              <Key className="h-4 w-4" />
              MCP
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
              <span className="sm:hidden">Perms</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Adv</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name" className="text-sm font-semibold">
                  Project Name *
                </Label>
                <Input
                  id="settings-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  The display name for this project
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-slug" className="text-sm font-semibold">
                  Project Slug *
                </Label>
                <Input
                  id="settings-slug"
                  value={projectSlug}
                  onChange={(e) => setProjectSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="project-slug"
                  className="h-11 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (lowercase, hyphens only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="settings-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Project description..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional description of the project's purpose
                </p>
              </div>
            </div>
          </TabsContent>

          {/* MCP Settings */}
          <TabsContent value="mcp" className="space-y-6 mt-6 flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="mcp-enabled" className="text-sm font-semibold">
                    Enable MCP Integration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow IDEs to connect to this project via MCP protocol
                  </p>
                </div>
                <Switch
                  id="mcp-enabled"
                  checked={mcpEnabled}
                  onCheckedChange={setMcpEnabled}
                />
              </div>

              {mcpEnabled && (
                <>
                  <Separator />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync" className="text-sm font-semibold">
                        Auto Sync
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically sync changes from Account to this project
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>

                  {autoSync && (
                    <div className="space-y-2">
                      <Label htmlFor="sync-interval" className="text-sm font-semibold">
                        Sync Interval (minutes)
                      </Label>
                      <Select value={syncInterval} onValueChange={setSyncInterval}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        How often to check for changes and sync from Account
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Key className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold">MCP Keys</p>
                        <p className="text-xs text-muted-foreground">
                          Manage MCP authentication keys for this project. Keys can be scoped to this project or all projects.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Key className="h-3 w-3 mr-2" />
                          Manage MCP Keys
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="flex-1 overflow-y-auto mt-6">
            {loadingPermissions && permissions.length === 0 ? (
              <div className="flex justify-center p-8"><RefreshCw className="animate-spin h-6 w-6" /></div>
            ) : (
              <PermissionManager
                permissions={permissions}
                inheritPermissions={inheritPermissions}
                onInheritToggle={handleToggleInheritPermissions}
                onAddPermission={handleAddPermission}
                onUpdatePermission={handleUpdatePermission}
                onRemovePermission={handleRemovePermission}
                resourceType="project"
                resourceName={project.name}
                availableUsers={availableUsers}
                availableGroups={availableGroups}
                onEmailSearch={async (email: string) => {
                  const res = await searchUserByEmail(email)
                  return res.success && res.data ? res.data : null
                }}
              />
            )}
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6 mt-6 flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">


              <div className="space-y-2">
                <Label htmlFor="max-file-size" className="text-sm font-semibold">
                  Maximum File Size (MB)
                </Label>
                <Select value={maxFileSize} onValueChange={setMaxFileSize}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 MB</SelectItem>
                    <SelectItem value="10">10 MB</SelectItem>
                    <SelectItem value="25">25 MB</SelectItem>
                    <SelectItem value="50">50 MB</SelectItem>
                    <SelectItem value="100">100 MB</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Maximum size for individual rule files in this project
                </p>
              </div>

              <Separator />

              <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-destructive">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">
                      Irreversible and destructive actions
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you definitely sure? This will delete the project and all its data.")) {
                            handleDeleteProject()
                          }
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete Project
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="h-11 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="h-11 w-full sm:w-auto sm:min-w-[120px]"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

