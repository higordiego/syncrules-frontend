/**
 * Project Actions with Business Rules
 * Centralized business logic for project operations
 */

import { useConfirm } from "@/lib/hooks/use-confirm"

export function useProjectActions() {
  const { ConfirmDialog } = useConfirm()

  return {
    ConfirmDialog,
  }
}
