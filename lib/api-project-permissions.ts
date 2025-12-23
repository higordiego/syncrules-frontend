"use client"

import { request, type ApiResponse } from "./api"
import type { Permission, PermissionType, PermissionTargetType, Project } from "@/lib/types/governance"

export interface CreateProjectPermissionData {
  projectId: string
  targetType: PermissionTargetType
  targetId: string
  permissionType: PermissionType
}

export interface UpdateProjectPermissionData {
  permissionType: PermissionType
}

/**
 * Lista todas as permissões de um projeto
 */
export async function listProjectPermissions(projectId: string): Promise<ApiResponse<Permission[]>> {
  return request<Permission[]>(`/project-permissions?projectId=${projectId}`)
}

/**
 * Cria uma nova permissão para um projeto
 */
export async function createProjectPermission(data: CreateProjectPermissionData): Promise<ApiResponse<Permission>> {
  return request<Permission>("/project-permissions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Atualiza uma permissão de projeto
 */
export async function updateProjectPermission(id: string, data: UpdateProjectPermissionData): Promise<ApiResponse<Permission>> {
  return request<Permission>(`/project-permissions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta uma permissão de projeto
 */
export async function deleteProjectPermission(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/project-permissions/${id}`, {
    method: "DELETE",
  })
}

export interface ToggleInheritPermissionsData {
  projectId: string
  enabled: boolean
}

/**
 * Alterna a herança de permissões de um projeto
 */
export async function toggleInheritPermissions(data: ToggleInheritPermissionsData): Promise<ApiResponse<Project>> {
  return request<Project>("/project-permissions/toggle-inherit", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

