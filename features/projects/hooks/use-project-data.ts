/**
 * useProjectData Hook
 * 
 * Encapsulates all data fetching for project page.
 * Handles folders, rules, permissions fetching.
 * 
 * Max: 100 lines
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { listFolders } from "@/lib/api-folders"
import { listRulesByProject } from "@/lib/api-rules"
import { listProjectPermissions } from "@/lib/api-project-permissions"
import type { Folder, Rule, Permission } from "@/lib/types/governance"

interface UseProjectDataResult {
  folders: Folder[]
  rules: Rule[]
  permissions: Permission[]
  isLoadingFolders: boolean
  isLoadingRules: boolean
  isLoadingPermissions: boolean
  refetchFolders: () => Promise<void>
  refetchRules: () => Promise<void>
  refetchPermissions: () => Promise<void>
}

export function useProjectData(projectId: string | null) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [isLoadingRules, setIsLoadingRules] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)

  const fetchFolders = useCallback(async () => {
    if (!projectId) return
    setIsLoadingFolders(true)
    try {
      const response = await listFolders(projectId)
      if (response.success && response.data) {
        setFolders(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error("Error loading folders:", error)
    } finally {
      setIsLoadingFolders(false)
    }
  }, [projectId])

  const fetchRules = useCallback(async () => {
    if (!projectId) return
    setIsLoadingRules(true)
    try {
      const response = await listRulesByProject(projectId)
      if (response.success && response.data) {
        setRules(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error("Error loading rules:", error)
    } finally {
      setIsLoadingRules(false)
    }
  }, [projectId])

  const fetchPermissions = useCallback(async () => {
    if (!projectId) return
    setIsLoadingPermissions(true)
    try {
      const response = await listProjectPermissions(projectId)
      if (response.success && response.data) {
        setPermissions(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error("Error loading permissions:", error)
    } finally {
      setIsLoadingPermissions(false)
    }
  }, [projectId])

  return {
    folders,
    rules,
    permissions,
    isLoadingFolders,
    isLoadingRules,
    isLoadingPermissions,
    refetchFolders: fetchFolders,
    refetchRules: fetchRules,
    refetchPermissions: fetchPermissions,
  }
}

