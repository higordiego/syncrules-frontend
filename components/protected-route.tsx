"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, getUserSync, type User } from "@/lib/auth"
import { isAuthenticated } from "@/lib/api"
import { ProjectRequirementCheck } from "./projects/project-requirement-check"
import { useAccount } from "@/context/AccountContext"
import { Building2, ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { AccountSelector } from "./accounts/account-selector"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const { selectedAccountId, isLoading: isAccountLoading } = useAccount()

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

  if (loading || isAccountLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Verifying organization context...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // ENFORCEMENT: Check for account_id
  if (!selectedAccountId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-white overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="mb-8 relative">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
              <ArrowRight className="h-5 w-5 text-blue-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Organization Required
          </h1>
          <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
            Welcome back! To access your dashboard and manage AI rules, please select or create an organization context.
          </p>

          <div className="w-full max-w-xs space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <AccountSelector />
            </div>
            <p className="text-xs text-slate-500">
              All API calls are strictly scoped to the selected organization.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Verificar se usuário tem projetos (regra obrigatória)
  return <ProjectRequirementCheck>{children}</ProjectRequirementCheck>
}
