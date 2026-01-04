"use client"

import { request, type ApiResponse } from "./api"
import type { Folder, FolderStatus } from "./types/governance"

export interface CreateFolderData {
  projectId?: string
  parentFolderId?: string
  name: string
  path: string
  inheritPermissions?: boolean
}

export interface MoveFolderData {
  parentFolderId?: string
  displayOrder: number
}

/**
 * Lista pastas por projeto (X-Account-Id injetado automaticamente)
 */
export async function listFolders(params: { projectId?: string } = {}): Promise<ApiResponse<Folder[]>> {
  const query = new URLSearchParams()
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

/**
 * Compartilha uma pasta com projetos específicos
 */
export async function shareFolderWithProjects(folderId: string, projectIds: string[]): Promise<ApiResponse<void>> {
  return request<void>(`/folders/${folderId}/share`, {
    method: "POST",
    body: JSON.stringify({ projectIds }),
  })
}

/**
 * Remove compartilhamento de uma pasta com um projeto
 */
export async function unshareFolderFromProject(folderId: string, projectId: string): Promise<ApiResponse<void>> {
  return request<void>(`/folders/${folderId}/share/${projectId}`, {
    method: "DELETE",
  })
}

/**
 * Obtém lista de projetos que têm acesso a uma pasta
 */
export async function getSharedProjects(folderId: string): Promise<ApiResponse<string[]>> {
  return request<string[]>(`/folders/${folderId}/shared-projects`)
}
