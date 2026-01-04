/**
 * Project Settings Tab Component
 * 
 * Displays project settings form.
 * Presentational component - receives data via props.
 * 
 * Max: 150 lines
 */

"use client"

import { ProjectGeneralSettings } from "@/components/projects/project-general-settings"
import type { Project } from "../types"

interface ProjectSettingsTabProps {
  project: Project
  onUpdate: (updatedProject: Project) => void
}

export function ProjectSettingsTab({ project, onUpdate }: ProjectSettingsTabProps) {
  return (
    <ProjectGeneralSettings
      project={project}
      onUpdate={onUpdate}
    />
  )
}

