"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserSync } from "@/lib/auth"
import { FileText, Key, FolderOpen, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { listDocuments } from "@/lib/api-documents"
import { listMCPKeys } from "@/lib/api-mcp-keys"
import { getUsageStats } from "@/lib/api-usage"
import { listIDEConnections } from "@/lib/api-sync"

interface Stats {
  totalDocuments: number
  totalFolders: number
  totalKeys: number
}

export default function DashboardPage() {
  const user = getUserSync()
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalFolders: 0,
    totalKeys: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Load documents from API
      const docsResponse = await listDocuments({ parentId: null, limit: 1000 })
      const documents = docsResponse.success && docsResponse.data ? docsResponse.data.data : []
      
      // Load MCP keys from API
      const keysResponse = await listMCPKeys()
      const keys = keysResponse.success && keysResponse.data ? keysResponse.data : []

      const countFolders = (items: any[]) => {
        return items.filter((item) => item.type === "folder").length
      }

      const countDocuments = (items: any[]) => {
        return items.filter((item) => item.type === "file").length
      }

      setStats({
        totalDocuments: countDocuments(documents),
        totalFolders: countFolders(documents),
        totalKeys: keys.length,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const [usageStats, setUsageStats] = useState({
    filesUsed: 0,
    filesLimit: 10,
    requestsUsed: 0,
    requestsLimit: 100,
    storageUsed: 0,
    storageLimit: 50,
  })
  const [ideConnections, setIDEConnections] = useState<any[]>([])

  useEffect(() => {
    loadUsageStats()
    loadIDEConnections()
  }, [])

  const loadUsageStats = async () => {
    try {
      const response = await getUsageStats()
      if (response.success && response.data) {
        setUsageStats({
          filesUsed: response.data.filesUsed,
          filesLimit: response.data.filesLimit,
          requestsUsed: response.data.requestsUsed,
          requestsLimit: response.data.requestsLimit,
          storageUsed: response.data.storageUsed / (1024 * 1024), // Convert bytes to MB
          storageLimit: response.data.storageLimit / (1024 * 1024), // Convert bytes to MB
        })
      }
    } catch (error) {
      console.error("Error loading usage stats:", error)
    }
  }

  const loadIDEConnections = async () => {
    try {
      const response = await listIDEConnections()
      if (response.success && response.data) {
        // Garantir que sempre seja um array
        setIDEConnections(Array.isArray(response.data) ? response.data : [])
      } else {
        setIDEConnections([])
      }
    } catch (error) {
      console.error("Error loading IDE connections:", error)
      setIDEConnections([])
    }
  }

  const getIDEIcon = (ideId: string) => {
    switch (ideId) {
      case "vscode":
        return "VS Code"
      case "cursor":
        return "Cursor IDE"
      case "copilot":
        return "GitHub Copilot"
      case "jetbrains":
        return "JetBrains IDEs"
      default:
        return ideId
    }
  }

  const getIDEStatus = (connection: any) => {
    if (connection.connected) {
      return {
        text: "Active",
        color: "text-green-600 dark:text-green-400",
        dotColor: "bg-green-500",
        bgColor: "bg-green-500/10",
        description: connection.lastSync ? `Last synced: ${new Date(connection.lastSync).toLocaleDateString()}` : "Connected and synced",
      }
    }
    return {
      text: "Inactive",
      color: "text-muted-foreground",
      dotColor: "bg-gray-500",
      bgColor: "bg-gray-500/10",
      description: "Waiting for connection",
    }
  }

  const currentPlan = {
    name: user?.plan || "Freemium",
    filesUsed: usageStats.filesUsed,
    filesLimit: usageStats.filesLimit,
    requestsUsed: usageStats.requestsUsed,
    requestsLimit: usageStats.requestsLimit,
  }

  const planUsagePercentage = currentPlan.filesLimit > 0 ? (currentPlan.filesUsed / currentPlan.filesLimit) * 100 : 0
  const requestsUsagePercentage = currentPlan.requestsLimit > 0 ? (currentPlan.requestsUsed / currentPlan.requestsLimit) * 100 : 0

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-4 lg:space-y-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="mt-2 text-sm lg:text-base text-muted-foreground">Welcome back, {user?.name}!</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground">Total Documents</CardTitle>
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-card-foreground">{stats.totalDocuments}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Markdown files</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground">Total Folders</CardTitle>
                    <FolderOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-card-foreground">{stats.totalFolders}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Organized in hierarchy</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground">MCP Keys</CardTitle>
                    <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-card-foreground">{stats.totalKeys}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Registered keys</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your most recent actions in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 rounded-lg border border-border bg-muted/50 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-card-foreground">Welcome to DocManager</p>
                          <p className="mt-1 text-xs text-muted-foreground">Start by adding your documents</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Quick Access</CardTitle>
                    <CardDescription>Links to main features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <a
                        href="/documents"
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Manage Documents</p>
                          <p className="text-xs text-muted-foreground">Add and organize your files</p>
                        </div>
                      </a>
                      <a
                        href="/mcp-keys"
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Manage MCP Keys</p>
                          <p className="text-xs text-muted-foreground">Configure your credentials</p>
                        </div>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      {currentPlan.name} Plan Usage
                    </CardTitle>
                    <CardDescription>Track your limits and usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-card-foreground">Files</span>
                        <span className="text-sm text-muted-foreground">
                          {currentPlan.filesUsed} / {currentPlan.filesLimit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            planUsagePercentage >= 80
                              ? "bg-red-500"
                              : planUsagePercentage >= 50
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${planUsagePercentage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-card-foreground">Requests (Month)</span>
                        <span className="text-sm text-muted-foreground">
                          {currentPlan.requestsUsed} / {currentPlan.requestsLimit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            requestsUsagePercentage >= 80
                              ? "bg-red-500"
                              : requestsUsagePercentage >= 50
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${requestsUsagePercentage}%` }}
                        />
                      </div>
                    </div>

                    {planUsagePercentage >= 80 && (
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          You're close to the limit! Consider upgrading.
                        </p>
                      </div>
                    )}

                    <a
                      href="/plans"
                      className="block w-full text-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      View Plans
                    </a>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <svg
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Sync Status
                    </CardTitle>
                    <CardDescription>Connections with your AI tools</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!Array.isArray(ideConnections) || ideConnections.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">No IDE connections configured</p>
                        <a
                          href="/sync-settings"
                          className="inline-block rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Configure Integrations
                        </a>
                      </div>
                    ) : (
                      <>
                        {ideConnections.map((connection) => {
                          const status = getIDEStatus(connection)
                          return (
                            <div key={connection.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${status.bgColor}`}>
                                  <div className={`h-2 w-2 rounded-full ${status.dotColor} ${connection.connected ? "animate-pulse" : ""}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-card-foreground">{connection.name || getIDEIcon(connection.ideId)}</p>
                                  <p className="text-xs text-muted-foreground">{status.description}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
                            </div>
                          )
                        })}
                        <a
                          href="/sync-settings"
                          className="w-full text-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Configure Integrations
                        </a>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
