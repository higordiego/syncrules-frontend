"use client"

import { request, type ApiResponse } from "./api"

export interface Group {
  id: string
  accountIds: string[] // Multiple accounts this group belongs to
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  userName?: string
  userEmail?: string
  userPicture?: string
  addedAt: string
}

export interface CreateGroupData {
  name: string
  description?: string
  accountIds?: string[] // Optional: multiple account IDs (defaults to accountId from URL)
}

export interface UpdateGroupData {
  name?: string
  description?: string
  accountIds?: string[] // Optional: update account associations
}

export interface AddGroupMemberData {
  userId: string
}

/**
 * Lista todos os grupos de uma organização
 */
export async function listGroups(accountId: string): Promise<ApiResponse<Group[]>> {
  return request<Group[]>(`/accounts/${accountId}/groups`)
}

/**
 * Lista todos os grupos existentes (não filtrados por organização)
 */
export async function listAllGroups(): Promise<ApiResponse<Group[]>> {
  return request<Group[]>("/groups")
}

/**
 * Obtém um grupo por ID
 */
export async function getGroup(groupId: string): Promise<ApiResponse<Group>> {
  return request<Group>(`/groups/${groupId}`)
}

/**
 * Cria um novo grupo
 */
export async function createGroup(accountId: string, data: CreateGroupData): Promise<ApiResponse<Group>> {
  return request<Group>(`/accounts/${accountId}/groups`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Atualiza um grupo
 */
export async function updateGroup(groupId: string, data: UpdateGroupData): Promise<ApiResponse<Group>> {
  return request<Group>(`/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta um grupo
 */
export async function deleteGroup(groupId: string): Promise<ApiResponse<void>> {
  return request<void>(`/groups/${groupId}`, {
    method: "DELETE",
  })
}

/**
 * Lista membros de um grupo
 */
export async function listGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
  return request<GroupMember[]>(`/groups/${groupId}/members`)
}

/**
 * Adiciona um membro ao grupo
 */
export async function addGroupMember(groupId: string, data: AddGroupMemberData): Promise<ApiResponse<void>> {
  return request<void>(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Remove um membro do grupo
 */
export async function removeGroupMember(groupId: string, userId: string): Promise<ApiResponse<void>> {
  return request<void>(`/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  })
}

/**
 * Associa um grupo existente a uma organização
 */
export async function addGroupToAccount(accountId: string, groupId: string): Promise<ApiResponse<void>> {
  return request<void>(`/accounts/${accountId}/groups/associate`, {
    method: "POST",
    body: JSON.stringify({ groupId }),
  })
}

/**
 * Remove a associação de um grupo com uma organização (desassocia o grupo da organização)
 */
export async function removeGroupFromAccount(accountId: string, groupId: string): Promise<ApiResponse<void>> {
  return request<void>(`/accounts/${accountId}/groups/${groupId}`, {
    method: "DELETE",
  })
}

