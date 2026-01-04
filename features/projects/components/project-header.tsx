/**
 * Project Header Component
 * 
 * Displays project name, description, and navigation.
 * Presentational component - receives data via props.
 * 
 * Max: 150 lines
 */

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Settings } from "lucide-react"
import type { Project } from "../types"

interface ProjectHeaderProps {
  project: Project
  onSettingsClick?: () => void
}

export function ProjectHeader({ project, onSettingsClick }: ProjectHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/account">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Project Info */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant="secondary">Active</Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>

        {onSettingsClick && (
          <Button variant="outline" onClick={onSettingsClick}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>
    </div>
  )
}

