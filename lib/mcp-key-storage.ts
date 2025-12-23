/**
 * Gerenciamento de visualização de chaves MCP
 * Chaves só podem ser vistas UMA VEZ após criação
 */

const VIEWED_KEYS_STORAGE_KEY = "syncrules_viewed_mcp_keys"

/**
 * Marca uma chave como "vista" após criação
 */
export function markKeyAsViewed(keyId: string) {
  if (typeof window === "undefined") return
  const viewed = getViewedKeys()
  viewed.add(keyId)
  localStorage.setItem(VIEWED_KEYS_STORAGE_KEY, JSON.stringify(Array.from(viewed)))
}

/**
 * Verifica se uma chave já foi vista
 */
export function isKeyViewed(keyId: string): boolean {
  if (typeof window === "undefined") return false
  const viewed = getViewedKeys()
  return viewed.has(keyId)
}

/**
 * Obtém o conjunto de chaves já visualizadas
 */
function getViewedKeys(): Set<string> {
  if (typeof window === "undefined") return new Set()
  const stored = localStorage.getItem(VIEWED_KEYS_STORAGE_KEY)
  if (!stored) return new Set()
  try {
    return new Set(JSON.parse(stored))
  } catch {
    return new Set()
  }
}

/**
 * Remove uma chave da lista de visualizadas (útil para resetar)
 */
export function removeKeyFromViewed(keyId: string) {
  if (typeof window === "undefined") return
  const viewed = getViewedKeys()
  viewed.delete(keyId)
  localStorage.setItem(VIEWED_KEYS_STORAGE_KEY, JSON.stringify(Array.from(viewed)))
}

