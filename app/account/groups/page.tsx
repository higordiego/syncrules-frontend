"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Users,
  Plus,
  Search,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Mail,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentAccountId } from "@/components/accounts/account-selector"
import type { Group, User } from "@/lib/types/governance"
import { useConfirm } from "@/lib/hooks/use-confirm"
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupMembers,
  addGroupMember,
  removeGroupMember,
  type Group as ApiGroup,
  type GroupMember,
} from "@/lib/api-groups"
import { listAccountMembers, searchAccountMembers, type AccountMember } from "@/lib/api-account-members"
import { searchUserByEmail } from "@/lib/api-users"
import { getPendingInvitesByEmail, createInvite, type Invite } from "@/lib/api-invites"

export default function GroupsPage() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const currentAccountId = getCurrentAccountId()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [availableMembers, setAvailableMembers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  // Carregar grupos da organização
  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentAccountId) {
        setIsLoadingGroups(false)
        return
      }

      setIsLoadingGroups(true)
      try {
        const response = await listGroups(currentAccountId)
        if (response.success && response.data) {
          const groupsArray = Array.isArray(response.data) ? response.data : []
          
          // Carregar membros de cada grupo
          const groupsWithMembers: Group[] = await Promise.all(
            groupsArray.map(async (apiGroup: ApiGroup) => {
              try {
                const membersResponse = await listGroupMembers(apiGroup.id)
                const membersArray = Array.isArray(membersResponse.data) ? membersResponse.data : []
                
                // Converter GroupMember para User
                const members: User[] = membersArray.map((member: GroupMember) => ({
                  id: member.userId,
                  email: member.userEmail || "",
                  name: member.userName || "",
                  picture: member.userPicture,
                }))

                return {
                  id: apiGroup.id,
                  accountId: apiGroup.accountIds[0] || currentAccountId,
                  name: apiGroup.name,
                  description: apiGroup.description,
                  members,
                  createdBy: undefined,
                  createdAt: apiGroup.createdAt,
                  updatedAt: apiGroup.updatedAt,
                }
              } catch (error) {
                console.error(`Failed to fetch members for group ${apiGroup.id}:`, error)
                return {
                  id: apiGroup.id,
                  accountId: apiGroup.accountIds[0] || currentAccountId,
                  name: apiGroup.name,
                  description: apiGroup.description,
                  members: [],
                  createdBy: undefined,
                  createdAt: apiGroup.createdAt,
                  updatedAt: apiGroup.updatedAt,
                }
              }
            })
          )
          
          setGroups(groupsWithMembers)
        } else {
          setGroups([])
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load groups",
        })
        setGroups([])
      } finally {
        setIsLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [currentAccountId, toast])

  // Carregar usuários disponíveis (membros da organização)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentAccountId) return

      setIsLoadingUsers(true)
      try {
        const response = await listAccountMembers(currentAccountId)
        if (response.success && response.data) {
          const membersArray = Array.isArray(response.data) ? response.data : []
          
          // Converter AccountMember para User
          const users: User[] = membersArray.map((member: AccountMember) => ({
            id: member.userId,
            email: member.userEmail || "",
            name: member.userName || "",
            picture: member.userPicture,
          }))
          
          setAllUsers(users)
        } else {
          setAllUsers([])
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
        setAllUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [currentAccountId])

  // Filtrar grupos
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Buscar usuários disponíveis (excluindo os que já estão no grupo selecionado)
  useEffect(() => {
    let filtered = allUsers

    // Filtrar por busca de texto
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
    }

    // Excluir usuários que já estão no grupo selecionado
    if (selectedGroup) {
      filtered = filtered.filter((user) => !selectedGroup.members.some((m) => m.id === user.id))
    }

    setAvailableMembers(filtered)
  }, [allUsers, selectedGroup, userSearchQuery])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentAccountId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Group name is required",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await createGroup(currentAccountId, {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        accountIds: [currentAccountId],
      })

      if (response.success && response.data) {
        toast({
          title: "Group Created",
          description: `Group "${response.data.name}" created successfully.`,
        })
        
        setIsCreateDialogOpen(false)
        setNewGroupName("")
        setNewGroupDescription("")
        
        // Recarregar grupos
        const groupsResponse = await listGroups(currentAccountId)
        if (groupsResponse.success && groupsResponse.data) {
          const groupsArray = Array.isArray(groupsResponse.data) ? groupsResponse.data : []
          const groupsWithMembers: Group[] = await Promise.all(
            groupsArray.map(async (apiGroup: ApiGroup) => {
              try {
                const membersResponse = await listGroupMembers(apiGroup.id)
                const membersArray = Array.isArray(membersResponse.data) ? membersResponse.data : []
                const members: User[] = membersArray.map((member: GroupMember) => ({
                  id: member.userId,
                  email: member.userEmail || "",
                  name: member.userName || "",
                  picture: member.userPicture,
                }))
                return {
                  id: apiGroup.id,
                  accountId: apiGroup.accountIds[0] || currentAccountId,
                  name: apiGroup.name,
                  description: apiGroup.description,
                  members,
                  createdBy: undefined,
                  createdAt: apiGroup.createdAt,
                  updatedAt: apiGroup.updatedAt,
                }
              } catch {
                return {
                  id: apiGroup.id,
                  accountId: apiGroup.accountIds[0] || currentAccountId,
                  name: apiGroup.name,
                  description: apiGroup.description,
                  members: [],
                  createdBy: undefined,
                  createdAt: apiGroup.createdAt,
                  updatedAt: apiGroup.updatedAt,
                }
              }
            })
          )
          setGroups(groupsWithMembers)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to create group",
        })
      }
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create group",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditGroup = async () => {
    if (!selectedGroup || !newGroupName.trim()) return

    setIsUpdating(true)
    try {
      const response = await updateGroup(selectedGroup.id, {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
      })

      if (response.success && response.data) {
        toast({
          title: "Group Updated",
          description: "Group updated successfully.",
        })

        setIsEditDialogOpen(false)
        setSelectedGroup(null)
        setNewGroupName("")
        setNewGroupDescription("")

        // Recarregar grupos
        if (currentAccountId) {
          const groupsResponse = await listGroups(currentAccountId)
          if (groupsResponse.success && groupsResponse.data) {
            const groupsArray = Array.isArray(groupsResponse.data) ? groupsResponse.data : []
            const groupsWithMembers: Group[] = await Promise.all(
              groupsArray.map(async (apiGroup: ApiGroup) => {
                try {
                  const membersResponse = await listGroupMembers(apiGroup.id)
                  const membersArray = Array.isArray(membersResponse.data) ? membersResponse.data : []
                  const members: User[] = membersArray.map((member: GroupMember) => ({
                    id: member.userId,
                    email: member.userEmail || "",
                    name: member.userName || "",
                    picture: member.userPicture,
                  }))
                  return {
                    id: apiGroup.id,
                    accountId: apiGroup.accountIds[0] || currentAccountId,
                    name: apiGroup.name,
                    description: apiGroup.description,
                    members,
                    createdBy: undefined,
                    createdAt: apiGroup.createdAt,
                    updatedAt: apiGroup.updatedAt,
                  }
                } catch {
                  return {
                    id: apiGroup.id,
                    accountId: apiGroup.accountIds[0] || currentAccountId,
                    name: apiGroup.name,
                    description: apiGroup.description,
                    members: [],
                    createdBy: undefined,
                    createdAt: apiGroup.createdAt,
                    updatedAt: apiGroup.updatedAt,
                  }
                }
              })
            )
            setGroups(groupsWithMembers)
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to update group",
        })
      }
    } catch (error) {
      console.error("Error updating group:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update group",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    const confirmed = await confirm({
      title: `Delete group "${group.name}"?`,
      description: `This will remove the group and all its permissions. Members will lose access granted through this group.\n\nThis action cannot be undone.`,
      variant: "destructive",
      confirmText: "Delete Group",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await deleteGroup(group.id)

      if (response.success) {
        toast({
          title: "Group Deleted",
          description: `Group "${group.name}" deleted successfully.`,
        })

        // Remover do estado local
        setGroups(groups.filter((g) => g.id !== group.id))
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to delete group",
        })
      }
    } catch (error) {
      console.error("Error deleting group:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete group",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedMembers.length === 0) return

    setIsAddingMembers(true)
    try {
      // Separar usuários reais de convites
      const realUserIds: string[] = []
      const inviteEmails: string[] = []

      selectedMembers.forEach((id) => {
        const user = availableMembers.find((u) => u.id === id)
        if (user?.isInvite || user?.canInvite) {
          // É um convite ou pode criar convite
          inviteEmails.push(user.email)
        } else {
          // É um usuário real
          realUserIds.push(id)
        }
      })

      // Adicionar usuários reais ao grupo
      const addPromises = realUserIds.map((userId) =>
        addGroupMember(selectedGroup.id, { userId })
      )

      // Criar convites para emails que não são usuários
      const invitePromises = inviteEmails.map((email) =>
        createInvite({
          email,
          groupId: selectedGroup.id,
          role: "member",
        })
      )

      await Promise.all([...addPromises, ...invitePromises])

      toast({
        title: "Members Added",
        description: `${selectedMembers.length} member(s) added to group.`,
      })

      setIsAddMembersDialogOpen(false)
      setSelectedGroup(null)
      setSelectedMembers([])

      // Recarregar grupos
      if (currentAccountId) {
        const groupsResponse = await listGroups(currentAccountId)
        if (groupsResponse.success && groupsResponse.data) {
          const groupsArray = Array.isArray(groupsResponse.data) ? groupsResponse.data : []
          const groupsWithMembers: Group[] = await Promise.all(
            groupsArray.map(async (apiGroup: ApiGroup) => {
              try {
                const membersResponse = await listGroupMembers(apiGroup.id)
                const membersArray = Array.isArray(membersResponse.data) ? membersResponse.data : []
                const members: User[] = membersArray.map((member: GroupMember) => ({
                  id: member.userId,
                  email: member.userEmail || "",
                  name: member.userName || "",
                  picture: member.userPicture,
                }))
                return {
                  id: apiGroup.id,
                  accountId: apiGroup.accountIds[0] || currentAccountId,
                  name: apiGroup.name,
                  description: apiGroup.description,
                  members,
                  createdBy: undefined,
                  createdAt: apiGroup.createdAt,
                  updatedAt: apiGroup.updatedAt,
                }
              } catch {
                return {
                  id: apiGroup.id,
                  accountId: apiGroup.accountIds[0] || currentAccountId,
                  name: apiGroup.name,
                  description: apiGroup.description,
                  members: [],
                  createdBy: undefined,
                  createdAt: apiGroup.createdAt,
                  updatedAt: apiGroup.updatedAt,
                }
              }
            })
          )
          setGroups(groupsWithMembers)
        }
      }
    } catch (error) {
      console.error("Error adding members:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add members",
      })
    } finally {
      setIsAddingMembers(false)
    }
  }

  const handleRemoveMember = async (group: Group, userId: string) => {
    const user = allUsers.find((u) => u.id === userId)
    const confirmed = await confirm({
      title: `Remove ${user?.name || user?.email} from group?`,
      description: `This will revoke all permissions granted through this group.`,
      variant: "destructive",
      confirmText: "Remove Member",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    setIsRemovingMember(true)
    try {
      const response = await removeGroupMember(group.id, userId)

      if (response.success) {
        toast({
          title: "Member Removed",
          description: `${user?.name || user?.email} removed from group.`,
        })

        // Recarregar grupos
        if (currentAccountId) {
          const groupsResponse = await listGroups(currentAccountId)
          if (groupsResponse.success && groupsResponse.data) {
            const groupsArray = Array.isArray(groupsResponse.data) ? groupsResponse.data : []
            const groupsWithMembers: Group[] = await Promise.all(
              groupsArray.map(async (apiGroup: ApiGroup) => {
                try {
                  const membersResponse = await listGroupMembers(apiGroup.id)
                  const membersArray = Array.isArray(membersResponse.data) ? membersResponse.data : []
                  const members: User[] = membersArray.map((member: GroupMember) => ({
                    id: member.userId,
                    email: member.userEmail || "",
                    name: member.userName || "",
                    picture: member.userPicture,
                  }))
                  return {
                    id: apiGroup.id,
                    accountId: apiGroup.accountIds[0] || currentAccountId,
                    name: apiGroup.name,
                    description: apiGroup.description,
                    members,
                    createdBy: undefined,
                    createdAt: apiGroup.createdAt,
                    updatedAt: apiGroup.updatedAt,
                  }
                } catch {
                  return {
                    id: apiGroup.id,
                    accountId: apiGroup.accountIds[0] || currentAccountId,
                    name: apiGroup.name,
                    description: apiGroup.description,
                    members: [],
                    createdBy: undefined,
                    createdAt: apiGroup.createdAt,
                    updatedAt: apiGroup.updatedAt,
                  }
                }
              })
            )
            setGroups(groupsWithMembers)
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to remove member",
        })
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member",
      })
    } finally {
      setIsRemovingMember(false)
    }
  }

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group)
    setNewGroupName(group.name)
    setNewGroupDescription(group.description || "")
    setIsEditDialogOpen(true)
  }

  const openAddMembersDialog = (group: Group) => {
    setSelectedGroup(group)
    setSelectedMembers([])
    setUserSearchQuery("")
    setIsAddMembersDialogOpen(true)
  }

  if (!currentAccountId) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-6 bg-background">
              <div className="mx-auto max-w-7xl">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Please select an organization first</p>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Groups</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage user groups and permissions
                  </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                      <DialogDescription>
                        Create a group to manage permissions for multiple users
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name *</Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="e.g., Frontend Team"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="group-description">Description</Label>
                        <Input
                          id="group-description"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreating}>
                        {isCreating ? "Creating..." : "Create Group"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Groups List */}
              {isLoadingGroups ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
                    <p className="text-muted-foreground">Loading groups...</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.map((group) => (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-primary" />
                              {group.name}
                            </CardTitle>
                            {group.description && (
                              <CardDescription className="mt-1">{group.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                              disabled={isUpdating || isDeleting}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group)}
                              disabled={isUpdating || isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Members</span>
                              <Badge variant="secondary">{group.members.length}</Badge>
                            </div>
                            {group.members.length > 0 ? (
                              <div className="space-y-2">
                                {group.members.slice(0, 3).map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{member.name || member.email}</p>
                                        {member.name && (
                                          <p className="text-xs text-muted-foreground">{member.email}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(group, member.id)}
                                      disabled={isRemovingMember}
                                    >
                                      <UserMinus className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                                {group.members.length > 3 && (
                                  <p className="text-xs text-muted-foreground text-center">
                                    +{group.members.length - 3} more member(s)
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No members yet
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => openAddMembersDialog(group)}
                            disabled={isAddingMembers}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Members
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoadingGroups && filteredGroups.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No groups found" : "No groups yet. Create your first group."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Edit Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Group</DialogTitle>
                    <DialogDescription>Update group information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-group-name">Group Name *</Label>
                      <Input
                        id="edit-group-name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g., Frontend Team"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-group-description">Description</Label>
                      <Input
                        id="edit-group-description"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditGroup} disabled={!newGroupName.trim() || isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add Members Dialog */}
              <Dialog open={isAddMembersDialogOpen} onOpenChange={setIsAddMembersDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Members to {selectedGroup?.name}</DialogTitle>
                    <DialogDescription>
                      Select users to add to this group. You can search for members of your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or email..."
                        className="pl-10"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                      />
                    </div>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                        {availableMembers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No users available</p>
                          </div>
                        ) : (
                          availableMembers.map((user) => (
                            <div
                              key={user.id}
                              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedMembers.includes(user.id)
                                  ? "bg-primary/10 border border-primary"
                                  : "bg-muted/50 hover:bg-muted"
                              }`}
                              onClick={() => {
                                setSelectedMembers((prev) =>
                                  prev.includes(user.id)
                                    ? prev.filter((id) => id !== user.id)
                                    : [...prev, user.id]
                                )
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user.name || user.email}</p>
                                  {user.name && (
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  )}
                                </div>
                              </div>
                              {selectedMembers.includes(user.id) && (
                                <Badge variant="default">Selected</Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddMembersDialogOpen(false)}
                      disabled={isAddingMembers}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMembers}
                      disabled={selectedMembers.length === 0 || isAddingMembers}
                    >
                      {isAddingMembers
                        ? "Adding..."
                        : `Add ${selectedMembers.length > 0 ? `${selectedMembers.length} ` : ""}Member${selectedMembers.length !== 1 ? "s" : ""}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Confirm Dialog */}
              <ConfirmDialog />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
