"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
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
  Edit,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Building2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useAccount } from "@/context/AccountContext"
import { getFolder, listFolders, createFolder as createFolderAPI, moveFolder, updateFolder, deleteFolder } from "@/lib/api-folders"
import {
  listRulesByFolder,
  createRule as createRuleAPI,
  updateRule as updateRuleAPI,
  deleteRule as deleteRuleAPI,
  moveRule,
} from "@/lib/api-rules"
import type { Folder as GovernanceFolder, Rule } from "@/lib/types/governance"
import { RulesTree } from "@/components/projects/rules-tree"
import { FolderSettingsDialog } from "@/components/projects/folder-settings-dialog"

export default function AccountFolderPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { selectedAccountId } = useAccount()
  const folderId = params.id as string

  const [folder, setFolder] = useState<GovernanceFolder | null>(null)
  const [subFolders, setSubFolders] = useState<GovernanceFolder[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Rule | null>(null)
  const [viewingItem, setViewingItem] = useState<Rule | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false)
  const [selectedFolderForDetails, setSelectedFolderForDetails] = useState<GovernanceFolder | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [isDragOverZone, setIsDragOverZone] = useState(false)
  const [fileForm, setFileForm] = useState({
    name: "",
    content: "",
    path: "",
  })
  const [folderForm, setFolderForm] = useState({
    name: "",
    path: "",
  })
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (folderId) {
      loadFolderAndRules()
      // Selecionar o folder atual por padrão
      setSelectedFolderId(folderId)
    }
  }, [folderId])

  // Limpar estados quando dialogs fecharem
  useEffect(() => {
    if (!isCreateFolderOpen) {
      setFolderForm({
        name: "",
        path: "",
      })
    }
  }, [isCreateFolderOpen])

  useEffect(() => {
    if (!isCreateFileOpen) {
      setFileForm({
        name: "",
        content: "",
        path: "",
      })
      setSelectedFolderId(folderId)
    }
  }, [isCreateFileOpen, folderId])

  useEffect(() => {
    if (!isEditOpen) {
      setEditingItem(null)
    }
  }, [isEditOpen])

  useEffect(() => {
    if (!isViewOpen) {
      setViewingItem(null)
    }
  }, [isViewOpen])

  useEffect(() => {
    if (!isFolderSettingsOpen) {
      setSelectedFolderForDetails(null)
    }
  }, [isFolderSettingsOpen])

  const loadFolderAndRules = async () => {
    setIsLoading(true)
    try {
      const [folderResponse, foldersResponse] = await Promise.all([
        getFolder(folderId),
        listFolders(), // Buscar todos os folders da Account para encontrar subfolders
      ])

      if (folderResponse.success && folderResponse.data) {
        setFolder(folderResponse.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Folder not found",
        })
        router.push("/account")
        return
      }

      // Filtrar subfolders que pertencem a este folder (parentFolderId === folderId)
      // E também buscar recursivamente subfolders de subfolders
      let allSubFolderIds: string[] = [folderId] // Incluir o folder principal também
      if (foldersResponse.success && foldersResponse.data) {
        const allFolders = Array.isArray(foldersResponse.data) ? foldersResponse.data : []
        // Filtrar apenas folders da Account (sem projectId) que são subfolders deste folder
        // Incluir apenas subfolders diretos (parentFolderId === folderId) e recursivos
        const buildSubFoldersTree = (parentId: string): typeof allFolders => {
          const directChildren = allFolders.filter(f => 
            f.parentFolderId === parentId && 
            !f.projectId && 
            f.accountId
          )
          // Buscar recursivamente subfolders de cada filho
          const allDescendants: typeof allFolders = []
          directChildren.forEach(child => {
            allDescendants.push(child)
            allSubFolderIds.push(child.id) // Adicionar ID do subfolder à lista
            const childDescendants = buildSubFoldersTree(child.id)
            allDescendants.push(...childDescendants)
          })
          return allDescendants
        }
        const subFoldersList = buildSubFoldersTree(folderId)
        setSubFolders(subFoldersList)
        console.log("Loaded subfolders for folder", folderId, ":", subFoldersList.length, subFoldersList.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })))
      }

      // Buscar rules do folder principal e de todos os subfolders
      const rulesPromises = allSubFolderIds.map(folderId => listRulesByFolder(folderId))
      const rulesResponses = await Promise.all(rulesPromises)
      
      // Combinar todas as rules em um único array
      const allRules: Rule[] = []
      rulesResponses.forEach((response, index) => {
        if (response.success && response.data) {
          const rulesArray = Array.isArray(response.data) ? response.data : []
          allRules.push(...rulesArray)
          console.log(`Loaded ${rulesArray.length} rules from folder ${allSubFolderIds[index]}`)
        } else {
          console.error(`Failed to load rules from folder ${allSubFolderIds[index]}:`, response.error)
        }
      })
      
      setRules(allRules)
      console.log("Total loaded rules:", allRules.length, allRules.map(r => ({ id: r.id, name: r.name, folderId: r.folderId })))
    } catch (error) {
      console.error("Error loading folder and rules:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load folder and rules.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRules = useMemo(() => {
    if (!Array.isArray(rules)) return []
    if (!searchQuery) return rules
    const lowerCaseQuery = searchQuery.toLowerCase()
    return rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(lowerCaseQuery) ||
        rule.content?.toLowerCase().includes(lowerCaseQuery)
    )
  }, [rules, searchQuery])

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

  const validateFiles = (files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } => {
    const valid: File[] = []
    const invalid: { file: File; reason: string }[] = []

    files.forEach((file) => {
      const allowedExtensions = [".rule", ".txt", ".md"]
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

      if (!allowedExtensions.includes(fileExtension)) {
        invalid.push({
          file,
          reason: `File type "${fileExtension}" is not allowed. Text files (.txt, .md, .rule) are supported.`,
        })
        return
      }

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

  const handleCreateSubFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderForm.name.trim()) return

    try {
      const response = await createFolderAPI({
        parentFolderId: folderId,
        name: folderForm.name.trim(),
        path: folderForm.path.trim() || `/${folderId}/${folderForm.name.toLowerCase().replace(/\s+/g, "-")}`,
      })
      if (response.success && response.data) {
        setFolderForm({ name: "", path: "" })
        setIsCreateFolderOpen(false)
        await loadFolderAndRules()
        if (response.data.id) {
          setExpandedFolders((prev) => new Set(prev).add(response.data!.id))
        }
        toast({
          title: "Subfolder Created",
          description: `Subfolder "${response.data.name}" created successfully.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to create subfolder.",
        })
      }
    } catch (error) {
      console.error("Error creating subfolder:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create subfolder.",
      })
    }
  }

  const handleMoveFolder = async (folderId: string, targetId: string | null) => {
    try {
      const response = await moveFolder(folderId, {
        parentFolderId: targetId || undefined,
        displayOrder: 0,
      })
      if (response.success) {
        toast({
          title: "Folder Moved",
          description: "Folder structure updated successfully.",
        })
        await loadFolderAndRules()
        if (targetId) {
          setExpandedFolders((prev) => new Set(prev).add(targetId))
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
        description: "Failed to move folder",
      })
    }
  }

  const handleMoveRule = async (ruleId: string, targetFolderId: string | null) => {
    // Verificar se o destino é uma pasta compartilhada (não pode receber itens)
    if (targetFolderId) {
      const targetFolder = subFolders.find(f => f.id === targetFolderId)
      if (targetFolder && targetFolder.accountId && !targetFolder.projectId) {
        toast({
          variant: "destructive",
          title: "Cannot Move",
          description: "Cannot move rule into a shared folder. Shared folders are read-only.",
        })
        return
      }
    }

    try {
      const response = await moveRule(ruleId, targetFolderId || folderId)
      if (response.success) {
        toast({
          title: "Rule Moved",
          description: "Rule moved successfully.",
        })
        await loadFolderAndRules()
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
        description: "Failed to move rule",
      })
    }
  }

  const handleDeleteSubFolder = async () => {
    if (!folderToDeleteId) return

    try {
      const response = await deleteFolder(folderToDeleteId)
      if (response.success) {
        setFolderToDeleteId(null)
        await loadFolderAndRules()
        toast({
          title: "Subfolder Deleted",
          description: "Subfolder deleted successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to delete subfolder.",
        })
      }
    } catch (error) {
      console.error("Error deleting subfolder:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subfolder.",
      })
    }
  }

  const handleOpenFolderSettings = (folder: GovernanceFolder) => {
    setSelectedFolderForDetails(folder)
    setIsFolderSettingsOpen(true)
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
        const path = `/${folderId}/${name.toLowerCase().replace(/\s+/g, "-")}`

        console.log("Uploading rule:", { folderId, name, path })
        return createRuleAPI({
          folderId: folderId,
          name: name,
          content: content,
          path: path,
        })
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
      const failed = results.length - successful

      await loadFolderAndRules()
      setExpandedFolders((prev) => new Set(prev).add(folderId))

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
        description: "Failed to upload rules. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileForm.name || !fileForm.content) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide both name and content for the rule.",
      })
      return
    }

    try {
      let finalName = fileForm.name
      if (finalName.match(/\.(md|txt)$/i)) {
        finalName = finalName.replace(/\.(md|txt)$/i, "")
      }
      if (!finalName.toLowerCase().endsWith(".rule")) {
        finalName += ".rule"
      }

      const targetFolderId = selectedFolderId || folderId
      const path = fileForm.path || `/${targetFolderId}/${finalName.toLowerCase().replace(/\s+/g, "-")}`
      console.log("Creating rule:", { folderId: targetFolderId, name: finalName, path })
      const response = await createRuleAPI({
        folderId: targetFolderId,
        name: finalName,
        content: fileForm.content,
        path: path,
      })
      console.log("Create rule response:", response)
      if (response.success && response.data) {
        setFileForm({ name: "", content: "", path: "" })
        setIsCreateFileOpen(false)
        await loadFolderAndRules()
        if (targetFolderId) {
          setExpandedFolders((prev) => new Set(prev).add(targetFolderId))
        }
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
        await loadFolderAndRules()
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
        await loadFolderAndRules()
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

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
      const uploadPromises = valid.map(async (file) => {
        const content = await file.text()
        const baseName = file.name.replace(/\.[^/.]+$/, "")
        const name = `${baseName}.rule`
        const path = `/${selectedFolderId}/${name.toLowerCase().replace(/\s+/g, "-")}`

        return createRuleAPI({
          folderId: selectedFolderId,
          name: name,
          content: content,
          path: path,
        })
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length
      const failed = results.length - successful

      await loadFolderAndRules()
      setExpandedFolders((prev) => new Set(prev).add(selectedFolderId))

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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-6 bg-background">
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!folder) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-6 bg-background">
              <div className="flex flex-col items-center justify-center h-full">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Folder not found</h2>
                <Button asChild>
                  <Link href="/account">Back to Account</Link>
                </Button>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
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
              <div className="bg-white/40 dark:bg-background/40 backdrop-blur-sm border border-gray-200 dark:border-muted/20 p-6 rounded-3xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-600/10 dark:bg-blue-500/20 p-4 rounded-2xl shadow-inner">
                      <Folder className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                          {folder.name}
                        </h1>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest shadow-sm">
                          Account-Level
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 opacity-50" />
                        {folder.path || "/"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-50 dark:bg-muted/30 p-2 rounded-2xl border border-gray-200 dark:border-muted/50">
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-background hover:shadow-sm" asChild>
                      <Link href="/account">
                        <ArrowLeft className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Account-Level Folder
                      </h3>
                      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                        Rules created in this folder are shared across all projects in your organization. Projects with "Full Inheritance" will automatically receive these rules. Projects with "Partial Inheritance" can choose to include this folder.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rules Manager Section - Same structure as project Rules tab */}
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
                        <form onSubmit={handleCreateSubFolder}>
                          <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                            <DialogDescription>Enter a name for your new folder.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                              id="folder-name"
                              value={folderForm.name}
                              onChange={(e) => setFolderForm((prev) => ({ ...prev, name: e.target.value }))}
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
                                  value={selectedFolderId || folderId}
                                  onChange={(e) => setSelectedFolderId(e.target.value)}
                                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  required
                                >
                                  <option value={folderId}>{folder.name} (root)</option>
                                  {subFolders
                                    .filter((f) => !(f.accountId && !f.projectId)) // Filtrar pastas compartilhadas
                                    .map((f) => (
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
                        onClick={() => {
                          setSelectedFolderId(folderId)
                          fileInputRef.current?.click()
                        }}
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

                    const dataJson = e.dataTransfer.getData("application/json")
                    if (dataJson) {
                      try {
                        const data = JSON.parse(dataJson)
                        if (data.type === "folder") {
                          handleMoveFolder(data.id, null)
                        } else if (data.type === "rule") {
                          handleMoveRule(data.id, null)
                        }
                      } catch (err) {
                        // Ignore JSON parse error
                      }
                    }

                    const files = e.dataTransfer.files
                    if (files && files.length > 0) {
                      handleDropFilesOnFolder(folderId, files)
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.types.includes("application/json")) {
                      setIsDragOverZone(true)
                      e.dataTransfer.dropEffect = "move"
                      return
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setIsDragOverZone(false)
                    }
                  }}
                  className={`border-2 transition-all relative ${isDragOverZone && !draggedItem
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-border"
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
                        folders={subFolders}
                        rules={searchQuery ? filteredRules : rules}
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
              </div>
            </div>
          </main>
        </div>
      </div>

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
      {selectedFolderForDetails && (
        <FolderSettingsDialog
          isOpen={isFolderSettingsOpen}
          onClose={() => {
            setIsFolderSettingsOpen(false)
            setSelectedFolderForDetails(null)
          }}
          folderId={selectedFolderForDetails.id}
          folderName={selectedFolderForDetails.name}
          onUpdateFolder={async () => {
            await loadFolderAndRules()
          }}
          onDeleteFolder={async () => {
            if (selectedFolderForDetails) {
              setFolderToDeleteId(selectedFolderForDetails.id)
              setIsFolderSettingsOpen(false)
            }
          }}
        />
      )}

      {/* Folder Delete Confirmation */}
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
            <AlertDialogAction onClick={handleDeleteSubFolder} className="bg-red-600 hover:bg-red-700">
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
