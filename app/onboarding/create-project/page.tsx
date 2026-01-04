"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FolderKanban, Sparkles, ArrowRight } from "lucide-react"
import { useAccount } from "@/context/AccountContext"
import { useAccountActions } from "@/lib/actions/account-actions"
import { setCurrentProjectId, setDefaultProjectId } from "@/components/projects/project-selector"
import { addUserProject } from "@/components/projects/project-requirement-check"
import { listAccounts } from "@/lib/api-accounts"
import type { Project } from "@/lib/types/governance"

export default function CreateProjectOnboardingPage() {
  const router = useRouter()
  const { createProject } = useAccountActions()
  const { selectedAccountId: accountId, isLoading: isLoadingAccount } = useAccount()
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  // As organizações já são carregadas pelo AccountContext
  useEffect(() => {
    if (!isLoadingAccount && !accountId) {
      router.push("/onboarding/select-account")
    }
  }, [isLoadingAccount, accountId, router])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !accountId) return

    setIsCreating(true)
    try {
      await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        onSuccess: async (projectId: string) => {
          // Buscar projeto criado da API para obter dados completos
          // Por enquanto, criar objeto básico
          const newProject: Project = {
            id: projectId,
            accountId,
            name: projectName.trim(),
            description: projectDescription.trim() || undefined,
            permissions: [],
            inheritPermissions: false,
            folders: [],
            rules: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            slug: projectName.trim().toLowerCase().replace(/\s+/g, "-"),
          }

          // Adicionar projeto à lista de projetos do usuário
          addUserProject(newProject)

          // Definir como projeto atual e padrão
          setCurrentProjectId(projectId)
          setDefaultProjectId(projectId)

          // Aguardar um pouco para garantir que tudo foi salvo
          await new Promise((resolve) => setTimeout(resolve, 300))

          // Redirecionar para o projeto criado
          router.push(`/account/projects/${projectId}`)
        },
      })
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="w-full max-w-2xl">
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FolderKanban className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">Welcome to Sync Rules!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Create your first project to get started
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-sm font-semibold">
                    Project Name *
                  </Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Frontend Team, API Documentation, Design System"
                    className="h-11 text-base"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a descriptive name for your project
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description" className="text-sm font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="project-description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe the purpose and scope of this project..."
                    rows={4}
                    className="text-base resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Add context about what this project is for
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Required:</strong> You must create at least one project to continue. This is a one-time setup.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || isLoadingAccount || !projectName.trim() || !accountId}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      Create Project
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

