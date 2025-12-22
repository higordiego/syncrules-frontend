"use client"

import { request, type ApiResponse } from "./api"

export interface MCPKey {
  id: string
  name: string
  key: string // Encrypted on backend
  description: string
  userId: string
  createdAt: string
  updatedAt: string
}

/**
 * Lista todas as chaves MCP do usuário
 */
export async function listMCPKeys(): Promise<ApiResponse<MCPKey[]>> {
  return request<MCPKey[]>("/mcp-keys")
}

/**
 * Obtém uma chave MCP específica
 */
export async function getMCPKey(id: string): Promise<ApiResponse<MCPKey>> {
  return request<MCPKey>(`/mcp-keys/${id}`)
}

/**
 * Cria uma nova chave MCP
 */
export async function createMCPKey(data: {
  name: string
  key: string
  description: string
}): Promise<ApiResponse<MCPKey>> {
  return request<MCPKey>("/mcp-keys", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Atualiza uma chave MCP
 */
export async function updateMCPKey(
  id: string,
  data: { name?: string; key?: string; description?: string }
): Promise<ApiResponse<MCPKey>> {
  return request<MCPKey>(`/mcp-keys/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta uma chave MCP
 */
export async function deleteMCPKey(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/mcp-keys/${id}`, {
    method: "DELETE",
  })
}

/**
 * Valida uma chave MCP
 */
export async function validateMCPKey(id: string): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
  return request<{ valid: boolean; message?: string }>(`/mcp-keys/${id}/validate`, {
    method: "POST",
  })
}

