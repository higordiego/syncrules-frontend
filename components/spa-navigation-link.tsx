"use client"

/**
 * SPA Navigation Link
 * 
 * This component replaces Next.js Link to ensure:
 * - Client-side only navigation (no full page reload)
 * - Smooth transitions
 * - State preservation
 * - Event handling for analytics/tracking
 * 
 * WHY THIS WORKS:
 * - Next.js Link already does client-side navigation
 * - This wrapper adds additional guarantees and event handling
 * - Prevents any accidental full page reloads
 */

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MouseEvent, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SPANavigationLinkProps {
  href: string
  children: ReactNode
  className?: string
  activeClassName?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  exact?: boolean // If true, only active when pathname exactly matches
}

export function SPANavigationLink({
  href,
  children,
  className,
  activeClassName,
  onClick,
  exact = false,
}: SPANavigationLinkProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Determine if link is active
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname?.startsWith(href + "/")

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Prevent default only if it's an external link or special case
    // For internal links, Next.js Link handles it client-side
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(e)
    }

    // Ensure client-side navigation
    // Next.js Link already does this, but we add extra guarantee
    if (href.startsWith("/") && !href.startsWith("http")) {
      // Internal link - ensure no full page reload
      e.preventDefault()
      router.push(href)
      
      // Optional: Dispatch custom event for analytics
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("spa-navigation", {
            detail: { href, pathname },
          })
        )
      }
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(className, isActive && activeClassName)}
      // Prefetch for faster navigation (Next.js feature)
      prefetch={true}
    >
      {children}
    </Link>
  )
}

