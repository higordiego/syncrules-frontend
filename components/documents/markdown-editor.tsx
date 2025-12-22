"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { Edit, Eye, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  className?: string
  autoSave?: boolean
  autoSaveDelay?: number
  defaultViewMode?: "edit" | "preview" | "split"
}

export function MarkdownEditor({
  content,
  onChange,
  onSave,
  className,
  autoSave = false,
  autoSaveDelay = 1000,
  defaultViewMode = "split",
}: MarkdownEditorProps) {
  const [localContent, setLocalContent] = useState(content)
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">(defaultViewMode)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalContent(content)
    setHasChanges(false)
  }, [content])

  useEffect(() => {
    if (autoSave && hasChanges && localContent !== content) {
      const timer = setTimeout(() => {
        onChange(localContent)
        setHasChanges(false)
      }, autoSaveDelay)

      return () => clearTimeout(timer)
    }
  }, [localContent, autoSave, autoSaveDelay, hasChanges, content, onChange])

  const handleChange = (value: string) => {
    setLocalContent(value)
    setHasChanges(true)
    if (!autoSave) {
      onChange(value)
    }
  }

  const handleSave = () => {
    onChange(localContent)
    setHasChanges(false)
    onSave?.()
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="split" className="gap-2">
              <Eye className="h-4 w-4" />
              Split
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {hasChanges && !autoSave && (
          <Button onClick={handleSave} size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {viewMode === "edit" && (
          <div className="h-full flex flex-col bg-[#1e1e1e] dark:bg-[#0d1117]">
            <Textarea
              value={localContent}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 font-mono text-sm resize-none border-0 rounded-none min-h-0 p-6 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-[#d4d4d4] dark:text-[#c9d1d9] placeholder:text-[#6a737d] dark:placeholder:text-[#6a737d] leading-relaxed"
              placeholder="# Start writing your Markdown here...&#10;&#10;## Features&#10;- Edit your content&#10;- See live preview&#10;- Save changes"
            />
          </div>
        )}

        {viewMode === "preview" && (
          <div className="h-full overflow-y-auto p-6 bg-background">
            <MarkdownViewer content={localContent || "*No content yet*"} />
          </div>
        )}

        {viewMode === "split" && (
          <div className="grid grid-cols-2 h-full divide-x">
            <div className="overflow-hidden flex flex-col bg-[#1e1e1e] dark:bg-[#0d1117]">
              <Textarea
                value={localContent}
                onChange={(e) => handleChange(e.target.value)}
                className="flex-1 font-mono text-sm resize-none border-0 rounded-none min-h-0 p-6 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-[#d4d4d4] dark:text-[#c9d1d9] placeholder:text-[#6a737d] dark:placeholder:text-[#6a737d] leading-relaxed"
                placeholder="# Start writing your Markdown here..."
              />
            </div>
            <div className="overflow-y-auto p-6 bg-muted/30">
              <MarkdownViewer content={localContent || "*No content yet*"} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

