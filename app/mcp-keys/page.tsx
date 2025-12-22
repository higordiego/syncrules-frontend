"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Plus, Key, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react"
import { getMCPKeys, addMCPKey, deleteMCPKey, type MCPKey } from "@/lib/mcp-keys"

export default function MCPKeysPage() {
  const [keys, setKeys] = useState<MCPKey[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
  })

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = () => {
    const loadedKeys = getMCPKeys()
    setKeys(loadedKeys)
  }

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault()
    const keyWithPrefix = formData.key.startsWith("SK-") ? formData.key : `SK-${formData.key}`
    addMCPKey({ ...formData, key: keyWithPrefix })
    setFormData({ name: "", key: "", description: "" })
    setIsAddDialogOpen(false)
    loadKeys()
  }

  const handleDeleteKey = () => {
    if (deleteKeyId) {
      deleteMCPKey(deleteKeyId)
      setDeleteKeyId(null)
      loadKeys()
    }
  }

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••"
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4)
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
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px] mx-4">
                    <form onSubmit={handleAddKey}>
                      <DialogHeader>
                        <DialogTitle>Add New MCP Key</DialogTitle>
                        <DialogDescription>Enter your MCP API key details</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Key Name</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Production Key"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="key">API Key</Label>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-mono text-slate-600">
                              SK-
                            </span>
                            <Input
                              id="key"
                              type="password"
                              placeholder="your-key-here"
                              value={formData.key}
                              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                              required
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="What is this key for?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                          Add
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {keys.length === 0 ? (
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
                              <CardTitle className="text-base lg:text-lg break-words text-card-foreground">
                                {keyItem.name}
                              </CardTitle>
                              <CardDescription className="mt-1 text-sm break-words">
                                {keyItem.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 self-end sm:self-start"
                            onClick={() => setDeleteKeyId(keyItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex-1 rounded-lg border border-border bg-muted p-3 font-mono text-xs lg:text-sm break-all text-muted-foreground">
                            {visibleKeys.has(keyItem.id) ? keyItem.key : maskKey(keyItem.key)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleKeyVisibility(keyItem.id)}
                              className="border-border"
                            >
                              {visibleKeys.has(keyItem.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(keyItem.key, keyItem.id)}
                              className="border-border"
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
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
