"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Trash2, Save, Loader2 } from "lucide-react"
import { updateProject, deleteProject } from "@/lib/api-projects"
import type { Project } from "@/lib/types/governance"
import { useConfirm } from "@/lib/hooks/use-confirm"
import { Separator } from "@/components/ui/separator"

interface ProjectGeneralSettingsProps {
  project: Project
}

export function ProjectGeneralSettings({ project }: ProjectGeneralSettingsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [projectName, setProjectName] = useState(project.name)
  const [projectDescription, setProjectDescription] = useState(project.description || "")
  const [projectSlug, setProjectSlug] = useState(project.slug)

  const { confirm, ConfirmDialog } = useConfirm()

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      const response = await updateProject(project.id, {
        name: projectName,
        description: projectDescription,
        slug: projectSlug,
        // Inheritance mode is handled in its own tab, so we preserve the current one if not sending it,
        // but the API might expect partial updates. Assuming updateProject handles partials.
        // If not, pass current inheritanceMode.
        inheritanceMode: project.inheritanceMode,
      })

      if (response.success) {
        toast({
          title: "Settings saved",
          description: "Project settings have been updated successfully.",
        })
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to save settings.",
        })
      }
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

  const handleDeleteProject = async () => {
    const confirmed = await confirm({
      title: "Delete Project?",
      description: "This action cannot be undone. This will permanently delete your project and remove all associated data, including folders and rules.",
      variant: "destructive",
      confirmText: "Delete Project",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await deleteProject(project.id)
      if (response.success) {
        toast({ title: "Project deleted", description: "Redirecting to projects list..." })
        router.push("/account")
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

  const hasChanges =
    projectName !== project.name ||
    projectDescription !== (project.description || "") ||
    projectSlug !== project.slug

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your project's basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Project"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectSlug">Slug</Label>
            <Input
              id="projectSlug"
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="my-project"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly name for your project
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description</Label>
            <Textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveGeneral} disabled={isSaving || !hasChanges}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-card/50">
            <div>
              <h4 className="font-semibold text-destructive">Delete Project</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all of its resources
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  )
}
