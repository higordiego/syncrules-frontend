"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className={`flex-1 p-4 lg:p-6 bg-background ${className}`}>{children}</main>
      </div>
    </div>
  )
}

