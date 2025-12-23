"use client"

import { useState, useCallback } from "react"
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
import { AlertTriangle, Info, AlertCircle } from "lucide-react"
import { createContext, useContext, ReactNode } from "react"

interface ConfirmOptions {
  title: string
  description: string
  variant?: "default" | "destructive" | "warning"
  confirmText?: string
  cancelText?: string
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          ...options,
          isOpen: true,
          onConfirm: () => {
            setConfirmState(null)
            resolve(true)
          },
          onCancel: () => {
            setConfirmState(null)
            resolve(false)
          },
        })
      })
    },
    []
  )

  const ConfirmDialog = () => {
    if (!confirmState) return null

    const { title, description, variant = "default", confirmText = "Confirm", cancelText = "Cancel", isOpen, onConfirm, onCancel } = confirmState

    const getIcon = () => {
      switch (variant) {
        case "destructive":
          return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        case "warning":
          return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        default:
          return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      }
    }

    const getConfirmButtonClass = () => {
      switch (variant) {
        case "destructive":
          return "bg-red-600 hover:bg-red-700 focus:ring-red-600"
        case "warning":
          return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
        default:
          return "bg-primary hover:bg-primary/90"
      }
    }

    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {getIcon()}
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line pt-2">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className={getConfirmButtonClass()}>
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return { confirm, ConfirmDialog }
}

