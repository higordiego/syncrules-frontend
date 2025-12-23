"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { AccountMetrics, ProjectMetrics } from "@/lib/types/governance"

interface MetricsDashboardProps {
  accountMetrics?: AccountMetrics
  projectMetrics?: ProjectMetrics
  projectId?: string
}

export function MetricsDashboard({
  accountMetrics,
  projectMetrics,
  projectId,
}: MetricsDashboardProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedRule, setSelectedRule] = useState<string>("all")

  const metrics = projectMetrics || accountMetrics
  if (!metrics) return null

  const isAccountView = !!accountMetrics

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {isAccountView && (
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {accountMetrics.callsByProject.map((p) => (
                    <SelectItem key={p.projectId} value={p.projectId}>
                      {p.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedRule} onValueChange={setSelectedRule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select rule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rules</SelectItem>
                {metrics.callsByRule.map((r) => (
                  <SelectItem key={r.ruleId} value={r.ruleId}>
                    {r.ruleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAccountView
                ? accountMetrics.totalCalls.toLocaleString()
                : projectMetrics?.totalCalls.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">MCP bootstrap calls</p>
          </CardContent>
        </Card>

        {isAccountView && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accountMetrics.callsByProject.length}</div>
              <p className="text-xs text-muted-foreground">Projects with usage</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.callsByRule.length}</div>
            <p className="text-xs text-muted-foreground">Rules in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IDE Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.callsByIDE.length}</div>
            <p className="text-xs text-muted-foreground">Different IDEs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Rule */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Rule</CardTitle>
            <CardDescription>MCP calls per rule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.callsByRule.slice(0, 10).map((item) => {
                const maxCount = Math.max(...metrics.callsByRule.map((r) => r.count))
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.ruleId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{item.ruleName}</span>
                      <span className="font-medium">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Usage by IDE */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by IDE</CardTitle>
            <CardDescription>MCP calls per IDE type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.callsByIDE.map((item) => {
                const maxCount = Math.max(...metrics.callsByIDE.map((i) => i.count))
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.ideType} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.ideType}</span>
                      <span className="font-medium">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adoption Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Adoption Trend</CardTitle>
          <CardDescription>Usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end justify-between gap-1">
            {metrics.adoptionTrend.map((day, index) => {
              const maxCalls = Math.max(...metrics.adoptionTrend.map((d) => d.calls))
              const height = (day.calls / maxCalls) * 100
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.calls} calls`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {metrics.adoptionTrend[0]?.date &&
                format(new Date(metrics.adoptionTrend[0].date), "MMM dd")}
            </span>
            <span>
              {metrics.adoptionTrend[metrics.adoptionTrend.length - 1]?.date &&
                format(
                  new Date(metrics.adoptionTrend[metrics.adoptionTrend.length - 1].date),
                  "MMM dd"
                )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage by Project (Account view only) */}
      {isAccountView && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Project</CardTitle>
            <CardDescription>MCP calls per project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accountMetrics.callsByProject.map((item) => {
                const maxCount = Math.max(...accountMetrics.callsByProject.map((p) => p.count))
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.projectId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.projectName}</span>
                      <span className="font-medium">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

