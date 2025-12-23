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
import { Badge } from "@/components/ui/badge"
import { Mail, Users, Building2 } from "lucide-react"
import { getMyPendingInvites, acceptInvite, rejectInvite, type Invite } from "@/lib/api-invites"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface InvitesPendingDialogProps {
  userEmail: string
  onClose?: () => void
}

export function InvitesPendingDialog({ userEmail, onClose }: InvitesPendingDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const fetchInvites = async () => {
      setIsLoading(true)
      try {
        const response = await getMyPendingInvites()
        if (response.success && response.data) {
          setInvites(Array.isArray(response.data) ? response.data : [])
        }
      } catch (error) {
        console.error("Failed to fetch pending invites:", error)
        setInvites([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvites()
  }, [])

  const handleAccept = async (inviteId: string) => {
    setIsProcessing(true)
    try {
      const response = await acceptInvite(inviteId)
      if (response.success) {
        toast({
          title: "Invite Accepted",
          description: "You have been added successfully.",
        })
        // Remover convite da lista
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
        
        // Se não há mais convites, fechar diálogo
        if (invites.length === 1) {
          setOpen(false)
          if (onClose) onClose()
          // Recarregar página para atualizar dados
          router.refresh()
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to accept invite",
        })
      }
    } catch (error) {
      console.error("Error accepting invite:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept invite",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (inviteId: string) => {
    setIsProcessing(true)
    try {
      const response = await rejectInvite(inviteId)
      if (response.success) {
        toast({
          title: "Invite Rejected",
          description: "The invite has been removed.",
        })
        // Remover convite da lista
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
        
        // Se não há mais convites, fechar diálogo
        if (invites.length === 1) {
          setOpen(false)
          if (onClose) onClose()
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error?.message || "Failed to reject invite",
        })
      }
    } catch (error) {
      console.error("Error rejecting invite:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject invite",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectAll = async () => {
    setIsProcessing(true)
    try {
      const rejectPromises = invites.map((inv) => rejectInvite(inv.id))
      await Promise.all(rejectPromises)
      
      toast({
        title: "All Invites Rejected",
        description: "All invites have been removed.",
      })
      
      setInvites([])
      setOpen(false)
      if (onClose) onClose()
    } catch (error) {
      console.error("Error rejecting invites:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject some invites",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checking Invites...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (invites.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen && onClose) {
        onClose()
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>You Have Pending Invites</DialogTitle>
          <DialogDescription>
            You have been invited to join {invites.length} {invites.length === 1 ? "group or organization" : "groups or organizations"}.
            Choose to accept or reject each invite.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto py-4">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-start justify-between p-4 border rounded-lg bg-muted/50"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                  {invite.groupId ? (
                    <Users className="h-5 w-5 text-primary" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {invite.groupId ? "Group Invite" : "Organization Invite"}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {invite.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invite.groupId
                      ? "You've been invited to join a group"
                      : "You've been invited to join an organization"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Invited by email: {invite.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(invite.id)}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(invite.id)}
                  disabled={isProcessing}
                >
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleRejectAll}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Reject All
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              if (onClose) onClose()
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Review Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

