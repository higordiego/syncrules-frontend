"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Share2, Folder as FolderIcon, FileText } from "lucide-react"
import type { Folder, Project } from "@/lib/types/governance"

interface ShareFolderDialogProps {
    folder: Folder | null
    projects: Project[]
    sharedProjects: string[]
    selectedProjects: string[]
    onSelectedProjectsChange: (projectIds: string[]) => void
    onShare: () => void
    isOpen: boolean
    onClose: () => void
    isLoading: boolean
}

export function ShareFolderDialog({
    folder,
    projects,
    sharedProjects,
    selectedProjects,
    onSelectedProjectsChange,
    onShare,
    isOpen,
    onClose,
    isLoading,
}: ShareFolderDialogProps) {
    const toggleProject = (projectId: string) => {
        if (selectedProjects.includes(projectId)) {
            onSelectedProjectsChange(selectedProjects.filter(id => id !== projectId))
        } else {
            onSelectedProjectsChange([...selectedProjects, projectId])
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-blue-600" />
                        Share Folder with Projects
                    </DialogTitle>
                    <DialogDescription>
                        Select which projects should have access to <strong>{folder?.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No projects available
                            </p>
                        ) : (
                            projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-muted/50 transition-colors"
                                >
                                    <Checkbox
                                        id={`project-${project.id}`}
                                        checked={selectedProjects.includes(project.id)}
                                        onCheckedChange={() => toggleProject(project.id)}
                                    />
                                    <Label
                                        htmlFor={`project-${project.id}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="font-medium">{project.name}</div>
                                        {project.description && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {project.description}
                                            </div>
                                        )}
                                    </Label>
                                    {sharedProjects.includes(project.id) && (
                                        <span className="text-xs text-blue-600 font-medium">
                                            Currently Shared
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={onShare} disabled={isLoading || selectedProjects.length === 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Share Folder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface FolderDetailsDialogProps {
    folder: Folder | null
    projects: Project[]
    sharedProjects: string[]
    isOpen: boolean
    onClose: () => void
    isLoading: boolean
    onManageRules?: (folderId: string) => void
    onShare?: (projectIds: string[]) => Promise<void>
    isSharing?: boolean
}

export function FolderDetailsDialog({
    folder,
    projects,
    sharedProjects,
    isOpen,
    onClose,
    isLoading,
    onManageRules,
    onShare,
    isSharing = false,
}: FolderDetailsDialogProps) {
    const [selectedProjects, setSelectedProjects] = useState<string[]>(sharedProjects)
    const [isEditingSharing, setIsEditingSharing] = useState(false)

    // Sincronizar selectedProjects quando sharedProjects mudar ou modal abrir
    useEffect(() => {
        if (isOpen && folder) {
            setSelectedProjects(sharedProjects)
            setIsEditingSharing(false)
        }
    }, [isOpen, folder, sharedProjects])

    if (!folder) return null

    const toggleProject = (projectId: string) => {
        if (selectedProjects.includes(projectId)) {
            setSelectedProjects(selectedProjects.filter(id => id !== projectId))
        } else {
            setSelectedProjects([...selectedProjects, projectId])
        }
        setIsEditingSharing(true)
    }

    const handleSaveSharing = async () => {
        if (onShare) {
            await onShare(selectedProjects)
            setIsEditingSharing(false)
        }
    }

    const hasChanges = JSON.stringify(selectedProjects.sort()) !== JSON.stringify(sharedProjects.sort())
    const sharedProjectsList = projects.filter(p => sharedProjects.includes(p.id))

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0 pb-4 border-b">
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        Folder Details
                    </DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        Information and actions for <strong>{folder.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-semibold text-foreground mb-2 block">Folder Name</Label>
                            <p className="text-base font-medium text-foreground">{folder.name}</p>
                        </div>

                        <div>
                            <Label className="text-sm font-semibold text-foreground mb-2 block">Path</Label>
                            <p className="font-mono text-sm bg-gray-50 dark:bg-muted/30 px-3 py-2 rounded-lg border border-gray-200 dark:border-border">{folder.path || "/"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-semibold text-foreground mb-2 block">Type</Label>
                                <p className="text-sm text-muted-foreground">Account-Level Folder</p>
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-foreground mb-2 block">Rules</Label>
                                <p className="text-sm font-medium text-foreground">{folder.ruleCount || 0} rules</p>
                            </div>
                        </div>
                    </div>

                    {/* Shared Projects - Inline Editing */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-semibold text-foreground">
                                Share with Projects
                            </Label>
                            {isEditingSharing && hasChanges && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedProjects(sharedProjects)
                                            setIsEditingSharing(false)
                                        }}
                                        disabled={isSharing}
                                        className="h-8"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveSharing}
                                        disabled={isSharing || selectedProjects.length === 0}
                                        className="h-8"
                                    >
                                        {isSharing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        <Share2 className="h-3 w-3 mr-2" />
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Loading projects...</span>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-border rounded-lg bg-gray-50 dark:bg-muted/20">
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">No projects available</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {projects.map((project) => {
                                    const isSelected = selectedProjects.includes(project.id)
                                    const isCurrentlyShared = sharedProjects.includes(project.id)
                                    return (
                                        <div
                                            key={project.id}
                                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                id={`project-${project.id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleProject(project.id)}
                                            />
                                            <Label
                                                htmlFor={`project-${project.id}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="font-medium text-sm text-foreground">{project.name}</div>
                                                {project.description && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {project.description}
                                                    </div>
                                                )}
                                            </Label>
                                            {isCurrentlyShared && !isSelected && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Currently Shared
                                                </Badge>
                                            )}
                                            {isSelected && (
                                                <Badge variant="default" className="text-xs bg-blue-600">
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t gap-2">
                    {onManageRules && (
                        <Button
                            variant="default"
                            onClick={() => {
                                onManageRules(folder.id)
                                onClose()
                            }}
                            className="flex-1 sm:flex-none"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Manage Rules
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
