/**
 * Project Service
 * 
 * Handles all project-related API calls and business logic.
 * Pure TypeScript - no React dependencies.
 * 
 * Max: 120 lines
 */

import { apiClient } from "@/services/api-client"
import type { Project, CreateProjectDto, UpdateProjectDto } from "../types"

export const projectService = {
  /**
   * Get project by ID
   */
  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`)
    return transformProject(response)
  },

  /**
   * List all projects for current account
   */
  async list(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>("/projects")
    return Array.isArray(response) ? response.map(transformProject) : []
  },

  /**
   * Create a new project
   */
  async create(dto: CreateProjectDto): Promise<Project> {
    validateCreateDto(dto)
    const response = await apiClient.post<Project>("/projects", dto)
    return transformProject(response)
  },

  /**
   * Update an existing project
   */
  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    validateUpdateDto(dto)
    const response = await apiClient.put<Project>(`/projects/${id}`, dto)
    return transformProject(response)
  },

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  },
}

/**
 * Transform API response to Project type
 */
function transformProject(data: any): Project {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    accountId: data.accountId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Validate create DTO
 */
function validateCreateDto(dto: CreateProjectDto): void {
  if (!dto.name || dto.name.trim().length === 0) {
    throw new Error("Project name is required")
  }
  if (!dto.accountId) {
    throw new Error("Account ID is required")
  }
}

/**
 * Validate update DTO
 */
function validateUpdateDto(dto: UpdateProjectDto): void {
  if (dto.name !== undefined && dto.name.trim().length === 0) {
    throw new Error("Project name cannot be empty")
  }
}

