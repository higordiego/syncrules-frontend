"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { listAccounts, type Account } from "@/lib/api-accounts"
import { setGlobalAccountId } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface AccountContextType {
    selectedAccountId: string | null
    selectedAccount: Account | null
    accounts: Account[]
    isLoading: boolean
    switchAccount: (accountId: string) => void
    refreshAccounts: () => Promise<void>
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

const ACCOUNT_STORAGE_KEY = "syncrules_current_account"

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()

    const refreshAccounts = useCallback(async () => {
        try {
            const response = await listAccounts()
            if (response.success && response.data) {
                setAccounts(response.data)
                return response.data
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error)
        }
        return []
    }, [])

    const switchAccount = useCallback((accountId: string) => {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, accountId)
        setSelectedAccountId(accountId)
        setGlobalAccountId(accountId)

        // Clear project context when switching accounts
        localStorage.removeItem("syncrules_current_project")

        toast({
            title: "Account Switched",
            description: "Your organization context has been updated.",
        })

        // Refresh current page to reload data with new header
        router.refresh()
    }, [router, toast])

    // Initial load
    useEffect(() => {
        const initAccount = async () => {
            setIsLoading(true)
            const fetchedAccounts = await refreshAccounts()

            const storedAccountId = localStorage.getItem(ACCOUNT_STORAGE_KEY)

            if (storedAccountId && fetchedAccounts.some(a => a.id === storedAccountId)) {
                setSelectedAccountId(storedAccountId)
                setGlobalAccountId(storedAccountId)
            } else if (fetchedAccounts.length === 1) {
                // Auto-select if only one account
                const onlyAccount = fetchedAccounts[0]
                setSelectedAccountId(onlyAccount.id)
                setGlobalAccountId(onlyAccount.id)
                localStorage.setItem(ACCOUNT_STORAGE_KEY, onlyAccount.id)
            } else if (fetchedAccounts.length > 0) {
                // Option: we could auto-select the first one or force selection
                // For now, let's not auto-select if multiple, making the guard trigger
            }

            setIsLoading(false)
        }

        // Only run on non-auth routes
        if (!pathname.startsWith("/login") && !pathname.startsWith("/auth")) {
            initAccount()
        } else {
            setIsLoading(false)
        }
    }, [refreshAccounts, pathname])

    // Update selectedAccount object when selectedAccountId or accounts change
    useEffect(() => {
        if (selectedAccountId && accounts.length > 0) {
            const account = accounts.find(a => a.id === selectedAccountId)
            setSelectedAccount(account || null)
        } else {
            setSelectedAccount(null)
        }
    }, [selectedAccountId, accounts])

    return (
        <AccountContext.Provider
            value={{
                selectedAccountId,
                selectedAccount,
                accounts,
                isLoading,
                switchAccount,
                refreshAccounts
            }}
        >
            {children}
        </AccountContext.Provider>
    )
}

export function useAccount() {
    const context = useContext(AccountContext)
    if (context === undefined) {
        throw new Error("useAccount must be used within an AccountProvider")
    }
    return context
}
