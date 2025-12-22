"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Document } from "@/lib/api-documents"
import { cn } from "@/lib/utils"
import { Eye, Edit, Trash2, FolderPlus } from "lucide-react"

interface TreeViewProps {
  documents: Document[]
  allDocuments: Document[]
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
  onOpenFolder: (folderId: string) => void
  onEdit: (item: Document) => void
  onDelete: (itemId: string) => void
  onView?: (item: Document) => void
  onCreateSubfolder?: (parentId: string) => void
  draggedItem: string | null
  dragOverItem: string | null
  onDragStart: (e: React.DragEvent, itemId: string) => void
  onDragOver: (e: React.DragEvent, itemId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, targetId: string | null) => void
  onDragEnd: () => void
  level?: number
  parentId?: string | null
}

function TreeItem({
  item,
  allDocuments,
  expandedFolders,
  onToggleFolder,
  onOpenFolder,
  onEdit,
  onDelete,
  onView,
  onCreateSubfolder,
  draggedItem,
  dragOverItem,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  level = 0,
}: {
  item: Document
  allDocuments: Document[]
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
  onOpenFolder: (folderId: string) => void
  onEdit: (item: Document) => void
  onDelete: (itemId: string) => void
  onView?: (item: Document) => void
  onCreateSubfolder?: (parentId: string) => void
  draggedItem: string | null
  dragOverItem: string | null
  onDragStart: (e: React.DragEvent, itemId: string) => void
  onDragOver: (e: React.DragEvent, itemId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, targetId: string | null) => void
  onDragEnd: () => void
  level: number
}) {
  const isExpanded = expandedFolders.has(item.id)
  const children = allDocuments.filter((d) => d.parentId === item.id)
  const hasChildren = children.length > 0
  const isDragging = draggedItem === item.id
  const isDragOver = dragOverItem === item.id && item.type === "folder"

  const handleClick = () => {
    if (item.type === "folder") {
      onToggleFolder(item.id)
      onOpenFolder(item.id)
    } else if (onView) {
      onView(item)
    }
  }

  return (
    <div>
      <div
        draggable={true}
        onDragStart={(e) => onDragStart(e, item.id)}
        onDragOver={(e) => (item.type === "folder" ? onDragOver(e, item.id) : e.preventDefault())}
        onDragLeave={onDragLeave}
        onDrop={(e) => (item.type === "folder" ? onDrop(e, item.id) : e.preventDefault())}
        onDragEnd={onDragEnd}
        className={cn(
          "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-accent/50 cursor-pointer",
          isDragging && "opacity-50",
          isDragOver && item.type === "folder" && "bg-blue-100 dark:bg-blue-900/30 border border-blue-500"
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {item.type === "folder" ? (
          <button
            onClick={() => onToggleFolder(item.id)}
            className="flex-shrink-0 p-0.5 hover:bg-accent rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        <div onClick={handleClick} className="flex flex-1 items-center gap-2 min-w-0">
          {item.type === "folder" ? (
            isExpanded ? (
              <FolderOpen className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            ) : (
              <Folder className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            )
          ) : (
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {item.type === "file" && onView && (
              <DropdownMenuItem onClick={() => onView(item)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            )}
            {item.type === "folder" && onCreateSubfolder && (
              <DropdownMenuItem onClick={() => onCreateSubfolder(item.id)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Subfolder
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.type === "folder" && isExpanded && hasChildren && (
        <div>
          {children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === "folder" ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <TreeItem
                key={child.id}
                item={child}
                allDocuments={allDocuments}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onOpenFolder={onOpenFolder}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                onCreateSubfolder={onCreateSubfolder}
                draggedItem={draggedItem}
                dragOverItem={dragOverItem}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({
  documents,
  allDocuments,
  expandedFolders,
  onToggleFolder,
  onOpenFolder,
  onEdit,
  onDelete,
  onView,
  onCreateSubfolder,
  draggedItem,
  dragOverItem,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: Omit<TreeViewProps, "level" | "parentId">) {
  const rootItems = useMemo(() => {
    return documents
      .filter((d) => d.parentId === null)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [documents])

  return (
    <div className="space-y-1">
      {rootItems.map((item) => (
          <TreeItem
            key={item.id}
            item={item}
            allDocuments={allDocuments}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
            onOpenFolder={onOpenFolder}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onCreateSubfolder={onCreateSubfolder}
            draggedItem={draggedItem}
            dragOverItem={dragOverItem}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            level={0}
          />
      ))}
    </div>
  )
}

