/**
 * API Client
 * 
 * Centralized HTTP client for all API calls.
 * Handles authentication, error handling, and response transformation.
 * 
 * Max: 120 lines
 */

import { getAccessToken } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    })
  }

  /**
   * Base request method
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    }

    // Add auth token if required
    if (requireAuth) {
      const token = getAccessToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    // Add account ID from context (if available)
    const accountId = typeof window !== "undefined" 
      ? sessionStorage.getItem("currentAccountId")
      : null
    if (accountId) {
      headers["X-Account-Id"] = accountId
    }

    const url = `${this.baseURL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const data = await response.json()
        return (data.data ?? data) as T
      }

      return {} as T
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Network error")
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

