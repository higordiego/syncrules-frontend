"use client"

import { useState, useEffect, useCallback } from "react"
import { listMCPKeys, createMCPKey, deleteMCPKey, type MCPKey } from "@/lib/api-mcp-keys"

export function useMCPKeys() {
  const [keys, setKeys] = useState<MCPKey[]>([])
  const [loading, setLoading] = useState(false)

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true)
      const response = await listMCPKeys()
      if (response.success && response.data) {
        setKeys(response.data)
      }
    } catch (error) {
      console.error("Error loading MCP keys:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleAddKey = useCallback(
    async (keyData: { name: string; key: string; description: string }) => {
      try {
        const keyWithPrefix = keyData.key.startsWith("SK-") ? keyData.key : `SK-${keyData.key}`
        const response = await createMCPKey({ ...keyData, key: keyWithPrefix })
        if (response.success) {
          await loadKeys()
        }
      } catch (error) {
        console.error("Error adding MCP key:", error)
      }
    },
    [loadKeys]
  )

  const handleDeleteKey = useCallback(
    async (id: string) => {
      try {
        await deleteMCPKey(id)
        await loadKeys()
      } catch (error) {
        console.error("Error deleting MCP key:", error)
      }
    },
    [loadKeys]
  )

  return {
    keys,
    loading,
    handleAddKey,
    handleDeleteKey,
    reload: loadKeys,
  }
}

