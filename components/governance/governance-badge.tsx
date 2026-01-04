"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Lock, Unlock } from "lucide-react"
import type { FolderStatus } from "@/lib/types/governance"
import { cn } from "@/lib/utils"

interface GovernanceBadgeProps {
  folderStatus?: FolderStatus
  className?: string
}

export function GovernanceBadge({
  folderStatus,
  className,
}: GovernanceBadgeProps) {
  const getStatusIcon = () => {
    if (folderStatus === "read-only") {
      return Lock
    }
    if (folderStatus === "editable") {
      return Unlock
    }
    return null
  }

  const StatusIndicatorIcon = getStatusIcon()

  if (!StatusIndicatorIcon) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            <StatusIndicatorIcon
              className={cn(
                "h-3 w-3",
                folderStatus === "read-only"
                  ? "text-red-500"
                  : "text-green-500"
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {folderStatus && (
              <p className="text-xs">
                Status: {folderStatus === "read-only" ? "Read-only" : "Editable"}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

