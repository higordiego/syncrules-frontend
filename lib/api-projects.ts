"use client"

import { request, type ApiResponse } from "./api"
import type { Project, InheritanceMode } from "./types/governance"

export interface CreateProjectData {
  accountId: string
  name: string
  description?: string
  inheritanceMode: InheritanceMode
}

export interface UpdateProjectData {
  name?: string
  description?: string
  inheritanceMode?: InheritanceMode
}

/**
 * Lista todos os projetos de uma organização
 */
export async function listProjects(accountId: string): Promise<ApiResponse<Project[]>> {
  return request<Project[]>(`/projects?accountId=${accountId}`)
}

/**
 * Obtém um projeto específico
 */
export async function getProject(id: string): Promise<ApiResponse<Project>> {
  return request<Project>(`/projects/${id}`)
}

/**
 * Cria um novo projeto
 */
export async function createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({
      accountId: data.accountId,
      name: data.name,
      description: data.description,
      inheritanceMode: data.inheritanceMode,
    }),
  })
}

/**
 * Atualiza um projeto
 */
export async function updateProject(id: string, data: UpdateProjectData): Promise<ApiResponse<Project>> {
  return request<Project>(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta um projeto
 */
export async function deleteProject(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/projects/${id}`, {
    method: "DELETE",
  })
}


