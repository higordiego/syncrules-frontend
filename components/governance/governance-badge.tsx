"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw, Copy, Lock, Unlock, ArrowDown, FileText } from "lucide-react"
import type { SyncStatus, FolderStatus } from "@/lib/types/governance"
import { cn } from "@/lib/utils"

interface GovernanceBadgeProps {
  syncStatus: SyncStatus
  folderStatus?: FolderStatus
  inheritedFrom?: string
  sourceOfTruth: "account" | "project"
  className?: string
}

export function GovernanceBadge({
  syncStatus,
  folderStatus,
  inheritedFrom,
  sourceOfTruth,
  className,
}: GovernanceBadgeProps) {
  const getBadgeConfig = () => {
    switch (syncStatus) {
      case "synced":
        return {
          label: "Synced",
          icon: RefreshCw,
          variant: "default" as const,
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          tooltip: `Synced from ${sourceOfTruth === "account" ? "Account" : "Parent Project"}. Read-only.`,
        }
      case "detached":
        return {
          label: "Detached",
          icon: Copy,
          variant: "secondary" as const,
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          tooltip: `Detached from ${inheritedFrom ? "Account" : "Parent"}. Editable local copy.`,
        }
      case "local":
        return {
          label: "Local",
          icon: FileText,
          variant: "outline" as const,
          color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          tooltip: `Created locally in ${sourceOfTruth === "account" ? "Account" : "Project"}. Editable.`,
        }
      default:
        return {
          label: "Unknown",
          icon: FileText,
          variant: "outline" as const,
          color: "",
          tooltip: "",
        }
    }
  }

  const getStatusIcon = () => {
    if (folderStatus === "read-only") {
      return Lock
    }
    if (folderStatus === "editable") {
      return Unlock
    }
    return null
  }

  const badgeConfig = getBadgeConfig()
  const StatusIcon = badgeConfig.icon
  const StatusIndicatorIcon = getStatusIcon()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            <Badge className={cn("flex items-center gap-1", badgeConfig.color)}>
              <StatusIcon className="h-3 w-3" />
              {badgeConfig.label}
            </Badge>
            {StatusIndicatorIcon && (
              <StatusIndicatorIcon
                className={cn(
                  "h-3 w-3",
                  folderStatus === "read-only"
                    ? "text-red-500"
                    : "text-green-500"
                )}
              />
            )}
            {inheritedFrom && (
              <ArrowDown className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{badgeConfig.tooltip}</p>
            {folderStatus && (
              <p className="text-xs">
                Status: {folderStatus === "read-only" ? "Read-only" : "Editable"}
              </p>
            )}
            {inheritedFrom && (
              <p className="text-xs">Inherited from: {inheritedFrom}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

