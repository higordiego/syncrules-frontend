"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Folder, Lock, RefreshCw, Save, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PermissionManager } from "@/components/governance/permission-manager"
import type { Permission, PermissionType } from "@/lib/types/governance"
import {
    listFolderPermissions,
    createFolderPermission,
    updateFolderPermission,
    deleteFolderPermission,
    type CreateFolderPermissionData,
} from "@/lib/api-folder-permissions"

interface FolderSettingsDialogProps {
    isOpen: boolean
    onClose: () => void
    folderId: string
    folderName: string
    onUpdateFolder: (name: string) => Promise<void>
    onDeleteFolder: () => Promise<void>
    // Mock data for user selection since we don't have full user search in this component yet
    availableUsers?: any[]
    availableGroups?: any[]
    currentUserId?: string
}

export function FolderSettingsDialog({
    isOpen,
    onClose,
    folderId,
    folderName,
    onUpdateFolder,
    onDeleteFolder,
    availableUsers = [],
    availableGroups = [],
    currentUserId = "current-user-id", // Should come from context
}: FolderSettingsDialogProps) {
    const { toast } = useToast()
    const [name, setName] = useState(folderName)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Permissions state
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(false)

    // Load permissions when dialog opens or tab changes
    const loadPermissions = async () => {
        setLoadingPermissions(true)
        try {
            const response = await listFolderPermissions(folderId)
            if (response.success && response.data) {
                setPermissions(response.data)
            }
        } catch (error) {
            console.error("Failed to load permissions", error)
        } finally {
            setLoadingPermissions(false)
        }
    }

    const handleSaveGeneral = async () => {
        setIsSaving(true)
        try {
            await onUpdateFolder(name)
            toast({
                title: "Folder updated",
                description: "Folder settings saved successfully.",
            })
            onClose()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update folder.",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this folder? This action cannot be undone.")) return

        setIsDeleting(true)
        try {
            await onDeleteFolder()
            toast({
                title: "Folder deleted",
                description: "Folder deleted successfully.",
            })
            onClose()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete folder.",
            })
            setIsDeleting(false)
        }
    }

    // Permission handlers
    const handleAddPermission = async (data: Omit<Permission, "id" | "grantedAt" | "grantedBy">) => {
        try {
            const reqData: CreateFolderPermissionData = {
                targetType: data.targetType,
                targetId: data.targetId,
                permissionType: data.permissionType,
            }
            const response = await createFolderPermission(folderId, reqData)
            if (response.success && response.data) {
                setPermissions([...permissions, response.data])
                toast({ title: "Permission added" })
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to add permission" })
        }
    }

    const handleUpdatePermission = async (id: string, type: PermissionType) => {
        try {
            const response = await updateFolderPermission(id, { permissionType: type })
            if (response.success && response.data) {
                setPermissions(permissions.map(p => p.id === id ? response.data! : p))
                toast({ title: "Permission updated" })
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to update permission" })
        }
    }

    const handleRemovePermission = async (id: string) => {
        try {
            const response = await deleteFolderPermission(id)
            if (response.success) {
                setPermissions(permissions.filter(p => p.id !== id))
                toast({ title: "Permission removed" })
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to remove permission" })
        }
    }

    // Limpar estado quando modal fechar
    useEffect(() => {
        if (!isOpen) {
            setName(folderName)
            setIsSaving(false)
            setIsDeleting(false)
            setPermissions([])
            setLoadingPermissions(false)
        }
    }, [isOpen, folderName])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        Folder Settings: {folderName}
                    </DialogTitle>
                    <DialogDescription>
                        Manage folder properties and permissions
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full" onValueChange={(val) => val === 'permissions' && loadPermissions()}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Folder Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="pt-4 border-t mt-4">
                            <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete Folder
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="permissions" className="py-4">
                        {loadingPermissions ? (
                            <div className="flex justify-center p-4"><RefreshCw className="animate-spin h-6 w-6" /></div>
                        ) : (
                            <PermissionManager
                                permissions={permissions}
                                inheritPermissions={false} // TODO: Add inherit permission logic to backend/frontend
                                onInheritToggle={() => { }}
                                onAddPermission={handleAddPermission}
                                onUpdatePermission={handleUpdatePermission}
                                onRemovePermission={handleRemovePermission}
                                resourceType="folder"
                                resourceName={folderName}
                                currentUserId={currentUserId}
                                availableUsers={availableUsers}
                                availableGroups={availableGroups}
                            />
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Close</Button>
                    <Button onClick={handleSaveGeneral} disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
