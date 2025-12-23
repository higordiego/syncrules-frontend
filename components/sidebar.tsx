"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Key,
  Building2,
  BarChart3,
  History,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const navigation = [
  { name: "Account", href: "/account", icon: Building2 },
  { name: "Groups", href: "/account/groups", icon: Users },
  { name: "MCP Keys", href: "/mcp-keys", icon: Key },
  { name: "Metrics", href: "/account/metrics", icon: BarChart3 },
  { name: "Audit", href: "/account/audit", icon: History },
]

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed"

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Carregar estado do localStorage após montagem
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  // Salvar estado no localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Não renderizar até montar para evitar hydration mismatch
  if (!mounted) {
    return (
      <aside className="hidden lg:block w-64 border-r border-sidebar-border bg-sidebar" />
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-2 border-b border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 hover:bg-sidebar-accent"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => {
            // Lógica melhorada para determinar link ativo
            let isActive = false

            if (item.href === "/account") {
              isActive =
                pathname === "/account" ||
                (pathname?.startsWith("/account/") &&
                  !pathname?.startsWith("/account/groups") &&
                  !pathname?.startsWith("/account/metrics") &&
                  !pathname?.startsWith("/account/audit") &&
                  !pathname?.startsWith("/account/projects"))
            } else {
              isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/")
            }

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate transition-opacity duration-200">
                    {item.name}
                  </span>
                )}
              </Link>
            )

            // Mostrar tooltip apenas quando colapsado
            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.name}>{linkContent}</div>
          })}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
