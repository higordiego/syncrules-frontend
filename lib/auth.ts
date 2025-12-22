"use client"

import { getMe, isAuthenticated, clearTokens } from "./api"

export interface User {
  id: string
  email: string
  name: string
  picture: string
  plan?: string
}

const USER_STORAGE_KEY = "syncrules_user"

/**
 * Obtém usuário do localStorage ou valida com backend
 */
export async function getUser(): Promise<User | null> {
  if (typeof window === "undefined") return null

  // Se não está autenticado, limpa usuário
  if (!isAuthenticated()) {
    clearUser()
    return null
  }

  // Tenta obter do localStorage primeiro
  const userStr = localStorage.getItem(USER_STORAGE_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      // Se JSON inválido, limpa
      clearUser()
    }
  }

  // Se não há usuário no localStorage, busca do backend
  try {
    const response = await getMe()
    if (response.success && response.data) {
      const user: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
        plan: response.data.plan,
      }
      setUser(user)
      return user
    }
  } catch {
    // Erro ao buscar do backend
  }

  return null
}

/**
 * Obtém usuário sincronamente (apenas do localStorage)
 * Use apenas quando necessário evitar async
 */
export function getUserSync(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem(USER_STORAGE_KEY)
  return userStr ? JSON.parse(userStr) : null
}

export function setUser(user: User) {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearUser() {
  if (typeof window === "undefined") return
  localStorage.removeItem(USER_STORAGE_KEY)
  clearTokens()
}

export function updateUserName(name: string) {
  const user = getUserSync()
  if (user) {
    user.name = name
    setUser(user)
  }
}

export function deleteAccount() {
  clearUser()
  if (typeof window === "undefined") return
  localStorage.removeItem("mcpKeys")
  localStorage.removeItem("documents")
  localStorage.removeItem("folders")
}

/**
 * @deprecated Use getGoogleAuthUrl() e redirecione para /auth/callback
 * Mantido apenas para compatibilidade durante migração
 */
export function simulateGoogleLogin(): User {
  const mockUser: User = {
    id: "1",
    email: "usuario@gmail.com",
    name: "Usuário Demo",
    picture: "/diverse-user-avatars.png",
  }
  setUser(mockUser)
  return mockUser
}
