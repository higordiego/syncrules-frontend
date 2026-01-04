"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listActivities, getActivityHistory } from "@/lib/api-activity"
import { getUsageStats } from "@/lib/api-usage"
import { 
  FileText, 
  Key, 
  FolderOpen, 
  Edit, 
  Trash2, 
  Upload, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Loader2,
  RefreshCw,
  Filter,
  Clock,
  Activity as ActivityIcon
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useAccount } from "@/context/AccountContext"
import { useToast } from "@/components/ui/use-toast"
import type { Activity } from "@/lib/api-activity"
import type { UsageStats } from "@/lib/api-usage"

interface RequestHistoryItem {
  date: string
  count: number
}

const ACTIVITY_TYPES = [
  { value: "all", label: "All Activities" },
  { value: "upload", label: "Uploads" },
  { value: "folder", label: "Folders" },
  { value: "key", label: "Keys" },
  { value: "edit", label: "Edits" },
  { value: "delete", label: "Deletes" },
  { value: "sync", label: "Syncs" },
  { value: "request", label: "Requests" },
]

const TIME_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
]

export default function ActivityPage() {
  const { selectedAccountId: accountId } = useAccount()
  const { toast } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [requestsHistory, setRequestsHistory] = useState<RequestHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedDays, setSelectedDays] = useState<string>("7")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadData = useCallback(async (showRefreshing = false) => {
    if (!accountId) {
      setLoading(false)
      return
    }

    try {
      if (showRefreshing) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Load activities with filter
      const activitiesResponse = await listActivities({ 
        limit: 50,
        type: selectedType !== "all" ? selectedType : undefined
      })
      if (activitiesResponse.success && activitiesResponse.data) {
        const activitiesData = Array.isArray(activitiesResponse.data) 
          ? activitiesResponse.data 
          : (activitiesResponse.data.data || [])
        setActivities(activitiesData)
      } else {
        setActivities([])
      }

      // Load usage stats
      const usageResponse = await getUsageStats()
      if (usageResponse.success && usageResponse.data) {
        setUsageStats(usageResponse.data)
      } else {
        setUsageStats(null)
        if (!showRefreshing) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load usage statistics",
          })
        }
      }

      // Load request history
      const historyResponse = await getActivityHistory({ 
        days: parseInt(selectedDays), 
        type: "request" 
      })
      if (historyResponse.success && historyResponse.data) {
        const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : []
        
        // Aggregate requests by date
        const requestsByDate = new Map<string, number>()
        historyData.forEach((activity: Activity) => {
          const date = activity.createdAt 
            ? new Date(activity.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
          requestsByDate.set(date, (requestsByDate.get(date) || 0) + 1)
        })

        // Convert to array and sort by date
        const historyArray: RequestHistoryItem[] = Array.from(requestsByDate.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setRequestsHistory(historyArray)
      } else {
        setRequestsHistory([])
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error loading activity data:", error)
      setError(error instanceof Error ? error.message : "Failed to load data")
      if (!showRefreshing) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load activity data",
        })
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [accountId, selectedType, selectedDays, toast])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!accountId) return

    const interval = setInterval(() => {
      loadData(true) // Silent refresh
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [accountId, loadData])

  const handleRefresh = () => {
    loadData(true)
    toast({
      title: "Refreshing...",
      description: "Updating activity data",
    })
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
      case "sync":
        return <RefreshCw className="h-4 w-4 text-white" />
      case "request":
        return <Zap className="h-4 w-4 text-white" />
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
      case "sync":
        return "bg-cyan-500"
      case "request":
        return "bg-indigo-500"
      default:
        return "bg-slate-500"
    }
  }

  // Calculate display values for usage stats
  const displayUsageStats = usageStats ? {
    filesUsed: usageStats.filesUsed,
    filesLimit: usageStats.filesLimit,
    filesPercent: usageStats.filesLimit > 0 ? (usageStats.filesUsed / usageStats.filesLimit) * 100 : 0,
    requestsUsed: usageStats.requestsUsed,
    requestsLimit: usageStats.requestsLimit,
    requestsPercent: usageStats.requestsLimit > 0 ? (usageStats.requestsUsed / usageStats.requestsLimit) * 100 : 0,
    storageUsed: usageStats.storageUsed / (1024 * 1024), // Convert bytes to MB
    storageLimit: usageStats.storageLimit / (1024 * 1024), // Convert bytes to MB
    storagePercent: usageStats.storageLimit > 0 ? (usageStats.storageUsed / usageStats.storageLimit) * 100 : 0,
  } : {
    filesUsed: 0,
    filesLimit: 0,
    filesPercent: 0,
    requestsUsed: 0,
    requestsLimit: 0,
    requestsPercent: 0,
    storageUsed: 0,
    storageLimit: 0,
    storagePercent: 0,
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading activity data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center space-y-2">
          <p className="text-destructive font-semibold text-lg">{error}</p>
          <p className="text-muted-foreground text-sm">Please try again</p>
        </div>
        <Button onClick={() => loadData()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto max-w-7xl space-y-6 w-full">
        {/* Header */}
        <div className="bg-background/40 backdrop-blur-sm border border-muted/20 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-blue-500/10" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Activity & Usage</h1>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-muted-foreground font-medium flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time monitoring of your governance footprint
                </p>
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {formatTimeAgo(lastUpdate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Usage Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <FileText className="h-12 w-12" />
            </div>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Files Uploaded</CardTitle>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-4xl font-black tracking-tight text-foreground">{displayUsageStats.filesUsed}</span>
                <span className="text-sm font-bold text-muted-foreground">/ {displayUsageStats.filesLimit === 0 ? '∞' : displayUsageStats.filesLimit}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={displayUsageStats.filesPercent} 
                className="h-2.5 bg-blue-100 dark:bg-blue-900/30" 
              />
              <p className="mt-4 text-xs text-muted-foreground font-semibold italic">
                {displayUsageStats.filesLimit === 0 
                  ? "Unlimited storage" 
                  : `${displayUsageStats.filesLimit - displayUsageStats.filesUsed} files remaining in quota`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="h-12 w-12" />
            </div>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Total Requests</CardTitle>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-4xl font-black tracking-tight text-foreground">{displayUsageStats.requestsUsed}</span>
                <span className="text-sm font-bold text-muted-foreground">/ {displayUsageStats.requestsLimit === 0 ? '∞' : displayUsageStats.requestsLimit}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={displayUsageStats.requestsPercent} 
                className="h-2.5 bg-indigo-100 dark:bg-indigo-900/30" 
              />
              <p className="mt-4 text-xs text-muted-foreground font-semibold italic">
                {displayUsageStats.requestsLimit === 0 
                  ? "Unlimited requests" 
                  : `${displayUsageStats.requestsLimit - displayUsageStats.requestsUsed} requests until reset`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-12 w-12" />
            </div>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Context Storage</CardTitle>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-4xl font-black tracking-tight text-foreground">{displayUsageStats.storageUsed.toFixed(1)}</span>
                <span className="text-sm font-bold text-muted-foreground">/ {displayUsageStats.storageLimit === 0 ? '∞' : `${displayUsageStats.storageLimit.toFixed(1)} MB`}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={displayUsageStats.storagePercent} 
                className="h-2.5 bg-emerald-100 dark:bg-emerald-900/30" 
              />
              <p className="mt-4 text-xs text-muted-foreground font-semibold italic">
                {displayUsageStats.storageLimit === 0 
                  ? "Unlimited storage" 
                  : `${(displayUsageStats.storageLimit - displayUsageStats.storageUsed).toFixed(1)} MB available storage`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Chart */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Requests Chart
              </CardTitle>
              <CardDescription>Activity over time</CardDescription>
            </div>
            <Select value={selectedDays} onValueChange={setSelectedDays}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {requestsHistory.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No request history available</p>
                <p className="text-sm mt-1">Activity will appear here as requests are made</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requestsHistory.map((item, index) => {
                  const date = new Date(item.date)
                  const dateLabel = date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
                  const maxRequests = Math.max(...requestsHistory.map((h) => h.count), 1)
                  const percentage = maxRequests > 0 ? (item.count / maxRequests) * 100 : 0

                  return (
                    <div key={`${item.date}-${index}`} className="space-y-1 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-card-foreground">{dateLabel}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {item.count} {item.count === 1 ? 'request' : 'requests'}
                        </span>
                      </div>
                      <div className="relative h-8 overflow-hidden rounded-lg bg-muted">
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="border-none shadow-sm bg-background/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-muted/20 bg-muted/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <div className="bg-blue-600/10 p-2.5 rounded-2xl">
                  <ActivityIcon className="h-6 w-6 text-blue-600" />
                </div>
                Activity Timeline
              </CardTitle>
              <CardDescription className="text-base font-medium mt-2">Historical audit trail of all governance events</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {activities.length === 0 ? (
              <div className="py-20 text-center bg-muted/20 border-2 border-dashed rounded-[2rem]">
                <div className="bg-background p-5 rounded-3xl shadow-sm border w-fit mx-auto mb-6">
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pristine Workspace</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">No actions captured in the timeline yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(activities) && activities.map((activity, index) => {
                  const timestamp = activity.createdAt || new Date().toISOString()
                  const date = new Date(timestamp)
                  const timeLabel = date.toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  return (
                    <div
                      key={activity.id}
                      className="group flex items-start gap-5 p-5 bg-background border rounded-3xl hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform ${getActivityColor(activity.type)}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-bold text-foreground leading-tight">{activity.description}</p>
                        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground/70">
                          <Badge variant="outline" className="text-xs uppercase tracking-widest">
                            {activity.type}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
