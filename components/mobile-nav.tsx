"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { 
  Menu, 
  Key, 
  Building2, 
  BarChart3,
  History,
  Users,
  X,
  LayoutDashboard,
  GitBranch,
  Plug,
  Shield,
  CreditCard,
} from "lucide-react"
import { Logo } from "./logo"
import { getUserSync } from "@/lib/auth"
import { useAccount } from "@/context/AccountContext"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Overview", href: "/account", icon: LayoutDashboard },
  { name: "Versioning", href: "/dashboard/versioning", icon: GitBranch, requiresPro: true },
  { name: "Teams", href: "/account/groups", icon: Users },
  { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { name: "Audit Logs", href: "/dashboard/audit", icon: Shield, requiresEnterprise: true },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "MCP Keys", href: "/mcp-keys", icon: Key },
  { name: "Activity & Usage", href: "/activity", icon: BarChart3 },
  { name: "Organizations", href: "/account/organizations", icon: Building2 },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const user = getUserSync()
  const { selectedAccount } = useAccount()
  const plan = selectedAccount?.plan || "freemium"
  
  const isPlanPro = plan === "pro" || plan === "enterprise"
  const isPlanEnterprise = plan === "enterprise"
  
  const isItemAccessible = (item: { requiresPro?: boolean; requiresEnterprise?: boolean }) => {
    if (item.requiresEnterprise && !isPlanEnterprise) return false
    if (item.requiresPro && !isPlanPro) return false
    return true
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-9 w-9 hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-80 p-0 flex flex-col bg-background border-r [&>button]:hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-7 w-7 text-primary" />
              <SheetTitle className="text-lg font-bold">Sync Rules</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {user && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navigation.map((item) => {
            if (!isItemAccessible(item)) return null
            
            let isActive = false
            if (item.href === "/account") {
              isActive = pathname === "/account" || 
                (pathname?.startsWith("/account/") && 
                 !pathname?.startsWith("/account/groups") &&
                 !pathname?.startsWith("/account/organizations"))
            } else {
              isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                <span className="flex-1">{item.name}</span>
                {item.requiresPro && !isPlanPro && (
                  <Badge variant="outline" className="text-xs">
                    Pro
                  </Badge>
                )}
                {item.requiresEnterprise && !isPlanEnterprise && (
                  <Badge variant="outline" className="text-xs">
                    Enterprise
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© Sync Rules</span>
            <span className="text-[10px]">v1.0.0</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
