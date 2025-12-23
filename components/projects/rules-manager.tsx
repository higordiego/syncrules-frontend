"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Search,
  TreePine,
  ChevronRight,
  ChevronDown,
  Edit,
  Plus,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  listFolders,
  createFolder as createFolderAPI,
  type Folder as GovernanceFolder,
  moveFolder,
  updateFolder,
  deleteFolder,
} from "@/lib/api-folders"
import { FolderSettingsDialog } from "@/components/projects/folder-settings-dialog"
import { RulesTree } from "@/components/projects/rules-tree"
import {
  listRulesByProject,
  listRulesByFolder,
  createRule as createRuleAPI,
  updateRule as updateRuleAPI,
  deleteRule as deleteRuleAPI,
  moveRule,
  type Rule,
} from "@/lib/api-rules"
import { getCurrentAccountId } from "@/components/accounts/account-selector"
// Removed MarkdownEditor and MarkdownViewer - rules are plain text, not markdown
import { GovernanceBadge } from "@/components/governance/governance-badge"
import { SourceOfTruthIndicator } from "@/components/governance/source-of-truth-indicator"
import { useToast } from "@/components/ui/use-toast"

interface RulesManagerProps {
  projectId: string
  folders: GovernanceFolder[]
  availableUsers?: any[]
  availableGroups?: any[]
}

export function RulesManager({ projectId, folders, availableUsers = [], availableGroups = [] }: RulesManagerProps) {
  const { toast } = useToast()
  const currentAccountId = getCurrentAccountId()
  const [projectFolders, setProjectFolders] = useState<GovernanceFolder[]>(folders)
  const [projectRules, setProjectRules] = useState<Rule[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Rule | null>(null)
  const [viewingItem, setViewingItem] = useState<Rule | null>(null)

  // Folder Settings & Delete State
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false)
  const [selectedFolderForDetails, setSelectedFolderForDetails] = useState<GovernanceFolder | null>(null)
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null)
  const [folderName, setFolderName] = useState("")
  const [folderPath, setFolderPath] = useState("")
  const [fileForm, setFileForm] = useState({
    name: "",
    content: "",
    path: "",
  })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [isDragOverZone, setIsDragOverZone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFoldersAndRules()
  }, [projectId])

  useEffect(() => {
    setProjectFolders(folders)
    // Se não tiver folder selecionado, seleciona o primeiro por padrão
    if (!selectedFolderId && folders && folders.length > 0) {
      setSelectedFolderId(folders[0].id)
    }
  }, [folders])

  const loadFoldersAndRules = async () => {
    try {
      setLoading(true)
      // Carregar folders do projeto
      const foldersResponse = await listFolders({ projectId })
      if (foldersResponse.success && foldersResponse.data) {
        setProjectFolders(Array.isArray(foldersResponse.data) ? foldersResponse.data : [])
      }

      // Carregar rules do projeto
      const rulesResponse = await listRulesByProject(projectId)
      if (rulesResponse.success && rulesResponse.data) {
        setProjectRules(Array.isArray(rulesResponse.data) ? rulesResponse.data : [])
      }
    } catch (error) {
      console.error("Error loading folders and rules:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load folders and rules.",
      })
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

  const filteredRules = useMemo(() => {
    if (!Array.isArray(projectRules)) return []
    if (!searchQuery) return projectRules
    const lowerCaseQuery = searchQuery.toLowerCase()
    return projectRules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(lowerCaseQuery) ||
        rule.content?.toLowerCase().includes(lowerCaseQuery)
    )
  }, [projectRules, searchQuery])

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAccountId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No organization selected.",
      })
      return
    }

    try {
      const path = folderPath || `/${folderName.toLowerCase().replace(/\s+/g, "-")}`
      const response = await createFolderAPI({
        projectId: projectId,
        name: folderName,
        path: path,
        inheritPermissions: false,
      })
      if (response.success && response.data) {
        setFolderName("")
        setFolderPath("")
        setIsCreateFolderOpen(false)
        await loadFoldersAndRules()
        toast({
          title: "Folder Created",
          description: `Folder "${response.data.name}" created successfully.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to create folder.",
        })
      }
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder.",
      })
    }
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleAddFile started", { selectedFolderId, fileForm })

    if (!selectedFolderId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a folder first.",
      })
      console.error("handleAddFile: No folder selected")
      return
    }

    if (!fileForm.name || !fileForm.content) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide both name and content for the rule.",
      })
      console.error("handleAddFile: Missing name or content")
      return
    }

    try {
      // Rules are plain text files, not markdown
      let finalName = fileForm.name
      // Strip .md or .txt if present to avoid double extensions like .md.rule
      if (finalName.match(/\.(md|txt)$/i)) {
        finalName = finalName.replace(/\.(md|txt)$/i, "")
      }
      // Ensure it ends with .rule
      if (!finalName.toLowerCase().endsWith(".rule")) {
        finalName += ".rule"
      }

      const path = fileForm.path || `/${selectedFolderId}/${finalName.toLowerCase().replace(/\s+/g, "-")}`
      const response = await createRuleAPI({
        projectId: projectId,
        folderId: selectedFolderId,
        name: finalName,
        content: fileForm.content,
        path: path,
      })
      if (response.success && response.data) {
        setFileForm({ name: "", content: "", path: "" })
        setIsCreateFileOpen(false)
        setExpandedFolders((prev) => new Set(prev).add(selectedFolderId))
        await loadFoldersAndRules()
        toast({
          title: "Rule Created",
          description: `Rule "${response.data.name}" created successfully.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to create rule.",
        })
      }
    } catch (error) {
      console.error("Error creating rule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create rule.",
      })
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const response = await updateRuleAPI(editingItem.id, {
        name: editingItem.name,
        content: editingItem.content || "",
      })
      if (response.success) {
        setEditingItem(null)
        setIsEditOpen(false)
        await loadFoldersAndRules()
        toast({
          title: "Rule Updated",
          description: `Rule "${response.data?.name}" updated successfully.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to update rule.",
        })
      }
    } catch (error) {
      console.error("Error updating rule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update rule.",
      })
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemId) return

    try {
      const response = await deleteRuleAPI(deleteItemId)
      if (response.success) {
        setDeleteItemId(null)
        await loadFoldersAndRules()
        toast({
          title: "Rule Deleted",
          description: "Rule deleted successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to delete rule.",
        })
      }
    } catch (error) {
      console.error("Error deleting rule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete rule.",
      })
    }
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    const target = projectFolders.find((folder) => folder.id === itemId)
    if (draggedItem !== itemId && target) {
      setDragOverItem(itemId)
    } else {
      setDragOverItem(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault()
    // draggedItem is local state for old DnD. RulesTree uses data transfer.

    // Check if we have data transfer from RulesTree
    const dataJson = e.dataTransfer.getData("application/json")
    if (dataJson) {
      try {
        const data = JSON.parse(dataJson)
        if (data.type === "folder") {
          // Move folder to root (targetId is null)
          if (targetId === null) {
            await handleMoveFolder(data.id, null)
            return
          }
        } else if (data.type === "rule") {
          // Move rule to root
          if (targetId === null) {
            await handleMoveRule(data.id, null)
            return
          }
        }
      } catch (err) {
        // Ignore JSON parse error, might not be ours
      }
    }

    if (!draggedItem) return

    // Legacy logic if still used
    toast({
      variant: "default",
      title: "Not Implemented",
      description: "Moving items here is not implemented.",
    })
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const validateFiles = (files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } => {
    const valid: File[] = []
    const invalid: { file: File; reason: string }[] = []

    files.forEach((file) => {
      // Validar tipo de arquivo - rules são arquivos de texto simples
      const allowedExtensions = [".rule", ".txt", ".md"] // Aceita .md e .txt mas converte para .rule
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

      if (!allowedExtensions.includes(fileExtension)) {
        invalid.push({
          file,
          reason: `File type "${fileExtension}" is not allowed. Text files (.txt, .md, .rule) are supported.`,
        })
        return
      }

      // Validar tamanho (10MB máximo)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        invalid.push({
          file,
          reason: `File "${file.name}" exceeds maximum size of 10MB.`,
        })
        return
      }

      valid.push(file)
    })

    return { valid, invalid }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const { valid, invalid } = validateFiles(fileArray)

    // Mostrar erros de validação
    if (invalid.length > 0) {
      invalid.forEach(({ file, reason }) => {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: `${file.name}: ${reason}`,
        })
      })
    }

    // Se não há arquivos válidos, parar
    if (valid.length === 0) {
      if (e.target) {
        e.target.value = ""
      }
      return
    }

    if (!selectedFolderId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a folder first.",
      })
      if (e.target) {
        e.target.value = ""
      }
      return
    }

    setUploading(true)
    try {
      // Ler conteúdo dos arquivos e criar rules (rules são texto simples, não markdown)
      const uploadPromises = valid.map(async (file) => {
        const content = await file.text()
        // Remove extensões .md, .txt, etc. e adiciona .rule
        const baseName = file.name.replace(/\.[^/.]+$/, "") // Remove extensão
        const name = `${baseName}.rule`
        const path = `/${selectedFolderId}/${name}`

        return createRuleAPI({
          projectId: projectId,
          folderId: selectedFolderId,
          name: name,
          content: content,
          path: path,
        })
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
      const failed = results.length - successful

      await loadFoldersAndRules()

      if (failed > 0) {
        toast({
          variant: "destructive",
          title: "Partial Upload",
          description: `${successful} file(s) uploaded, ${failed} failed.`,
        })
      } else {
        toast({
          title: "Rules Uploaded",
          description: `${successful} rule(s) uploaded successfully.`,
        })
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload rules. Please try again.",
      })
    } finally {
      setUploading(false)
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  const handleDropFiles = async (e: React.DragEvent) => {
    // ... (keep existing implementation, logic inside function block handled by tool? No, I need to provide full function body if I replace it. But I just want to append after it.
    // Actually, I'll insert handleMoveFolder after it.)
    e.preventDefault()
    setIsDragOverZone(false)

    // Se está arrastando um item existente, não fazer upload
    if (draggedItem) return

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const { valid, invalid } = validateFiles(fileArray)

    // Mostrar erros de validação
    if (invalid.length > 0) {
      invalid.forEach(({ file, reason }) => {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: `${file.name}: ${reason}`,
        })
      })
    }

    // Se não há arquivos válidos, parar
    if (valid.length === 0) return

    if (!selectedFolderId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a folder first.",
      })
      return
    }

    setUploading(true)
    try {
      // Ler conteúdo dos arquivos e criar rules (rules são texto simples, não markdown)
      const uploadPromises = valid.map(async (file) => {
        const content = await file.text()
        // Remove extensões .md, .txt, etc. e adiciona .rule
        const baseName = file.name.replace(/\.[^/.]+$/, "") // Remove extensão
        const name = `${baseName}.rule`
        const path = `/${selectedFolderId}/${name}`

        return createRuleAPI({
          projectId: projectId,
          folderId: selectedFolderId,
          name: name,
          content: content,
          path: path,
        })
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
      const failed = results.length - successful

      await loadFoldersAndRules()

      if (failed > 0) {
        toast({
          variant: "destructive",
          title: "Partial Upload",
          description: `${successful} file(s) uploaded, ${failed} failed.`,
        })
      } else {
        toast({
          title: "Rules Uploaded",
          description: `${successful} rule(s) uploaded successfully.`,
        })
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload rules. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleMoveFolder = async (folderId: string, targetId: string | null) => {
    try {
      const response = await moveFolder(folderId, targetId, 0) // 0 for now (append)
      if (response.success) {
        toast({
          title: "Folder Moved",
          description: "Folder structure updated successfully.",
        })
        await loadFoldersAndRules()
        if (targetId) {
          setExpandedFolders(prev => new Set(prev).add(targetId))
        }
      } else {
        toast({
          variant: "destructive",
          title: "Move Failed",
          description: response.error?.message || "Failed to move folder",
        })
      }
    } catch (error) {
      console.error("Move folder error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleMoveRule = async (ruleId: string, targetFolderId: string | null) => {
    try {
      // @ts-ignore - API expects optional string, null fits if we cast or logic handles it
      // Actually we need to verify api-rules.ts signature. 
      // Current signature: moveRule(ruleId: string, newFolderId: string)
      // We updated it? Not checking yet. Assuming I will update it or use casting.
      // Wait, I see I should update api-rules logic passing undefined if null?
      // Check api-rules.ts:   body: JSON.stringify({ folderId: newFolderId })
      // If newFolderId is null, JSON.stringify sets it to null, backend handles it?
      // Backend expects pointer *uuid.UUID. if json is null, it's null pointer.

      const response = await moveRule(ruleId, targetFolderId as string)
      if (response.success) {
        toast({
          title: "Rule Moved",
          description: "Rule moved successfully.",
        })
        await loadFoldersAndRules()
        // Expand target folder if not root
        if (targetFolderId) {
          setExpandedFolders((prev) => new Set(prev).add(targetFolderId))
        }
      } else {
        toast({
          variant: "destructive",
          title: "Move Failed",
          description: response.error?.message || "Failed to move rule",
        })
      }
    } catch (error) {
      console.error("Move rule error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    }
  }

  const handleOpenFolderSettings = (folder: GovernanceFolder) => {
    setSelectedFolderForDetails(folder)
    setIsFolderSettingsOpen(true)
  }

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDeleteId) return

    try {
      const response = await deleteFolder(folderToDeleteId)
      if (response.success) {
        toast({
          title: "Folder Deleted",
          description: "Folder deleted successfully.",
        })
        setFolderToDeleteId(null)
        await loadFoldersAndRules()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to delete folder.",
        })
      }
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete folder.",
      })
    }
  }

  const handleUpdateFolderDetails = async (name: string) => {
    if (!selectedFolderForDetails) return

    try {
      const response = await updateFolder(selectedFolderForDetails.id, { name })
      if (response.success) {
        // Update local state is tricky because we load all. Just reload.
        await loadFoldersAndRules()
        // Update the selected folder object just in case the dialog stays open (it shouldn't in this flow but good practice)
        setSelectedFolderForDetails({ ...selectedFolderForDetails, name })
      } else {
        throw new Error(response.error?.message || "Failed to update folder")
      }
    } catch (error) {
      console.error("Update folder error:", error)
      throw error // Let the dialog handle the error display
    }
  }

  // Wrapper for delete from details dialog
  const handleDeleteFromDetails = async () => {
    if (!selectedFolderForDetails) return

    // We reuse the existing delete logic but we need to act as if it's confirmed
    try {
      const response = await deleteFolder(selectedFolderForDetails.id)
      if (response.success) {
        await loadFoldersAndRules()
        setIsFolderSettingsOpen(false)
        setSelectedFolderForDetails(null)
      } else {
        throw new Error(response.error?.message || "Failed to delete folder")
      }
    } catch (error) {
      console.error("Delete folder error:", error)
      throw error
    }
  }

  const handleDropFilesOnFolder = async (folderId: string, files: FileList) => {
    const fileArray = Array.from(files)
    const { valid, invalid } = validateFiles(fileArray)

    if (invalid.length > 0) {
      invalid.forEach(({ file, reason }) => {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: `${file.name}: ${reason}`,
        })
      })
    }

    if (valid.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = valid.map(async (file) => {
        const content = await file.text()
        const baseName = file.name.replace(/\.[^/.]+$/, "")
        const name = `${baseName}.rule`
        const path = `/${folderId}/${name}`

        return createRuleAPI({
          projectId: projectId,
          folderId: folderId,
          name: name,
          content: content,
          path: path,
        })
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
      const failed = results.length - successful

      await loadFoldersAndRules()

      // Expand target folder
      setExpandedFolders(prev => new Set(prev).add(folderId))

      if (failed > 0) {
        toast({
          variant: "destructive",
          title: "Partial Upload",
          description: `${successful} file(s) uploaded, ${failed} failed.`,
        })
      } else {
        toast({
          title: "Rules Uploaded",
          description: `${successful} rule(s) uploaded successfully.`,
        })
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload rules.",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading && projectFolders.length === 0 && projectRules.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Folder className="h-4 w-4 mr-2" />
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

          <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleAddFile}>
                <DialogHeader>
                  <DialogTitle>Create New Rule</DialogTitle>
                  <DialogDescription>
                    Rules are plain text configuration files. Enter the rule name and content.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="target-folder">Target Folder</Label>
                    <div className="mt-2">
                      <select
                        id="target-folder"
                        value={selectedFolderId || ""}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="" disabled>Select a folder</option>
                        {projectFolders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="file-name">Rule Name</Label>
                    <Input
                      id="file-name"
                      value={fileForm.name}
                      onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                      placeholder="my-rule.rule"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="file-content">Content (Plain Text)</Label>
                    <Textarea
                      id="file-content"
                      value={fileForm.content}
                      onChange={(e) => setFileForm({ ...fileForm, content: e.target.value })}
                      placeholder="Enter rule content here..."
                      rows={10}
                      required
                      className="mt-2 font-mono"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Rule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".rule,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Rules
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Rules Tree */}
      <Card
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOverZone(false)

          // Global file drop disabled

          // Handle folder/rule move to root
          handleDrop(e, null)
        }}
        onDragOver={(e) => {
          e.preventDefault()

          // Global file drag disabled

          // Allow dropping folder/rule to root (internal move)
          if (e.dataTransfer.types.includes("application/json")) {
            setIsDragOverZone(true)
            e.dataTransfer.dropEffect = "move"
            return
          }

          // Legacy check
          if (!draggedItem) {
            // setIsDragOverZone(true) 
          }
        }}
        onDragLeave={(e) => {
          // Só remover drag over se realmente saiu do card
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOverZone(false)
          }
        }}
        className={`border-2 transition-all relative ${isDragOverZone && !draggedItem
          ? "border-primary bg-primary/5 dark:bg-primary/10"
          : "border-border"
          }`}
      >
        <CardContent className="p-6 relative">
          {isDragOverZone && !draggedItem && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-lg border-2 border-dashed border-primary backdrop-blur-sm pointer-events-none">
              <div className="text-center space-y-2">
                <Folder className="h-12 w-12 text-primary mx-auto" />
                <p className="text-lg font-semibold text-primary">Move to Root</p>
              </div>
            </div>
          )}
          <div className="min-h-[200px]">
            <RulesTree
              folders={projectFolders}
              rules={projectRules}
              onMoveFolder={handleMoveFolder}
              onToggleFolder={toggleFolder}
              expandedFolders={expandedFolders}
              onAddRule={(folderId) => {
                setSelectedFolderId(folderId)
                setIsCreateFileOpen(true)
              }}
              onEditRule={(rule) => {
                setEditingItem(rule)
                setIsEditOpen(true)
              }}
              onDeleteRule={setDeleteItemId}
              onDropFiles={handleDropFilesOnFolder}
              onMoveRule={handleMoveRule}
              onEditFolder={handleOpenFolderSettings}
              onDeleteFolder={setFolderToDeleteId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0">
          <form onSubmit={handleEditItem} className="flex flex-col flex-1 min-h-0">
            <DialogHeader className="flex-shrink-0 border-b border-border p-4">
              <DialogTitle>Edit Rule: {editingItem?.name}</DialogTitle>
              <DialogDescription>
                Rules are plain text configuration files, not markdown documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 px-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex-shrink-0">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingItem?.name || ""}
                  onChange={(e) =>
                    setEditingItem(editingItem ? { ...editingItem, name: e.target.value } : null)
                  }
                  required
                  className="mt-2"
                />
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingItem?.content || ""}
                  onChange={(e) =>
                    setEditingItem(
                      editingItem ? { ...editingItem, content: e.target.value } : null
                    )
                  }
                  className="mt-2 font-mono flex-1 min-h-0"
                  placeholder="Enter rule content (plain text)..."
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 border-t border-border p-4">
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
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
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            {viewingItem?.content ? (
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg max-w-full overflow-x-auto">
                {viewingItem.content}
              </pre>
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
              This action cannot be undone. This will permanently delete the rule and all its contents.
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


      {/* Folder Settings Dialog */}
      {
        selectedFolderForDetails && (
          <FolderSettingsDialog
            isOpen={isFolderSettingsOpen}
            onClose={() => {
              setIsFolderSettingsOpen(false)
              setSelectedFolderForDetails(null)
            }}
            folderId={selectedFolderForDetails.id}
            folderName={selectedFolderForDetails.name}
            onUpdateFolder={handleUpdateFolderDetails}
            onDeleteFolder={handleDeleteFromDetails}
            availableUsers={availableUsers}
            availableGroups={availableGroups}
          />
        )
      }

      {/* Folder Delete Confirmation (from Tree context menu) */}
      <AlertDialog open={!!folderToDeleteId} onOpenChange={() => setFolderToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? This will delete all rules inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-red-600 hover:bg-red-700">
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}

