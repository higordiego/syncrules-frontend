"use client"

import { request, type ApiResponse } from "./api"

export interface UsageStats {
  filesUsed: number
  filesLimit: number
  requestsUsed: number
  requestsLimit: number
  storageUsed: number // bytes
  storageLimit: number // bytes
}

export interface UsageHistory {
  date: string
  requests: number
  files: number
  storage: number
}

/**
 * Obtém estatísticas de uso (X-Account-Id header injetado automaticamente)
 */
export async function getUsageStats(): Promise<ApiResponse<UsageStats>> {
  return request<UsageStats>("/usage/stats")
}

/**
 * Obtém limites de uso
 */
export async function getUsageLimits(): Promise<ApiResponse<UsageStats>> {
  return request<UsageStats>("/usage/limits")
}

/**
 * Obtém histórico de uso
 */
export async function getUsageHistory(params?: {
  days?: number
}): Promise<ApiResponse<UsageHistory[]>> {
  const queryParams = new URLSearchParams()
  if (params?.days) queryParams.set("days", params.days.toString())

  return request<UsageHistory[]>(`/usage/history?${queryParams.toString()}`)
}
