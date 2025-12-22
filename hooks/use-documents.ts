"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getDocumentsByParent,
  addDocument,
  deleteDocument,
  updateDocument,
  getDocumentPath,
  moveDocument,
  addDocumentFromFile,
  type DocumentItem,
} from "@/lib/documents"
import { getUsageStats } from "@/lib/activity"

export function useDocuments(parentId: string | null) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [breadcrumb, setBreadcrumb] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadDocuments = useCallback(() => {
    setLoading(true)
    const docs = getDocumentsByParent(parentId)
    setDocuments(docs)
    if (parentId) {
      const path = getDocumentPath(parentId)
      setBreadcrumb(path)
    } else {
      setBreadcrumb([])
    }
    setLoading(false)
  }, [parentId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const canAddFile = useCallback(() => {
    const stats = getUsageStats()
    return stats.filesUsed < stats.filesLimit
  }, [])

  const handleAddFolder = useCallback(
    (name: string) => {
      addDocument({
        name,
        type: "folder",
        parentId,
      })
      loadDocuments()
    },
    [parentId, loadDocuments]
  )

  const handleAddFile = useCallback(
    (name: string, content: string) => {
      if (!canAddFile()) {
        return false
      }
      addDocument({
        name: name.endsWith(".md") ? name : `${name}.md`,
        type: "file",
        content,
        parentId,
      })
      loadDocuments()
      return true
    },
    [parentId, canAddFile, loadDocuments]
  )

  const handleUpdateDocument = useCallback(
    (id: string, updates: { name?: string; content?: string }) => {
      updateDocument(id, updates)
      loadDocuments()
    },
    [loadDocuments]
  )

  const handleDeleteDocument = useCallback(
    (id: string) => {
      deleteDocument(id)
      loadDocuments()
    },
    [loadDocuments]
  )

  const handleMoveDocument = useCallback(
    (id: string, newParentId: string | null) => {
      const success = moveDocument(id, newParentId)
      if (success) {
        loadDocuments()
      }
      return success
    },
    [loadDocuments]
  )

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      const stats = getUsageStats()
      const filesCanUpload = stats.filesLimit - stats.filesUsed

      if (filesCanUpload <= 0) {
        return { success: false, error: "limit_reached" }
      }

      if (files.length > filesCanUpload) {
        return { success: false, error: "too_many_files", maxFiles: filesCanUpload }
      }

      try {
        for (const file of files) {
          await addDocumentFromFile(file, parentId)
        }
        loadDocuments()
        return { success: true }
      } catch (error) {
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

