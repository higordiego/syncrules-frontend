"use client"

import { request, type ApiResponse } from "./api"
import type { Folder, SyncStatus, FolderStatus } from "./types/governance"

export interface CreateFolderData {
  accountId?: string
  projectId?: string
  name: string
  path: string
  inheritPermissions?: boolean
}

export interface MoveFolderData {
  parentFolderId?: string
  displayOrder: number
}

/**
 * Lista pastas por conta ou projeto
 */
export async function listFolders(params: { accountId?: string; projectId?: string }): Promise<ApiResponse<Folder[]>> {
  const query = new URLSearchParams()
  if (params.accountId) query.append("accountId", params.accountId)
  if (params.projectId) query.append("projectId", params.projectId)

  return request<Folder[]>(`/folders?${query.toString()}`)
}

/**
 * Obtém uma pasta específica
 */
export async function getFolder(id: string): Promise<ApiResponse<Folder>> {
  return request<Folder>(`/folders/${id}`)
}

/**
 * Cria uma nova pasta
 */
export async function createFolder(data: CreateFolderData): Promise<ApiResponse<Folder>> {
  return request<Folder>("/folders", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Sincroniza uma pasta da conta para um projeto
 */
export async function syncFolder(id: string, projectId: string): Promise<ApiResponse<Folder>> {
  return request<Folder>(`/folders/${id}/sync`, {
    method: "POST",
    body: JSON.stringify({ projectId }),
  })
}

/**
 * Desvincula uma pasta sincronizada (torna local)
 */
export async function detachFolder(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/folders/${id}/detach`, {
    method: "POST",
  })
}

/**
 * Re-sincroniza uma pasta desvinculada
 */
export async function resyncFolder(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/folders/${id}/resync`, {
    method: "POST",
  })
}

/**
 * Atualiza uma pasta
 */
export async function updateFolder(id: string, data: Partial<CreateFolderData>): Promise<ApiResponse<Folder>> {
  return request<Folder>(`/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

/**
 * Move uma pasta
 */
export async function moveFolder(id: string, data: MoveFolderData): Promise<ApiResponse<void>> {
  return request<void>(`/folders/${id}/move`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta uma pasta
 */
export async function deleteFolder(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/folders/${id}`, {
    method: "DELETE",
  })
}
