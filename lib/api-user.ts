"use client"

import { request, type ApiResponse } from "./api"

export interface User {
  id: string
  email: string
  name: string
  picture: string
  plan: "freemium" | "pro" | "enterprise"
  createdAt: string
  updatedAt: string
}

/**
 * Obtém um usuário específico
 */
export async function getUser(id: string): Promise<ApiResponse<User>> {
  return request<User>(`/users/${id}`)
}

/**
 * Atualiza um usuário
 */
export async function updateUser(id: string, data: { name?: string }): Promise<ApiResponse<User>> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta um usuário (conta)
 */
export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/users/${id}`, {
    method: "DELETE",
  })
}

