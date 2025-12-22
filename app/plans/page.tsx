"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Sparkles, Building2 } from "lucide-react"
import { listPlans, type Plan } from "@/lib/api-plans"
import { getMe } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

function PlansContent() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string>("freemium")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      // Load user's current plan
      const userResponse = await getMe()
      if (userResponse.success && userResponse.data?.plan) {
        setCurrentPlanId(userResponse.data.plan)
      }

      // Load available plans
      const plansResponse = await listPlans()
      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data)
      }
    } catch (error) {
      console.error("Error loading plans:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load plans. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatStorage = (bytes: number): string => {
    if (bytes === 0) return "0 MB"
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    }
    return `${mb.toFixed(0)} MB`
  }

  const formatLimit = (limit: number): string => {
    if (limit === -1 || limit === 0) return "Unlimited"
    return limit.toLocaleString()
  }

  const getPlanFeatures = (plan: Plan): string[] => {
    const features: string[] = []
    const limits = plan.limits

    if (limits.filesLimit === -1) {
      features.push("Unlimited files")
    } else {
      features.push(`Up to ${formatLimit(limits.filesLimit)} files`)
    }

    if (limits.requestsLimit === -1) {
      features.push("Unlimited requests")
    } else {
      features.push(`${formatLimit(limits.requestsLimit)} requests per month`)
    }

    features.push(`${formatStorage(limits.storageLimit)} storage`)
    features.push("Unlimited folders")
    features.push("Unlimited MCP keys")
    features.push("Markdown viewer")

    if (plan.id === "pro") {
      features.push("Advanced Markdown viewer")
      features.push("Markdown editor")
      features.push("Document versioning")
      features.push("Folder sharing")
      features.push("24/7 priority support")
      features.push("API access")
    } else if (plan.id === "enterprise") {
      features.push("Everything in Pro included")
      features.push("Unlimited storage")
      features.push("Unlimited requests")
      features.push("Multiple teams and workspaces")
      features.push("Advanced permission management")
      features.push("SSO (Single Sign-On)")
      features.push("Advanced audit and logs")
      features.push("99.9% guaranteed SLA")
      features.push("Dedicated account manager")
      features.push("Custom onboarding")
      features.push("Custom integration")
      features.push("White-label support")
    } else {
      features.push("Email support")
    }

    return features
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "freemium":
        return Zap
      case "pro":
        return Crown
      case "enterprise":
        return Building2
      default:
        return Zap
    }
  }

  const getPlanColors = (planId: string) => {
    switch (planId) {
      case "freemium":
        return {
          gradient: "from-cyan-600 to-blue-600",
          bgGradient: "from-cyan-400 via-blue-500 to-blue-600",
          shadow: "shadow-cyan-500/50",
          border: "border-cyan-500",
          badge: "from-cyan-500 to-blue-600",
          checkBg: "bg-cyan-100 dark:bg-cyan-900/30",
          checkText: "text-cyan-600 dark:text-cyan-400",
        }
      case "pro":
        return {
          gradient: "from-purple-600 via-pink-600 to-rose-600",
          bgGradient: "from-purple-500 via-pink-500 to-rose-500",
          shadow: "shadow-purple-500/50",
          border: "border-purple-500",
          badge: "from-purple-600 via-pink-600 to-rose-600",
          checkBg: "bg-purple-100 dark:bg-purple-900/30",
          checkText: "text-purple-600 dark:text-purple-400",
        }
      case "enterprise":
        return {
          gradient: "from-amber-600 via-orange-600 to-yellow-600",
          bgGradient: "from-amber-500 via-orange-500 to-yellow-500",
          shadow: "shadow-amber-500/50",
          border: "border-amber-500",
          badge: "from-amber-600 via-orange-600 to-yellow-600",
          checkBg: "bg-amber-100 dark:bg-amber-900/30",
          checkText: "text-amber-600 dark:text-amber-400",
        }
      default:
        return {
          gradient: "from-cyan-600 to-blue-600",
          bgGradient: "from-cyan-400 via-blue-500 to-blue-600",
          shadow: "shadow-cyan-500/50",
          border: "border-cyan-500",
          badge: "from-cyan-500 to-blue-600",
          checkBg: "bg-cyan-100 dark:bg-cyan-900/30",
          checkText: "text-cyan-600 dark:text-cyan-400",
        }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
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
              {plans.map((plan) => {
                const Icon = getPlanIcon(plan.id)
                const colors = getPlanColors(plan.id)
                const features = getPlanFeatures(plan)
                const isCurrentPlan = currentPlanId === plan.id
                const isPro = plan.id === "pro"
                const isEnterprise = plan.id === "enterprise"

                return (
                  <Card
                    key={plan.id}
                    className={`relative border-2 bg-card ${
                      isCurrentPlan
                        ? `ring-4 ring-${colors.border.split("-")[1]}-500 shadow-xl shadow-${colors.shadow.split("/")[0]} border-${colors.border.split("-")[1]}-500`
                        : isPro || isEnterprise
                          ? `border-${colors.border.split("-")[1]}-500 shadow-2xl shadow-${colors.shadow.split("/")[0]}`
                          : "border-border"
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className={`bg-gradient-to-r ${colors.badge} text-white px-4 py-1.5 shadow-lg`}>
                          <Icon className="h-3 w-3 mr-1 inline" />
                          Current Plan
                        </Badge>
                      </div>
                    )}
                    {isPro && !isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className={`bg-gradient-to-r ${colors.badge} text-white px-4 py-1.5 shadow-lg animate-pulse`}>
                          <Sparkles className="h-3 w-3 mr-1 inline" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {isEnterprise && !isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className={`bg-gradient-to-r ${colors.badge} text-white px-4 py-1.5 shadow-lg`}>
                          <Building2 className="h-3 w-3 mr-1 inline" />
                          For Enterprises
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-6 pt-8">
                      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.bgGradient} shadow-lg ${colors.shadow}`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className={`text-2xl bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent font-bold`}>
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-base mt-2 font-medium">
                        {plan.id === "freemium" && "To get started"}
                        {plan.id === "pro" && "For professionals"}
                        {plan.id === "enterprise" && "For large teams"}
                      </CardDescription>
                      <div className="mt-4">
                        {plan.price === 0 ? (
                          <>
                            <span className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                              $0
                            </span>
                            <span className="text-muted-foreground text-base">/month</span>
                          </>
                        ) : plan.id === "enterprise" ? (
                          <>
                            <span className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                              Custom
                            </span>
                            <span className="text-muted-foreground text-base block mt-1">Contact us</span>
                          </>
                        ) : (
                          <>
                            <span className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                              ${plan.price.toFixed(2)}
                            </span>
                            <span className="text-muted-foreground text-base">/month</span>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-2.5">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${colors.checkBg} flex-shrink-0 mt-0.5`}>
                              <Check className={`h-3.5 w-3.5 ${colors.checkText} font-bold`} />
                            </div>
                            <span className="text-card-foreground text-sm font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {isCurrentPlan ? (
                        <Button
                          disabled
                          className={`w-full bg-gradient-to-r ${colors.gradient}/20 text-muted-foreground cursor-not-allowed border-2 border-${colors.border.split("-")[1]}-500/30`}
                        >
                          Current Plan
                        </Button>
                      ) : plan.id === "enterprise" ? (
                        <Button className={`w-full bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white shadow-lg ${colors.shadow} font-semibold py-5`}>
                          Contact Sales
                        </Button>
                      ) : (
                        <Button className={`w-full bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white shadow-lg ${colors.shadow} font-semibold py-5`}>
                          Upgrade Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
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
