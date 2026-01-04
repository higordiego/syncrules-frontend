/**
 * Projects Feature - Public API
 * 
 * Exports only what should be used outside the feature.
 * Keeps internal implementation hidden.
 */

export { ProjectView } from "./components/project-view"
export { ProjectHeader } from "./components/project-header"
export { ProjectTabs } from "./components/project-tabs"
export { useProject } from "./hooks/use-project"
export type { Project, CreateProjectDto, UpdateProjectDto } from "./types"

