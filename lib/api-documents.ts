"use client"

import { request, type ApiResponse } from "./api"

export interface Document {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  parentId: string | null
  userId: string
  size?: number
  createdAt: string
  updatedAt: string
}

export interface DocumentPathItem {
  id: string
  name: string
  type: "file" | "folder"
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Lista documentos com filtros e paginação
 */
export async function listDocuments(params?: {
  parentId?: string | null
  type?: "file" | "folder"
  search?: string
  page?: number
  limit?: number
}): Promise<ApiResponse<PaginatedResponse<Document>>> {
  const queryParams = new URLSearchParams()
  if (params?.parentId !== undefined) queryParams.set("parentId", params.parentId || "")
  if (params?.type) queryParams.set("type", params.type)
  if (params?.search) queryParams.set("search", params.search)
  if (params?.page) queryParams.set("page", params.page.toString())
  if (params?.limit) queryParams.set("limit", params.limit.toString())

  return request<PaginatedResponse<Document>>(`/documents?${queryParams.toString()}`)
}

/**
 * Obtém um documento específico
 */
export async function getDocument(id: string): Promise<ApiResponse<Document>> {
  return request<Document>(`/documents/${id}`)
}

/**
 * Cria um novo documento ou pasta
 */
export async function createDocument(data: {
  name: string
  type: "file" | "folder"
  content?: string
  parentId?: string | null
}): Promise<ApiResponse<Document>> {
  return request<Document>("/documents", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Atualiza um documento
 */
export async function updateDocument(
  id: string,
  data: { name?: string; content?: string }
): Promise<ApiResponse<Document>> {
  return request<Document>(`/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta um documento
 */
export async function deleteDocument(id: string): Promise<ApiResponse<{ deletedCount: number; freedStorage: number }>> {
  return request<{ deletedCount: number; freedStorage: number }>(`/documents/${id}`, {
    method: "DELETE",
  })
}

/**
 * Obtém o caminho (path) de um documento
 */
export async function getDocumentPath(id: string): Promise<ApiResponse<DocumentPathItem[]>> {
  return request<DocumentPathItem[]>(`/documents/${id}/path`)
}

/**
 * Move um documento para outra pasta
 */
export async function moveDocument(id: string, parentId: string | null): Promise<ApiResponse<Document>> {
  return request<Document>(`/documents/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ parentId }),
  })
}

/**
 * Busca documentos
 */
export async function searchDocuments(query: string): Promise<ApiResponse<PaginatedResponse<Document>>> {
  return request<PaginatedResponse<Document>>(`/documents/search?search=${encodeURIComponent(query)}`)
}

/**
 * Faz upload de arquivos
 */
export async function uploadFiles(
  files: File[],
  parentId?: string | null
): Promise<ApiResponse<{ uploaded: Document[]; failed: string[] }>> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })
  if (parentId !== undefined) {
    formData.append("parentId", parentId || "")
  }

  const token = (await import("./api")).getAccessToken()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  })

  return response.json()
}

/**
 * Faz upload de diretório completo
 */
export async function uploadDirectory(
  files: FileList,
  parentId?: string | null
): Promise<ApiResponse<{ uploaded: Document[]; failed: string[] }>> {
  const formData = new FormData()
  Array.from(files).forEach((file) => {
    formData.append("files", file)
  })
  if (parentId !== undefined) {
    formData.append("parentId", parentId || "")
  }

  const token = (await import("./api")).getAccessToken()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

  const response = await fetch(`${API_BASE_URL}/documents/upload-directory`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  })

  return response.json()
}

