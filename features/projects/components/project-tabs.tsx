/**
 * Project Tabs Component
 * 
 * Manages tab navigation for project views.
 * Handles tab switching and triggers data fetching.
 * 
 * Max: 120 lines
 */

"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderKanban, FileText, Settings, Users } from "lucide-react"
import { ReactNode } from "react"

interface ProjectTab {
  id: string
  label: string
  icon: ReactNode
  content: ReactNode
}

interface ProjectTabsProps {
  tabs: ProjectTab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
}

export function ProjectTabs({ tabs, defaultTab = "folders", onTabChange }: ProjectTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

