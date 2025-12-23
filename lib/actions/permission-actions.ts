/**
 * Permission Actions with Business Rules
 * Centralized business logic for permission operations
 */

import { useToast } from "@/components/ui/use-toast"
import { useConfirm } from "@/lib/hooks/use-confirm"
import type { Permission, PermissionType } from "@/lib/types/governance"
import { createProjectPermission, updateProjectPermission, deleteProjectPermission, toggleInheritPermissions as toggleInheritPermissionsAPI } from "@/lib/api-project-permissions"

interface AddPermissionParams {
  resourceType: "project" | "folder"
  resourceId: string
  resourceName: string
  permission: Omit<Permission, "id" | "grantedAt" | "grantedBy">
  onSuccess?: () => void
}

interface UpdatePermissionParams {
  permissionId: string
  resourceType: "project" | "folder"
  resourceId: string
  permissionType: PermissionType
  onSuccess?: () => void
}

interface RemovePermissionParams {
  permissionId: string
  resourceType: "project" | "folder"
  resourceId: string
  targetName: string
  onSuccess?: () => void
}

interface ToggleInheritPermissionsParams {
  resourceType: "project" | "folder"
  resourceId: string
  enabled: boolean
  onSuccess?: () => void
}

export function usePermissionActions() {
  const { toast } = useToast()
  const { confirm } = useConfirm()

  /**
   * Add Permission
   * REGRAS DE NEGÓCIO:
   * - Validar que target (user/group) existe
   * - Validar que não há permissão duplicada
   * - Se herança está ativa, avisar que permissão local pode sobrescrever herdada
   * - Registrar quem concedeu a permissão (audit)
   */
  const addPermission = async ({
    resourceType,
    resourceId,
    resourceName,
    permission,
    onSuccess,
  }: AddPermissionParams) => {
    try {
      // REGRA: Validar que target existe
      if (!permission.targetId) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select a user or group",
        })
        return
      }

      // REGRA: Validar que não há permissão duplicada
      // (em produção, verificar via API)

      if (resourceType === "project") {
        const response = await createProjectPermission({
          projectId: resourceId,
          targetType: permission.targetType,
          targetId: permission.targetId,
          permissionType: permission.permissionType,
        })

        if (!response.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error?.message || "Failed to add permission",
          })
          return
        }
      } else {
        // TODO: Implementar API para folder permissions
        toast({
          variant: "destructive",
          title: "Not Implemented",
          description: "Folder permissions API not yet implemented",
        })
        return
      }

      toast({
        title: "Permission Added",
        description: `${permission.permissionType} permission granted to ${permission.targetName} for ${resourceType}: ${resourceName}`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add permission",
      })
    }
  }

  /**
   * Update Permission
   * REGRAS DE NEGÓCIO:
   * - Validar que permissão existe e não é herdada
   * - Se reduzindo de Admin para Write/Read, avisar sobre perda de controle de permissões
   * - Se aumentando para Admin, avisar sobre acesso total
   * - Registrar mudança (audit)
   */
  const updatePermission = async ({
    permissionId,
    resourceType,
    resourceId,
    permissionType,
    onSuccess,
  }: UpdatePermissionParams) => {
    try {
      // REGRA: Validar que permissão não é herdada
      // (em produção, verificar via API)

      // REGRA: Avisar sobre mudanças significativas
      // (em produção, buscar permissão atual e comparar)

      if (resourceType === "project") {
        const response = await updateProjectPermission(permissionId, { permissionType })
        if (!response.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error?.message || "Failed to update permission",
          })
          return
        }
      } else {
        // TODO: Implementar API para folder permissions
        toast({
          variant: "destructive",
          title: "Not Implemented",
          description: "Folder permissions API not yet implemented",
        })
        return
      }

      toast({
        title: "Permission Updated",
        description: `Permission level updated to ${permissionType}`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update permission",
      })
    }
  }

  /**
   * Remove Permission
   * REGRAS DE NEGÓCIO:
   * - Validar que permissão não é herdada (não pode remover herdada)
   * - Confirmar remoção
   * - Avisar sobre perda de acesso
   * - Registrar remoção (audit)
   */
  const removePermission = async ({
    permissionId,
    resourceType,
    resourceId,
    targetName,
    onSuccess,
  }: RemovePermissionParams) => {
    try {
      // REGRA: Confirmar ação destrutiva
      const confirmed = await confirm({
        title: `Remove permission for ${targetName}?`,
        description: `This will revoke access to this ${resourceType}.\n\nThis action cannot be undone.`,
        variant: "destructive",
        confirmText: "Remove Permission",
        cancelText: "Cancel",
      })

      if (!confirmed) return

      if (resourceType === "project") {
        const response = await deleteProjectPermission(permissionId)
        if (!response.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error?.message || "Failed to remove permission",
          })
          return
        }
      } else {
        // TODO: Implementar API para folder permissions
        toast({
          variant: "destructive",
          title: "Not Implemented",
          description: "Folder permissions API not yet implemented",
        })
        return
      }

      toast({
        title: "Permission Removed",
        description: `Access revoked for ${targetName}`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove permission",
      })
    }
  }

  /**
   * Toggle Inherit Permissions
   * REGRAS DE NEGÓCIO:
   * - Se ativando herança: permissões locais serão mescladas com herdadas
   * - Se desativando herança: apenas permissões locais serão mantidas
   * - Avisar sobre impacto nas permissões existentes
   */
  const toggleInheritPermissions = async ({
    resourceType,
    resourceId,
    enabled,
    onSuccess,
  }: ToggleInheritPermissionsParams) => {
    try {
      if (enabled) {
        // REGRA: Avisar sobre mesclagem de permissões
        const confirmed = await confirm({
          title: "Enable permission inheritance?",
          description: `Permissions from ${resourceType === "project" ? "Account" : "Project"} will be inherited.\n\nLocal permissions will be merged with inherited ones.`,
          variant: "default",
          confirmText: "Enable Inheritance",
          cancelText: "Cancel",
        })

        if (!confirmed) return
      } else {
        // REGRA: Avisar sobre perda de permissões herdadas
        const confirmed = await confirm({
          title: "Disable permission inheritance?",
          description: `Only local permissions will be kept. Inherited permissions will be removed.\n\nThis action cannot be undone.`,
          variant: "warning",
          confirmText: "Disable Inheritance",
          cancelText: "Cancel",
        })

        if (!confirmed) return
      }

      if (resourceType === "project") {
        const response = await toggleInheritPermissionsAPI({
          projectId: resourceId,
          enabled,
        })

        if (!response.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error?.message || "Failed to update permission inheritance",
          })
          return
        }

        // Use the actual value returned from the backend
        const actualEnabled = response.data?.inheritPermissions ?? enabled

        toast({
          title: "Permission Inheritance Updated",
          description: `Permission inheritance ${actualEnabled ? "enabled" : "disabled"}`,
        })
      } else {
        // TODO: Implementar API para folder permissions
        toast({
          variant: "destructive",
          title: "Not Implemented",
          description: "Folder permissions API not yet implemented",
        })
        return
      }

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update permission inheritance",
      })
    }
  }

  const { ConfirmDialog } = useConfirm()

  return {
    addPermission,
    updatePermission,
    removePermission,
    toggleInheritPermissions,
    ConfirmDialog,
  }
}

