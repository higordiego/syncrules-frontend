/**
 * Mock Data for Context Governance Platform
 * Used for frontend development and validation
 */

import type {
  Account,
  Project,
  Folder,
  Rule,
  InheritanceConfig,
  AccountMetrics,
  ProjectMetrics,
  AuditLog,
  IDEType,
  Permission,
  User,
  Group,
} from "../types/governance"

// Mock Users and Groups
export const mockUsers: User[] = [
  {
    id: "user-001",
    email: "john.doe@acme.com",
    name: "John Doe",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
  {
    id: "user-002",
    email: "jane.smith@acme.com",
    name: "Jane Smith",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
  },
  {
    id: "user-003",
    email: "bob.wilson@acme.com",
    name: "Bob Wilson",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
]

export const mockGroups: Group[] = [
  {
    id: "group-001",
    accountId: "acc-001",
    name: "Frontend Team",
    description: "Frontend developers",
    members: [mockUsers[0], mockUsers[1]], // John Doe e Jane Smith
    memberCount: 2,
    createdBy: "user-001",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:00:00Z",
  },
  {
    id: "group-002",
    accountId: "acc-001",
    name: "Backend Team",
    description: "Backend developers",
    members: [mockUsers[2]], // Bob Wilson
    memberCount: 1,
    createdBy: "user-001",
    createdAt: "2024-01-16T11:00:00Z",
    updatedAt: "2024-01-19T16:00:00Z",
  },
  {
    id: "group-003",
    accountId: "acc-001",
    name: "DevOps",
    description: "DevOps engineers",
    members: [],
    memberCount: 0,
    createdBy: "user-001",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
]

// Mock Account
export const mockAccount: Account = {
  id: "acc-001",
  name: "Acme Corporation",
  slug: "acme-corp",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-20T14:30:00Z",
  baseFolders: [],
  baseRules: [],
}

// Mock Projects with Permissions
export const mockProjects: Project[] = [
  {
    id: "proj-001",
    accountId: "acc-001",
    name: "Frontend Team",
    slug: "frontend-team",
    description: "Frontend development rules and guidelines",
    permissions: [
      {
        id: "perm-001",
        targetType: "group",
        targetId: "group-001",
        targetName: "Frontend Team",
        permissionType: "admin",
        grantedBy: "user-001",
        grantedAt: "2024-01-16T09:00:00Z",
      },
      {
        id: "perm-002",
        targetType: "user",
        targetId: "user-002",
        targetName: "Jane Smith",
        permissionType: "write",
        grantedBy: "user-001",
        grantedAt: "2024-01-16T10:00:00Z",
      },
    ],
    inheritPermissions: true,
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
    folders: [],
    rules: [],
  },
  {
    id: "proj-002",
    accountId: "acc-001",
    name: "Backend Team",
    slug: "backend-team",
    description: "Backend development standards",
    permissions: [
      {
        id: "perm-003",
        targetType: "group",
        targetId: "group-002",
        targetName: "Backend Team",
        permissionType: "admin",
        grantedBy: "user-001",
        grantedAt: "2024-01-17T11:00:00Z",
      },
    ],
    inheritPermissions: false,
    createdAt: "2024-01-17T11:00:00Z",
    updatedAt: "2024-01-19T15:00:00Z",
    folders: [],
    rules: [],
  },
  {
    id: "proj-003",
    accountId: "acc-001",
    name: "DevOps",
    slug: "devops",
    description: "DevOps and infrastructure rules",
    permissions: [
      {
        id: "perm-004",
        targetType: "group",
        targetId: "group-003",
        targetName: "DevOps",
        permissionType: "admin",
        grantedBy: "user-001",
        grantedAt: "2024-01-18T08:00:00Z",
      },
      {
        id: "perm-005",
        targetType: "user",
        targetId: "user-003",
        targetName: "Bob Wilson",
        permissionType: "read",
        grantedBy: "user-001",
        grantedAt: "2024-01-18T09:00:00Z",
      },
    ],
    inheritPermissions: false,
    createdAt: "2024-01-18T08:00:00Z",
    updatedAt: "2024-01-20T12:00:00Z",
    folders: [],
    rules: [],
  },
]

// Mock Account-Level Folders
export const mockAccountFolders: Folder[] = [
  {
    id: "folder-acc-001",
    accountId: "acc-001",
    name: "Code Standards",
    path: "/account/code-standards",
    syncStatus: "local",
    folderStatus: "editable",
    sourceOfTruth: "account",
    ruleCount: 5,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "folder-acc-002",
    accountId: "acc-001",
    name: "Security Guidelines",
    path: "/account/security",
    syncStatus: "local",
    folderStatus: "editable",
    sourceOfTruth: "account",
    ruleCount: 8,
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-19T16:00:00Z",
  },
  {
    id: "folder-acc-003",
    accountId: "acc-001",
    name: "API Design",
    path: "/account/api-design",
    syncStatus: "local",
    folderStatus: "editable",
    sourceOfTruth: "account",
    ruleCount: 12,
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  },
]

// Mock Project-Level Folders (with inheritance indicators and permissions)
export const mockProjectFolders: Folder[] = [
  // Synced folders (read-only, inherited from account)
  {
    id: "folder-proj-001",
    accountId: "acc-001",
    projectId: "proj-001",
    name: "Code Standards",
    path: "/projects/proj-001/code-standards",
    syncStatus: "synced",
    folderStatus: "read-only",
    inheritedFrom: "acc-001",
    sourceOfTruth: "account",
    permissions: [
      {
        id: "perm-folder-001",
        targetType: "group",
        targetId: "group-001",
        targetName: "Frontend Team",
        permissionType: "read",
        grantedBy: "user-001",
        grantedAt: "2024-01-16T09:00:00Z",
        inheritedFrom: "proj-001",
      },
    ],
    inheritPermissions: true,
    ruleCount: 5,
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "folder-proj-002",
    accountId: "acc-001",
    projectId: "proj-001",
    name: "Security Guidelines",
    path: "/projects/proj-001/security",
    syncStatus: "synced",
    folderStatus: "read-only",
    inheritedFrom: "acc-001",
    sourceOfTruth: "account",
    permissions: [
      {
        id: "perm-folder-002",
        targetType: "group",
        targetId: "group-001",
        targetName: "Frontend Team",
        permissionType: "read",
        grantedBy: "user-001",
        grantedAt: "2024-01-16T09:00:00Z",
        inheritedFrom: "proj-001",
      },
    ],
    inheritPermissions: true,
    ruleCount: 8,
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-19T16:00:00Z",
  },
  // Detached folder (editable, copied from account)
  {
    id: "folder-proj-003",
    accountId: "acc-001",
    projectId: "proj-002",
    name: "API Design",
    path: "/projects/proj-002/api-design",
    syncStatus: "detached",
    folderStatus: "editable",
    inheritedFrom: "acc-001",
    sourceOfTruth: "project",
    permissions: [
      {
        id: "perm-folder-003",
        targetType: "group",
        targetId: "group-002",
        targetName: "Backend Team",
        permissionType: "write",
        grantedBy: "user-001",
        grantedAt: "2024-01-17T11:00:00Z",
      },
      {
        id: "perm-folder-004",
        targetType: "user",
        targetId: "user-002",
        targetName: "Jane Smith",
        permissionType: "read",
        grantedBy: "user-001",
        grantedAt: "2024-01-17T12:00:00Z",
      },
    ],
    inheritPermissions: false,
    ruleCount: 12,
    createdAt: "2024-01-17T11:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  },
  // Local folder (created in project, no inheritance)
  {
    id: "folder-proj-004",
    projectId: "proj-003",
    name: "Infrastructure Rules",
    path: "/projects/proj-003/infrastructure",
    syncStatus: "local",
    folderStatus: "editable",
    sourceOfTruth: "project",
    permissions: [
      {
        id: "perm-folder-005",
        targetType: "group",
        targetId: "group-003",
        targetName: "DevOps",
        permissionType: "admin",
        grantedBy: "user-001",
        grantedAt: "2024-01-18T08:00:00Z",
      },
    ],
    inheritPermissions: false,
    ruleCount: 6,
    createdAt: "2024-01-18T08:00:00Z",
    updatedAt: "2024-01-20T12:00:00Z",
  },
]

// Mock Rules
export const mockRules: Rule[] = [
  {
    id: "rule-001",
    folderId: "folder-acc-001",
    accountId: "acc-001",
    name: "TypeScript Best Practices",
    content: "# TypeScript Best Practices\n\nAlways use strict mode...",
    path: "/account/code-standards/typescript.md",
    syncStatus: "local",
    folderStatus: "editable",
    sourceOfTruth: "account",
    usageCount: 245,
    lastUsedAt: "2024-01-20T14:00:00Z",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "rule-002",
    folderId: "folder-proj-001",
    accountId: "acc-001",
    projectId: "proj-001",
    name: "TypeScript Best Practices",
    content: "# TypeScript Best Practices\n\nAlways use strict mode...",
    path: "/projects/proj-001/code-standards/typescript.md",
    syncStatus: "synced",
    folderStatus: "read-only",
    inheritedFrom: "acc-001",
    sourceOfTruth: "account",
    usageCount: 89,
    lastUsedAt: "2024-01-20T13:00:00Z",
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "rule-003",
    folderId: "folder-proj-003",
    accountId: "acc-001",
    projectId: "proj-002",
    name: "API Design",
    content: "# API Design Guidelines\n\nRESTful principles...",
    path: "/projects/proj-002/api-design/rest.md",
    syncStatus: "detached",
    folderStatus: "editable",
    inheritedFrom: "acc-001",
    sourceOfTruth: "project",
    usageCount: 156,
    lastUsedAt: "2024-01-20T12:00:00Z",
    createdAt: "2024-01-17T11:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  },
]

// Mock Inheritance Configs
export const mockInheritanceConfigs: InheritanceConfig[] = [
  {
    projectId: "proj-001",
    mode: "full",
    syncedFolders: ["folder-acc-001", "folder-acc-002"],
    detachedFolders: [],
    lastSyncAt: "2024-01-20T14:30:00Z",
  },
  {
    projectId: "proj-002",
    mode: "partial",
    syncedFolders: ["folder-acc-001"],
    detachedFolders: ["folder-acc-003"],
    lastSyncAt: "2024-01-19T15:00:00Z",
  },
  {
    projectId: "proj-003",
    mode: "none",
    syncedFolders: [],
    detachedFolders: [],
  },
]

// Mock Account Metrics
export const mockAccountMetrics: AccountMetrics = {
  accountId: "acc-001",
  totalCalls: 15234,
  callsByProject: [
    { projectId: "proj-001", projectName: "Frontend Team", count: 6234 },
    { projectId: "proj-002", projectName: "Backend Team", count: 4567 },
    { projectId: "proj-003", projectName: "DevOps", count: 4433 },
  ],
  callsByRule: [
    { ruleId: "rule-001", ruleName: "TypeScript Best Practices", count: 2450 },
    { ruleId: "rule-002", ruleName: "Security Guidelines", count: 1890 },
    { ruleId: "rule-003", ruleName: "API Design", count: 1560 },
  ],
  callsByIDE: [
    { ideType: "vscode", count: 6234 },
    { ideType: "cursor", count: 4567 },
    { ideType: "jetbrains", count: 2890 },
    { ideType: "neovim", count: 1543 },
  ],
  adoptionTrend: Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toISOString().split("T")[0],
      calls: Math.floor(Math.random() * 500) + 200,
      projects: Math.floor(Math.random() * 3) + 1,
    }
  }),
}

// Mock Project Metrics
export const mockProjectMetrics: Record<string, ProjectMetrics> = {
  "proj-001": {
    projectId: "proj-001",
    totalCalls: 6234,
    callsByRule: [
      { ruleId: "rule-001", ruleName: "TypeScript Best Practices", count: 2450 },
      { ruleId: "rule-002", ruleName: "React Patterns", count: 1890 },
      { ruleId: "rule-003", ruleName: "CSS Guidelines", count: 1894 },
    ],
    callsByIDE: [
      { ideType: "vscode", count: 3124 },
      { ideType: "cursor", count: 2110 },
      { ideType: "jetbrains", count: 1000 },
    ],
    adoptionTrend: Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toISOString().split("T")[0],
        calls: Math.floor(Math.random() * 300) + 100,
      }
    }),
  },
}

// Mock Audit Logs - Comprehensive audit trail
export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-001",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-001",
    action: "project.created",
    resourceType: "project",
    resourceId: "proj-001",
    changes: {
      name: { from: null, to: "Frontend Team" },
    },
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-004",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-002",
    action: "rule.created",
    resourceType: "rule",
    resourceId: "rule-003",
    changes: {
      name: { from: null, to: "API Guidelines" },
    },
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-005",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-002",
    action: "rule.updated",
    resourceType: "rule",
    resourceId: "rule-003",
    changes: {
      content: { from: "old content", to: "new content" },
    },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-006",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-001",
    action: "permission.granted",
    resourceType: "permission",
    resourceId: "perm-001",
    changes: {
      permissionType: { from: "none", to: "write" },
      targetId: { from: null, to: "user-002" },
    },
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-007",
    accountId: "acc-001",
    userId: "user-001",
    action: "mcp_key.created",
    resourceType: "mcp_key",
    resourceId: "mcp-key-001",
    changes: {
      scope: { from: null, to: "all_projects" },
      name: { from: null, to: "Production Key" },
    },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-009",
    accountId: "acc-001",
    userId: "user-001",
    action: "group.created",
    resourceType: "group",
    resourceId: "group-001",
    changes: {
      name: { from: null, to: "Frontend Team" },
    },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-010",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-001",
    action: "permission.revoked",
    resourceType: "permission",
    resourceId: "perm-002",
    changes: {
      permissionType: { from: "write", to: "none" },
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-011",
    accountId: "acc-001",
    userId: "user-001",
    action: "mcp_key.updated",
    resourceType: "mcp_key",
    resourceId: "mcp-key-001",
    changes: {
      scope: { from: "all_projects", to: "project" },
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-012",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-002",
    action: "rule.deleted",
    resourceType: "rule",
    resourceId: "rule-004",
    changes: {
      name: { from: "Old Rule", to: null },
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: {
      warning: "Rule deletion is permanent",
    },
  },
  {
    id: "audit-013",
    accountId: "acc-001",
    userId: "user-001",
    action: "user.created",
    resourceType: "user",
    resourceId: "user-003",
    changes: {
      email: { from: null, to: "bob.wilson@acme.com" },
    },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "audit-014",
    accountId: "acc-001",
    projectId: "proj-001",
    userId: "user-001",
    action: "project.updated",
    resourceType: "project",
    resourceId: "proj-001",
    changes: {
      description: { from: "Old description", to: "Updated description" },
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

