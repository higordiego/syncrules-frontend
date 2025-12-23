"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Building2, FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"

interface SourceOfTruthIndicatorProps {
  source: "account" | "project"
  className?: string
}

export function SourceOfTruthIndicator({ source, className }: SourceOfTruthIndicatorProps) {
  const config =
    source === "account"
      ? {
          label: "Account",
          icon: Building2,
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          tooltip: "Source of truth: Account level. Changes here affect all synced projects.",
        }
      : {
          label: "Project",
          icon: FolderKanban,
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          tooltip: "Source of truth: Project level. Changes are local to this project.",
        }

  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn("flex items-center gap-1", config.color, className)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

