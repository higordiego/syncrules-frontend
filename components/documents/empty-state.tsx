"use client"

import { FolderOpen } from "lucide-react"

export function DocumentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 lg:py-16">
      <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-card-foreground mb-2">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        Create a new folder or file, or drag and drop files here to get started
      </p>
    </div>
  )
}

