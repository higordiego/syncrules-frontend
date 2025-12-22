"use client"

import { useState, useEffect, useCallback } from "react"
import { getMCPKeys, addMCPKey, deleteMCPKey, type MCPKey } from "@/lib/mcp-keys"

export function useMCPKeys() {
  const [keys, setKeys] = useState<MCPKey[]>([])
  const [loading, setLoading] = useState(false)

  const loadKeys = useCallback(() => {
    setLoading(true)
    const loadedKeys = getMCPKeys()
    setKeys(loadedKeys)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleAddKey = useCallback(
    (keyData: { name: string; key: string; description: string }) => {
      const keyWithPrefix = keyData.key.startsWith("SK-") ? keyData.key : `SK-${keyData.key}`
      addMCPKey({ ...keyData, key: keyWithPrefix })
      loadKeys()
    },
    [loadKeys]
  )

  const handleDeleteKey = useCallback(
    (id: string) => {
      deleteMCPKey(id)
      loadKeys()
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

