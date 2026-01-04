# Arquitetura - Exemplos Práticos

## Exemplo 1: Página de Projeto (Refatorada)

### Antes (715 linhas) ❌
- Toda lógica na página
- Múltiplas responsabilidades
- Difícil de manter

### Depois (Arquitetura) ✅

#### 1. Page (Orquestração) - ~80 linhas
```tsx
// app/(dashboard)/account/projects/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { ProjectView } from "@/features/projects"
import { useProjectData } from "@/features/projects/hooks/use-project-data"
import { usePermissionActions } from "@/lib/actions/permission-actions"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  // Hooks encapsulam toda lógica
  const projectData = useProjectData(projectId)
  const { addPermission, updatePermission, removePermission } = usePermissionActions()

  return (
    <ProjectView
      projectId={projectId}
      foldersContent={<ProjectFoldersTab {...projectData} />}
      rulesContent={<ProjectRulesTab {...projectData} />}
      permissionsContent={
        <ProjectPermissionsTab
          {...projectData}
          onAddPermission={addPermission}
          onUpdatePermission={updatePermission}
          onRemovePermission={removePermission}
        />
      }
      settingsContent={<ProjectSettingsTab />}
    />
  )
}
```

**Responsabilidade**: Apenas orquestração - compõe componentes

#### 2. Feature Component (View) - ~150 linhas
```tsx
// features/projects/components/project-view.tsx
"use client"

import { ProjectHeader } from "./project-header"
import { ProjectTabs } from "./project-tabs"
import { useProject } from "../hooks/use-project"

export function ProjectView({ projectId, foldersContent, ... }) {
  const { project, isLoading } = useProject(projectId)
  
  return (
    <div>
      <ProjectHeader project={project} />
      <ProjectTabs tabs={tabs} />
    </div>
  )
}
```

**Responsabilidade**: Compor sub-componentes e gerenciar estado de UI

#### 3. Hook (Data Fetching) - ~100 linhas
```tsx
// features/projects/hooks/use-project.ts
"use client"

import { useState, useEffect } from "react"
import { projectService } from "../services/project-service"

export function useProject(projectId: string) {
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    projectService.getById(projectId)
      .then(setProject)
      .finally(() => setIsLoading(false))
  }, [projectId])

  return { project, isLoading }
}
```

**Responsabilidade**: Encapsular data fetching e estado

#### 4. Service (Business Logic) - ~120 linhas
```tsx
// features/projects/services/project-service.ts
import { apiClient } from "@/services/api-client"

export const projectService = {
  async getById(id: string): Promise<Project> {
    const data = await apiClient.get(`/projects/${id}`)
    return transformProject(data)
  },

  async create(dto: CreateProjectDto): Promise<Project> {
    validateCreateDto(dto)
    const data = await apiClient.post("/projects", dto)
    return transformProject(data)
  },
}

function transformProject(data: any): Project {
  return { id: data.id, name: data.name, ... }
}
```

**Responsabilidade**: Lógica de negócio e comunicação com API

## Exemplo 2: Componente de Tabs

### Componente Pequeno e Focado - ~120 linhas
```tsx
// features/projects/components/project-tabs.tsx
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectTabsProps {
  tabs: ProjectTab[]
  onTabChange?: (tabId: string) => void
}

export function ProjectTabs({ tabs, onTabChange }: ProjectTabsProps) {
  return (
    <Tabs onValueChange={onTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
```

**Responsabilidade**: Apenas renderização de tabs

## Exemplo 3: Hook para Múltiplos Dados

### Hook Focado - ~100 linhas
```tsx
// features/projects/hooks/use-project-data.ts
"use client"

import { useState, useCallback } from "react"
import { listFolders } from "@/lib/api-folders"
import { listRulesByProject } from "@/lib/api-rules"

export function useProjectData(projectId: string) {
  const [folders, setFolders] = useState([])
  const [rules, setRules] = useState([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)

  const fetchFolders = useCallback(async () => {
    setIsLoadingFolders(true)
    const response = await listFolders(projectId)
    setFolders(response.data || [])
    setIsLoadingFolders(false)
  }, [projectId])

  const fetchRules = useCallback(async () => {
    // Similar pattern
  }, [projectId])

  return {
    folders,
    rules,
    isLoadingFolders,
    refetchFolders: fetchFolders,
    refetchRules: fetchRules,
  }
}
```

**Responsabilidade**: Encapsular múltiplos data fetches relacionados

## Benefícios da Arquitetura

### 1. Manutenibilidade
- **Antes**: Arquivo de 715 linhas - difícil encontrar código
- **Depois**: Múltiplos arquivos pequenos - fácil navegar

### 2. Testabilidade
- **Antes**: Difícil testar lógica misturada com UI
- **Depois**: Services e hooks testáveis isoladamente

### 3. Reusabilidade
- **Antes**: Código duplicado entre páginas
- **Depois**: Componentes e hooks reutilizáveis

### 4. Escalabilidade
- **Antes**: Adicionar feature = modificar arquivo gigante
- **Depois**: Adicionar feature = criar nova pasta em features/

### 5. Colaboração
- **Antes**: Conflitos de merge frequentes
- **Depois**: Arquivos pequenos = menos conflitos

## Checklist de Validação

Para cada arquivo criado, verificar:

- [ ] **Tamanho**: Componente < 150 linhas, Hook < 100 linhas, Service < 120 linhas
- [ ] **Responsabilidade**: Uma única responsabilidade clara
- [ ] **Dependências**: Dependências apontam para dentro (UI → Hook → Service)
- [ ] **Testabilidade**: Lógica isolada e testável
- [ ] **Reusabilidade**: Componente/hook pode ser reutilizado

## Próximos Passos

1. Refatorar `organizations/page.tsx` (1693 linhas)
2. Refatorar `rules-manager.tsx` (1297 linhas)
3. Refatorar `folders/[id]/page.tsx` (1102 linhas)
4. Criar features para: groups, folders, permissions, mcp-keys
5. Migrar gradualmente mantendo funcionalidade

