"use client"

/**
 * @deprecated Use lib/api-documents.ts instead
 * Mantido apenas para compatibilidade durante migração
 */

import * as apiDocuments from "./api-documents"
export type { Document as DocumentItem } from "./api-documents"

// Re-export API functions
export const {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentPath,
  moveDocument,
  searchDocuments,
  uploadFiles,
  uploadDirectory,
} = apiDocuments

// Legacy localStorage functions (mantidas para compatibilidade)
export interface LegacyDocumentItem {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export function getDocuments(): LegacyDocumentItem[] {
  if (typeof window === "undefined") return []
  const docsStr = localStorage.getItem("documents")
  return docsStr ? JSON.parse(docsStr) : []
}

export function saveDocuments(documents: DocumentItem[]) {
  localStorage.setItem("documents", JSON.stringify(documents))
}

export function addDocument(doc: Omit<DocumentItem, "id" | "createdAt" | "updatedAt">): DocumentItem {
  const documents = getDocuments()
  const newDoc: DocumentItem = {
    ...doc,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  documents.push(newDoc)
  saveDocuments(documents)

  if (newDoc.type === "file") {
    addActivity({ type: "upload", description: `File "${newDoc.name}" uploaded` })
  } else {
    addActivity({ type: "folder", description: `Folder "${newDoc.name}" created` })
  }

  return newDoc
}

export function updateDocument(id: string, updates: Partial<DocumentItem>) {
  const documents = getDocuments()
  const index = documents.findIndex((d) => d.id === id)
  if (index !== -1) {
    documents[index] = { ...documents[index], ...updates, updatedAt: new Date().toISOString() }
    saveDocuments(documents)

    if (updates.name) {
      addActivity({ type: "edit", description: `Renamed to "${updates.name}"` })
    }
  }
}

export function deleteDocument(id: string) {
  const documents = getDocuments()
  const doc = documents.find((d) => d.id === id)
  // Delete the document and all its children recursively
  const toDelete = new Set([id])
  let changed = true

  while (changed) {
    changed = false
    for (const doc of documents) {
      if (doc.parentId && toDelete.has(doc.parentId) && !toDelete.has(doc.id)) {
        toDelete.add(doc.id)
        changed = true
      }
    }
  }

  const filtered = documents.filter((d) => !toDelete.has(d.id))
  saveDocuments(filtered)

  if (doc) {
    addActivity({ type: "delete", description: `"${doc.name}" was deleted` })
  }
}

export function getDocumentsByParent(parentId: string | null): DocumentItem[] {
  const documents = getDocuments()
  return documents
    .filter((d) => d.parentId === parentId)
    .sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
}

export function getDocumentPath(id: string): DocumentItem[] {
  const documents = getDocuments()
  const path: DocumentItem[] = []
  let current = documents.find((d) => d.id === id)

  while (current) {
    path.unshift(current)
    current = current.parentId ? documents.find((d) => d.id === current!.parentId) : undefined
  }

  return path
}

export function moveDocument(id: string, newParentId: string | null) {
  const documents = getDocuments()
  const index = documents.findIndex((d) => d.id === id)
  if (index !== -1) {
    // Prevent moving a folder into itself or its descendants
    if (documents[index].type === "folder" && newParentId) {
      const descendants = getAllDescendants(id, documents)
      if (descendants.includes(newParentId)) {
        return false
      }
    }
    documents[index] = { ...documents[index], parentId: newParentId, updatedAt: new Date().toISOString() }
    saveDocuments(documents)
    return true
  }
  return false
}

function getAllDescendants(folderId: string, documents: DocumentItem[]): string[] {
  const descendants: string[] = []
  const children = documents.filter((d) => d.parentId === folderId)

  for (const child of children) {
    descendants.push(child.id)
    if (child.type === "folder") {
      descendants.push(...getAllDescendants(child.id, documents))
    }
  }

  return descendants
}

export function addDocumentFromFile(file: File, parentId: string | null): Promise<DocumentItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const newDoc = addDocument({
        name: file.name,
        type: "file",
        content,
        parentId,
      })
      resolve(newDoc)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

interface FileWithPath extends File {
  webkitRelativePath?: string
}

export async function processDirectoryUpload(
  files: FileList,
  baseParentId: string | null
): Promise<{ success: boolean; error?: string }> {
  const fileArray = Array.from(files) as FileWithPath[]
  
  // Check if any file has webkitRelativePath (indicates directory upload)
  const hasRelativePaths = fileArray.some((f) => f.webkitRelativePath)
  
  if (!hasRelativePaths) {
    // Regular file upload, process normally
    for (const file of fileArray) {
      await addDocumentFromFile(file, baseParentId)
    }
    return { success: true }
  }

  const folderMap = new Map<string, string | null>() // path -> folderId
  folderMap.set("", baseParentId)

  try {
    // First pass: Create all folders
    const folderPaths = new Set<string>()
    fileArray.forEach((file) => {
      if (file.webkitRelativePath) {
        const pathParts = file.webkitRelativePath.split("/")
        let currentPath = ""
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i]
          currentPath = currentPath ? `${currentPath}/${part}` : part
          folderPaths.add(currentPath)
        }
      }
    })

    // Create folders in order (shallowest first)
    const sortedPaths = Array.from(folderPaths).sort((a, b) => {
      const depthA = a.split("/").length
      const depthB = b.split("/").length
      return depthA - depthB
    })

    for (const path of sortedPaths) {
      const pathParts = path.split("/")
      const folderName = pathParts[pathParts.length - 1]
      const parentPath = pathParts.slice(0, -1).join("/")
      const parentId = folderMap.get(parentPath) ?? baseParentId

      const folder = addDocument({
        name: folderName,
        type: "folder",
        parentId: parentId,
      })
      folderMap.set(path, folder.id)
    }

    // Second pass: Create all files
    for (const file of fileArray) {
      let parentId = baseParentId
      if (file.webkitRelativePath) {
        const pathParts = file.webkitRelativePath.split("/")
        if (pathParts.length > 1) {
          const folderPath = pathParts.slice(0, -1).join("/")
          parentId = folderMap.get(folderPath) ?? baseParentId
        }
      }
      await addDocumentFromFile(file, parentId)
    }

    return { success: true }
  } catch (error) {
    console.error("Error processing directory upload:", error)
    return { success: false, error: "Failed to process directory upload" }
  }
}
