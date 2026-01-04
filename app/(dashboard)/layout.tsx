"use client"

/**
 * DASHBOARD LAYOUT - SPA Architecture
 * 
 * This layout ensures:
 * 1. Header and Sidebar NEVER unmount (always mounted)
 * 2. Only the main content area updates on navigation
 * 3. No full page reloads (Next.js App Router handles this)
 * 4. Smooth transitions between views
 * 5. State preservation across navigation
 * 
 * ARCHITECTURE:
 * - Header: Always mounted, never re-rendered on navigation
 * - Sidebar: Always mounted, never re-rendered on navigation
 * - Main Content: Only this area updates via Next.js App Router
 * - Transitions: Framer Motion handles smooth animations
 * 
 * WHY NO FULL RELOAD:
 * - Next.js App Router uses client-side navigation by default
 * - Components outside <main> remain mounted
 * - Only children prop changes, triggering re-render of content only
 */

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useMemo } from "react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Memoize Header and Sidebar to prevent unnecessary re-renders
    // These components NEVER unmount, only the main content updates
    const header = useMemo(() => <Header />, [])
    const sidebar = useMemo(() => <Sidebar />, [])

    return (
        <ProtectedRoute>
            {/* 
                Root Container - NEVER unmounts
                This structure ensures Header and Sidebar stay mounted
            */}
            <div className="flex min-h-screen flex-col">
                {/* 
                    HEADER - Always Mounted
                    - Never unmounts on navigation
                    - Only re-renders if its own state changes
                    - Preserves user menu, account selector, etc.
                */}
                {header}

                {/* 
                    Content Area - Flex Container
                    - Sidebar and Main stay side-by-side
                    - Only main content updates
                */}
                <div className="flex flex-1">
                    {/* 
                        SIDEBAR - Always Mounted
                        - Never unmounts on navigation
                        - Navigation state preserved
                        - Active link highlighting works via pathname
                    */}
                    {sidebar}

                    {/* 
                        MAIN CONTENT AREA - Only This Updates
                        - This is the ONLY part that changes on navigation
                        - Next.js App Router updates children prop
                        - Framer Motion provides smooth transitions
                        - No full page reload - only content swap
                    */}
                    <main 
                        id="app-content" 
                        className="flex-1 overflow-auto bg-background p-4 lg:p-6"
                        // Ensure smooth scrolling
                        style={{ scrollBehavior: "smooth" }}
                    >
                        {/* 
                            AnimatePresence handles exit animations
                            mode="wait" ensures old content exits before new enters
                            This prevents layout shifts
                        */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname} // Key changes trigger animation
                                initial={{ opacity: 0, y: 10 }} // Start slightly below
                                animate={{ opacity: 1, y: 0 }} // Fade in and slide up
                                exit={{ opacity: 0, y: -10 }} // Fade out and slide up
                                transition={{ 
                                    duration: 0.2, // Fast, smooth transition
                                    ease: "easeInOut" 
                                }}
                                className="h-full"
                                // Prevent layout shift during transition
                                style={{ willChange: "opacity, transform" }}
                            >
                                {/* 
                                    CHILDREN - Page Content
                                    - This is what Next.js App Router provides
                                    - Changes based on current route
                                    - No full reload - Next.js handles client-side navigation
                                */}
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
