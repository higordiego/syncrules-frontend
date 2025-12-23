"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { listActivities, getActivityStats, getActivityHistory } from "@/lib/api-activity"
import { getUsageStats } from "@/lib/api-usage"
import { FileText, Key, FolderOpen, Edit, Trash2, Upload, BarChart3, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [usageStats, setUsageStats] = useState<any>({
    filesUsed: 0,
    filesLimit: 10,
    requestsUsed: 0,
    requestsLimit: 100,
    storageUsed: 0,
    storageLimit: 50,
  })
  const [requestsHistory, setRequestsHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load activities
      const activitiesResponse = await listActivities({ limit: 50 })
      if (activitiesResponse.success && activitiesResponse.data) {
        const activitiesData = activitiesResponse.data.data || activitiesResponse.data
        setActivities(Array.isArray(activitiesData) ? activitiesData : [])
      } else {
        setActivities([])
      }
      
      // Load usage stats
      const usageResponse = await getUsageStats()
      if (usageResponse.success && usageResponse.data) {
        setUsageStats({
          filesUsed: usageResponse.data.filesUsed,
          filesLimit: usageResponse.data.filesLimit,
          requestsUsed: usageResponse.data.requestsUsed,
          requestsLimit: usageResponse.data.requestsLimit,
          storageUsed: usageResponse.data.storageUsed / (1024 * 1024), // Convert bytes to MB
          storageLimit: usageResponse.data.storageLimit / (1024 * 1024), // Convert bytes to MB
        })
      }
      
      // Load history
      const historyResponse = await getActivityHistory({ days: 7 })
      if (historyResponse.success && historyResponse.data) {
        const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : []
        setRequestsHistory(historyData.map((a: any) => ({
          date: new Date(a.createdAt).toISOString().split("T")[0],
          count: 1, // You may need to aggregate this properly
        })))
      } else {
        setRequestsHistory([])
      }
    } catch (error) {
      console.error("Error loading activity data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <Upload className="h-4 w-4 text-white" />
      case "folder":
        return <FolderOpen className="h-4 w-4 text-white" />
      case "key":
        return <Key className="h-4 w-4 text-white" />
      case "edit":
        return <Edit className="h-4 w-4 text-white" />
      case "delete":
        return <Trash2 className="h-4 w-4 text-white" />
      default:
        return <FileText className="h-4 w-4 text-white" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "upload":
        return "bg-green-500"
      case "folder":
        return "bg-blue-500"
      case "key":
        return "bg-amber-500"
      case "edit":
        return "bg-purple-500"
      case "delete":
        return "bg-red-500"
      default:
        return "bg-slate-500"
    }
  }

  const maxRequests = Array.isArray(requestsHistory) && requestsHistory.length > 0
    ? Math.max(...requestsHistory.map((h) => h.count), 1)
    : 1

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Activity & Usage</h1>
                <p className="mt-2 text-muted-foreground">Monitor your usage and Freemium plan limits</p>
              </div>

              {/* Usage Stats */}
              <div className="grid gap-4 lg:gap-6 md:grid-cols-3">
                <Card className="border-border bg-card">
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-sm font-medium text-card-foreground">Files Uploaded</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-card-foreground">{usageStats.filesUsed}</span>
                      <span className="text-sm text-muted-foreground">/ {usageStats.filesLimit}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(usageStats.filesUsed / usageStats.filesLimit) * 100} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {usageStats.filesLimit - usageStats.filesUsed} files remaining
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-sm font-medium text-card-foreground">Requests</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-card-foreground">{usageStats.requestsUsed}</span>
                      <span className="text-sm text-muted-foreground">/ {usageStats.requestsLimit}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(usageStats.requestsUsed / usageStats.requestsLimit) * 100} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {usageStats.requestsLimit - usageStats.requestsUsed} requests remaining
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-sm font-medium text-card-foreground">Storage</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-card-foreground">{usageStats.storageUsed}</span>
                      <span className="text-sm text-muted-foreground">/ {usageStats.storageLimit} MB</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(usageStats.storageUsed / usageStats.storageLimit) * 100} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {(usageStats.storageLimit - usageStats.storageUsed).toFixed(1)} MB remaining
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Requests Chart */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Requests Chart
                  </CardTitle>
                  <CardDescription>Last 7 days of activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(requestsHistory) && requestsHistory.map((item, index) => {
                      const date = new Date(item.date)
                      const dateLabel = date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
                      const percentage = (item.count / maxRequests) * 100

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-card-foreground">{dateLabel}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              {item.count} requests
                            </span>
                          </div>
                          <div className="relative h-8 overflow-hidden rounded-lg bg-muted">
                            <div
                              className="h-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Activity History</CardTitle>
                  <CardDescription>All your recent actions in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="py-8 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No activity recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.isArray(activities) && activities.map((activity) => {
                        const date = new Date(activity.timestamp)
                        const timeLabel = date.toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })

                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                          >
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-card-foreground">{activity.description}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{timeLabel}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
