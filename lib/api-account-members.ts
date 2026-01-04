"use client"

import { request, type ApiResponse } from "./api"

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

export interface AddMemberData {
  userId: string
  role?: "owner" | "admin" | "member"
}

export interface UpdateMemberRoleData {
  role: "owner" | "admin" | "member"
}

/**
 * Lista todos os membros da organização atual
 * Se accountId for fornecido, usa /accounts/{id}/members
 * Caso contrário, usa /members que obtém o account ID do X-Account-Id header
 */
export async function listAccountMembers(accountId?: string): Promise<ApiResponse<AccountMember[]>> {
  // Se accountId for fornecido, usar na URL
  if (accountId) {
    return request<AccountMember[]>(`/accounts/${accountId}/members`)
  }
  // Caso contrário, usar endpoint que obtém do contexto (X-Account-Id header)
  return request<AccountMember[]>("/members")
}

/**
 * Adiciona um membro à organização atual
 */
export async function addAccountMember(
  data: AddMemberData
): Promise<ApiResponse<void>> {
  return request<void>("/members", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Remove um membro da organização atual
 */
export async function removeAccountMember(
  userId: string
): Promise<ApiResponse<void>> {
  return request<void>(`/members/${userId}`, {
    method: "DELETE",
  })
}

/**
 * Atualiza o role de um membro na organização atual
 */
export async function updateAccountMemberRole(
  userId: string,
  data: UpdateMemberRoleData
): Promise<ApiResponse<void>> {
  return request<void>(`/members/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Busca membros da organização atual por email (busca parcial)
 */
export async function searchAccountMembers(
  emailQuery: string
): Promise<ApiResponse<AccountMember[]>> {
  return request<AccountMember[]>(`/members/search?email=${encodeURIComponent(emailQuery)}`)
}

