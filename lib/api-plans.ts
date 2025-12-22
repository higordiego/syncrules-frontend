"use client"

import { request, type ApiResponse } from "./api"

export interface Plan {
  id: string
  name: string
  price: number
  limits: {
    filesLimit: number
    requestsLimit: number
    storageLimit: number // in bytes
  }
}

/**
 * Lista todos os planos disponíveis
 */
export async function listPlans(): Promise<ApiResponse<Plan[]>> {
  return request<Plan[]>("/plans")
}

/**
 * Obtém detalhes de um plano específico
 */
export async function getPlan(id: string): Promise<ApiResponse<Plan>> {
  return request<Plan>(`/plans/${id}`)
}

/**
 * Inscreve-se em um plano
 */
export async function subscribeToPlan(planId: string): Promise<ApiResponse<{ subscriptionId: string }>> {
  return request<{ subscriptionId: string }>(`/plans/${planId}/subscribe`, {
    method: "POST",
  })
}

