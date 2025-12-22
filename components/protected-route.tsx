"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, getUserSync, type User } from "@/lib/auth"
import { isAuthenticated } from "@/lib/api"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      // Verifica se há token primeiro (mais rápido)
      if (!isAuthenticated()) {
        router.push("/login")
        return
      }

      // Tenta obter usuário do localStorage primeiro
      const cachedUser = getUserSync()
      if (cachedUser) {
        setUser(cachedUser)
        setLoading(false)
        return
      }

      // Se não há no cache, busca do backend
      try {
        const currentUser = await getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
