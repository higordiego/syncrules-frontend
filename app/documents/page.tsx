"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Folder,
  FileText,
  Upload,
  AlertCircle,
  Search,
  Grid3x3,
  List,
  TreePine,
  ChevronRight,
  ChevronDown,
  Edit,
  Save,
} from "lucide-react"
import {
  listDocuments,
  createDocument,
  deleteDocument,
  updateDocument,
  getDocumentPath,
  moveDocument,
  uploadFiles,
  uploadDirectory,
  type Document,
} from "@/lib/api-documents"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { MarkdownEditor } from "@/components/documents/markdown-editor"
import { getUsageStats } from "@/lib/api-usage"
import type { DocumentItem } from "@/lib/documents"
import { TreeView } from "@/components/documents/tree-view"
import { DocumentsEmptyState } from "@/components/documents/empty-state"
import { useToast } from "@/components/ui/use-toast"

type ViewMode = "tree" | "grid" | "list"

function DocumentsPageContent() {
  const { toast } = useToast()
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isCreateSubfolderOpen, setIsCreateSubfolderOpen] = useState(false)
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Document | null>(null)
  const [viewingItem, setViewingItem] = useState<Document | null>(null)
  const [folderName, setFolderName] = useState("")
  const [fileForm, setFileForm] = useState({
    name: "",
    content: "",
  })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [isDragOverZone, setIsDragOverZone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("tree")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAllDocuments()
  }, [])

  const loadAllDocuments = async () => {
    try {
      setLoading(true)
      const response = await listDocuments({ limit: 1000 })
      if (response.success && response.data) {
        // Garantir que sempre seja um array
        setAllDocuments(Array.isArray(response.data.data) ? response.data.data : [])
      } else {
        setAllDocuments([])
      }
    } catch (error) {
      console.error("Error loading documents:", error)
      setAllDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const expandAllFolders = () => {
    const folders = allDocuments.filter((d) => d.type === "folder").map((d) => d.id)
    setExpandedFolders(new Set(folders))
  }

  const collapseAllFolders = () => {
    setExpandedFolders(new Set())
  }

  const filteredDocuments = useMemo(() => {
    // Garantir que allDocuments seja sempre um array
    if (!Array.isArray(allDocuments)) {
      return []
    }

    if (!searchQuery) return allDocuments

    const query = searchQuery.toLowerCase()
    const matchingIds = new Set<string>()
    const foldersToExpand = new Set<string>()

    // Find all matching documents
    allDocuments.forEach((doc) => {
      if (doc && doc.name && doc.name.toLowerCase().includes(query)) {
        matchingIds.add(doc.id)
        // Add all ancestors and expand them
        let current = doc.parentId
        while (current) {
          matchingIds.add(current)
          foldersToExpand.add(current)
          const parent = allDocuments.find((d) => d && d.id === current)
          current = parent?.parentId || null
        }
      }
    })

    // Auto-expand folders that contain matches
    if (foldersToExpand.size > 0) {
      setExpandedFolders((prev) => {
        const newSet = new Set(prev)
        foldersToExpand.forEach((id) => newSet.add(id))
        return newSet
      })
    }

    return allDocuments.filter((d) => d && matchingIds.has(d.id))
  }, [allDocuments, searchQuery])

  const rootDocuments = useMemo(() => {
    if (!Array.isArray(filteredDocuments)) {
      return []
    }
    return filteredDocuments.filter((d) => d.parentId === null)
  }, [filteredDocuments])

  const canAddFile = async () => {
    try {
      const statsResponse = await getUsageStats()
      if (statsResponse.success && statsResponse.data) {
        return statsResponse.data.filesUsed < statsResponse.data.filesLimit
      }
      return false
    } catch {
      return false
    }
  }

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await createDocument({
        name: folderName,
        type: "folder",
        parentId: selectedFolderId,
      })
      if (response.success) {
        setFolderName("")
        setIsCreateFolderOpen(false)
        setIsCreateSubfolderOpen(false)
        if (selectedFolderId) {
          setExpandedFolders((prev) => new Set(prev).add(selectedFolderId))
        }
        await loadAllDocuments()
      }
    } catch (error) {
      console.error("Error adding folder:", error)
    }
  }

  const handleCreateSubfolder = (parentId: string) => {
    setSelectedFolderId(parentId)
    setIsCreateSubfolderOpen(true)
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!(await canAddFile())) {
        setIsCreateFileOpen(false)
        setShowLimitWarning(true)
        return
      }
      const response = await createDocument({
        name: fileForm.name.endsWith(".md") ? fileForm.name : `${fileForm.name}.md`,
        type: "file",
        content: fileForm.content,
        parentId: selectedFolderId,
      })
      if (response.success) {
        setFileForm({ name: "", content: "" })
        setIsCreateFileOpen(false)
        if (selectedFolderId) {
          setExpandedFolders((prev) => new Set(prev).add(selectedFolderId))
        }
        await loadAllDocuments()
      }
    } catch (error) {
      console.error("Error adding file:", error)
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    
    try {
      const response = await updateDocument(editingItem.id, {
        name: editingItem.name,
        content: editingItem.content || "",
      })
      if (response.success) {
        setEditingItem(null)
        setIsEditOpen(false)
        await loadAllDocuments()
      }
    } catch (error) {
      console.error("Error updating document:", error)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemId) return
    
    try {
      await deleteDocument(deleteItemId)
      setDeleteItemId(null)
      await loadAllDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const openFolder = (folderId: string) => {
    toggleFolder(folderId)
    setSelectedFolderId(folderId)
  }

  const openViewDialog = (item: Document) => {
    setViewingItem(item)
    setIsViewOpen(true)
  }

  const openEditDialog = (item: Document) => {
    setEditingItem({ ...item })
    setIsEditOpen(true)
    setSelectedFolderId(item.parentId)
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItem(itemId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedItem) return

    if (draggedItem !== targetId) {
      try {
        const response = await moveDocument(draggedItem, targetId)
        if (response.success) {
          if (targetId) {
            setExpandedFolders((prev) => new Set(prev).add(targetId))
          }
          await loadAllDocuments()
        }
      } catch (error) {
        console.error("Error moving document:", error)
      }
    }

    setDraggedItem(null)
    setDragOverItem(null)
    setIsDragOverZone(false)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
    setIsDragOverZone(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const statsResponse = await getUsageStats()
      if (!statsResponse.success || !statsResponse.data) {
        console.error("Failed to load usage stats")
        return
      }
      
      const stats = statsResponse.data
      const filesCanUpload = stats.filesLimit - stats.filesUsed

      // Check if it's a directory upload (has webkitRelativePath)
      const isDirectory = Array.from(files).some((f: any) => f.webkitRelativePath)

      if (isDirectory) {
        // Process directory upload
        setUploading(true)
        try {
          const result = await uploadDirectory(files, selectedFolderId)
          if (result.success) {
            // Reload documents to get new folders
            await loadAllDocuments()
            // Expand folders after reload
            const response = await listDocuments({ limit: 1000 })
            if (response.success && response.data) {
              const newFolders = response.data.data.filter((d: Document) => d.type === "folder")
              setExpandedFolders((prev) => {
                const newSet = new Set(prev)
                newFolders.forEach((f: Document) => newSet.add(f.id))
                return newSet
              })
            }
          } else {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: result.error?.message || "Failed to upload directory",
            })
          }
        } catch (error) {
          console.error("Error uploading directory:", error)
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: "Error uploading directory. Please try again.",
          })
        } finally {
          setUploading(false)
          if (e.target) {
            e.target.value = ""
          }
        }
        return
      }

      // Regular file upload
      if (filesCanUpload <= 0) {
        setShowLimitWarning(true)
        e.target.value = ""
        return
      }

      if (files.length > filesCanUpload) {
        toast({
          variant: "destructive",
          title: "Upload Limit Reached",
          description: `You can only upload ${filesCanUpload} file(s). You've reached the Freemium plan limit.`,
        })
        e.target.value = ""
        return
      }

      setUploading(true)
      try {
        const result = await uploadFiles(Array.from(files), selectedFolderId)
        if (result.success) {
          if (selectedFolderId) {
            setExpandedFolders((prev) => new Set(prev).add(selectedFolderId))
          }
          await loadAllDocuments()
        } else {
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: result.error?.message || "Failed to upload files",
          })
        }
      } catch (error) {
        console.error("Error uploading files:", error)
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "Error uploading files. Please try again.",
        })
      } finally {
        setUploading(false)
        if (e.target) {
          e.target.value = ""
        }
      }
    } catch (error) {
      console.error("Error in handleFileSelect:", error)
    }
  }

  const handleDropZone = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverZone(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    try {
      const statsResponse = await getUsageStats()
      if (!statsResponse.success || !statsResponse.data) {
        console.error("Failed to load usage stats")
        return
      }
      
      const stats = statsResponse.data
      
      // Check if it's a directory upload
      const isDirectory = files.some((f: any) => f.webkitRelativePath)

      if (isDirectory) {
        setUploading(true)
        try {
          // Create a DataTransfer object to convert File[] to FileList
          const dataTransfer = new DataTransfer()
          files.forEach((file) => dataTransfer.items.add(file))
          const result = await uploadDirectory(dataTransfer.files, selectedFolderId)
          if (result.success) {
            await loadAllDocuments()
            // Expand folders after reload
            const response = await listDocuments({ limit: 1000 })
            if (response.success && response.data) {
              const newFolders = response.data.data.filter((d: Document) => d.type === "folder")
              setExpandedFolders((prev) => {
                const newSet = new Set(prev)
                newFolders.forEach((f: Document) => newSet.add(f.id))
                return newSet
              })
            }
          } else {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: result.error?.message || "Failed to upload directory",
            })
          }
        } catch (error) {
          console.error("Error uploading directory:", error)
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: "Error uploading directory. Please try again.",
          })
        } finally {
          setUploading(false)
        }
        return
      }

      // Regular file upload
      const filesCanUpload = stats.filesLimit - stats.filesUsed

      if (filesCanUpload <= 0) {
        setShowLimitWarning(true)
        return
      }

      if (files.length > filesCanUpload) {
        toast({
          variant: "destructive",
          title: "Upload Limit Reached",
          description: `You can only upload ${filesCanUpload} file(s). You've reached the Freemium plan limit.`,
        })
        return
      }

      setUploading(true)
      try {
        const result = await uploadFiles(files, selectedFolderId)
        if (result.success) {
          if (selectedFolderId) {
            setExpandedFolders((prev) => new Set(prev).add(selectedFolderId))
          }
          await loadAllDocuments()
        } else {
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: result.error?.message || "Failed to upload files",
          })
        }
      } catch (error) {
        console.error("Error uploading files:", error)
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "Error uploading files. Please try again.",
        })
      } finally {
        setUploading(false)
      }
    } catch (error) {
      console.error("Error in handleDropZone:", error)
    }
  }

  const handleDragOverZone = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only show drag over zone for file uploads, not document dragging
    if (!draggedItem) {
      setIsDragOverZone(true)
    }
  }

  const handleDragLeaveZone = () => {
    setIsDragOverZone(false)
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-4 lg:p-8">
              {/* Header Section */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Documents</h1>
                    <p className="mt-2 text-sm lg:text-base text-muted-foreground">
                      Manage your files and folders in a tree structure
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Folder className="h-4 w-4" />
                          New Folder
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleAddFolder}>
                          <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                            <DialogDescription>Enter a name for your new folder.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                              id="folder-name"
                              value={folderName}
                              onChange={(e) => setFolderName(e.target.value)}
                              placeholder="My Folder"
                              required
                              className="mt-2"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit">Create Folder</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateSubfolderOpen} onOpenChange={setIsCreateSubfolderOpen}>
                      <DialogContent>
                        <form onSubmit={handleAddFolder}>
                          <DialogHeader>
                            <DialogTitle>Create New Subfolder</DialogTitle>
                            <DialogDescription>Enter a name for the new subfolder.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="subfolder-name">Subfolder Name</Label>
                            <Input
                              id="subfolder-name"
                              value={folderName}
                              onChange={(e) => setFolderName(e.target.value)}
                              placeholder="Subfolder Name"
                              required
                              className="mt-2"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit">Create Subfolder</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <FileText className="h-4 w-4" />
                          New File
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <form onSubmit={handleAddFile}>
                          <DialogHeader>
                            <DialogTitle>Create New File</DialogTitle>
                            <DialogDescription>Enter the file name and content in Markdown format.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="file-name">File Name</Label>
                              <Input
                                id="file-name"
                                value={fileForm.name}
                                onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                                placeholder="document.md"
                                required
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label htmlFor="file-content">Content (Markdown)</Label>
                              <Textarea
                                id="file-content"
                                value={fileForm.content}
                                onChange={(e) => setFileForm({ ...fileForm, content: e.target.value })}
                                placeholder="# My Document&#10;&#10;Write your content here..."
                                rows={10}
                                required
                                className="mt-2 font-mono"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Create File</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".md,.txt"
                        onChange={handleFileSelect}
                        {...({ webkitdirectory: "" } as any)}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Files/Folders
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Search and Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === "tree" && (
                      <>
                        <Button variant="outline" size="sm" onClick={expandAllFolders} className="gap-2">
                          <ChevronDown className="h-4 w-4" />
                          Expand All
                        </Button>
                        <Button variant="outline" size="sm" onClick={collapseAllFolders} className="gap-2">
                          <ChevronRight className="h-4 w-4" />
                          Collapse All
                        </Button>
                      </>
                    )}
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                      <Button
                        variant={viewMode === "tree" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("tree")}
                        className="h-8 w-8"
                      >
                        <TreePine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className="h-8 w-8"
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className="h-8 w-8"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Area */}
              <Card
                onDrop={handleDropZone}
                onDragOver={handleDragOverZone}
                onDragLeave={handleDragLeaveZone}
                className={`relative border-2 transition-all duration-200 ${
                  isDragOverZone && !draggedItem
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                <CardContent className="p-6 lg:p-8">
                  {!Array.isArray(allDocuments) || allDocuments.length === 0 ? (
                    <DocumentsEmptyState />
                  ) : viewMode === "tree" ? (
                    <div className="min-h-[400px]">
                      <TreeView
                        documents={filteredDocuments}
                        allDocuments={filteredDocuments}
                        expandedFolders={expandedFolders}
                        onToggleFolder={toggleFolder}
                        onOpenFolder={openFolder}
                        onEdit={openEditDialog}
                        onDelete={setDeleteItemId}
                        onView={openViewDialog}
                        onCreateSubfolder={handleCreateSubfolder}
                        draggedItem={draggedItem}
                        dragOverItem={dragOverItem}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  ) : (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                          : "space-y-2"
                      }
                    >
                      {rootDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, doc.id)}
                          onDragOver={(e) => (doc.type === "folder" ? handleDragOver(e, doc.id) : e.preventDefault())}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => (doc.type === "folder" ? handleDrop(e, doc.id) : e.preventDefault())}
                          onDragEnd={handleDragEnd}
                          className={`group relative rounded-xl border-2 transition-all duration-200 ${
                            viewMode === "grid"
                              ? "bg-card hover:shadow-lg hover:scale-[1.02] cursor-move"
                              : "flex items-center gap-4 bg-card hover:bg-accent/50"
                          } ${
                            draggedItem === doc.id ? "opacity-30 scale-95" : ""
                          } ${
                            dragOverItem === doc.id && doc.type === "folder"
                              ? "border-blue-500 border-dashed bg-blue-50 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20"
                              : "border-border"
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (doc.type === "folder") {
                                openFolder(doc.id)
                              }
                              // Files don't open on single click - use double click or View button instead
                            }}
                            onDoubleClick={() => {
                              if (doc.type === "folder") {
                                openFolder(doc.id)
                              } else {
                                openViewDialog(doc)
                              }
                            }}
                            className={`flex flex-1 items-center gap-4 cursor-pointer p-4 ${
                              viewMode === "list" ? "flex-1" : ""
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 rounded-lg p-3 ${
                                doc.type === "folder"
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-green-100 dark:bg-green-900/30"
                              }`}
                            >
                              {doc.type === "folder" ? (
                                <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-card-foreground truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {doc.type === "folder" ? "Folder" : "Markdown file"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent 
          className={
            editingItem?.type === "file" && editingItem.name.endsWith(".md") 
              ? "max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] !translate-y-[-50%] !top-[50%] !left-[50%] !translate-x-[-50%] flex flex-col p-0 gap-0 rounded-lg overflow-hidden" 
              : "max-w-2xl"
          }
        >
          {editingItem?.type === "file" && editingItem.name.endsWith(".md") ? (
            <form onSubmit={handleEditItem} className="flex flex-col h-full">
              {/* IDE-style Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <DialogTitle className="text-base font-medium m-0">Edit: {editingItem.name}</DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
              
              {/* Editor Area */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <MarkdownEditor
                  content={editingItem.content || ""}
                  onChange={(content) =>
                    setEditingItem(editingItem ? { ...editingItem, content } : null)
                  }
                  className="h-full"
                  defaultViewMode="edit"
                />
              </div>
            </form>
          ) : (
            <form onSubmit={handleEditItem} className="flex flex-col flex-1 min-h-0">
              <DialogHeader>
                <DialogTitle>Edit {editingItem?.type === "folder" ? "Folder" : "File"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
                <div className="flex-shrink-0">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingItem?.name || ""}
                    onChange={(e) => setEditingItem(editingItem ? { ...editingItem, name: e.target.value } : null)}
                    required
                    className="mt-2"
                  />
                </div>
                {editingItem?.type === "file" ? (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={editingItem?.content || ""}
                      onChange={(e) =>
                        setEditingItem(editingItem ? { ...editingItem, content: e.target.value } : null)
                      }
                      className="mt-2 font-mono flex-1 min-h-0"
                    />
                  </div>
                ) : null}
              </div>
              <DialogFooter className="flex-shrink-0">
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] !translate-y-[-50%] !top-[50%] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                {viewingItem?.name}
              </DialogTitle>
              {viewingItem && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(viewingItem)
                    setIsViewOpen(false)
                    setIsEditOpen(true)
                  }}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            {viewingItem?.content ? (
              viewingItem.name.endsWith(".md") ? (
                <div className="max-w-4xl mx-auto">
                  <MarkdownViewer content={viewingItem.content} />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                  {viewingItem.content}
                </pre>
              )
            ) : (
              <p className="text-muted-foreground text-center py-8">No content</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item and all its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limit Warning */}
      <AlertDialog open={showLimitWarning} onOpenChange={setShowLimitWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Plan Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You've reached the limit of 10 files on the Freemium plan.</p>
              <p>Upgrade to the Pro plan and get unlimited access to files, folders, and much more!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = "/plans"
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              View Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}

export default function DocumentsPage() {
  return <DocumentsPageContent />
}
