/**
 * Account Actions with Business Rules
 * Centralized business logic for account operations
 */

import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createProject as createProjectAPI, type CreateProjectData } from "@/lib/api-projects"

interface CreateProjectParams {
  name: string
  description?: string
  onSuccess?: (projectId: string) => void
}

export function useAccountActions() {
  const { toast } = useToast()
  const router = useRouter()

  /**
   * Create Project
   * REGRAS DE NEGÓCIO:
   * - Validar nome único dentro da Account
   * - Validar limite de projetos do plano
   * - Criar projeto com configuração inicial
   * - Redirecionar para página do projeto
   */
  const createProject = async ({
    name,
    description,
    onSuccess,
  }: CreateProjectParams) => {
    try {
      // REGRA: Validar nome
      if (!name || name.trim().length === 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Project name is required",
        })
        return
      }

      // REGRA: Validar limite de projetos (em produção, verificar plano)
      // TODO: Verificar limite do plano

      // Criar projeto via API
      const response = await createProjectAPI({
        name: name.trim(),
        description: description?.trim(),
      })

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to create project")
      }

      const project = response.data

      toast({
        variant: "success",
        title: "Project Created",
        description: `Project "${name}" created successfully.`,
      })

      onSuccess?.(project.id)
      router.push(`/account/projects/${project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
      })
    }
  }

  return {
    createProject,
  }
}

