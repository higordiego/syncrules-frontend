"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Sparkles, Building2 } from "lucide-react"

function PlansContent() {
  const currentPlan = "freemium"

  const features = {
    freemium: [
      "Up to 10 files",
      "100 requests per month",
      "50 MB storage",
      "Unlimited folders",
      "Unlimited MCP keys",
      "Markdown viewer",
      "Email support",
    ],
    pro: [
      "Unlimited files",
      "Unlimited requests",
      "10 GB storage",
      "Unlimited folders",
      "Unlimited MCP keys",
      "Advanced Markdown viewer",
      "Markdown editor",
      "Document versioning",
      "Folder sharing",
      "24/7 priority support",
      "API access",
    ],
    enterprise: [
      "Everything in Pro included",
      "Unlimited storage",
      "Unlimited requests",
      "Multiple teams and workspaces",
      "Advanced permission management",
      "SSO (Single Sign-On)",
      "Advanced audit and logs",
      "99.9% guaranteed SLA",
      "Dedicated account manager",
      "Custom onboarding",
      "Custom integration",
      "White-label support",
    ],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 bg-background">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Plans & Pricing</h1>
              <p className="text-muted-foreground mt-3 text-base lg:text-lg">
                Choose the perfect plan for your needs
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Plano Freemium */}
              <Card
                className={`relative border-2 bg-card ${currentPlan === "freemium" ? "ring-4 ring-cyan-500 shadow-xl shadow-cyan-500/30 border-cyan-500" : "border-border"}`}
              >
                {currentPlan === "freemium" && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1.5 shadow-lg">
                      <Zap className="h-3 w-3 mr-1 inline" />
                      Current Plan
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6 pt-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 shadow-lg shadow-cyan-500/50">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-bold">
                    Freemium
                  </CardTitle>
                  <CardDescription className="text-base mt-2 font-medium">To get started</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                      $0
                    </span>
                    <span className="text-muted-foreground text-base">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2.5">
                    {features.freemium.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex-shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 font-bold" />
                        </div>
                        <span className="text-card-foreground text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    disabled
                    className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-muted-foreground cursor-not-allowed border-2 border-cyan-500/30"
                  >
                    Plano Atual
                  </Button>
                </CardContent>
              </Card>

              {/* Plano Pro */}
              <Card className="relative border-2 border-purple-500 bg-card shadow-2xl shadow-purple-500/40">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white px-4 py-1.5 shadow-lg animate-pulse">
                    <Sparkles className="h-3 w-3 mr-1 inline" />
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className="text-center pb-6 pt-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-lg shadow-purple-500/50">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent font-bold">
                    Pro
                  </CardTitle>
                  <CardDescription className="text-base mt-2 font-medium">For professionals</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                      $19
                    </span>
                    <span className="text-muted-foreground text-base">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2.5">
                    {features.pro.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 flex-shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                        </div>
                        <span className="text-card-foreground text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white shadow-lg shadow-purple-500/50 font-semibold py-5">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>

              {/* Plano Enterprise */}
              <Card className="relative border-2 border-amber-500 bg-card shadow-2xl shadow-amber-500/40">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white px-4 py-1.5 shadow-lg">
                    <Building2 className="h-3 w-3 mr-1 inline" />
                    For Enterprises
                  </Badge>
                </div>
                <CardHeader className="text-center pb-6 pt-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-lg shadow-amber-500/50">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent font-bold">
                    Enterprise
                  </CardTitle>
                  <CardDescription className="text-base mt-2 font-medium">For large teams</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      Custom
                    </span>
                    <span className="text-muted-foreground text-base block mt-1">Contact us</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2.5">
                    {features.enterprise.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 flex-shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 font-bold" />
                        </div>
                        <span className="text-card-foreground text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:from-amber-700 hover:via-orange-700 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/50 font-semibold py-5">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PlansPage() {
  return (
    <ProtectedRoute>
      <PlansContent />
    </ProtectedRoute>
  )
}
