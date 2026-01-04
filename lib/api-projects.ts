"use client"

import { request, type ApiResponse } from "./api"
import type { Project } from "./types/governance"

export interface CreateProjectData {
  name: string
  description?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
}

/**
 * Lista todos os projetos da organização atual (X-Account-Id header injetado pelo client)
 */
export async function listProjects(): Promise<ApiResponse<Project[]>> {
  return request<Project[]>("/projects")
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
    body: JSON.stringify(data),
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
