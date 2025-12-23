"use client"

import { request, type ApiResponse } from "./api"

export interface Invite {
  id: string
  email: string
  accountId?: string
  groupId?: string
  role: "owner" | "admin" | "member"
  invitedBy: string
  status: "pending" | "accepted" | "expired" | "cancelled"
  expiresAt: string
  acceptedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateInviteData {
  email: string
  accountId?: string
  groupId?: string
  role: "owner" | "admin" | "member"
  expiresIn?: number // Days until expiration
}

/**
 * Cria um convite para uma organização ou grupo
 */
export async function createInvite(data: CreateInviteData): Promise<ApiResponse<Invite>> {
  return request<Invite>("/invites", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Obtém convites pendentes por email
 */
export async function getPendingInvitesByEmail(email: string): Promise<ApiResponse<Invite[]>> {
  return request<Invite[]>(`/invites/pending?email=${encodeURIComponent(email)}`)
}

/**
 * Aceita um convite
 */
export async function acceptInvite(inviteId: string): Promise<ApiResponse<void>> {
  return request<void>(`/invites/${inviteId}/accept`, {
    method: "POST",
  })
}

/**
 * Rejeita um convite
 */
export async function rejectInvite(inviteId: string): Promise<ApiResponse<void>> {
  return request<void>(`/invites/${inviteId}/reject`, {
    method: "POST",
  })
}

/**
 * Obtém convites pendentes do usuário logado
 */
export async function getMyPendingInvites(): Promise<ApiResponse<Invite[]>> {
  return request<Invite[]>("/invites/my-pending")
}

