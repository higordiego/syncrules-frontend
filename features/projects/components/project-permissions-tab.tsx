/**
 * Project Permissions Tab Component
 * 
 * Displays and manages permissions for a project.
 * Presentational component - receives data via props.
 * 
 * Max: 150 lines
 */

"use client"

import { PermissionManager } from "@/components/governance/permission-manager"
import type { Permission } from "@/lib/types/governance"

interface ProjectPermissionsTabProps {
  permissions: Permission[]
  projectId: string
  isLoading: boolean
  onAddPermission: (permission: Omit<Permission, "id">) => Promise<void>
  onUpdatePermission: (id: string, permission: Partial<Permission>) => Promise<void>
  onRemovePermission: (id: string) => Promise<void>
}

export function ProjectPermissionsTab({
  permissions,
  projectId,
  isLoading,
  onAddPermission,
  onUpdatePermission,
  onRemovePermission,
}: ProjectPermissionsTabProps) {
  return (
    <PermissionManager
      permissions={permissions}
      targetType="project"
      targetId={projectId}
      isLoading={isLoading}
      onAddPermission={onAddPermission}
      onUpdatePermission={onUpdatePermission}
      onRemovePermission={onRemovePermission}
    />
  )
}

