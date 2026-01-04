/**
 * Project Folders Tab Component
 * 
 * Displays folders for a project.
 * Presentational component - receives data via props.
 * 
 * Max: 150 lines
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderKanban, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Folder } from "@/lib/types/governance"

interface ProjectFoldersTabProps {
  folders: Folder[]
  isLoading: boolean
  projectId: string
}

export function ProjectFoldersTab({ folders, isLoading, projectId }: ProjectFoldersTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (folders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No folders yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => (
        <Card key={folder.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              {folder.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {folder.description && (
              <p className="text-sm text-muted-foreground mb-4">{folder.description}</p>
            )}
            <Link href={`/account/folders/${folder.id}`}>
              <Button variant="outline" className="w-full">
                Open Folder
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

