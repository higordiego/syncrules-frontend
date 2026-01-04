"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, Plus, FolderKanban } from "lucide-react"
import { mockProjects } from "@/lib/mock-data/governance"
import { getUserProjects } from "./project-requirement-check"
import { useAccount } from "@/context/AccountContext"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import type { Project } from "@/lib/types/governance"

const PROJECT_STORAGE_KEY = "syncrules_current_project"
const DEFAULT_PROJECT_STORAGE_KEY = "syncrules_default_project"

export function getCurrentProjectId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PROJECT_STORAGE_KEY)
}

export function setCurrentProjectId(projectId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(PROJECT_STORAGE_KEY, projectId)
}

export function getDefaultProjectId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEFAULT_PROJECT_STORAGE_KEY)
}

export function setDefaultProjectId(projectId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(DEFAULT_PROJECT_STORAGE_KEY, projectId)
}

interface ProjectSelectorProps {
  projects?: Project[]
  onProjectChange?: (projectId: string) => void
}

export function ProjectSelector({ projects, onProjectChange }: ProjectSelectorProps) {
  // Filtrar projetos pela organização selecionada via context
  const { selectedAccountId: currentAccountId } = useAccount()
  const allUserProjects = getUserProjects() || mockProjects
  const accountProjects = currentAccountId
    ? allUserProjects.filter((p) => p.accountId === currentAccountId)
    : allUserProjects

  // Usar projetos fornecidos ou filtrados por account
  const userProjects = projects || accountProjects
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null)

  // Extrair projectId da URL se estiver em uma página de projeto
  const extractProjectIdFromPath = (path: string): string | null => {
    const match = path.match(/\/projects\/([^\/]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    // Prioridade: URL > localStorage > default > primeiro projeto
    // IMPORTANTE: Sempre validar se o projeto pertence à organização atual
    const urlProjectId = extractProjectIdFromPath(pathname)
    const stored = getCurrentProjectId()
    const defaultProject = getDefaultProjectId()

    // Função para validar se projeto pertence à organização atual
    const isValidProject = (projId: string | null): boolean => {
      if (!projId) return false
      return userProjects.some((p) => p.id === projId)
    }

    let initialProjectId: string | null = null

    if (urlProjectId && isValidProject(urlProjectId)) {
      // Se há projeto na URL e ele pertence à org atual, usar ele
      initialProjectId = urlProjectId
      setCurrentProjectId(urlProjectId)
    } else if (stored && isValidProject(stored)) {
      // Se não há na URL mas há no localStorage e é válido, usar localStorage
      initialProjectId = stored
    } else if (defaultProject && isValidProject(defaultProject)) {
      // Se não há no localStorage mas há padrão e é válido, usar padrão
      initialProjectId = defaultProject
      setCurrentProjectId(defaultProject)
    } else if (userProjects.length > 0) {
      // Por último, usar o primeiro projeto disponível da organização atual
      initialProjectId = userProjects[0].id
      setCurrentProjectId(userProjects[0].id)
    } else {
      // Se não há projetos na organização atual, limpar seleção
      setCurrentProjectIdState(null)
      return
    }

    if (initialProjectId) {
      setCurrentProjectIdState(initialProjectId)
    }
  }, [pathname, userProjects, currentAccountId])

  const currentProject = userProjects.find((p: Project) => p.id === currentProjectId) || userProjects[0]

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId)
    setCurrentProjectIdState(projectId)
    setOpen(false)

    if (onProjectChange) {
      onProjectChange(projectId)
    }

    // Navegar para a página do projeto se não estiver lá
    const currentPath = window.location.pathname
    if (!currentPath.includes(`/projects/${projectId}`)) {
      router.push(`/account/projects/${projectId}`)
    }

    toast({
      title: "Project switched",
      description: `Switched to ${userProjects.find((p: Project) => p.id === projectId)?.name || "project"}`,
    })
  }

  const handleSetAsDefault = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDefaultProjectId(projectId)
    setCurrentProjectId(projectId)
    setCurrentProjectIdState(projectId)

    toast({
      title: "Default project set",
      description: `${userProjects.find((p: Project) => p.id === projectId)?.name || "Project"} is now your default project`,
    })
  }

  if (!currentProject) {
    return (
      <Button variant="outline" asChild>
        <Link href="/account">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Link>
      </Button>
    )
  }

  const isDefault = getDefaultProjectId() === currentProject.id

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] sm:w-[280px] justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{currentProject.name}</span>
            {isDefault && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Default
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup heading="Projects">
              {userProjects.map((project: Project) => {
                const isSelected = project.id === currentProjectId
                const isProjectDefault = getDefaultProjectId() === project.id

                return (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelectProject(project.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={`h-4 w-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"
                          }`}
                      />
                      <span className="truncate">{project.name}</span>
                      {isProjectDefault && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Default
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 shrink-0"
                      onClick={(e) => handleSetAsDefault(project.id, e)}
                      title="Set as default project"
                    >
                      <span className="text-xs">Set default</span>
                    </Button>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push("/account")
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create new project</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push("/account")
                }}
                className="cursor-pointer"
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                <span>Manage all projects</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

