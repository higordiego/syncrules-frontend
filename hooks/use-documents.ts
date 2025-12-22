"use client"

import { useState, useEffect, useCallback } from "react"
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentPath,
  moveDocument,
  uploadFiles,
  type Document,
} from "@/lib/api-documents"
import { getUsageStats } from "@/lib/api-usage"

export function useDocuments(parentId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [breadcrumb, setBreadcrumb] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await listDocuments({ parentId, limit: 1000 })
      if (response.success && response.data) {
        setDocuments(response.data.data)
        
        if (parentId) {
          const pathResponse = await getDocumentPath(parentId)
          if (pathResponse.success && pathResponse.data) {
            setBreadcrumb(pathResponse.data)
          } else {
            setBreadcrumb([])
          }
        } else {
          setBreadcrumb([])
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }, [parentId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const canAddFile = useCallback(async () => {
    try {
      const statsResponse = await getUsageStats()
      if (statsResponse.success && statsResponse.data) {
        return statsResponse.data.filesUsed < statsResponse.data.filesLimit
      }
      return false
    } catch {
      return false
    }
  }, [])

  const handleAddFolder = useCallback(
    async (name: string) => {
      try {
        const response = await createDocument({
          name,
          type: "folder",
          parentId,
        })
        if (response.success) {
          await loadDocuments()
        }
      } catch (error) {
        console.error("Error adding folder:", error)
      }
    },
    [parentId, loadDocuments]
  )

  const handleAddFile = useCallback(
    async (name: string, content: string) => {
      try {
        if (!(await canAddFile())) {
          return false
        }
        const response = await createDocument({
          name: name.endsWith(".md") ? name : `${name}.md`,
          type: "file",
          content,
          parentId,
        })
        if (response.success) {
          await loadDocuments()
          return true
        }
        return false
      } catch (error) {
        console.error("Error adding file:", error)
        return false
      }
    },
    [parentId, canAddFile, loadDocuments]
  )

  const handleUpdateDocument = useCallback(
    async (id: string, updates: { name?: string; content?: string }) => {
      try {
        await updateDocument(id, updates)
        await loadDocuments()
      } catch (error) {
        console.error("Error updating document:", error)
      }
    },
    [loadDocuments]
  )

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id)
        await loadDocuments()
      } catch (error) {
        console.error("Error deleting document:", error)
      }
    },
    [loadDocuments]
  )

  const handleMoveDocument = useCallback(
    async (id: string, newParentId: string | null) => {
      try {
        const response = await moveDocument(id, newParentId)
        if (response.success) {
          await loadDocuments()
          return true
        }
        return false
      } catch (error) {
        console.error("Error moving document:", error)
        return false
      }
    },
    [loadDocuments]
  )

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      try {
        const statsResponse = await getUsageStats()
        if (!statsResponse.success || !statsResponse.data) {
          return { success: false, error: "failed_to_load_stats" }
        }

        const stats = statsResponse.data
        const filesCanUpload = stats.filesLimit - stats.filesUsed

        if (filesCanUpload <= 0) {
          return { success: false, error: "limit_reached" }
        }

        if (files.length > filesCanUpload) {
          return { success: false, error: "too_many_files", maxFiles: filesCanUpload }
        }

        const response = await uploadFiles(files, parentId)
        if (response.success) {
          await loadDocuments()
          return { success: true }
        }
        return { success: false, error: "upload_failed" }
      } catch (error) {
        console.error("Error uploading files:", error)
        return { success: false, error: "upload_failed" }
      }
    },
    [parentId, loadDocuments]
  )

  return {
    documents,
    breadcrumb,
    loading,
    canAddFile,
    handleAddFolder,
    handleAddFile,
    handleUpdateDocument,
    handleDeleteDocument,
    handleMoveDocument,
    handleUploadFiles,
    reload: loadDocuments,
  }
}

