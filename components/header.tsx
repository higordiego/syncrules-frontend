"use client"

import { useRouter } from "next/navigation"
import { getUserSync, clearUser } from "@/lib/auth"
import { logout } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, CreditCard, BarChart3 } from "lucide-react"
import Link from "next/link"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { Logo } from "./logo"
import { AccountSelector } from "./accounts/account-selector"
import { useAccount } from "@/context/AccountContext"
import { cn } from "@/lib/utils"

export function Header() {
  const router = useRouter()
  const user = getUserSync()
  const { selectedAccount } = useAccount()
  const plan = selectedAccount?.plan || user?.plan || "freemium"

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      clearUser()
      router.push("/login")
    }
  }

  const getPlanBadgeStyle = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:from-purple-500/20 hover:to-purple-600/20"
      case "pro":
        return "bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:from-green-500/20 hover:to-green-600/20"
      default:
        return "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:from-blue-500/20 hover:to-blue-600/20"
    }
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "Enterprise"
      case "pro":
        return "Pro"
      default:
        return "Freemium"
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/account" className="flex items-center gap-2">
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center">
              <Logo className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
            </div>
            <span className="text-lg lg:text-xl font-bold">Sync Rules</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Account Selector - Organization selector */}
          <div className="hidden md:block">
            <AccountSelector />
          </div>

          <ThemeToggle />

          <Link href="/dashboard/billing">
            <Badge
              variant="secondary"
              className={cn(
                "hidden sm:flex gap-1 px-3 py-1 cursor-pointer transition-colors",
                getPlanBadgeStyle(plan)
              )}
            >
              <CreditCard className="h-3 w-3" />
              {getPlanName(plan)}
            </Badge>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarImage src={user?.picture || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="bg-blue-500 text-white text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing" className="cursor-pointer flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
