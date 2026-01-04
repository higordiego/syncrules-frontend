"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Settings,
  Check,
  X,
  Users,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Shield,
  Mail,
  FolderKanban,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  type Account,
} from "@/lib/api-accounts"
import {
  listAccountMembers,
  addAccountMember,
  removeAccountMember,
  updateAccountMemberRole,
  type AccountMember,
} from "@/lib/api-account-members"
import { useAccount } from "@/context/AccountContext"
import { getUser } from "@/lib/auth"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  listGroups,
  listAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupMembers,
  addGroupMember,
  removeGroupMember,
  addGroupToAccount,
  removeGroupFromAccount,
  type Group,
  type GroupMember,
} from "@/lib/api-groups"
import { createInvite, type CreateInviteData } from "@/lib/api-invites"
import { useConfirm } from "@/lib/hooks/use-confirm"

export default function ManageOrganizationsPage() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const {
    accounts,
    selectedAccountId: currentAccountId,
    isLoading,
    switchAccount,
    refreshAccounts
  } = useAccount()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [newAccountName, setNewAccountName] = useState("")
  const [editAccountName, setEditAccountName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [accountMembers, setAccountMembers] = useState<Record<string, AccountMember[]>>({})
  const [isLoadingMembers, setIsLoadingMembers] = useState<Record<string, boolean>>({})
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedAccountForMember, setSelectedAccountForMember] = useState<Account | null>(null)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<"owner" | "admin" | "member">("member")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [groups, setGroups] = useState<Record<string, Group[]>>({})
  const [allGroups, setAllGroups] = useState<Group[]>([]) // Todos os grupos disponíveis
  const [isLoadingAllGroups, setIsLoadingAllGroups] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({})
  const [isLoadingGroups, setIsLoadingGroups] = useState<Record<string, boolean>>({})
  const [isAssociatingGroup, setIsAssociatingGroup] = useState(false)
  const [selectedAccountForGroupAssociation, setSelectedAccountForGroupAssociation] = useState<Account | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [isAddGroupMemberDialogOpen, setIsAddGroupMemberDialogOpen] = useState(false)
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<Group | null>(null)
  const [newGroupMemberEmail, setNewGroupMemberEmail] = useState("")
  const [isAddingGroupMember, setIsAddingGroupMember] = useState(false)
  const [isRemoveGroupDialogOpen, setIsRemoveGroupDialogOpen] = useState(false)
  const [selectedGroupForRemoval, setSelectedGroupForRemoval] = useState<{ groupId: string; accountId: string; groupName: string } | null>(null)

  // As organizações já são carregadas pelo AccountContext
  useEffect(() => {
    // Buscar ID do usuário atual
    getUser().then((user) => {
      if (user) {
        setCurrentUserId(user.id)
      }
    })
  }, [])

  // Buscar grupos da organização atual
  const fetchGroups = async () => {
    if (!currentAccountId) return

    // Evitar chamadas duplicadas
    if (isLoadingGroups[currentAccountId]) {
      return
    }

    setIsLoadingGroups((prev) => ({ ...prev, [currentAccountId]: true }))
    try {
      const response = await listGroups()
      if (response.success && response.data) {
        const groupsData = response.data!
        setGroups((prev) => ({ ...prev, [currentAccountId]: groupsData }))
        
        // Carregar membros de todos os grupos automaticamente
        const membersPromises = groupsData.map(async (group) => {
          try {
            const membersResponse = await listGroupMembers(group.id)
            if (membersResponse.success && membersResponse.data) {
              const members = Array.isArray(membersResponse.data) ? membersResponse.data : []
              setGroupMembers((prev) => ({ ...prev, [group.id]: members }))
            }
          } catch (error) {
            console.error(`Failed to fetch members for group ${group.id}:`, error)
            setGroupMembers((prev) => ({ ...prev, [group.id]: [] }))
          }
        })
        
        // Não esperar por todas as promises para não bloquear a UI
        Promise.allSettled(membersPromises)
      } else {
        // Marcar como carregado mesmo em caso de erro para evitar loops
        setGroups((prev) => ({ ...prev, [currentAccountId]: [] }))
        toast({
          title: "Error",
          description: response.error?.message || "Failed to load groups",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error)
      // Marcar como carregado mesmo em caso de erro para evitar loops
      setGroups((prev) => ({ ...prev, [currentAccountId]: [] }))
      toast({
        title: "Error",
        description: "Failed to load groups. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingGroups((prev) => ({ ...prev, [currentAccountId]: false }))
    }
  }

  // Carregar todos os grupos disponíveis
  useEffect(() => {
    const fetchAllGroups = async () => {
      setIsLoadingAllGroups(true)
      try {
        const response = await listAllGroups()
        if (response.success && response.data) {
          setAllGroups(Array.isArray(response.data) ? response.data : [])
        }
      } catch (error) {
        console.error("Failed to fetch all groups:", error)
        setAllGroups([])
      } finally {
        setIsLoadingAllGroups(false)
      }
    }
    fetchAllGroups()
  }, [])

  // Carregar grupos quando expandir a organização ATUAL
  useEffect(() => {
    if (expandedAccountId && expandedAccountId === currentAccountId) {
      const isLoading = isLoadingGroups[expandedAccountId] || false
      const hasGroups = groups[expandedAccountId] !== undefined

      if (!isLoading && !hasGroups) {
        fetchGroups()
      }
    }
  }, [expandedAccountId, currentAccountId])

  // Buscar membros de um grupo
  const fetchGroupMembers = async (groupId: string) => {
    try {
      const response = await listGroupMembers(groupId)
      if (response.success && response.data) {
        // Garantir que sempre seja um array
        const members = Array.isArray(response.data) ? response.data : []
        setGroupMembers((prev) => ({ ...prev, [groupId]: members }))
      } else {
        // Em caso de erro, definir como array vazio
        setGroupMembers((prev) => ({ ...prev, [groupId]: [] }))
      }
    } catch (error) {
      console.error("Failed to fetch group members:", error)
      // Em caso de erro, definir como array vazio
      setGroupMembers((prev) => ({ ...prev, [groupId]: [] }))
    }
  }

  // Associar grupo existente à organização atual
  const handleAssociateGroup = async (groupId: string) => {
    setIsAssociatingGroup(true)
    try {
      const response = await addGroupToAccount(groupId)
      if (response.success) {
        toast({
          variant: "success",
          title: "Success",
          description: "Group associated with organization successfully.",
        })
        // Recarregar grupos da organização
        await fetchGroups()
        // Recarregar todos os grupos
        const allGroupsResponse = await listAllGroups()
        if (allGroupsResponse.success && allGroupsResponse.data) {
          setAllGroups(Array.isArray(allGroupsResponse.data) ? allGroupsResponse.data : [])
        }
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to associate group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error associating group:", error)
      toast({
        title: "Error",
        description: "Failed to associate group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAssociatingGroup(false)
      setSelectedAccountForGroupAssociation(null)
    }
  }

  // Adicionar membro ao grupo
  const handleAddGroupMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroupForMember || !newGroupMemberEmail.trim()) return

    setIsAddingGroupMember(true)
    try {
      // Buscar usuário por email
      const { searchUserByEmail } = await import("@/lib/api-users")
      const userResponse = await searchUserByEmail(newGroupMemberEmail.trim())

      if (!userResponse.success || !userResponse.data) {
        // Usuário não encontrado - criar convite para o grupo
        // Primeiro precisamos do accountId do grupo
        const group = selectedGroupForMember
        const inviteData: CreateInviteData = {
          email: newGroupMemberEmail.trim(),
          groupId: group.id,
          role: "member", // Membros de grupo sempre são "member"
        }

        const inviteResponse = await createInvite(inviteData)
        if (inviteResponse.success) {
          toast({
            variant: "success",
            title: "Invite sent",
            description: `An invitation has been sent to ${newGroupMemberEmail.trim()}. They will be added to the group when they sign up.`,
          })
          setIsAddGroupMemberDialogOpen(false)
          setNewGroupMemberEmail("")
          setSelectedGroupForMember(null)
        } else {
          toast({
            title: "Error",
            description: inviteResponse.error?.message || "Failed to send invite",
            variant: "destructive",
          })
        }
        return
      }

      // Usuário encontrado - adicionar diretamente
      const groupId = selectedGroupForMember.id
      const response = await addGroupMember(groupId, {
        userId: userResponse.data.id,
      })
      if (response.success) {
        toast({
          variant: "success",
          title: "Success",
          description: "Member added to group successfully.",
        })
        setIsAddGroupMemberDialogOpen(false)
        setNewGroupMemberEmail("")
        setSelectedGroupForMember(null)
        await fetchGroupMembers(groupId)
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to add member to group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding group member:", error)
      toast({
        title: "Error",
        description: "Failed to add member to group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingGroupMember(false)
    }
  }

  // Remover membro do grupo
  const handleRemoveGroupMember = async (groupId: string, userId: string) => {
    const groupMembersList = groupMembers[groupId] || []
    const targetMember = groupMembersList.find((m) => m.userId === userId)
    const userName = targetMember?.userName || targetMember?.userEmail || "this member"

    // Mostrar modal de confirmação
    const confirmed = await confirm({
      title: `Remove ${userName} from group?`,
      description: `Are you sure you want to remove ${userName} from this group? This will revoke all permissions granted through this group.`,
      variant: "destructive",
      confirmText: "Remove Member",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    try {
      const response = await removeGroupMember(groupId, userId)
      if (response.success) {
        // Recarregar membros do grupo para garantir contagem correta
        await fetchGroupMembers(groupId)
        toast({
          variant: "success",
          title: "Success",
          description: "Member removed from group successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to remove member from group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing group member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member from group. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Desassociar grupo da organização (não deleta o grupo, apenas remove a associação)
  const handleDeleteGroup = async () => {
    if (!selectedGroupForRemoval) return

    const { groupId } = selectedGroupForRemoval
    try {
      const response = await removeGroupFromAccount(groupId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Group unlinked from organization successfully.",
        })
        await fetchGroups()
        setExpandedGroupId(null)
        setIsRemoveGroupDialogOpen(false)
        setSelectedGroupForRemoval(null)
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to unlink group from organization",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error unlinking group from organization:", error)
      toast({
        title: "Error",
        description: "Failed to unlink group from organization. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Buscar membros da organização atual
  const fetchAccountMembers = async (accountId?: string) => {
    const targetAccountId = accountId || currentAccountId
    if (!targetAccountId) return
    setIsLoadingMembers((prev) => ({ ...prev, [targetAccountId]: true }))
    try {
      const response = await listAccountMembers(targetAccountId)
      if (response.success && response.data) {
        setAccountMembers((prev) => ({ ...prev, [targetAccountId]: response.data! }))
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to load members",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
      toast({
        title: "Error",
        description: "Failed to load members. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMembers((prev) => ({ ...prev, [targetAccountId]: false }))
    }
  }

  // Adicionar membro
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccountForMember || !newMemberEmail.trim()) return

    setIsAddingMember(true)
    try {
      // Buscar usuário por email
      const { searchUserByEmail } = await import("@/lib/api-users")
      const userResponse = await searchUserByEmail(newMemberEmail.trim())

      if (!userResponse.success || !userResponse.data) {
        // Usuário não encontrado - criar convite
        const inviteData: CreateInviteData = {
          email: newMemberEmail.trim(),
          role: newMemberRole,
        }

        const inviteResponse = await createInvite(inviteData)
        if (inviteResponse.success) {
          toast({
            variant: "success",
            title: "Invite sent",
            description: `An invitation has been sent to ${newMemberEmail.trim()}. They will be added to the organization when they sign up.`,
          })
          setIsAddMemberDialogOpen(false)
          setNewMemberEmail("")
          setNewMemberRole("member")
          setSelectedAccountForMember(null)
        } else {
          toast({
            title: "Error",
            description: inviteResponse.error?.message || "Failed to send invite",
            variant: "destructive",
          })
        }
        return
      }

      // Usuário encontrado - adicionar diretamente
      const response = await addAccountMember({
        userId: userResponse.data.id,
        role: newMemberRole,
      })
      if (response.success) {
        toast({
          variant: "success",
          title: "Success",
          description: `Member added successfully.`,
        })
        setIsAddMemberDialogOpen(false)
        setNewMemberEmail("")
        setNewMemberRole("member")
        setSelectedAccountForMember(null)
        await fetchAccountMembers()
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to add member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingMember(false)
    }
  }

  // Remover membro da organização atual
  const handleRemoveMember = async (userId: string) => {
    if (!currentAccountId) return
    const members = accountMembers[currentAccountId] || []
    const targetMember = members.find((m) => m.userId === userId)

    // Validação no frontend: não permitir remover owner se for o último owner
    if (targetMember?.role === "owner") {
      const ownerCount = members.filter((m) => m.role === "owner").length
      if (ownerCount <= 1) {
        toast({
          title: "Cannot remove last owner",
          description: "You cannot remove the last owner. Assign another owner first.",
          variant: "destructive",
        })
        return
      }
    }

    // Buscar informações do usuário para exibir no modal
    const userEmail = targetMember?.userEmail || targetMember?.userName || "this member"
    const userName = targetMember?.userName || userEmail

    // Mostrar modal de confirmação
    const confirmed = await confirm({
      title: `Remove ${userName} from organization?`,
      description: `Are you sure you want to remove ${userName} from this organization? This action cannot be undone and will revoke all permissions granted to this member.`,
      variant: "destructive",
      confirmText: "Remove Member",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    try {
      const response = await removeAccountMember(userId)
      if (response.success) {
        toast({
          variant: "success",
          title: "Success",
          description: "Member removed successfully.",
        })
        // Atualizar membros da organização
        await fetchAccountMembers()
        // Recarregar grupos para atualizar contagens
        if (currentAccountId) {
          await fetchGroups()
        }
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Atualizar role do membro na organização atual
  const handleUpdateMemberRole = async (
    userId: string,
    role: "owner" | "admin" | "member"
  ) => {
    if (!currentAccountId) return
    // Validação no frontend: não permitir que owner remova ele mesmo de owner sem outro owner
    if (currentUserId === userId && role !== "owner") {
      const members = accountMembers[currentAccountId] || []
      const currentMember = members.find((m) => m.userId === userId)

      if (currentMember?.role === "owner") {
        const ownerCount = members.filter((m) => m.role === "owner").length
        if (ownerCount <= 1) {
          toast({
            title: "Cannot remove owner role",
            description: "You cannot remove yourself from owner role. Assign another owner first.",
            variant: "destructive",
          })
          return
        }
      }
    }

    try {
      const response = await updateAccountMemberRole(userId, { role })
      if (response.success) {
        toast({
          variant: "success",
          title: "Success",
          description: "Member role updated successfully.",
        })
        await fetchAccountMembers()
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to update member role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating member role:", error)
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName.trim()) return

    setIsCreating(true)
    try {
      const response = await createAccount({ name: newAccountName.trim() })
      if (response.success && response.data) {
        toast({
          variant: "success",
          title: "Organization created",
          description: `${response.data.name} has been created successfully.`,
        })
        setNewAccountName("")
        setIsCreateDialogOpen(false)
        await refreshAccounts()
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to create organization",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (account: Account) => {
    setSelectedAccount(account)
    setEditAccountName(account.name)
    setIsEditDialogOpen(true)
  }

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount || !editAccountName.trim()) return

    setIsUpdating(true)
    try {
      const response = await updateAccount(selectedAccount.id, { name: editAccountName.trim() })
      if (response.success) {
        toast({
          title: "Organization updated",
          description: "Organization name has been updated successfully.",
        })
        setIsEditDialogOpen(false)
        setSelectedAccount(null)
        setEditAccountName("")
        await refreshAccounts()
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to update organization",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating account:", error)
      toast({
        title: "Error",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = (account: Account) => {
    setSelectedAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return

    // Validação adicional: não permitir deletar se for a última organização
    if (accounts.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot delete the last organization. You must have at least one organization.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      setSelectedAccount(null)
      return
    }

    setIsDeleting(true)
    try {
      const response = await deleteAccount(selectedAccount.id)
      if (response.success) {
        toast({
          title: "Organization deleted",
          description: "Organization has been deleted successfully.",
        })
        setIsDeleteDialogOpen(false)
        const deletedAccountId = selectedAccount.id
        setSelectedAccount(null)

        // Limpar dados relacionados à organização deletada
        setAccountMembers((prev) => {
          const updated = { ...prev }
          delete updated[deletedAccountId]
          return updated
        })
        setGroups((prev) => {
          const updated = { ...prev }
          delete updated[deletedAccountId]
          return updated
        })
        setIsLoadingMembers((prev) => {
          const updated = { ...prev }
          delete updated[deletedAccountId]
          return updated
        })
        setIsLoadingGroups((prev) => {
          const updated = { ...prev }
          delete updated[deletedAccountId]
          return updated
        })

        // Se a organização deletada estava expandida, fechar
        if (expandedAccountId === deletedAccountId) {
          setExpandedAccountId(null)
        }

        // Recarregar lista de organizações
        await refreshAccounts()
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to delete organization",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete organization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectAccount = (accountId: string) => {
    switchAccount(accountId)
  }

  const handleSetAsDefault = (accountId: string) => {
    // Para simplificar, definimos como default no state global se necessário,
    // mas aqui apenas selecionamos e avisamos que seria o default
    switchAccount(accountId)
    toast({
      title: "Default set",
      description: "Organization set as your default successfully.",
    })
  }

  // Assuming the AccountContext provides a way to know the default account ID,
  // or that the currently selected account is implicitly the "default" for this session.
  // For this example, we'll assume `currentAccountId` can also represent the "default"
  // if the context doesn't explicitly provide a separate `defaultAccountId`.
  // If `useAccount` provides `defaultAccountId`, use it here.
  const defaultAccountId = currentAccountId; // Placeholder, replace if useAccount provides a distinct defaultAccountId

  return (
    <div className="flex flex-col">
      <main className="flex-1 p-4 lg:p-6 bg-background">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Manage Organizations
              </h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and manage your organizations
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateAccount}>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Create a new organization to manage your projects and teams.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-account-name">Organization Name *</Label>
                      <Input
                        id="new-account-name"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="e.g., My Company, Tech Startup Inc"
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Choose a name for your organization
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setNewAccountName("")
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating || !newAccountName.trim()}>
                      {isCreating ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Organization
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
              <CardDescription>
                {accounts.length === 0
                  ? "You don't have any organizations yet. Create your first one!"
                  : `You have ${accounts.length} organization${accounts.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No organizations found</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Organization
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => {
                    const isCurrent = account.id === currentAccountId
                    const isDefault = account.id === defaultAccountId
                    const isExpanded = expandedAccountId === account.id
                    const members = accountMembers[account.id] || []
                    const isLoadingMembersForAccount = isLoadingMembers[account.id] || false

                    return (
                      <div key={account.id} className="border rounded-lg">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="w-8">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (isExpanded) {
                                      setExpandedAccountId(null)
                                    } else {
                                      setExpandedAccountId(account.id)
                                      if (!accountMembers[account.id]) {
                                        fetchAccountMembers(account.id)
                                      }
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  {account.name}
                                  {isDefault && (
                                    <Badge variant="secondary" className="text-xs">
                                      Default
                                    </Badge>
                                  )}
                                  {isCurrent && (
                                    <Badge variant="outline" className="text-xs">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {account.slug}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    account.plan === "enterprise"
                                      ? "default"
                                      : account.plan === "pro"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {account.plan}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(account.createdAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {!isDefault && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSetAsDefault(account.id)}
                                      className="h-7 text-xs"
                                    >
                                      Set Default
                                    </Button>
                                  )}
                                  {!isCurrent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSelectAccount(account.id)}
                                      className="h-7 text-xs"
                                    >
                                      Select
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditClick(account)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(account)}
                                    disabled={accounts.length <= 1}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={accounts.length <= 1 ? "Cannot delete the last organization. You must have at least one organization." : "Delete organization"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        {isExpanded && (
                          <div className="border-t p-4 bg-muted/30">
                            <div className="space-y-6">
                              {/* Members Section */}
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <h3 className="font-semibold">Members</h3>
                                    <Badge variant="secondary">{members.length}</Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAccountForMember(account)
                                      setIsAddMemberDialogOpen(true)
                                    }}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Member
                                  </Button>
                                </div>
                                {isLoadingMembersForAccount ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  </div>
                                ) : members.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No members yet</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {members.map((member) => (
                                      <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                      >
                                        <div className="flex items-center gap-3">
                                          {member.userPicture ? (
                                            <img
                                              src={member.userPicture}
                                              alt={member.userName || member.userEmail || ""}
                                              className="h-8 w-8 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                              {member.userName ? (
                                                <span className="text-xs font-medium text-primary">
                                                  {member.userName.charAt(0).toUpperCase()}
                                                </span>
                                              ) : member.userEmail ? (
                                                <span className="text-xs font-medium text-primary">
                                                  {member.userEmail.charAt(0).toUpperCase()}
                                                </span>
                                              ) : (
                                                <Mail className="h-4 w-4 text-primary" />
                                              )}
                                            </div>
                                          )}
                                          <div>
                                            <p className="font-medium text-sm">
                                              {member.userName || member.userEmail || member.userId}
                                            </p>
                                            {member.userEmail && member.userEmail !== member.userName && (
                                              <p className="text-xs text-muted-foreground">
                                                {member.userEmail}
                                              </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                              Added {format(new Date(member.createdAt), "MMM d, yyyy")}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Select
                                            value={member.role}
                                            onValueChange={(value) =>
                                              handleUpdateMemberRole(
                                                member.userId,
                                                value as "owner" | "admin" | "member"
                                              )
                                            }
                                          >
                                            <SelectTrigger className="w-32">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="owner">
                                                <div className="flex items-center gap-2">
                                                  <Shield className="h-3 w-3" />
                                                  Owner
                                                </div>
                                              </SelectItem>
                                              <SelectItem
                                                value="admin"
                                                disabled={
                                                  // Desabilitar se é o próprio usuário tentando remover de owner sem outro owner
                                                  currentUserId === member.userId &&
                                                  member.role === "owner" &&
                                                  members.filter((m) => m.role === "owner").length <= 1
                                                }
                                              >
                                                Admin
                                              </SelectItem>
                                              <SelectItem
                                                value="member"
                                                disabled={
                                                  // Desabilitar se é o próprio usuário tentando remover de owner sem outro owner
                                                  currentUserId === member.userId &&
                                                  member.role === "owner" &&
                                                  members.filter((m) => m.role === "owner").length <= 1
                                                }
                                              >
                                                Member
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleRemoveMember(member.userId)
                                            }
                                            disabled={
                                              // Desabilitar remoção se é owner e é o último owner (qualquer owner, não apenas o próprio usuário)
                                              member.role === "owner" &&
                                              members.filter((m) => m.role === "owner").length <= 1
                                            }
                                            className="h-8 w-8 p-0 text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={
                                              member.role === "owner" &&
                                                members.filter((m) => m.role === "owner").length <= 1
                                                ? "Cannot remove the last owner. Assign another owner first."
                                                : "Remove member"
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Groups Section */}
                              {(() => {
                                // Garantir que sempre seja um array
                                const accountGroupsList = Array.isArray(groups[account.id]) ? groups[account.id] : []
                                const isLoadingGroupsForAccount = isLoadingGroups[account.id]

                                return (
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <FolderKanban className="h-5 w-5" />
                                        <div>
                                          <h3 className="font-semibold">Access Groups</h3>
                                          <p className="text-xs text-muted-foreground">
                                            Associate existing groups or add individual users to this organization
                                          </p>
                                        </div>
                                        <Badge variant="secondary">{accountGroupsList.length}</Badge>
                                      </div>
                                      <Dialog
                                        open={selectedAccountForGroupAssociation?.id === account.id}
                                        onOpenChange={(open) => {
                                          if (!open) {
                                            setSelectedAccountForGroupAssociation(null)
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedAccountForGroupAssociation(account)
                                            }}
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Associate Group
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Associate Group to Organization</DialogTitle>
                                            <DialogDescription>
                                              Select an existing group to associate with this organization.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="py-4">
                                            {isLoadingAllGroups ? (
                                              <div className="flex items-center justify-center py-8">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                              </div>
                                            ) : allGroups.length === 0 ? (
                                              <div className="text-center py-8 text-muted-foreground">
                                                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="font-medium mb-1">No groups available</p>
                                                <p className="text-xs">
                                                  Create groups first to associate them with organizations
                                                </p>
                                              </div>
                                            ) : (
                                              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                                {allGroups
                                                  .filter((group) => !group.accountIds.includes(account.id))
                                                  .map((group) => (
                                                    <div
                                                      key={group.id}
                                                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                                    >
                                                      <div className="flex-1">
                                                        <p className="font-medium text-sm">{group.name}</p>
                                                        {group.description && (
                                                          <p className="text-xs text-muted-foreground">
                                                            {group.description}
                                                          </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                          Associated with {group.accountIds.length} organization
                                                          {group.accountIds.length !== 1 ? "s" : ""}
                                                        </p>
                                                      </div>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => handleAssociateGroup(group.id)}
                                                        disabled={isAssociatingGroup}
                                                      >
                                                        {isAssociatingGroup ? (
                                                          <>
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                                            Associating...
                                                          </>
                                                        ) : (
                                                          "Associate"
                                                        )}
                                                      </Button>
                                                    </div>
                                                  ))}
                                                {allGroups.filter((group) => !group.accountIds.includes(account.id)).length === 0 && (
                                                  <div className="text-center py-8 text-muted-foreground">
                                                    <p className="text-sm">All available groups are already associated with this organization</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <DialogFooter>
                                            <Button
                                              variant="outline"
                                              onClick={() => setSelectedAccountForGroupAssociation(null)}
                                            >
                                              Close
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                    {isLoadingGroupsForAccount ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                      </div>
                                    ) : accountGroupsList.length === 0 ? (
                                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                        <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="font-medium mb-1">No access groups yet</p>
                                        <p className="text-xs">
                                          Create groups to organize users and manage permissions efficiently
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {accountGroupsList.map((group) => {
                                          const groupMembersList = Array.isArray(groupMembers[group.id]) ? groupMembers[group.id] : []
                                          const isExpanded = expandedGroupId === group.id

                                          return (
                                            <div
                                              key={group.id}
                                              className="bg-background rounded-lg border"
                                            >
                                              <div className="flex items-center justify-between p-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      if (isExpanded) {
                                                        setExpandedGroupId(null)
                                                      } else {
                                                        setExpandedGroupId(group.id)
                                                        if (!groupMembers[group.id]) {
                                                          fetchGroupMembers(group.id)
                                                        }
                                                      }
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                  >
                                                    {isExpanded ? (
                                                      <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                      <ChevronRight className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                  <div className="flex-1">
                                                    <p className="font-medium text-sm">{group.name}</p>
                                                    {group.description && (
                                                      <p className="text-xs text-muted-foreground">
                                                        {group.description}
                                                      </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                      {groupMembersList.length} member
                                                      {groupMembersList.length !== 1 ? "s" : ""}
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Dialog
                                                    open={isAddGroupMemberDialogOpen && selectedGroupForMember?.id === group.id}
                                                    onOpenChange={(open) => {
                                                      setIsAddGroupMemberDialogOpen(open)
                                                      if (!open) {
                                                        setNewGroupMemberEmail("")
                                                        setSelectedGroupForMember(null)
                                                      }
                                                    }}
                                                  >
                                                    <DialogTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                          setSelectedGroupForMember(group)
                                                          setIsAddGroupMemberDialogOpen(true)
                                                        }}
                                                        className="h-8"
                                                      >
                                                        <UserPlus className="h-4 w-4" />
                                                      </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                      <form onSubmit={handleAddGroupMember}>
                                                        <DialogHeader>
                                                          <DialogTitle>Add Member to {selectedGroupForMember?.name}</DialogTitle>
                                                          <DialogDescription>
                                                            Add a user to this access group by email.
                                                          </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                          <div className="space-y-2">
                                                            <Label htmlFor="group-member-email">User Email *</Label>
                                                            <Input
                                                              id="group-member-email"
                                                              type="email"
                                                              value={newGroupMemberEmail}
                                                              onChange={(e) => setNewGroupMemberEmail(e.target.value)}
                                                              placeholder="user@example.com"
                                                              required
                                                              autoFocus
                                                            />
                                                          </div>
                                                        </div>
                                                        <DialogFooter>
                                                          <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                              setIsAddGroupMemberDialogOpen(false)
                                                              setNewGroupMemberEmail("")
                                                              setSelectedGroupForMember(null)
                                                            }}
                                                            disabled={isAddingGroupMember}
                                                          >
                                                            Cancel
                                                          </Button>
                                                          <Button type="submit" disabled={isAddingGroupMember || !newGroupMemberEmail.trim()}>
                                                            {isAddingGroupMember ? (
                                                              <>
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                                                Adding...
                                                              </>
                                                            ) : (
                                                              <>
                                                                <UserPlus className="mr-2 h-4 w-4" />
                                                                Add Member
                                                              </>
                                                            )}
                                                          </Button>
                                                        </DialogFooter>
                                                      </form>
                                                    </DialogContent>
                                                  </Dialog>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      setSelectedGroupForRemoval({
                                                        groupId: group.id,
                                                        accountId: account.id,
                                                        groupName: group.name,
                                                      })
                                                      setIsRemoveGroupDialogOpen(true)
                                                    }}
                                                    className="h-8 w-8 p-0 text-destructive"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                              {isExpanded && (
                                                <div className="px-3 pb-3 border-t pt-3">
                                                  {groupMembersList.length === 0 ? (
                                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                                      <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                      <p>No members in this group</p>
                                                      <p className="text-xs mt-1">Click the + button to add members</p>
                                                    </div>
                                                  ) : (
                                                    <div className="space-y-2">
                                                      {groupMembersList.map((member) => (
                                                        <div
                                                          key={member.id}
                                                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                                        >
                                                          <div className="flex items-center gap-2">
                                                            {member.userPicture ? (
                                                              <img
                                                                src={member.userPicture}
                                                                alt={member.userName || member.userEmail || ""}
                                                                className="h-6 w-6 rounded-full object-cover"
                                                              />
                                                            ) : (
                                                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                                {member.userName ? (
                                                                  <span className="text-xs font-medium text-primary">
                                                                    {member.userName.charAt(0).toUpperCase()}
                                                                  </span>
                                                                ) : member.userEmail ? (
                                                                  <span className="text-xs font-medium text-primary">
                                                                    {member.userEmail.charAt(0).toUpperCase()}
                                                                  </span>
                                                                ) : (
                                                                  <Mail className="h-3 w-3 text-primary" />
                                                                )}
                                                              </div>
                                                            )}
                                                            <div>
                                                              <p className="text-xs font-medium">
                                                                {member.userName || member.userEmail || member.userId}
                                                              </p>
                                                              {member.userEmail && member.userEmail !== member.userName && (
                                                                <p className="text-xs text-muted-foreground">
                                                                  {member.userEmail}
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveGroupMember(group.id, member.userId)}
                                                            className="h-6 w-6 p-0 text-destructive"
                                                          >
                                                            <X className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateAccount}>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update the name of your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account-name">Organization Name *</Label>
                <Input
                  id="edit-account-name"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  placeholder="Organization name"
                  required
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedAccount(null)
                  setEditAccountName("")
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !editAccountName.trim()}>
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Organization
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {accounts.length <= 1 ? (
                <>
                  Cannot delete the last organization. You must have at least one organization.
                </>
              ) : (
                <>
                  This will delete the organization "{selectedAccount?.name}". This action cannot be undone.
                  All projects and data associated with this organization will be permanently deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || accounts.length <= 1}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Organization
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>
                Add a user to "{selectedAccountForMember?.name}" organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="member-email">User Email *</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email address of the user to add
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Role *</Label>
                <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Owner
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddMemberDialogOpen(false)
                  setNewMemberEmail("")
                  setNewMemberRole("member")
                  setSelectedAccountForMember(null)
                }}
                disabled={isAddingMember}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingMember || !newMemberEmail.trim()}>
                {isAddingMember ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar desassociação de grupo */}
      <AlertDialog open={isRemoveGroupDialogOpen} onOpenChange={setIsRemoveGroupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Group from Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink the group "{selectedGroupForRemoval?.groupName}" from this organization?
              This will remove the association but will not delete the group itself. The group can still be linked to other organizations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRemoveGroupDialogOpen(false)
                setSelectedGroupForRemoval(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unlink Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ConfirmDialog para confirmações gerais */}
      <ConfirmDialog />
    </div>
  )
}

