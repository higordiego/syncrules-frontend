"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Users, User, Plus, X, Shield, Edit, Lock } from "lucide-react"
import type { Permission, PermissionType, PermissionTargetType, User as UserType, Group } from "@/lib/types/governance"
import { PermissionBadge } from "./permission-badge"
import { UserGroupSelector } from "./user-group-selector"

interface PermissionManagerProps {
  permissions: Permission[]
  inheritPermissions: boolean
  onInheritToggle: (enabled: boolean) => void
  onAddPermission: (permission: Omit<Permission, "id" | "grantedAt" | "grantedBy">) => void
  onRemovePermission: (permissionId: string) => void
  onUpdatePermission: (permissionId: string, permissionType: PermissionType) => void
  availableUsers?: UserType[]
  availableGroups?: Group[]
  currentUserId?: string
  userGroups?: Group[] // Grupos que o usuário atual participa
  recentlyInvited?: UserType[] // Últimos convidados
  usersYouInvited?: UserType[] // Usuários que você convidou
  canViewOtherUsers?: boolean // Se o usuário tem permissão para ver outros usuários
  onEmailSearch?: (email: string) => Promise<UserType | null> // Callback para buscar usuário por email
  resourceType: "project" | "folder"
  resourceName: string
}

export function PermissionManager({
  permissions,
  inheritPermissions,
  onInheritToggle,
  onAddPermission,
  onRemovePermission,
  onUpdatePermission,
  availableUsers = [],
  availableGroups = [],
  currentUserId,
  userGroups = [],
  recentlyInvited = [],
  usersYouInvited = [],
  canViewOtherUsers = true,
  onEmailSearch,
  resourceType,
  resourceName,
}: PermissionManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTargetType, setSelectedTargetType] = useState<PermissionTargetType>("user")
  const [selectedTargetId, setSelectedTargetId] = useState<string>("")
  const [selectedPermissionType, setSelectedPermissionType] = useState<PermissionType>("read")

  const handleAddPermission = () => {
    if (!selectedTargetId) return

    const target = selectedTargetType === "user"
      ? availableUsers.find((u) => u.id === selectedTargetId)
      : availableGroups.find((g) => g.id === selectedTargetId)

    if (!target) return

    onAddPermission({
      targetType: selectedTargetType,
      targetId: selectedTargetId,
      targetName: selectedTargetType === "user" ? target.name : target.name,
      permissionType: selectedPermissionType,
    })

    setIsAddDialogOpen(false)
    setSelectedTargetId("")
    setSelectedPermissionType("read")
  }

  const getPermissionIcon = (type: PermissionType) => {
    switch (type) {
      case "admin":
        return Shield
      case "write":
        return Edit
      case "read":
        return Lock
      default:
        return X
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Manage access permissions for {resourceType}: {resourceName}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Permission</DialogTitle>
                <DialogDescription>
                  Grant access to a user or group for this {resourceType}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Target Type</Label>
                  <Select
                    value={selectedTargetType}
                    onValueChange={(value) => {
                      setSelectedTargetType(value as PermissionTargetType)
                      setSelectedTargetId("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="group">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Group
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <UserGroupSelector
                  type={selectedTargetType}
                  availableUsers={availableUsers.filter(u => !permissions.some(p => p.targetType === 'user' && p.targetId === u.id))}
                  availableGroups={availableGroups.filter(g => !permissions.some(p => p.targetType === 'group' && p.targetId === g.id))}
                  currentUserId={currentUserId}
                  userGroups={userGroups}
                  recentlyInvited={recentlyInvited}
                  usersYouInvited={usersYouInvited}
                  canViewOtherUsers={canViewOtherUsers}
                  onEmailSearch={onEmailSearch}
                  selectedId={selectedTargetId}
                  onSelect={setSelectedTargetId}
                  placeholder={`Select ${selectedTargetType}`}
                />

                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select
                    value={selectedPermissionType}
                    onValueChange={(value) => setSelectedPermissionType(value as PermissionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Read - Read-only access
                        </div>
                      </SelectItem>
                      <SelectItem value="write">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Write - Can read and modify
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin - Full access including permissions
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddPermission} disabled={!selectedTargetId} className="w-full sm:w-auto">
                  Add Permission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inherit Permissions Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="inherit-permissions" className="text-sm font-medium">
              Inherit Permissions
            </Label>
            <p className="text-xs text-muted-foreground">
              Inherit permissions from {resourceType === "project" ? "account" : "project"}
            </p>
          </div>
          <Switch
            id="inherit-permissions"
            checked={inheritPermissions}
            onCheckedChange={onInheritToggle}
          />
        </div>

        {/* Permissions List */}
        <div className="space-y-2">
          {permissions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No permissions configured. Add permissions to control access.
            </div>
          ) : (
            permissions.map((permission) => {
              const PermissionIcon = getPermissionIcon(permission.permissionType)
              return (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {permission.targetType === "group" ? (
                      <Users className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{permission.targetName}</span>
                        <PermissionBadge
                          permissionType={permission.permissionType}
                          targetType={permission.targetType}
                        />
                        {permission.inheritedFrom && (
                          <Badge variant="outline" className="text-xs">
                            Inherited
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {permission.targetType === "group" ? "Group" : "User"} • Granted{" "}
                        {new Date(permission.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!permission.inheritedFrom && (
                      <>
                        <Select
                          value={permission.permissionType}
                          onValueChange={(value) =>
                            onUpdatePermission(permission.id, value as PermissionType)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="write">Write</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemovePermission(permission.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

