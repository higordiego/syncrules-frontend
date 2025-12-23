"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { listProjects } from "@/lib/api-projects"
import { mockProjects } from "@/lib/mock-data/governance"
import { getCurrentAccountId } from "@/components/accounts/account-selector"
import type { Project } from "@/lib/types/governance"

const ONBOARDING_PATH = "/onboarding/create-project"
const ALLOWED_PATHS_WITHOUT_PROJECT = [
  "/onboarding/create-project",
  "/onboarding/select-account",
  "/login",
  "/auth/callback",
]

// Storage key para projetos criados pelo usuário
const USER_PROJECTS_STORAGE_KEY = "syncrules_user_projects"

/**
 * Obtém projetos do usuário (mock + localStorage)
 */
export function getUserProjects(): Project[] {
  if (typeof window === "undefined") return []
  
  // Verificar se há projetos salvos no localStorage
  const stored = localStorage.getItem(USER_PROJECTS_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  
  // Por padrão, retornar mockProjects (em produção viria da API)
  return mockProjects
}

/**
 * Salva projetos no localStorage
 */
function saveUserProjects(projects: Project[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_PROJECTS_STORAGE_KEY, JSON.stringify(projects))
}

/**
 * Adiciona um projeto à lista
 */
export function addUserProject(project: Project) {
  const projects = getUserProjects()
  projects.push(project)
  saveUserProjects(projects)
}

/**
 * Componente que verifica projetos (sem forçar criação)
 * Permite navegação mesmo sem projetos - criação é opcional
 */
export function ProjectRequirementCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkProjects() {
      // Permitir acesso a todas as rotas - não forçar criação de projeto
      if (ALLOWED_PATHS_WITHOUT_PROJECT.includes(pathname || "")) {
        setIsChecking(false)
        return
      }

      // Tentar buscar projetos da API para atualizar localStorage (opcional)
      const currentAccountId = getCurrentAccountId()
      if (currentAccountId) {
        try {
          const response = await listProjects(currentAccountId)
          if (response.success && response.data && Array.isArray(response.data)) {
            // Salvar projetos da API no localStorage
            if (response.data.length > 0) {
              saveUserProjects(response.data)
            }
          }
        } catch (apiError) {
          // Se API falhar, continuar normalmente
          console.warn("API call failed, continuing without projects:", apiError)
        }
      }
      
      setIsChecking(false)
    }

    checkProjects()
  }, [pathname, router])

  // Mostrar loading enquanto verifica (opcional)
  if (isChecking) {
    return <>{children}</> // Renderizar children imediatamente, sem bloqueio
  }

  return <>{children}</>
}

