"use client"

import type React from "react"
import { Folder, FileText, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Document } from "@/lib/api-documents"

interface DocumentItemProps {
  document: Document
  onOpen: (id: string) => void
  onEdit: (document: Document) => void
  onDelete: (id: string) => void
  onView?: (document: Document) => void
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent, id: string) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent, id: string) => void
  onDragEnd?: () => void
}

export function DocumentItemComponent({
  document,
  onOpen,
  onEdit,
  onDelete,
  onView,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: DocumentItemProps) {
  const handleClick = () => {
    if (document.type === "folder") {
      onOpen(document.id)
    } else if (onView) {
      onView(document)
    }
  }

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, document.id) : undefined}
      onDragOver={onDragOver && document.type === "folder" ? (e) => onDragOver(e, document.id) : undefined}
      onDragLeave={onDragLeave}
      onDrop={onDrop && document.type === "folder" ? (e) => onDrop(e, document.id) : undefined}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md cursor-move ${
        isDragging ? "opacity-50" : ""
      } ${isDragOver && document.type === "folder" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}
    >
      <div onClick={handleClick} className="flex flex-1 items-center gap-3 cursor-pointer">
        {document.type === "folder" ? (
          <Folder className="h-10 w-10 text-blue-500 dark:text-blue-400 flex-shrink-0" />
        ) : (
          <FileText className="h-10 w-10 text-green-600 dark:text-green-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-card-foreground truncate">{document.name}</p>
          <p className="text-xs text-muted-foreground">{document.type === "folder" ? "Folder" : "File"}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {document.type === "file" && onView && (
            <DropdownMenuItem onClick={() => onView(document)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(document)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(document.id)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

