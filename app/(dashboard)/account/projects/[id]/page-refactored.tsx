/**
 * Project Page - Refactored
 * 
 * This is the NEW refactored version following architecture rules:
 * - Page only orchestrates (max 100 lines)
 * - No business logic
 * - No direct API calls
 * - Composes feature components
 * 
 * This file demonstrates the target architecture.
 */

"use client"

import { useParams } from "next/navigation"
import { ProjectView } from "@/features/projects"
import { ProjectFoldersTab } from "@/features/projects/components/project-folders-tab"
import { ProjectRulesTab } from "@/features/projects/components/project-rules-tab"
import { ProjectPermissionsTab } from "@/features/projects/components/project-permissions-tab"
import { ProjectSettingsTab } from "@/features/projects/components/project-settings-tab"
import { useProjectData } from "@/features/projects/hooks/use-project-data"
import { usePermissionActions } from "@/lib/actions/permission-actions"
import { useProjectActions } from "@/lib/actions/project-actions"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  // Hooks encapsulate all data fetching and side effects
  const projectData = useProjectData(projectId)
  const { addPermission, updatePermission, removePermission } = usePermissionActions()
  const { updateProject } = useProjectActions()

  // Tab change handler - triggers data refetch
  const handleTabChange = (tab: string) => {
    if (tab === "folders") {
      projectData.refetchFolders()
    } else if (tab === "rules") {
      projectData.refetchRules()
    } else if (tab === "permissions") {
      projectData.refetchPermissions()
    }
  }

  // Permission handlers
  const handleAddPermission = async (permission: any) => {
    await addPermission(permission)
    projectData.refetchPermissions()
  }

  const handleUpdatePermission = async (id: string, permission: Partial<any>) => {
    await updatePermission(id, permission)
    projectData.refetchPermissions()
  }

  const handleRemovePermission = async (id: string) => {
    await removePermission(id)
    projectData.refetchPermissions()
  }

  // Project update handler
  const handleProjectUpdate = (updatedProject: any) => {
    // This will trigger a refetch in ProjectView via useProject hook
  }

  return (
    <ProjectView
      projectId={projectId}
      foldersContent={
        <ProjectFoldersTab
          folders={projectData.folders}
          isLoading={projectData.isLoadingFolders}
          projectId={projectId}
        />
      }
      rulesContent={
        <ProjectRulesTab
          rules={projectData.rules}
          projectId={projectId}
          isLoading={projectData.isLoadingRules}
        />
      }
      permissionsContent={
        <ProjectPermissionsTab
          permissions={projectData.permissions}
          projectId={projectId}
          isLoading={projectData.isLoadingPermissions}
          onAddPermission={handleAddPermission}
          onUpdatePermission={handleUpdatePermission}
          onRemovePermission={handleRemovePermission}
        />
      }
      settingsContent={
        <ProjectSettingsTab
          project={null as any} // Will be provided by ProjectView
          onUpdate={handleProjectUpdate}
        />
      }
      onTabChange={handleTabChange}
    />
  )
}

