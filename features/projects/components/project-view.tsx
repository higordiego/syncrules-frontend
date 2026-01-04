/**
 * Project View Component
 * 
 * Main orchestrator for project page.
 * Composes header, tabs, and content.
 * Handles data fetching and state management.
 * 
 * Max: 150 lines
 */

"use client"

import { useState } from "react"
import { ProjectHeader } from "./project-header"
import { ProjectTabs } from "./project-tabs"
import { useProject } from "../hooks/use-project"
import { FolderKanban, FileText, Settings, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog"

interface ProjectViewProps {
  projectId: string
  foldersContent: React.ReactNode
  rulesContent: React.ReactNode
  permissionsContent: React.ReactNode
  settingsContent: React.ReactNode
  onTabChange?: (tab: string) => void
}

export function ProjectView({
  projectId,
  foldersContent,
  rulesContent,
  permissionsContent,
  settingsContent,
  onTabChange,
}: ProjectViewProps) {
  const { project, isLoading, error, refetch } = useProject(projectId)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message || "Failed to load project"}
        </AlertDescription>
      </Alert>
    )
  }

  const tabs = [
    {
      id: "folders",
      label: "Folders",
      icon: <FolderKanban className="h-4 w-4" />,
      content: foldersContent,
    },
    {
      id: "rules",
      label: "Rules",
      icon: <FileText className="h-4 w-4" />,
      content: rulesContent,
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: <Users className="h-4 w-4" />,
      content: permissionsContent,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      content: settingsContent,
    },
  ]

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <ProjectTabs tabs={tabs} onTabChange={onTabChange} />

      {isSettingsOpen && (
        <ProjectSettingsDialog
          project={project}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onSuccess={() => {
            refetch()
            setIsSettingsOpen(false)
          }}
        />
      )}
    </div>
  )
}

