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
 * Lista todos os membros de uma organização
 */
export async function listAccountMembers(accountId: string): Promise<ApiResponse<AccountMember[]>> {
  return request<AccountMember[]>(`/accounts/${accountId}/members`)
}

/**
 * Adiciona um membro à organização
 */
export async function addAccountMember(
  accountId: string,
  data: AddMemberData
): Promise<ApiResponse<void>> {
  return request<void>(`/accounts/${accountId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Remove um membro da organização
 */
export async function removeAccountMember(
  accountId: string,
  userId: string
): Promise<ApiResponse<void>> {
  return request<void>(`/accounts/${accountId}/members/${userId}`, {
    method: "DELETE",
  })
}

/**
 * Atualiza o role de um membro
 */
export async function updateAccountMemberRole(
  accountId: string,
  userId: string,
  data: UpdateMemberRoleData
): Promise<ApiResponse<void>> {
  return request<void>(`/accounts/${accountId}/members/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Busca membros da organização por email (busca parcial)
 */
export async function searchAccountMembers(
  accountId: string,
  emailQuery: string
): Promise<ApiResponse<AccountMember[]>> {
  return request<AccountMember[]>(`/accounts/${accountId}/members/search?email=${encodeURIComponent(emailQuery)}`)
}

