"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  FileText,
  RefreshCw,
  Shield,
  Clock,
  Zap,
} from "lucide-react"
import Link from "next/link"
import type { Project, AccountMetrics, Folder } from "@/lib/types/governance"

interface InsightsPanelProps {
  projects: Project[]
  metrics: AccountMetrics
  folders: Folder[]
}

interface Insight {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  icon: React.ComponentType<{ className?: string }>
  priority: "high" | "medium" | "low"
}

export function InsightsPanel({ projects, metrics, folders }: InsightsPanelProps) {
  const insights: Insight[] = []

  // 1. Verificar projetos sem uso
  const projectsWithoutUsage = projects.filter((p) => {
    const projectUsage = metrics.callsByProject.find((cp) => cp.projectId === p.id)
    return !projectUsage || projectUsage.count === 0
  })

  if (projectsWithoutUsage.length > 0) {
    insights.push({
      id: "unused-projects",
      type: "warning",
      title: `${projectsWithoutUsage.length} Project${projectsWithoutUsage.length > 1 ? "s" : ""} Without Usage`,
      description: `These projects have no MCP calls yet. Consider configuring your IDE to use them or review their rules.`,
      action: {
        label: "View Projects",
        href: "/account",
      },
      icon: FolderKanban,
      priority: "high",
    })
  }

  // 2. Verificar projetos sem regras
  const projectsWithoutRules = projects.filter((p) => !p.rules || p.rules.length === 0)

  if (projectsWithoutRules.length > 0) {
    insights.push({
      id: "no-rules-projects",
      type: "warning",
      title: `${projectsWithoutRules.length} Project${projectsWithoutRules.length > 1 ? "s" : ""} Without Rules`,
      description: `These projects don't have any rules configured. Add rules to make them useful for your team.`,
      action: {
        label: "Add Rules",
        href: `/account/projects/${projectsWithoutRules[0]?.id}`,
      },
      icon: FileText,
      priority: "high",
    })
  }

  // 3. Verificar folders sem regras
  const foldersWithoutRules = folders.filter((f) => f.ruleCount === 0)

  if (foldersWithoutRules.length > 0) {
    insights.push({
      id: "empty-folders",
      type: "info",
      title: `${foldersWithoutRules.length} Empty Folder${foldersWithoutRules.length > 1 ? "s" : ""}`,
      description: `Some folders don't have any rules yet. Consider adding rules or removing empty folders.`,
      icon: FolderKanban,
      priority: "medium",
    })
  }

  // 4. Verificar projetos sem folders
  const projectsWithoutFolders = projects.filter(
    (p) => p.folders.length === 0
  )

  if (projectsWithoutFolders.length > 0) {
    insights.push({
      id: "projects-no-folders",
      type: "info",
      title: "Projects without folders",
      description: `Some projects don't have folders yet. Create folders to organize your rules.`,
      action: {
        label: "View Projects",
        href: `/account/projects/${projectsWithoutFolders[0]?.id}`,
      },
      icon: RefreshCw,
      priority: "medium",
    })
  }

  // 5. Verificar adoção (trend)
  const recentTrend = metrics.adoptionTrend.slice(-7)
  if (recentTrend.length > 1) {
    const lastWeek = recentTrend.slice(0, 3).reduce((sum, d) => sum + d.calls, 0)
    const thisWeek = recentTrend.slice(-3).reduce((sum, d) => sum + d.calls, 0)
    const trendChange = ((thisWeek - lastWeek) / lastWeek) * 100

    if (trendChange < -20) {
      insights.push({
        id: "declining-usage",
        type: "warning",
        title: "Usage Declining",
        description: `MCP calls decreased by ${Math.abs(trendChange).toFixed(0)}% compared to last week. Check if there are configuration issues.`,
        action: {
          label: "View Metrics",
          href: "/account/metrics",
        },
        icon: TrendingDown,
        priority: "high",
      })
    } else if (trendChange > 20) {
      insights.push({
        id: "growing-usage",
        type: "success",
        title: "Usage Growing",
        description: `MCP calls increased by ${trendChange.toFixed(0)}% compared to last week. Great adoption!`,
        icon: TrendingUp,
        priority: "low",
      })
    }
  }

  // 6. Verificar regras não utilizadas
  const unusedRules = metrics.callsByRule.filter((r) => r.count === 0)
  if (unusedRules.length > 0 && unusedRules.length <= 5) {
    insights.push({
      id: "unused-rules",
      type: "info",
      title: `${unusedRules.length} Rule${unusedRules.length > 1 ? "s" : ""} Not Being Used`,
      description: `Some rules haven't been accessed yet. Review them to ensure they're properly configured.`,
      action: {
        label: "View Rules",
        href: "/account/metrics",
      },
      icon: FileText,
      priority: "low",
    })
  }

  // 7. Verificar projetos sem permissões configuradas
  const projectsWithoutPermissions = projects.filter(
    (p) => !p.permissions || p.permissions.length === 0
  )

  if (projectsWithoutPermissions.length > 0 && projects.length > 1) {
    insights.push({
      id: "no-permissions",
      type: "warning",
      title: "Projects Without Permissions",
      description: `Some projects don't have permissions configured. Set up permissions to control access.`,
      action: {
        label: "Configure Permissions",
        href: `/account/projects/${projectsWithoutPermissions[0]?.id}?tab=permissions`,
      },
      icon: Shield,
      priority: "medium",
    })
  }

  // 8. Verificar se há uso recente
  const lastCallDate = metrics.adoptionTrend[metrics.adoptionTrend.length - 1]?.date
  if (lastCallDate) {
    const daysSinceLastCall = Math.floor(
      (new Date().getTime() - new Date(lastCallDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastCall > 7) {
      insights.push({
        id: "stale-usage",
        type: "warning",
        title: "No Recent Activity",
        description: `No MCP calls in the last ${daysSinceLastCall} days. Verify that IDEs are properly configured.`,
        action: {
          label: "Check Configuration",
          href: "/account",
        },
        icon: Clock,
        priority: "high",
      })
    }
  }

  // 9. Verificar se há muitos projetos sem uso
  if (projectsWithoutUsage.length > projects.length * 0.5) {
    insights.push({
      id: "many-unused-projects",
      type: "error",
      title: "Most Projects Unused",
      description: `More than 50% of your projects have no usage. Consider consolidating or removing unused projects.`,
      action: {
        label: "Review Projects",
        href: "/account",
      },
      icon: AlertCircle,
      priority: "high",
    })
  }

  // 10. Verificar performance (se muitas chamadas)
  if (metrics.totalCalls > 10000) {
    const avgCallsPerDay = metrics.totalCalls / 30
    if (avgCallsPerDay > 500) {
      insights.push({
        id: "high-usage",
        type: "success",
        title: "High Usage Detected",
        description: `Your platform is handling ${avgCallsPerDay.toFixed(0)} calls per day on average. Great adoption!`,
        icon: Zap,
        priority: "low",
      })
    }
  }

  // Ordenar por prioridade
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const getInsightStyles = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
      case "error":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      case "info":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
      default:
        return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
    }
  }

  const getIconColor = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "warning":
        return "text-amber-600 dark:text-amber-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      case "info":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>System health and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                All Systems Operational
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Everything looks good! Your projects are active and configured correctly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights & Alerts</CardTitle>
        <CardDescription>
          Important information and recommendations ({insights.length} alert{insights.length > 1 ? "s" : ""})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => {
            const Icon = insight.icon
            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${getInsightStyles(insight.type)}`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getIconColor(insight.type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {insight.type === "success"
                            ? "✓"
                            : insight.type === "warning"
                              ? "⚠"
                              : insight.type === "error"
                                ? "✗"
                                : "ℹ"}{" "}
                          {insight.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            insight.priority === "high"
                              ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
                              : insight.priority === "medium"
                                ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                                : "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={insight.action.href}>{insight.action.label}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

