"use client"

/**
 * @deprecated Use lib/api-mcp-keys.ts instead
 * Mantido apenas para compatibilidade durante migração
 */

import * as apiMCPKeys from "./api-mcp-keys"
export type { MCPKey } from "./api-mcp-keys"

// Re-export API functions
export const {
  listMCPKeys,
  getMCPKey,
  createMCPKey,
  updateMCPKey,
  deleteMCPKey,
  validateMCPKey,
} = apiMCPKeys

// Legacy localStorage functions (mantidas para compatibilidade)
export function getMCPKeys(): MCPKey[] {
  if (typeof window === "undefined") return []
  const keysStr = localStorage.getItem("mcpKeys")
  return keysStr ? JSON.parse(keysStr) : []
}

export function saveMCPKeys(keys: MCPKey[]) {
  localStorage.setItem("mcpKeys", JSON.stringify(keys))
}

export function addMCPKey(key: Omit<MCPKey, "id" | "createdAt">): MCPKey {
  const keys = getMCPKeys()
  const newKey: MCPKey = {
    ...key,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  keys.push(newKey)
  saveMCPKeys(keys)
  return newKey
}

export function updateMCPKey(id: string, updates: Partial<MCPKey>) {
  const keys = getMCPKeys()
  const index = keys.findIndex((k) => k.id === id)
  if (index !== -1) {
    keys[index] = { ...keys[index], ...updates }
    saveMCPKeys(keys)
  }
}

export function deleteMCPKey(id: string) {
  const keys = getMCPKeys()
  const filtered = keys.filter((k) => k.id !== id)
  saveMCPKeys(filtered)
}
