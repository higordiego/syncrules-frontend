/**
 * Project Rules Tab Component
 * 
 * Displays rules for a project.
 * Presentational component - receives data via props.
 * 
 * Max: 150 lines
 */

"use client"

import { RulesManager } from "@/components/projects/rules-manager"
import type { Rule } from "@/lib/types/governance"

interface ProjectRulesTabProps {
  rules: Rule[]
  projectId: string
  isLoading: boolean
}

export function ProjectRulesTab({ rules, projectId, isLoading }: ProjectRulesTabProps) {
  return (
    <RulesManager
      rules={rules}
      projectId={projectId}
      isLoading={isLoading}
    />
  )
}

