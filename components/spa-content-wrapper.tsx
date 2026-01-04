"use client"

/**
 * SPA Content Wrapper
 * 
 * This component ensures that content updates happen WITHOUT full page reloads.
 * It provides:
 * - Smooth transitions between views
 * - Preserved scroll position
 * - State preservation
 * - CSS-based animations
 * 
 * ARCHITECTURE:
 * - This wrapper receives children (page content) from Next.js App Router
 * - Next.js App Router already handles client-side navigation (no full reload)
 * - This component adds smooth transitions and state preservation
 * - Header/Sidebar remain mounted via layout.tsx (never unmount)
 */

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SPAContentWrapperProps {
  children: React.ReactNode
  className?: string
}

export function SPAContentWrapper({ children, className }: SPAContentWrapperProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    // Only trigger transition if pathname actually changed
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      setIsTransitioning(true)
      
      // Update content after fade-out starts
      setTimeout(() => {
        setDisplayChildren(children)
        setIsTransitioning(false)
      }, 150) // Half of transition duration (300ms / 2)
    } else {
      // First load or no change - no transition needed
      setDisplayChildren(children)
      previousPathnameRef.current = pathname
    }
  }, [pathname, children])

  // Preserve scroll position on navigation
  useEffect(() => {
    if (contentRef.current) {
      // Store scroll position before navigation
      const scrollKey = `scroll-${previousPathnameRef.current}`
      if (previousPathnameRef.current) {
        sessionStorage.setItem(scrollKey, String(contentRef.current.scrollTop))
      }

      // Restore scroll position after navigation
      const restoreScrollKey = `scroll-${pathname}`
      const savedScroll = sessionStorage.getItem(restoreScrollKey)
      if (savedScroll) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.scrollTop = Number(savedScroll)
          }
        }, 100)
      } else {
        // New page - scroll to top
        contentRef.current.scrollTop = 0
      }
    }
  }, [pathname])

  return (
    <div
      ref={contentRef}
      id="app-content"
      className={cn(
        "flex-1 overflow-y-auto transition-opacity duration-300 ease-in-out",
        isTransitioning ? "opacity-0" : "opacity-100",
        className
      )}
      style={{
        // Ensure smooth scrolling
        scrollBehavior: "smooth",
      }}
    >
      {/* 
        Content Container
        - This is the ONLY part that updates on navigation
        - Header/Sidebar remain mounted (never unmount)
        - Smooth fade transition between views
      */}
      <div className="min-h-full">
        {displayChildren}
      </div>
    </div>
  )
}

