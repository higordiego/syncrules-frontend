"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Key,
  FolderOpen,
  Building2,
  FolderKanban,
  BarChart3,
  History,
  Users,
} from "lucide-react"

const navigation = [
  { name: "Account", href: "/account", icon: Building2 },
  { name: "Groups", href: "/account/groups", icon: Users },
  { name: "MCP Keys", href: "/mcp-keys", icon: Key },
  { name: "Metrics", href: "/account/metrics", icon: BarChart3 },
  { name: "Audit", href: "/account/audit", icon: History },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block w-64 border-r border-sidebar-border bg-sidebar">
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          // Lógica melhorada para determinar link ativo
          let isActive = false
          
          if (item.href === "/account") {
            // Para "/account", só está ativo se for exatamente "/account" ou começar com "/account/" mas não for outro item específico
            isActive = pathname === "/account" || 
              (pathname?.startsWith("/account/") && 
               !pathname?.startsWith("/account/groups") &&
               !pathname?.startsWith("/account/metrics") &&
               !pathname?.startsWith("/account/audit") &&
               !pathname?.startsWith("/account/projects"))
          } else {
            // Para outros links, verifica se o pathname é exatamente igual ou começa com o href
            isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
