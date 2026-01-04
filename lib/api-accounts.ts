"use client"

import { request, type ApiResponse } from "./api"

export interface Account {
  id: string
  name: string
  slug: string
  createdBy: string
  plan: "freemium" | "pro" | "enterprise"
  createdAt: string
  updatedAt: string
}

export interface CreateAccountData {
  name: string
}

/**
 * Lista todas as organizações do usuário
 */
export async function listAccounts(): Promise<ApiResponse<Account[]>> {
  return request<Account[]>("/accounts")
}

/**
 * Obtém uma organização específica
 */
export async function getAccount(id: string): Promise<ApiResponse<Account>> {
  return request<Account>(`/accounts/${id}`)
}

/**
 * Cria uma nova organização
 */
export async function createAccount(data: CreateAccountData): Promise<ApiResponse<Account>> {
  return request<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export interface UpdateAccountData {
  name?: string
  plan?: "freemium" | "pro" | "enterprise"
}

/**
 * Atualiza uma organização
 */
export async function updateAccount(
  id: string,
  data: UpdateAccountData
): Promise<ApiResponse<Account>> {
  return request<Account>(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta uma organização
 */
export async function deleteAccount(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/accounts/${id}`, {
    method: "DELETE",
  })
}

import { User } from "./api-users"

export interface AccountMember {
  id: string
  accountId: string
  userId: string
  role: "owner" | "admin" | "member"
  createdAt: string
  userName?: string
  userEmail?: string
  userPicture?: string
}

/**
 * Lista membros de uma organização
 */
export async function getAccountMembers(accountId: string): Promise<ApiResponse<AccountMember[]>> {
  return request<AccountMember[]>(`/accounts/${accountId}/members`)
}

