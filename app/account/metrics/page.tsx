"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MetricsDashboard } from "@/components/metrics/metrics-dashboard"
import { BarChart3, Loader2 } from "lucide-react"
import { getCurrentAccountId } from "@/components/accounts/account-selector"
import { useToast } from "@/components/ui/use-toast"
import type { AccountMetrics } from "@/lib/types/governance"

export default function AccountMetricsPage() {
  const { toast } = useToast()
  const [accountMetrics, setAccountMetrics] = useState<AccountMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      try {
        const accountId = getCurrentAccountId()
        if (!accountId) {
          toast({
            title: "No organization selected",
            description: "Please select an organization first.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // TODO: Implementar API de métricas quando disponível
        // Por enquanto, usar métricas vazias
        const metrics: AccountMetrics = {
          accountId,
          totalCalls: 0,
          callsByProject: [],
          callsByRule: [],
          callsByIDE: [],
          adoptionTrend: [],
        }
        setAccountMetrics(metrics)
      } catch (error) {
        console.error("Failed to fetch metrics:", error)
        toast({
          title: "Error",
          description: "Failed to load metrics. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-8 w-8" />
                  Account Metrics
                </h1>
                <p className="text-muted-foreground mt-1">
                  Usage and adoption metrics across all projects
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : accountMetrics ? (
                <MetricsDashboard accountMetrics={accountMetrics} />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No metrics available</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

