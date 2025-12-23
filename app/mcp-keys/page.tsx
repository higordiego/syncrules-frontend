"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Key, Trash2, Copy, Check, Edit, Globe, Building2, FolderKanban, Eye, EyeOff } from "lucide-react"
import { listMCPKeys, deleteMCPKey, type MCPKey } from "@/lib/api-mcp-keys"
import { MCPKeyScopeDialog } from "@/components/mcp-keys/mcp-key-scope-dialog"


export default function MCPKeysPage() {
  const [keys, setKeys] = useState<MCPKey[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<MCPKey | undefined>(undefined)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      setLoading(true)
      const response = await listMCPKeys()
      if (response.success && response.data) {
        // Garantir que response.data é um array
        const keysData = Array.isArray(response.data) ? response.data : []
        setKeys(keysData)
      } else {
        // Se não houver dados ou resposta não foi bem-sucedida, usar array vazio
        setKeys([])
      }
    } catch (error) {
      console.error("Error loading MCP keys:", error)
      // Em caso de erro, garantir que keys seja um array vazio
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



  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-4 lg:space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">MCP Keys</h1>
                  <p className="mt-2 text-sm lg:text-base text-muted-foreground">Manage your MCP API keys</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingKey(undefined)
                    setIsAddDialogOpen(true)
                  }}
                  className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Key
                </Button>
              </div>

              {!Array.isArray(keys) || keys.length === 0 ? (
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-12 lg:py-16">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <Key className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg lg:text-xl font-semibold text-card-foreground">
                      No keys registered
                    </h3>
                    <p className="mt-2 text-center text-sm lg:text-base text-muted-foreground">
                      Start by adding your first MCP key to begin using the system
                    </p>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-6 bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Key
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {keys.map((keyItem) => (
                    <Card key={keyItem.id} className="border-border bg-card">
                      <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                              <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base lg:text-lg break-words text-card-foreground">
                                  {keyItem.name}
                                </CardTitle>
                                {keyItem.scope && (
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
                                    {keyItem.scope === "all_projects" && (
                                      <>
                                        <Globe className="h-3 w-3 mr-1" />
                                        All Projects
                                      </>
                                    )}
                                    {keyItem.scope === "account" && (
                                      <>
                                        <Building2 className="h-3 w-3 mr-1" />
                                        Organization
                                      </>
                                    )}
                                    {keyItem.scope === "project" && (
                                      <>
                                        <FolderKanban className="h-3 w-3 mr-1" />
                                        {keyItem.projectIds && keyItem.projectIds.length > 1
                                          ? `${keyItem.projectIds.length} Projects`
                                          : "1 Project"}
                                      </>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="mt-1 text-sm break-words">
                                {keyItem.description}
                              </CardDescription>
                              {keyItem.scope === "project" && keyItem.projectIds && keyItem.projectIds.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {keyItem.projectIds.slice(0, 3).map((projectId) => (
                                    <Badge key={projectId} variant="outline" className="text-xs">
                                      {projectId}
                                    </Badge>
                                  ))}
                                  {keyItem.projectIds.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{keyItem.projectIds.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-start">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => {
                                setEditingKey(keyItem)
                                setIsAddDialogOpen(true)
                              }}
                              title="Edit scope"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteKeyId(keyItem.id)}
                              title="Delete key"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex-1 rounded-lg border border-border bg-muted p-3 font-mono text-xs lg:text-sm break-all text-muted-foreground flex items-center justify-between gap-2">
                            <span className="flex-1">{keyItem.key}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(keyItem.key, keyItem.id)}
                              className="border-border"
                              title="Copy API key"
                            >
                              {copiedKey === keyItem.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                          Created on {new Date(keyItem.createdAt).toLocaleDateString("en-US")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The key will be permanently removed from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteKey} className="bg-red-600 hover:bg-red-700">
                      Delete
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
