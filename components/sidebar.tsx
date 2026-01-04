"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  GitBranch,
  Users,
  Plug,
  Shield,
  CreditCard,
  Key,
  BarChart3,
  History,
  Building2,
} from "lucide-react"
import { useAccount } from "@/context/AccountContext"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  requiresPro?: boolean
  requiresEnterprise?: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const { selectedAccount } = useAccount()
  const plan = selectedAccount?.plan || "freemium"

  const navigation: NavItem[] = [
    { name: "Overview", href: "/account", icon: LayoutDashboard },
    { name: "Versioning", href: "/dashboard/versioning", icon: GitBranch, requiresPro: true },
    { name: "Teams", href: "/account/groups", icon: Users, requiresPro: true },
    { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
    { name: "Audit Logs", href: "/dashboard/audit", icon: Shield, requiresEnterprise: true },
    { name: "Billing", href: "/plans", icon: CreditCard },
    { name: "MCP Keys", href: "/mcp-keys", icon: Key },
    { name: "Activity & Usage", href: "/activity", icon: BarChart3 },
    { name: "Organizations", href: "/account/organizations", icon: Building2 },
  ]

  const isPlanPro = plan === "pro" || plan === "enterprise"
  const isPlanEnterprise = plan === "enterprise"

  const isItemAccessible = (item: NavItem) => {
    if (item.requiresEnterprise && !isPlanEnterprise) return false
    if (item.requiresPro && !isPlanPro) return false
    return true
  }

  const isActive = (href: string) => {
    if (href === "/account") {
      return pathname === "/account" ||
        (pathname?.startsWith("/account/") &&
          !pathname?.startsWith("/account/groups") &&
          !pathname?.startsWith("/account/organizations"))
    }
    return pathname === href || pathname?.startsWith(href + "/")
  }

  return (
    <aside className="hidden lg:block w-64 border-r border-sidebar-border bg-sidebar">
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          if (!isItemAccessible(item)) return null

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                isActive(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
              {item.requiresPro && !isPlanPro && (
                <Badge variant="outline" className="ml-auto text-xs">
                  Pro
                </Badge>
              )}
              {item.requiresEnterprise && !isPlanEnterprise && (
                <Badge variant="outline" className="ml-auto text-xs">
                  Enterprise
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
