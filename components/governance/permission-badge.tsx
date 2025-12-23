"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, User, Lock, Edit, Shield, X } from "lucide-react"
import type { PermissionType, PermissionTargetType } from "@/lib/types/governance"
import { cn } from "@/lib/utils"

interface PermissionBadgeProps {
  permissionType: PermissionType
  targetType: PermissionTargetType
  className?: string
}

export function PermissionBadge({
  permissionType,
  targetType,
  className,
}: PermissionBadgeProps) {
  const getPermissionConfig = () => {
    switch (permissionType) {
      case "admin":
        return {
          label: "Admin",
          icon: Shield,
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          tooltip: "Full access: read, write, and manage permissions",
        }
      case "write":
        return {
          label: "Write",
          icon: Edit,
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          tooltip: "Can read and modify content",
        }
      case "read":
        return {
          label: "Read",
          icon: Lock,
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          tooltip: "Read-only access",
        }
      case "none":
        return {
          label: "No Access",
          icon: X,
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          tooltip: "No access to this resource",
        }
      default:
        return {
          label: "Unknown",
          icon: Lock,
          color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          tooltip: "",
        }
    }
  }

  const getTargetIcon = () => {
    return targetType === "group" ? Users : User
  }

  const permissionConfig = getPermissionConfig()
  const PermissionIcon = permissionConfig.icon
  const TargetIcon = getTargetIcon()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn("flex items-center gap-1", permissionConfig.color, className)}>
            <TargetIcon className="h-3 w-3" />
            <PermissionIcon className="h-3 w-3" />
            {permissionConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{permissionConfig.tooltip}</p>
            <p className="text-xs">Target: {targetType === "group" ? "Group" : "User"}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

