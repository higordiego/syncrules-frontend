"use client"

import { useRouter } from "next/navigation"
import { getUser, clearUser } from "@/lib/auth"
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

export function Header() {
  const router = useRouter()
  const user = getUser()

  const handleLogout = () => {
    clearUser()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center">
              <Logo className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
            </div>
            <span className="text-lg lg:text-xl font-bold">Sync Rules</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link href="/plans">
            <Badge
              variant="secondary"
              className="hidden sm:flex gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:from-blue-500/20 hover:to-blue-600/20 cursor-pointer transition-colors"
            >
              <CreditCard className="h-3 w-3" />
              Freemium
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
                <Link href="/activity" className="cursor-pointer flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Activity
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/plans" className="cursor-pointer flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Plans
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
