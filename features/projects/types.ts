/**
 * Project Feature Types
 * 
 * Centralized type definitions for the projects feature.
 * Keeps types close to where they're used.
 */

export interface Project {
  id: string
  name: string
  description?: string
  accountId: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectDto {
  name: string
  description?: string
  accountId: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
}

export interface ProjectPermissions {
  id: string
  projectId: string
  targetType: "user" | "group"
  targetId: string
  permissionType: "read" | "write" | "admin"
}

