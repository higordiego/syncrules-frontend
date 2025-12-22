"use client"

import { request, type ApiResponse } from "./api"

export interface Activity {
  id: string
  userId: string
  type: string
  description: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ActivityStats {
  total: number
  byType: Record<string, number>
  recent: Activity[]
}

/**
 * Lista atividades do usuário
 */
export async function listActivities(params?: {
  page?: number
  limit?: number
  type?: string
}): Promise<ApiResponse<{ data: Activity[]; pagination: any }>> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.set("page", params.page.toString())
  if (params?.limit) queryParams.set("limit", params.limit.toString())
  if (params?.type) queryParams.set("type", params.type)

  return request<{ data: Activity[]; pagination: any }>(`/activities?${queryParams.toString()}`)
}

/**
 * Obtém estatísticas de atividades
 */
export async function getActivityStats(): Promise<ApiResponse<ActivityStats>> {
  return request<ActivityStats>("/activities/stats")
}

/**
 * Obtém histórico de atividades
 */
export async function getActivityHistory(params?: {
  days?: number
  type?: string
}): Promise<ApiResponse<Activity[]>> {
  const queryParams = new URLSearchParams()
  if (params?.days) queryParams.set("days", params.days.toString())
  if (params?.type) queryParams.set("type", params.type)

  return request<Activity[]>(`/activities/history?${queryParams.toString()}`)
}

