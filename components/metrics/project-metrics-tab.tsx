"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Code,
  Monitor,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import type { ProjectMetrics } from "@/lib/types/governance"

interface ProjectMetricsTabProps {
  metrics: ProjectMetrics
}

export function ProjectMetricsTab({ metrics }: ProjectMetricsTabProps) {
  const hasActivity = metrics.totalCalls > 0
  const lastActivity = metrics.adoptionTrend.length > 0
    ? new Date(metrics.adoptionTrend[metrics.adoptionTrend.length - 1].date)
    : null

  // Calcular tendência (últimos 7 dias vs anteriores)
  const recentTrend = metrics.adoptionTrend.slice(-7)
  const previousTrend = metrics.adoptionTrend.slice(-14, -7)
  const recentTotal = recentTrend.reduce((sum, d) => sum + d.calls, 0)
  const previousTotal = previousTrend.reduce((sum, d) => sum + d.calls, 0)
  const trendPercentage = previousTotal > 0
    ? ((recentTotal - previousTotal) / previousTotal) * 100
    : recentTotal > 0 ? 100 : 0
  const isTrendingUp = trendPercentage > 0

  // Top rule
  const topRule = metrics.callsByRule.length > 0
    ? metrics.callsByRule.reduce((max, rule) => (rule.count > max.count ? rule : max), metrics.callsByRule[0])
    : null

  // Top IDE
  const topIDE = metrics.callsByIDE.length > 0
    ? metrics.callsByIDE.reduce((max, ide) => (ide.count > max.count ? ide : max), metrics.callsByIDE[0])
    : null

  // Total de regras utilizadas
  const activeRules = metrics.callsByRule.filter((r) => r.count > 0).length
  const totalRules = metrics.callsByRule.length

  return (
    <div className="space-y-6">
      {/* Status Card - Mostra se está sendo usado */}
      <Card className={hasActivity ? "border-green-500/50 bg-green-500/5" : "border-muted bg-muted/30"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasActivity ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">
                  {hasActivity ? "Metrics Active" : "No Activity Detected"}
                </CardTitle>
                <CardDescription>
                  {hasActivity
                    ? "This project is actively being used and tracked"
                    : "No MCP calls detected. Start using the project to see metrics."}
                </CardDescription>
              </div>
            </div>
            <Badge variant={hasActivity ? "default" : "secondary"} className="text-sm px-3 py-1">
              {hasActivity ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        {hasActivity && lastActivity && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last activity: {format(lastActivity, "MMM dd, yyyy")}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MCP Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalCalls.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              {isTrendingUp ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">
                    +{Math.abs(trendPercentage).toFixed(1)}% vs last week
                  </p>
                </>
              ) : trendPercentage < 0 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">
                    {Math.abs(trendPercentage).toFixed(1)}% vs last week
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No change</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Rules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeRules}/{totalRules}
            </div>
            <Progress value={(activeRules / totalRules) * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {totalRules > 0 ? `${Math.round((activeRules / totalRules) * 100)}% utilization` : "No rules"}
            </p>
          </CardContent>
        </Card>

        {/* Top Rule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Rule</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topRule ? (
              <>
                <div className="text-2xl font-bold">{topRule.count.toLocaleString()}</div>
                <p className="text-sm font-medium mt-1 truncate" title={topRule.ruleName}>
                  {topRule.ruleName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((topRule.count / metrics.totalCalls) * 100)}% of total calls
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-sm text-muted-foreground mt-1">No rules used</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top IDE */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used IDE</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topIDE ? (
              <>
                <div className="text-2xl font-bold">{topIDE.count.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {topIDE.ideType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((topIDE.count / metrics.totalCalls) * 100)}% of calls
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-sm text-muted-foreground mt-1">No IDE usage</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage by Rule */}
      {metrics.callsByRule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Usage by Rule
            </CardTitle>
            <CardDescription>MCP calls per rule in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.callsByRule
                .sort((a, b) => b.count - a.count)
                .map((rule) => {
                  const percentage = (rule.count / metrics.totalCalls) * 100
                  return (
                    <div key={rule.ruleId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate" title={rule.ruleName}>
                            {rule.ruleName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{rule.count.toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs">
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage by IDE */}
      {metrics.callsByIDE.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Usage by IDE Type
            </CardTitle>
            <CardDescription>MCP calls per IDE in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.callsByIDE
                .sort((a, b) => b.count - a.count)
                .map((ide) => {
                  const percentage = (ide.count / metrics.totalCalls) * 100
                  const getIDEIcon = () => {
                    switch (ide.ideType) {
                      case "vscode":
                        return "🔵"
                      case "cursor":
                        return "🟣"
                      case "jetbrains":
                        return "🟠"
                      case "neovim":
                        return "🟢"
                      default:
                        return "⚪"
                    }
                  }
                  return (
                    <div key={ide.ideType} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg">{getIDEIcon()}</span>
                          <span className="text-sm font-medium capitalize">{ide.ideType}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{ide.count.toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs">
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasActivity && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Metrics Available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              This project hasn't received any MCP calls yet. Once you start using the project with an IDE,
              metrics will appear here automatically.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

