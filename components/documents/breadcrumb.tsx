"use client"

import { ChevronRight, Home } from "lucide-react"
import { type DocumentItem } from "@/lib/documents"

interface BreadcrumbProps {
  items: DocumentItem[]
  onNavigate: (folderId: string | null) => void
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:text-primary transition-colors"
      >
        <Home className="h-4 w-4" />
        Home
      </button>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => onNavigate(item.id)} className="hover:text-primary transition-colors">
            {item.name}
          </button>
        </div>
      ))}
    </div>
  )
}

