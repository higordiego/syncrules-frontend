"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, User, Users, Clock, UserPlus, Users as UsersIcon } from "lucide-react"
import type { User as UserType, Group } from "@/lib/types/governance"

interface UserGroupSelectorProps {
  type: "user" | "group"
  availableUsers: UserType[]
  availableGroups: Group[]
  currentUserId?: string
  userGroups?: Group[] // Grupos que o usuário atual participa
  recentlyInvited?: UserType[] // Últimos convidados
  usersYouInvited?: UserType[] // Usuários que você convidou
  canViewOtherUsers?: boolean // Se o usuário tem permissão para ver outros usuários
  selectedId: string
  onSelect: (id: string) => void
  onEmailSearch?: (email: string) => Promise<UserType | null> // Callback para buscar usuário por email
  placeholder?: string
}

export function UserGroupSelector({
  type,
  availableUsers,
  availableGroups,
  currentUserId,
  userGroups = [],
  recentlyInvited = [],
  usersYouInvited = [],
  canViewOtherUsers = true, // Por padrão permite ver outros usuários
  selectedId,
  onSelect,
  onEmailSearch,
  placeholder,
}: UserGroupSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [isSearchingEmail, setIsSearchingEmail] = useState(false)
  const [foundUser, setFoundUser] = useState<UserType | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Filtrar e ordenar usuários/grupos baseado em relevância
  const filteredAndSorted = useMemo(() => {
    if (type === "user") {
      const allUsers = [...availableUsers]
      
      // Ordenar por relevância:
      // 1. Usuários que você convidou (mais relevante)
      // 2. Últimos convidados
      // 3. Membros de grupos que você participa
      // 4. Outros usuários
      const sorted = allUsers.sort((a, b) => {
        const aInvited = usersYouInvited.some((u) => u.id === a.id) ? 1 : 0
        const bInvited = usersYouInvited.some((u) => u.id === b.id) ? 1 : 0
        if (aInvited !== bInvited) return bInvited - aInvited

        const aRecent = recentlyInvited.some((u) => u.id === a.id) ? 1 : 0
        const bRecent = recentlyInvited.some((u) => u.id === b.id) ? 1 : 0
        if (aRecent !== bRecent) return bRecent - aRecent

        const aInGroup = userGroups.some((g) => g.members.some((m) => m.id === a.id)) ? 1 : 0
        const bInGroup = userGroups.some((g) => g.members.some((m) => m.id === b.id)) ? 1 : 0
        if (aInGroup !== bInGroup) return bInGroup - aInGroup

        return 0
      })

      // Filtrar por busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return sorted.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
      }

      return sorted
    } else {
      // Para grupos, apenas filtrar por busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return availableGroups.filter(
          (group) =>
            group.name.toLowerCase().includes(query) ||
            group.description?.toLowerCase().includes(query)
        )
      }
      return availableGroups
    }
  }, [
    type,
    availableUsers,
    availableGroups,
    searchQuery,
    usersYouInvited,
    recentlyInvited,
    userGroups,
  ])

  const getRelevanceBadge = (item: UserType | Group) => {
    if (type === "user") {
      const user = item as UserType
      if (usersYouInvited.some((u) => u.id === user.id)) {
        return (
          <Badge variant="default" className="text-xs">
            <UserPlus className="h-3 w-3 mr-1" />
            You invited
          </Badge>
        )
      }
      if (recentlyInvited.some((u) => u.id === user.id)) {
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Recent
          </Badge>
        )
      }
      if (userGroups.some((g) => g.members.some((m) => m.id === user.id))) {
        return (
          <Badge variant="outline" className="text-xs">
            <UsersIcon className="h-3 w-3 mr-1" />
            In your groups
          </Badge>
        )
      }
    }
    return null
  }

  // Se não pode ver outros usuários e é tipo user, mostrar campo de email
  const showEmailInput = type === "user" && !canViewOtherUsers

  const handleEmailSearch = async () => {
    if (!emailInput.trim() || !onEmailSearch) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailInput.trim())) {
      setEmailError("Please enter a valid email address")
      return
    }

    setIsSearchingEmail(true)
    setEmailError(null)
    try {
      const user = await onEmailSearch(emailInput.trim())
      if (user) {
        setFoundUser(user)
        onSelect(user.id)
      } else {
        setEmailError("User not found. They may need to be invited first.")
      }
    } catch (error) {
      setEmailError("Error searching for user. Please try again.")
    } finally {
      setIsSearchingEmail(false)
    }
  }

  if (showEmailInput) {
    return (
      <div className="space-y-2">
        <Label>User Email</Label>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter user email address..."
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                setEmailError(null)
                setFoundUser(null)
                if (selectedId) onSelect("") // Limpa seleção se mudar email
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleEmailSearch()
                }
              }}
              className="pl-10"
              disabled={isSearchingEmail}
            />
          </div>
          {emailError && (
            <p className="text-xs text-red-600 dark:text-red-400">{emailError}</p>
          )}
          {foundUser && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{foundUser.name}</p>
                  <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                </div>
                <Badge variant="default" className="text-xs">
                  Selected
                </Badge>
              </div>
            </div>
          )}
          {onEmailSearch && (
            <Button
              type="button"
              onClick={handleEmailSearch}
              disabled={!emailInput.trim() || isSearchingEmail}
              className="w-full"
              size="sm"
            >
              {isSearchingEmail ? "Searching..." : "Search User"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Enter the email address of the user you want to grant permission to.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{type === "user" ? "User" : "Group"}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder || `Search ${type === "user" ? "users" : "groups"}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
        {filteredAndSorted.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No {type === "user" ? "users" : "groups"} found
          </div>
        ) : (
          filteredAndSorted.map((item) => {
            const isSelected = selectedId === item.id
            const Icon = type === "user" ? User : Users

            return (
              <div
                key={item.id}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelect(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {getRelevanceBadge(item)}
                      </div>
                      {type === "user" && (
                        <p className="text-xs text-muted-foreground truncate">
                          {(item as UserType).email}
                        </p>
                      )}
                      {type === "group" && (
                        <p className="text-xs text-muted-foreground">
                          {(item as Group).members?.length || (item as Group).memberCount || 0} member
                          {((item as Group).members?.length || (item as Group).memberCount || 0) !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      {type === "user" && filteredAndSorted.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p className="flex items-center gap-1">
            <UserPlus className="h-3 w-3" />
            Users you invited
          </p>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Recently invited users
          </p>
          <p className="flex items-center gap-1">
            <UsersIcon className="h-3 w-3" />
            Members of groups you participate in
          </p>
        </div>
      )}
    </div>
  )
}

