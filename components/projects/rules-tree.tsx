"use client"

import * as React from "react"
import { useState } from "react"
import {
    ChevronRight,
    ChevronDown,
    Folder as FolderIcon,
    FolderOpen,
    FileText,
    MoreVertical,
    Plus,
    Trash2,
    Edit,
    Share2,
    Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Folder as GovernanceFolder, Rule } from "@/lib/types/governance"

interface RulesTreeProps {
    folders: GovernanceFolder[]
    rules: Rule[]
    onMoveFolder: (folderId: string, targetId: string | null) => void
    onToggleFolder: (folderId: string) => void
    expandedFolders: Set<string>
    onAddRule: (folderId: string) => void
    onEditRule: (rule: Rule) => void
    onDeleteRule: (ruleId: string) => void
    onEditFolder?: (folder: GovernanceFolder) => void
    onDeleteFolder?: (folderId: string) => void
    onDropFiles?: (targetId: string, files: FileList) => void
    onMoveRule?: (ruleId: string, targetFolderId: string) => void
    onViewRule?: (rule: Rule) => void
    allowManagedFolderEditing?: boolean
    disableInternalDnd?: boolean
}

interface TreeNode {
    type: "folder" | "rule"
    data: GovernanceFolder | Rule
    children?: TreeNode[]
}

export function RulesTree({
    folders,
    rules,
    onMoveFolder,
    onToggleFolder,
    expandedFolders,
    onAddRule,
    onEditRule,
    onDeleteRule,
    onEditFolder,
    onDeleteFolder,
    onDropFiles,
    onMoveRule,
    onViewRule,
    allowManagedFolderEditing = false,
    disableInternalDnd = false,
}: RulesTreeProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)

    // Build Tree
    const tree = React.useMemo(() => {
        const nodes: TreeNode[] = []
        const folderMap = new Map<string, TreeNode>()

        // Create folder nodes
        folders.forEach((f) => {
            folderMap.set(f.id, { type: "folder", data: f, children: [] })
        })

        // Nest folders
        folders.forEach((f) => {
            const node = folderMap.get(f.id)!
            if (f.parentFolderId && folderMap.has(f.parentFolderId)) {
                folderMap.get(f.parentFolderId)!.children!.push(node)
            } else {
                nodes.push(node)
            }
        })

        // Add rules to folders OR root
        rules.forEach((r) => {
            if (r.folderId && folderMap.has(r.folderId)) {
                folderMap.get(r.folderId)!.children!.push({ type: "rule", data: r })
            } else {
                // Rule is at root level
                nodes.push({ type: "rule", data: r })
            }
        })

        // Sort: Folders first, then Rules. Alphabetical within type.
        const sortNodes = (n: TreeNode[]) => {
            n.sort((a, b) => {
                if (a.type !== b.type) return a.type === "folder" ? -1 : 1
                // @ts-ignore
                return a.data.name.localeCompare(b.data.name)
            })
            n.forEach(child => {
                if (child.children) sortNodes(child.children)
            })
        }

        sortNodes(nodes)

        return nodes
    }, [folders, rules])

    const handleDragStart = (e: React.DragEvent, id: string, type: "folder" | "rule") => {
        e.stopPropagation()

        // Feature Flag: If internal DnD is disabled, block drag start entirely
        if (disableInternalDnd) {
            e.preventDefault()
            return
        }

        // Validation: Don't drag ReadOnly folders or shared folders UNSLESS editing is allowed
        if (type === "folder") {
            const folder = folders.find(f => f.id === id)
            if (folder?.folderStatus === "read-only") {
                e.preventDefault()
                return
            }
            // Prevent dragging shared folders (Account-level folders without projectId) UNLESS allowed
            if (folder && folder.accountId && !folder.projectId && !allowManagedFolderEditing) {
                e.preventDefault()
                return
            }
        }
        setDraggedId(id)
        e.dataTransfer.setData("application/json", JSON.stringify({ id, type }))
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent, id: string, type: "folder" | "rule") => {
        e.preventDefault()
        e.stopPropagation()

        // Verificar se é pasta compartilhada (não pode receber itens) UNLESS allowed
        if (type === "folder") {
            const folder = folders.find(f => f.id === id)
            // Pastas compartilhadas: accountId presente mas projectId null
            if (folder && folder.accountId && !folder.projectId && !allowManagedFolderEditing) {
                e.dataTransfer.dropEffect = "none"
                return
            }
        }

        // Case 1: Internal Drag (Reordering/Moving)
        if (draggedId) {
            if (disableInternalDnd) {
                e.dataTransfer.dropEffect = "none"
                return
            }

            if (draggedId === id) return

            // Can only drop ON folders
            if (type === "folder") {
                setDragOverId(id)
                e.dataTransfer.dropEffect = "move"
            }
            return
        }

        // Case 2: External File Drag (Upload)
        // Check if types includes "Files"
        if (e.dataTransfer.types.includes("Files")) {
            if (type === "folder") {
                setDragOverId(id)
                e.dataTransfer.dropEffect = "copy"
            }
        }
    }

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverId(null)

        // Verificar se o destino é uma pasta compartilhada (não pode receber itens) UNLESS allowed
        const targetFolder = folders.find(f => f.id === targetId)
        if (targetFolder && targetFolder.accountId && !targetFolder.projectId && !allowManagedFolderEditing) {
            // Pasta compartilhada - não permitir drop se não permitido
            return
        }

        // Case 1: Internal Drag
        if (draggedId) {
            if (disableInternalDnd) return // Should be blocked by dragStart/over but safety check

            if (draggedId === targetId) return
            const data = JSON.parse(e.dataTransfer.getData("application/json"))
            if (data.type === "folder") {
                onMoveFolder(data.id, targetId)
            } else if (data.type === "rule" && onMoveRule) {
                onMoveRule(data.id, targetId)
            }
            return
        }

        // Case 2: External File Drag
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropFiles?.(targetId, e.dataTransfer.files)
        }
    }

    const renderNode = (node: TreeNode, level: number = 0) => {
        const isFolder = node.type === "folder"
        const isExpanded = isFolder && expandedFolders.has((node.data as GovernanceFolder).id)
        const id = (node.data as any).id
        const isSharedFolder = isFolder && (node.data as GovernanceFolder).accountId && !(node.data as GovernanceFolder).projectId

        return (
            <div
                key={id}
                className={cn("select-none")}
                style={{ paddingLeft: level > 0 ? "1.5rem" : "0" }}
            >
                <div
                    draggable={true} // Enable dragging for both folders and rules

                    onDragStart={(e) => handleDragStart(e, id, node.type)}
                    onDragOver={(e) => handleDragOver(e, id, node.type)}
                    onDrop={(e) => handleDrop(e, id)}
                    className={cn(
                        "flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 group border border-transparent",
                        dragOverId === id && isFolder && "bg-accent border-primary",
                        // Removed opacity-50 for dragging to keep colors vivid
                        draggedId === id && "bg-accent/20 border-primary/20"
                    )}
                >
                    {isFolder && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleFolder(id)
                            }}
                            className="p-1 hover:bg-muted rounded text-foreground"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    )}

                    {!isFolder && <div className="w-6" />} {/* Spacing for rule */}

                    <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        {isFolder ? (
                            <FolderIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        ) : (
                            <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium text-foreground">{(node.data as any).name}</span>

                        {isFolder && (
                            <>
                                {/* Badge para folders compartilhadas (Account-level folders sem projectId) */}
                                {isSharedFolder && !allowManagedFolderEditing && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 flex items-center gap-1">
                                        <Share2 className="h-3 w-3" />
                                        <Lock className="h-3 w-3" />
                                        Shared (Read-Only)
                                    </Badge>
                                )}
                                {isSharedFolder && allowManagedFolderEditing && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-1">
                                        <Share2 className="h-3 w-3" />
                                        <Edit className="h-3 w-3" />
                                        Shared (Managed)
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFolder && (!isSharedFolder || allowManagedFolderEditing) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onAddRule(id)
                                }}
                                title="Add Rule"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isFolder ? (
                                    <>
                                        {/* Folder Actions */}
                                        {/* Verificar se é folder compartilhada (Account-level sem projectId) */}
                                        {isSharedFolder && !allowManagedFolderEditing ? (
                                            <>
                                                <DropdownMenuItem disabled className="text-muted-foreground">
                                                    <Lock className="mr-2 h-4 w-4" /> Read-Only (Shared Folder)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled className="text-muted-foreground">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Cannot Delete (Shared)
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <DropdownMenuItem onClick={() => onEditFolder?.(node.data as GovernanceFolder)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => onDeleteFolder?.(id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Rule Actions */}
                                        {/* Check if rule is in a shared folder (read-only context) */}
                                        {(() => {
                                            const rule = node.data as Rule
                                            const parentFolder = rule.folderId ? folders.find(f => f.id === rule.folderId) : null
                                            const isRuleInSharedFolder = parentFolder && parentFolder.accountId && !parentFolder.projectId
                                            // Also check if rule itself is account-level (no projectId)
                                            const isAccountRule = rule.accountId && !rule.projectId

                                            // If in shared folder OR is account rule, AND editing is not explicitly allowed
                                            if ((isRuleInSharedFolder || isAccountRule) && !allowManagedFolderEditing) {
                                                return (
                                                    <>
                                                        <DropdownMenuItem onClick={() => onViewRule?.(node.data as Rule)}>
                                                            <FileText className="mr-2 h-4 w-4" /> View Content
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem disabled className="text-muted-foreground opacity-75">
                                                            <Lock className="mr-2 h-4 w-4" /> Shared (Read-Only)
                                                        </DropdownMenuItem>
                                                    </>
                                                )
                                            }

                                            return (
                                                <>
                                                    <DropdownMenuItem onClick={() => onEditRule(node.data as Rule)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRule(id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )
                                        })()}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {isExpanded && node.children && (
                    <div className="border-l ml-3 pl-1">
                        {node.children.map(child => renderNode(child, 0))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {tree.map(node => renderNode(node))}
            {tree.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No folders or rules found.
                </div>
            )}
        </div>
    )
}
