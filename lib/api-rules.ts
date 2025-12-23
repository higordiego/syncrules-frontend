"use client"

import { request, type ApiResponse } from "./api"
import type { Rule } from "./types/governance"

export interface CreateRuleData {
  folderId?: string
  accountId?: string
  projectId?: string
  name: string
  content: string
  path: string
}

export interface UpdateRuleData {
  name?: string
  content?: string
  path?: string
}

/**
 * Lista todas as regras de uma pasta
 */
export async function listRulesByFolder(folderId: string): Promise<ApiResponse<Rule[]>> {
  return request<Rule[]>(`/rules?folderId=${folderId}`)
}

/**
 * Lista todas as regras de um projeto
 */
export async function listRulesByProject(projectId: string): Promise<ApiResponse<Rule[]>> {
  return request<Rule[]>(`/rules?projectId=${projectId}`)
}

/**
 * Lista todas as regras de uma organização
 */
export async function listRulesByAccount(accountId: string): Promise<ApiResponse<Rule[]>> {
  return request<Rule[]>(`/rules?accountId=${accountId}`)
}

/**
 * Obtém uma regra específica
 */
export async function getRule(id: string): Promise<ApiResponse<Rule>> {
  return request<Rule>(`/rules/${id}`)
}

/**
 * Cria uma nova regra
 */
export async function createRule(data: CreateRuleData): Promise<ApiResponse<Rule>> {
  return request<Rule>("/rules", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Atualiza uma regra
 */
export async function updateRule(id: string, data: UpdateRuleData): Promise<ApiResponse<Rule>> {
  return request<Rule>(`/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Deleta uma regra
 */
export async function deleteRule(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/rules/${id}`, {
    method: "DELETE",
  })
}

/**
 * Upload de arquivos de regras
 */
export async function uploadRules(folderId: string, files: File[]): Promise<ApiResponse<Rule[]>> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })
  formData.append("folderId", folderId)

  return request<Rule[]>("/rules/upload", {
    method: "POST",
    body: formData,
    headers: {}, // Remove Content-Type header to let browser set it with boundary
  })
}


/**
 * Move uma regra para outra pasta
 */
export async function moveRule(
  ruleId: string,
  newFolderId: string | null
): Promise<ApiResponse<void>> {
  return request<void>(`/rules/${ruleId}/move`, {
    method: "POST",
    body: JSON.stringify({
      folderId: newFolderId,
    }),
  })
}
