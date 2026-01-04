# Arquitetura Moderna - Next.js App Router

## Princípios Fundamentais

1. **Separação de Responsabilidades**: Cada arquivo tem uma única responsabilidade clara
2. **Feature-Based**: Organização por features, não por tipo de arquivo
3. **Server Components First**: Usar Server Components por padrão, Client Components apenas quando necessário
4. **Composição**: Componentes pequenos e reutilizáveis
5. **Isolamento de Lógica**: Lógica de negócio separada de UI

## Estrutura de Pastas

```
/app                          # Next.js App Router
  /(dashboard)                # Route groups
    /projects
      /[id]
        page.tsx              # ~50-100 linhas (orquestração)
        loading.tsx
        error.tsx
  /api                        # API routes (se necessário)

/features                     # Feature-based organization
  /projects
    /components              # Feature-specific components
      project-header.tsx     # ~100-150 linhas
      project-tabs.tsx       # ~80-120 linhas
      project-settings-form.tsx
    /hooks                    # Feature-specific hooks
      use-project.ts         # ~80-100 linhas
      use-project-mutations.ts
    /services                 # Business logic & API
      project-service.ts     # ~100-120 linhas
      project-transforms.ts
    /types.ts                 # Feature types
    index.ts                  # Public API exports

/components
  /ui                         # Design system (shadcn/ui)
  /layout                     # Layout components
    header.tsx
    sidebar.tsx
    dashboard-layout.tsx

/hooks                        # Shared hooks
  use-client-navigation.ts
  use-modal.ts
  use-confirm.ts

/services                     # Shared services
  http-client.ts
  auth-service.ts
  api-client.ts

/lib
  /constants
  /utils
  /env
  /types                      # Shared types

/context                      # React Context providers
```

## Responsabilidades por Camada

### 1. Pages (`app/**/page.tsx`)
**Responsabilidade**: Apenas orquestração
- Máximo: 100 linhas
- Não contém lógica de negócio
- Não contém chamadas de API diretas
- Apenas compõe componentes e passa props

**Exemplo**:
```tsx
// app/(dashboard)/projects/[id]/page.tsx
import { ProjectView } from "@/features/projects"

export default async function ProjectPage({ params }) {
  return <ProjectView projectId={params.id} />
}
```

### 2. Feature Components
**Responsabilidade**: UI específica da feature
- Máximo: 150 linhas
- Componentes apresentacionais quando possível
- Lógica mínima (apenas UI state)
- Usa hooks para side effects

**Exemplo**:
```tsx
// features/projects/components/project-header.tsx
"use client"

import { useProject } from "../hooks/use-project"

export function ProjectHeader({ projectId }) {
  const { project, isLoading } = useProject(projectId)
  
  if (isLoading) return <Skeleton />
  
  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
    </div>
  )
}
```

### 3. Hooks
**Responsabilidade**: Encapsular comportamento e side effects
- Máximo: 100 linhas
- Gerenciam estado e efeitos colaterais
- Chamam services, não APIs diretamente
- Retornam dados e funções para componentes

**Exemplo**:
```tsx
// features/projects/hooks/use-project.ts
"use client"

import { useState, useEffect } from "react"
import { projectService } from "../services/project-service"

export function useProject(projectId: string) {
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    projectService.getById(projectId)
      .then(setProject)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [projectId])

  return { project, isLoading, error }
}
```

### 4. Services
**Responsabilidade**: Lógica de negócio e comunicação com API
- Máximo: 120 linhas
- Transformações de dados
- Validações
- Chamadas de API
- Sem dependência de React

**Exemplo**:
```tsx
// features/projects/services/project-service.ts
import { apiClient } from "@/services/api-client"
import type { Project, CreateProjectDto } from "../types"

export const projectService = {
  async getById(id: string): Promise<Project> {
    const data = await apiClient.get(`/projects/${id}`)
    return transformProject(data)
  },

  async create(dto: CreateProjectDto): Promise<Project> {
    validateProjectDto(dto)
    const data = await apiClient.post("/projects", dto)
    return transformProject(data)
  },
}

function transformProject(data: any): Project {
  return {
    id: data.id,
    name: data.name,
    // ... transformations
  }
}
```

## Regras de Arquitetura

### ✅ DO

1. **Páginas pequenas**: Apenas orquestração
2. **Componentes compostos**: Quebrar em componentes menores
3. **Hooks para lógica**: Encapsular comportamento
4. **Services para API**: Isolar chamadas de API
5. **Server Components**: Usar por padrão
6. **Client Components**: Apenas quando necessário (interatividade)

### ❌ DON'T

1. **Lógica em páginas**: Páginas não devem ter lógica de negócio
2. **API calls em componentes**: Usar services
3. **Arquivos grandes**: Se > 150 linhas, quebrar
4. **Prop drilling**: Usar Context ou hooks
5. **Duplicação**: Extrair lógica compartilhada
6. **God components**: Um componente fazendo tudo

## Fluxo de Dados

```
Page (Server Component)
  ↓
Feature Component (Server/Client)
  ↓
Hook (Client Component)
  ↓
Service (Pure JS/TS)
  ↓
API Client
  ↓
Backend API
```

## Exemplo Completo: Feature Projects

### Estrutura
```
/features/projects
  /components
    project-header.tsx          # 120 linhas
    project-tabs.tsx            # 100 linhas
    project-settings-form.tsx   # 150 linhas
    project-permissions-tab.tsx # 130 linhas
  /hooks
    use-project.ts              # 80 linhas
    use-project-mutations.ts     # 90 linhas
    use-project-permissions.ts  # 100 linhas
  /services
    project-service.ts           # 110 linhas
    project-permission-service.ts # 100 linhas
  /types.ts                     # 50 linhas
  index.ts                      # Exports públicos
```

### Page (Orquestração)
```tsx
// app/(dashboard)/projects/[id]/page.tsx
import { ProjectView } from "@/features/projects"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectView projectId={params.id} />
}
```

### Feature Component Principal
```tsx
// features/projects/components/project-view.tsx
"use client"

import { ProjectHeader } from "./project-header"
import { ProjectTabs } from "./project-tabs"
import { useProject } from "../hooks/use-project"

export function ProjectView({ projectId }: { projectId: string }) {
  const { project, isLoading } = useProject(projectId)

  if (isLoading) return <div>Loading...</div>
  if (!project) return <div>Not found</div>

  return (
    <div>
      <ProjectHeader project={project} />
      <ProjectTabs projectId={projectId} />
    </div>
  )
}
```

## Validação

### Checklist de Arquitetura

- [ ] Nenhum arquivo > 150 linhas (componentes)
- [ ] Nenhum arquivo > 100 linhas (hooks)
- [ ] Nenhum arquivo > 120 linhas (services)
- [ ] Páginas apenas orquestram
- [ ] Lógica de negócio em services
- [ ] Side effects em hooks
- [ ] Componentes são apresentacionais
- [ ] Sem duplicação de código
- [ ] Separação clara de responsabilidades

## Benefícios

1. **Manutenibilidade**: Arquivos pequenos são fáceis de entender
2. **Testabilidade**: Lógica isolada é fácil de testar
3. **Reusabilidade**: Componentes e hooks reutilizáveis
4. **Escalabilidade**: Fácil adicionar novas features
5. **Colaboração**: Múltiplos devs podem trabalhar sem conflitos

