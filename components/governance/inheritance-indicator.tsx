"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowDown, GitBranch, Copy, X } from "lucide-react"
import type { InheritanceMode } from "@/lib/types/governance"
import { cn } from "@/lib/utils"

interface InheritanceIndicatorProps {
  mode: InheritanceMode
  syncedCount?: number
  detachedCount?: number
  className?: string
}

export function InheritanceIndicator({
  mode,
  syncedCount = 0,
  detachedCount = 0,
  className,
}: InheritanceIndicatorProps) {
  const getModeConfig = () => {
    switch (mode) {
      case "full":
        return {
          label: "Full Inheritance",
          icon: ArrowDown,
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          tooltip: "All folders are synced from Account. Changes propagate automatically.",
        }
      case "partial":
        return {
          label: "Partial Inheritance",
          icon: GitBranch,
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          tooltip: `Some folders are synced (${syncedCount}), some are detached (${detachedCount}).`,
        }
      case "none":
        return {
          label: "No Inheritance",
          icon: X,
          color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          tooltip: "No inheritance from Account. All folders are local to this project.",
        }
      default:
        return {
          label: "Unknown",
          icon: Copy,
          color: "",
          tooltip: "",
        }
    }
  }

  const modeConfig = getModeConfig()
  const ModeIcon = modeConfig.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn("flex items-center gap-1", modeConfig.color, className)}>
            <ModeIcon className="h-3 w-3" />
            {modeConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{modeConfig.tooltip}</p>
            {mode === "partial" && (
              <div className="text-xs space-y-0.5">
                <p>Synced: {syncedCount} folders</p>
                <p>Detached: {detachedCount} folders</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

