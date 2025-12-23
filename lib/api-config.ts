"use client"

/**
 * API Configuration - Funções auxiliares para requisições HTTP autenticadas
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

// Storage keys
const TOKEN_KEY = "syncrules_token"
const REFRESH_TOKEN_KEY = "syncrules_refresh_token"

/**
 * Obtém o token de acesso
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Obtém o refresh token
 */
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Remove todos os tokens
 */
function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * Atualiza o token de acesso usando refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const url = `${API_BASE_URL}/auth/refresh`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
      mode: "cors",
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, data.data.token)
          localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken)
        }
        return true
      }
    }

    return false
  } catch {
    return false
  }
}

/**
 * Faz requisição HTTP autenticada com tratamento de erros e refresh token automático
 * Retorna o Response diretamente para uso com response.ok, response.json(), etc.
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`
  const token = getAccessToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  // Adiciona token Bearer se disponível
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: "cors",
      credentials: "include",
    })

    // Se token expirado, tenta refresh
    if (response.status === 401 && token) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retenta a requisição com novo token
        const newToken = getAccessToken()
        if (newToken) {
          const retryHeaders: Record<string, string> = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          }
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
            mode: "cors",
            credentials: "include",
          })
          return retryResponse
        }
      }
      // Se refresh falhou, limpa tokens
      clearTokens()
    }

    return response
  } catch (error) {
    // Em caso de erro de rede, retorna uma Response simulada com erro
    throw error
  }
}

