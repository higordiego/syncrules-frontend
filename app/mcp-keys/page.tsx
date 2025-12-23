"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  Edit,
  Globe,
  Building2,
  FolderKanban,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Activity,
  Shield,
  AlertCircle,
} from "lucide-react"
import { listMCPKeys, deleteMCPKey, type MCPKey } from "@/lib/api-mcp-keys"
import { MCPKeyScopeDialog } from "@/components/mcp-keys/mcp-key-scope-dialog"

export default function MCPKeysPage() {
  const [keys, setKeys] = useState<MCPKey[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<MCPKey | undefined>(undefined)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      setLoading(true)
      const response = await listMCPKeys()
      if (response.success && response.data) {
        const keysData = Array.isArray(response.data) ? response.data : []
        setKeys(keysData)
      } else {
        setKeys([])
      }
    } catch (error) {
      console.error("Error loading MCP keys:", error)
      setKeys([])
    } finally {
      setLoading(false)
    }
  }

  const handleDialogSuccess = () => {
    loadKeys()
    setEditingKey(undefined)
  }

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return

    try {
      setLoading(true)
      await deleteMCPKey(deleteKeyId)
      setDeleteKeyId(null)
      await loadKeys()
    } catch (error) {
      console.error("Error deleting MCP key:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Calculate statistics
  const stats = {
    total: keys.length,
    allProjects: keys.filter((k) => k.scope === "all_projects").length,
    organizations: keys.filter((k) => k.scope === "account").length,
    projects: keys.filter((k) => k.scope === "project").length,
    active: keys.filter((k) => k.lastUsed).length,
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "all_projects":
        return <Globe className="h-4 w-4" />
      case "account":
        return <Building2 className="h-4 w-4" />
      case "project":
        return <FolderKanban className="h-4 w-4" />
      default:
        return <Key className="h-4 w-4" />
    }
  }

  const getScopeLabel = (keyItem: MCPKey) => {
    switch (keyItem.scope) {
      case "all_projects":
        return "All Projects"
      case "account":
        const accountCount = keyItem.accountIds?.length || (keyItem.accountId ? 1 : 0)
        return accountCount > 1 ? `${accountCount} Organizations` : "1 Organization"
      case "project":
        const projectCount = keyItem.projectIds?.length || (keyItem.projectId ? 1 : 0)
        return projectCount > 1 ? `${projectCount} Projects` : "1 Project"
      default:
        return "Unknown"
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">MCP API Keys</h1>
                  <p className="mt-2 text-sm lg:text-base text-muted-foreground">
                    Manage and monitor your Model Context Protocol API keys
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingKey(undefined)
                    setIsAddDialogOpen(true)
                  }}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                      <Plus className="mr-2 h-4 w-4" />
                  Create New Key
                        </Button>
              </div>

              {/* Statistics Cards */}
              {keys.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <p className="text-xs text-muted-foreground">Active API keys</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">All Projects</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.allProjects}</div>
                      <p className="text-xs text-muted-foreground">Global access</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.organizations}</div>
                      <p className="text-xs text-muted-foreground">Org-scoped keys</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Projects</CardTitle>
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.projects}</div>
                      <p className="text-xs text-muted-foreground">Project-scoped keys</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.active}</div>
                      <p className="text-xs text-muted-foreground">Recently used</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Keys List */}
              {!Array.isArray(keys) || keys.length === 0 ? (
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <Key className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg lg:text-xl font-semibold text-card-foreground">
                      No API keys found
                    </h3>
                    <p className="mt-2 text-center text-sm lg:text-base text-muted-foreground max-w-md">
                      Create your first MCP API key to start integrating with the Model Context Protocol. Keys provide
                      secure access to your projects and organizations.
                    </p>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-6 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Key
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {keys.map((keyItem) => {
                    const isVisible = visibleKeys.has(keyItem.id)
                    const maskedKey = keyItem.key.substring(0, 8) + "•".repeat(32) + keyItem.key.slice(-8)

                    return (
                      <Card key={keyItem.id} className="border-border bg-card hover:shadow-md transition-shadow">
                      <CardHeader>
                          <div className="flex flex-col gap-4">
                            {/* Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  {getScopeIcon(keyItem.scope)}
                            </div>
                            <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                              <CardTitle className="text-base lg:text-lg break-words text-card-foreground">
                                {keyItem.name}
                              </CardTitle>
                                    <Badge
                                      variant={
                                        keyItem.scope === "all_projects"
                                          ? "default"
                                          : keyItem.scope === "account"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {getScopeIcon(keyItem.scope)}
                                      <span className="ml-1">{getScopeLabel(keyItem)}</span>
                                    </Badge>
                                    {keyItem.lastUsed && (
                                      <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20">
                                        <Activity className="h-3 w-3 mr-1" />
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  {keyItem.description && (
                              <CardDescription className="mt-1 text-sm break-words">
                                {keyItem.description}
                              </CardDescription>
                                  )}
                            </div>
                          </div>
                              <div className="flex gap-2 self-start sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/20"
                                  onClick={() => {
                                    setEditingKey(keyItem)
                                    setIsAddDialogOpen(true)
                                  }}
                                  title="Edit key"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                            onClick={() => setDeleteKeyId(keyItem.id)}
                                  title="Delete key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                          </div>

                            <Separator />

                            {/* Key Details */}
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    API Key
                                  </label>
                          <div className="flex gap-2">
                            <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                              onClick={() => toggleKeyVisibility(keyItem.id)}
                                    >
                                      {isVisible ? (
                                        <>
                                          <EyeOff className="h-3 w-3 mr-1" />
                                          Hide
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-3 w-3 mr-1" />
                                          Show
                                        </>
                              )}
                            </Button>
                            <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                              onClick={() => copyToClipboard(keyItem.key, keyItem.id)}
                                      title="Copy API key"
                            >
                              {copiedKey === keyItem.id ? (
                                        <>
                                          <Check className="h-3 w-3 mr-1 text-green-600" />
                                          Copied
                                        </>
                              ) : (
                                        <>
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copy
                                        </>
                              )}
                            </Button>
                          </div>
                        </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs lg:text-sm break-all text-foreground flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="flex-1 select-all">{isVisible ? keyItem.key : maskedKey}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    Created: <span className="text-foreground font-medium">{formatDate(keyItem.createdAt)}</span>
                                  </span>
                                </div>
                                {keyItem.lastUsed ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      Last used: <span className="text-foreground font-medium">{formatDateTime(keyItem.lastUsed)}</span>
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-foreground font-medium">Never used</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                    </Card>
                    )
                  })}
                </div>
              )}

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the API key and revoke all access
                      associated with it. Any applications using this key will stop working immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteKey} className="bg-red-600 hover:bg-red-700">
                      Delete Key
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* MCP Key Scope Dialog */}
              <MCPKeyScopeDialog
                isOpen={isAddDialogOpen}
                onOpenChange={(open) => {
                  setIsAddDialogOpen(open)
                  if (!open) setEditingKey(undefined)
                }}
                onSuccess={handleDialogSuccess}
                existingKey={editingKey}
              />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
