/**
 * useProject Hook
 * 
 * Encapsulates project data fetching and state management.
 * Handles loading, error states, and data fetching.
 * 
 * Max: 100 lines
 */

"use client"

import { useState, useEffect } from "react"
import { projectService } from "../services/project-service"
import type { Project } from "../types"

interface UseProjectResult {
  project: Project | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProject(projectId: string | null): UseProjectResult {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProject = async () => {
    if (!projectId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await projectService.getById(projectId)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load project"))
      setProject(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  return {
    project,
    isLoading,
    error,
    refetch: fetchProject,
  }
}

