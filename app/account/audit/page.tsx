"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { AuditDashboard } from "@/components/governance/audit-dashboard"
import { mockAuditLogs } from "@/lib/mock-data/governance"
import { getCurrentAccountId } from "@/components/accounts/account-selector"
import { History, Shield } from "lucide-react"

export default function AuditPage() {
  const currentAccountId = getCurrentAccountId() || "acc-001"

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Shield className="h-8 w-8" />
                    Audit & Compliance
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Complete audit trail of all actions and changes in your organization
                  </p>
                </div>
              </div>
              <AuditDashboard accountId={currentAccountId} />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

