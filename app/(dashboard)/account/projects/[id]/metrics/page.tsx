"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MetricsDashboard } from "@/components/metrics/metrics-dashboard"
import { mockProjectMetrics } from "@/lib/mock-data/governance"
import { BarChart3, ArrowLeft } from "lucide-react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProjectMetricsPage() {
  const params = useParams()
  const projectId = params.id as string
  const metrics = mockProjectMetrics[projectId] || mockProjectMetrics["proj-001"]

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/account/projects/${projectId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Project
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-8 w-8" />
                    Project Metrics
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Usage and adoption metrics for this project
                  </p>
                </div>
              </div>
              <MetricsDashboard projectMetrics={metrics} projectId={projectId} />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

