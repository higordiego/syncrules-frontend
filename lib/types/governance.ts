/**
 * Core Domain Types for Context Governance Platform
 */

export type FolderStatus = "read-only" | "editable"
export type IDEType = "vscode" | "cursor" | "jetbrains" | "neovim" | "other"

/**
 * Permission System
 */
export type PermissionType = "read" | "write" | "admin" | "none"
export type PermissionTargetType = "user" | "group"

export interface Permission {
  id: string
  targetType: PermissionTargetType
  targetId: string // User ID or Group ID
  targetName: string // User name or Group name
  permissionType: PermissionType
  grantedBy: string // User ID who granted this permission
  grantedAt: string
  inheritedFrom?: string // Project ID or Folder ID if inherited
}

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  isInvite?: boolean // Se true, é um convite pendente, não um usuário real
  inviteId?: string // ID do convite se isInvite for true
  canInvite?: boolean // Se true, pode criar um convite para este email
}

export interface Group {
  id: string
  accountId: string
  name: string
  description?: string
  members: User[] // Lista de membros do grupo
  memberCount?: number // Computed: members.length (mantido para compatibilidade)
  createdBy?: string // ID do usuário que criou o grupo
  createdAt: string
  updatedAt: string
}

/**
 * Account (Organization/Tenant)
 */
export interface Account {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  // Base folders and rules defined at account level
  baseFolders: Folder[]
  baseRules: Rule[]
}

/**
 * Project (belongs to an Account)
 */
export interface Project {
  id: string
  accountId: string
  name: string
  slug: string
  description?: string
  permissions: Permission[] // Permissions for this project
  createdAt: string
  updatedAt: string
  // Project-specific folders and rules
  folders: Folder[]
  rules: Rule[]
}

/**
 * Folder (collection of rules)
 */
export interface Folder {
  id: string
  accountId?: string // If defined at account level
  projectId?: string // If defined at project level
  parentFolderId?: string // Parent folder ID for hierarchical structure
  name: string
  path: string
  folderStatus: FolderStatus
  permissions: Permission[] // Permissions for this folder
  inheritPermissions: boolean // Whether to inherit permissions from project/account
  ruleCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Rule (Markdown file used as AI context)
 */
export interface Rule {
  id: string
  folderId?: string // Optional if root level
  accountId?: string
  projectId?: string
  name: string
  content: string
  path: string
  folderStatus: FolderStatus
  usageCount: number
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Metrics Data
 */
export interface MCPSession {
  id: string
  projectId: string
  ruleId?: string
  folderId?: string
  ideType: IDEType
  action: "bootstrap" | "query" | "assign" | "sync"
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface UsageMetrics {
  projectId: string
  period: {
    start: string
    end: string
  }
  totalBootstrapCalls: number
  usageByProject: Record<string, number>
  usageByRule: Record<string, number>
  usageByIDE: Record<IDEType, number>
  adoptionOverTime: {
    date: string
    calls: number
    uniqueProjects: number
    uniqueRules: number
  }[]
}

export interface ProjectMetrics {
  projectId: string
  totalCalls: number
  callsByRule: Array<{
    ruleId: string
    ruleName: string
    count: number
  }>
  callsByIDE: Array<{
    ideType: IDEType
    count: number
  }>
  adoptionTrend: Array<{
    date: string
    calls: number
  }>
}

export interface AccountMetrics {
  accountId: string
  totalCalls: number
  callsByProject: Array<{
    projectId: string
    projectName: string
    count: number
  }>
  callsByRule: Array<{
    ruleId: string
    ruleName: string
    count: number
  }>
  callsByIDE: Array<{
    ideType: IDEType
    count: number
  }>
  adoptionTrend: Array<{
    date: string
    calls: number
    projects: number
  }>
}

/**
 * Audit Log Entry
 */
export interface AuditLog {
  id: string
  accountId: string
  projectId?: string
  userId: string
  action:
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "rule.created"
  | "rule.updated"
  | "rule.deleted"
  | "permission.granted"
  | "permission.revoked"
  | "mcp_key.created"
  | "mcp_key.updated"
  | "mcp_key.deleted"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "group.created"
  | "group.updated"
  | "group.deleted"
  resourceType: "project" | "folder" | "rule" | "permission" | "mcp_key" | "user" | "group"
  resourceId: string
  changes?: Record<string, { from: unknown; to: unknown }>
  timestamp: string
  metadata?: Record<string, unknown>
}

