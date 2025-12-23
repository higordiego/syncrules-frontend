/**
 * Project Actions with Business Rules
 * Centralized business logic for project operations
 */

import { useToast } from "@/components/ui/use-toast"
import { useConfirm } from "@/lib/hooks/use-confirm"
import type { Project, InheritanceMode } from "@/lib/types/governance"
import { updateProject } from "@/lib/api-projects"

interface UpdateInheritanceParams {
  projectId: string
  mode: InheritanceMode
  onSuccess?: () => void
}

interface DetachFolderParams {
  folderId: string
  projectId: string
  folderName: string
  onSuccess?: () => void
}

interface ReSyncFolderParams {
  folderId: string
  projectId: string
  folderName: string
  onSuccess?: () => void
}

export function useProjectActions() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  /**
   * Update Inheritance Mode
   * REGRAS DE NEGÓCIO:
   * - Validar que projeto existe
   * - Se mudando para "none", avisar que folders synced serão perdidos
   * - Se mudando para "full", sincronizar todos os folders da Account
   * - Se mudando para "partial", manter folders já synced/detached
   */
  const updateInheritanceMode = async ({
    projectId,
    mode,
    onSuccess,
  }: UpdateInheritanceParams) => {
    try {
      const response = await updateProject(projectId, { inheritanceMode: mode })
      if (!response.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to update inheritance mode",
        })
        return
      }

      toast({
        title: "Success",
        description: `Inheritance mode updated to "${mode}"`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update inheritance mode",
      })
    }
  }

  /**
   * Detach Folder
   * REGRAS DE NEGÓCIO:
   * - Validar que folder está synced
   * - Avisar que será criada cópia local (editable)
   * - Folder original na Account não será afetado
   * - Mudanças futuras na Account não propagarão para este folder
   */
  const detachFolder = async ({ folderId, projectId, folderName, onSuccess }: DetachFolderParams) => {
    try {
      // REGRA: Confirmar ação destrutiva
      const confirmed = await confirm({
        title: `Detach folder "${folderName}"?`,
        description: `This will create a local editable copy. Changes in Account will no longer propagate to this folder.\n\nThis action cannot be undone.`,
        variant: "destructive",
        confirmText: "Detach Folder",
        cancelText: "Cancel",
      })

      if (!confirmed) return

      const { detachFolder: detachFolderAPI } = await import("@/lib/api-folders")
      const response = await detachFolderAPI(folderId)
      if (!response.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to detach folder",
        })
        return
      }

      toast({
        title: "Folder Detached",
        description: `Folder "${folderName}" is now a local editable copy.`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to detach folder",
      })
    }
  }

  /**
   * Re-sync Folder
   * REGRAS DE NEGÓCIO:
   * - Validar que folder está detached
   * - AVISAR: Mudanças locais serão perdidas (sobrescritas)
   * - Folder voltará a ser read-only
   * - Mudanças na Account voltarão a propagar
   */
  const reSyncFolder = async ({
    folderId,
    projectId,
    folderName,
    onSuccess,
  }: ReSyncFolderParams) => {
    try {
      // REGRA: Aviso crítico sobre perda de dados
      const confirmed = await confirm({
        title: `Re-sync folder "${folderName}"?`,
        description: `⚠️ WARNING: All local changes will be LOST!\n\nThe folder will be overwritten with the Account version and become read-only again.\n\nThis action cannot be undone.`,
        variant: "destructive",
        confirmText: "Re-sync Folder",
        cancelText: "Cancel",
      })

      if (!confirmed) return

      const { reSyncFolder: reSyncFolderAPI } = await import("@/lib/api-folders")
      const response = await reSyncFolderAPI(folderId)
      if (!response.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to re-sync folder",
        })
        return
      }

      toast({
        title: "Folder Re-synced",
        description: `Folder "${folderName}" is now synced with Account and read-only.`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to re-sync folder",
      })
    }
  }

  return {
    updateInheritanceMode,
    detachFolder,
    reSyncFolder,
    ConfirmDialog,
  }
}

