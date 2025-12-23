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
): Promise<ApiResponse<{ uploaded: Document[]; failed: Array<{ fileName: string; reason: string }> }>> {
  if (!files || files.length === 0) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "No files provided",
      },
    }
  }

  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })
  if (parentId !== undefined && parentId !== null) {
    formData.append("parentId", parentId)
  }

  const { getAccessToken } = await import("./api")
  const token = getAccessToken()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

  try {
    const headers: HeadersInit = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    // Não definir Content-Type - o browser define automaticamente com boundary para FormData

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
      mode: "cors",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: {
          code: errorData.error?.code || "UPLOAD_ERROR",
          message: errorData.error?.message || `Upload failed: ${response.statusText}`,
          details: errorData.error?.details,
        },
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    console.error("Upload error:", error)
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "Failed to upload files",
      },
    }
  }
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

