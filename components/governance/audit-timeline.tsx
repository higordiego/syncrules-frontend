"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { AuditLog } from "@/lib/types/governance"
import {
  FolderKanban,
  Folder,
  FileText,
  GitBranch,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react"

interface AuditTimelineProps {
  logs: AuditLog[]
  projectId?: string
}

export function AuditTimeline({ logs, projectId }: AuditTimelineProps) {
  const getActionIcon = (action: AuditLog["action"]) => {
    switch (action) {
      case "project.created":
      case "rule.created":
        return Plus
      case "project.updated":
      case "rule.updated":
        return Edit
      case "project.deleted":
      case "rule.deleted":
        return Trash2
      case "folder.synced":
      case "folder.detached":
        return GitBranch
      case "inheritance.changed":
        return FolderKanban
      default:
        return FileText
    }
  }

  const getActionColor = (action: AuditLog["action"]) => {
    if (action.includes("deleted")) return "text-red-500"
    if (action.includes("created")) return "text-green-500"
    if (action.includes("updated")) return "text-blue-500"
    if (action.includes("synced") || action.includes("detached")) return "text-yellow-500"
    return "text-gray-500"
  }

  const getActionLabel = (action: AuditLog["action"]) => {
    const labels: Record<AuditLog["action"], string> = {
      "project.created": "Project Created",
      "project.updated": "Project Updated",
      "project.deleted": "Project Deleted",
      "folder.synced": "Folder Synced",
      "folder.detached": "Folder Detached",
      "rule.created": "Rule Created",
      "rule.updated": "Rule Updated",
      "rule.deleted": "Rule Deleted",
      "inheritance.changed": "Inheritance Changed",
    }
    return labels[action] || action
  }

  const filteredLogs = projectId
    ? logs.filter((log) => log.projectId === projectId)
    : logs

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Timeline</CardTitle>
        <CardDescription>
          {projectId ? "Activity for this project" : "All account activity"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity recorded</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              {filteredLogs.map((log, index) => {
                const Icon = getActionIcon(log.action)
                const color = getActionColor(log.action)
                return (
                  <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{getActionLabel(log.action)}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.resourceType}
                        </Badge>
                        {log.metadata?.warning && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Warning
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), "PPp")}
                      </p>
                      {log.changes && (
                        <div className="text-sm space-y-1 mt-2 p-2 bg-muted rounded">
                          {Object.entries(log.changes).map(([key, change]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="font-medium">{key}:</span>
                              <span className="text-muted-foreground line-through">
                                {String(change.from)}
                              </span>
                              <span>→</span>
                              <span className="font-medium">{String(change.to)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {log.metadata?.warning && (
                        <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          {log.metadata.warning as string}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

