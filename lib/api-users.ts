"use client"

import { request, type ApiResponse } from "./api"

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  plan: string
  createdAt: string
  updatedAt: string
}

/**
 * Busca um usuário por email
 */
export async function searchUserByEmail(email: string): Promise<ApiResponse<User>> {
  return request<User>(`/users/search?email=${encodeURIComponent(email)}`)
}

