"use client"

import { request, type ApiResponse } from "./api"

export interface IDEConnection {
  id: string
  userId: string
  ideId: string // "vscode", "cursor", "copilot", "jetbrains"
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  apiKey?: string
  webhookUrl?: string
  autoSync: boolean
  createdAt: string
  updatedAt: string
}

export interface MCPSettings {
  userId: string
  configured: boolean
  lastSync?: string
  serverUrl: string
  updatedAt: string
}

export interface SyncResult {
  synced: boolean
  documentsSynced: number
  lastSync: string
  details: Record<string, { synced: boolean; documentsCount: number }>
}

/**
 * Obtém configurações MCP do usuário
 */
export async function getMCPSettings(): Promise<ApiResponse<MCPSettings>> {
  return request<MCPSettings>("/sync/settings")
}

/**
 * Atualiza configurações MCP
 */
export async function updateMCPSettings(data: { serverUrl?: string }): Promise<ApiResponse<MCPSettings>> {
  return request<MCPSettings>("/sync/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Lista conexões IDE do usuário
 */
export async function listIDEConnections(): Promise<ApiResponse<IDEConnection[]>> {
  return request<IDEConnection[]>("/sync/ide-connections")
}

/**
 * Cria uma nova conexão IDE
 */
export async function createIDEConnection(data: {
  ideId: "vscode" | "cursor" | "copilot" | "jetbrains"
  apiKey: string
  webhookUrl?: string
  autoSync?: boolean
}): Promise<ApiResponse<IDEConnection>> {
  return request<IDEConnection>("/sync/ide-connections", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Atualiza uma conexão IDE
 */
export async function updateIDEConnection(
  id: string,
  data: { connected?: boolean; autoSync?: boolean; webhookUrl?: string }
): Promise<ApiResponse<IDEConnection>> {
  return request<IDEConnection>(`/sync/ide-connections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta uma conexão IDE
 */
export async function deleteIDEConnection(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/sync/ide-connections/${id}`, {
    method: "DELETE",
  })
}

/**
 * Dispara sincronização
 */
export async function triggerSync(data?: { ideId?: string }): Promise<ApiResponse<SyncResult>> {
  return request<SyncResult>("/sync/sync", {
    method: "POST",
    body: JSON.stringify(data || {}),
  })
}

