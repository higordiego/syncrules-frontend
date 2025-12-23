"use client"

/**
 * API Client para comunicação com o backend
 * Garante segurança: Client ID apenas no frontend, Client Secret apenas no backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "796650892294-fthnd6m999bjv49npemmgl40hqph9kar.apps.googleusercontent.com"

// Storage keys
const TOKEN_KEY = "syncrules_token"
const REFRESH_TOKEN_KEY = "syncrules_refresh_token"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
    requestId?: string
  }
  message?: string
}

export interface AuthTokens {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    picture: string
    plan: string
  }
}

/**
 * Armazena tokens de forma segura
 */
export function setTokens(tokens: { token: string; refreshToken: string }) {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, tokens.token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

/**
 * Obtém o token de acesso
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Obtém o refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Remove todos os tokens
 */
export function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

/**
 * Faz requisição HTTP com tratamento de erros e refresh token automático
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAccessToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  // Adiciona token Bearer se disponível e não fornecido nas opções
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: "cors", // Explicitamente permite CORS
      credentials: "include", // Inclui cookies se necessário
    })

    // Se token expirado, tenta refresh (exceto se já for a rota de refresh)
    if (response.status === 401 && token && !url.includes("/auth/refresh")) {
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
          return handleResponse<T>(retryResponse)
        }
      }
      // Se refresh falhou, limpa tokens e retorna erro
      clearTokens()
      throw new Error("Sessão expirada. Por favor, faça login novamente.")
    }

    return handleResponse<T>(response)
  } catch (error) {
    // Log detalhado do erro para debug
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Erro de rede ao conectar com o backend:", {
        url,
        error: error.message,
        backendUrl: API_BASE_URL,
      })
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: `Não foi possível conectar ao backend. Verifique se o servidor está rodando em ${API_BASE_URL}`,
        },
      }
    }

    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Erro de rede",
      },
    }
  }
}

/**
 * Processa resposta HTTP
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type")
  const isJson = contentType?.includes("application/json")

  if (!isJson) {
    const text = await response.text()
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: text || "Resposta inválida do servidor",
      },
    }
  }

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: {
        code: data.error?.code || "HTTP_ERROR",
        message: data.error?.message || data.message || "Erro na requisição",
        details: data.error?.details,
        requestId: data.error?.requestId,
      },
    }
  }

  return {
    success: true,
    data: data.data || data,
    message: data.message,
  }
}

/**
 * Atualiza o token de acesso usando refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await request<{ token: string; refreshToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    )

    if (response.success && response.data) {
      setTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      })
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Gera URL de autorização Google OAuth
 */
export function getGoogleAuthUrl(): string {
  const redirectUri = encodeURIComponent(
    `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`
  )
  const scopes = encodeURIComponent("openid profile email")

  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=${scopes}&` +
    `access_type=offline&` +
    `prompt=consent`
}

/**
 * Autentica com Google OAuth usando código de autorização
 */
export async function authenticateWithGoogle(code: string): Promise<ApiResponse<AuthTokens>> {
  // Obter redirect URI usado na requisição inicial
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "http://localhost:3000/auth/callback"

  return request<AuthTokens>("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      code,
      redirectUri, // Enviar redirect URI usado pelo frontend
    }),
  })
}

/**
 * Obtém informações do usuário autenticado
 */
export async function getMe(): Promise<ApiResponse<AuthTokens["user"]>> {
  return request<AuthTokens["user"]>("/auth/me")
}

/**
 * Faz logout
 */
export async function logout(): Promise<ApiResponse<void>> {
  const result = await request<void>("/auth/logout", {
    method: "POST",
  })
  clearTokens()
  return result
}

/**
 * Cliente API exportado para uso em outros módulos
 */
export const api = {
  request,
  authenticateWithGoogle,
  getMe,
  logout,
  getGoogleAuthUrl,
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
}

