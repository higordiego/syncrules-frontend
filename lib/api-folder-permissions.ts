"use client"

import { request, type ApiResponse } from "./api"
import type { Permission, PermissionType, PermissionTargetType } from "@/lib/types/governance"

export interface CreateFolderPermissionData {
    targetType: PermissionTargetType
    targetId: string
    permissionType: PermissionType
}

export interface UpdateFolderPermissionData {
    permissionType: PermissionType
}

/**
 * Lista todas as permissões de uma pasta
 */
export async function listFolderPermissions(folderId: string): Promise<ApiResponse<Permission[]>> {
    return request<Permission[]>(`/folders/${folderId}/permissions`)
}

/**
 * Cria uma nova permissão para uma pasta
 */
export async function createFolderPermission(folderId: string, data: CreateFolderPermissionData): Promise<ApiResponse<Permission>> {
    return request<Permission>(`/folders/${folderId}/permissions`, {
        method: "POST",
        body: JSON.stringify(data),
    })
}

/**
 * Atualiza uma permissão de pasta
 */
export async function updateFolderPermission(id: string, data: UpdateFolderPermissionData): Promise<ApiResponse<Permission>> {
    // Uses global permission route
    return request<Permission>(`/folder-permissions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

/**
 * Deleta uma permissão de pasta
 */
export async function deleteFolderPermission(id: string): Promise<ApiResponse<void>> {
    // Uses global permission route
    return request<void>(`/folder-permissions/${id}`, {
        method: "DELETE",
    })
}
