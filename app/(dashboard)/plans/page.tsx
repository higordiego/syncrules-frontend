/**
 * Plans/Pricing Page - High-Conversion Design
 * 
 * UX RATIONALE:
 * - Single-screen view: All plans visible without scrolling
 * - Clear comparison: Side-by-side cards with shared feature grid
 * - Visual hierarchy: Recommended plan (Pro) stands out
 * - Conversion focus: Clear CTAs, reduced cognitive load
 * - Outcome-oriented: Focus on value, not just features
 * 
 * LAYOUT:
 * - Centered container (max-width: 1400px)
 * - 3-column grid: Freemium | Pro (Recommended) | Enterprise
 * - Header: Title + subtitle (compact)
 * - Cards: Icon, Name, Price, Key Value Props, CTA
 * - Feature comparison table below (optional, if space allows)
 * 
 * CONVERSION STRATEGY:
 * - Pro plan visually emphasized (border, shadow, badge)
 * - Clear pricing (no hidden costs)
 * - Action-oriented CTAs ("Start Free", "Get Pro", "Contact Sales")
 * - Minimal text, maximum clarity
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Building2, Sparkles, Loader2 } from "lucide-react"
import { listPlans, type Plan } from "@/lib/api-plans"
import { getMe } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { subscribeToPlan } from "@/lib/api-plans"


export default function PlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string>("freemium")
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const userResponse = await getMe()
      if (userResponse.success && userResponse.data?.plan) {
        setCurrentPlanId(userResponse.data.plan)
      }

      const plansResponse = await listPlans()
      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data)
      }
    } catch (error) {
      console.error("Error loading plans:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load plans",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (planId === currentPlanId) return

    try {
      setSubscribing(planId)
      const response = await subscribeToPlan(planId)
      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully subscribed to ${planId} plan`,
        })
        loadPlans()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to subscribe. Please try again.",
      })
    } finally {
      setSubscribing(null)
    }
  }

  const formatStorage = (bytes: number | undefined | null): string => {
    if (bytes === undefined || bytes === null || bytes === -1) return "Unlimited"
    if (bytes === 0) return "0 MB"
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
    return `${mb.toFixed(0)} MB`
  }

  const formatLimit = (limit: number | undefined | null): string => {
    if (limit === undefined || limit === null || limit === -1) return "Unlimited"
    return limit.toLocaleString()
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

  const getPlanDescription = (planId: string): string => {
    switch (planId) {
      case "freemium":
        return "Perfect for getting started"
      case "pro":
        return "For professionals and teams"
      case "enterprise":
        return "For large organizations"
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const recommendedPlanId = "pro"

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm lg:text-base">All plans include core features. Upgrade for more power.</p>
        </div>

        {/* Plans Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id)
            const isRecommended = plan.id === recommendedPlanId
            const isCurrentPlan = currentPlanId === plan.id
            const isEnterprise = plan.id === "enterprise"

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 ${
                  isCurrentPlan
                    ? "border-2 border-primary shadow-2xl shadow-primary/20 scale-105 z-10 bg-primary/5"
                    : isRecommended
                    ? "border-2 border-purple-500 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all"
                    : "border border-border hover:border-primary/50 hover:shadow-lg transition-all"
                }`}
              >
                {/* Current Plan Badge - Highest Priority */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1.5 shadow-lg font-semibold">
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Seu Plano Atual
                    </Badge>
                  </div>
                )}

                {/* Recommended Badge - Only if not current plan */}
                {isRecommended && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-6 space-y-3">
                  {/* Icon */}
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl transition-all ${
                      isCurrentPlan
                        ? "bg-primary shadow-lg shadow-primary/50"
                        : isRecommended
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"
                        : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-7 w-7 ${
                        isCurrentPlan
                          ? "text-primary-foreground"
                          : isRecommended
                          ? "text-white"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Plan Name */}
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{getPlanDescription(plan.id)}</p>

                  {/* Price */}
                  <div className="space-y-1">
                    {plan.price === 0 ? (
                      <>
                        <div className="text-4xl font-bold">$0</div>
                        <div className="text-sm text-muted-foreground">Forever free</div>
                      </>
                    ) : isEnterprise ? (
                      <>
                        <div className="text-4xl font-bold">Custom</div>
                        <div className="text-sm text-muted-foreground">Contact us</div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl font-bold">${plan.price.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-4 pb-6">
                  {/* Key Value Props - Top 3 features only */}
                  <div className="space-y-3 flex-1">
                    {plan.id === "freemium" && (
                      <>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">{formatLimit(plan.limits.filesLimit)} files</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">{formatLimit(plan.limits.requestsLimit)} requests/month</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">{formatStorage(plan.limits.storageLimit)} storage</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">Markdown viewer</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">Email support</span>
                        </div>
                      </>
                    )}
                    {plan.id === "pro" && (
                      <>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Unlimited files</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Unlimited requests</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">{formatStorage(plan.limits.storageLimit)} storage</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Markdown editor</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Document versioning</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Folder sharing</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">API access</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Priority 24/7 support</span>
                        </div>
                      </>
                    )}
                    {plan.id === "enterprise" && (
                      <>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Everything in Pro</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Unlimited storage</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">SSO (Single Sign-On)</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Advanced audit logs</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Advanced permissions</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">99.9% SLA guarantee</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Dedicated account manager</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">Custom onboarding</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-foreground font-medium">White-label support</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-primary/10 text-primary border-2 border-primary cursor-not-allowed font-semibold"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Plano Atual
                    </Button>
                  ) : isEnterprise ? (
                    <Button
                      className={`w-full ${
                        isRecommended
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-lg"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Contact Sales"
                      )}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full font-semibold ${
                        isRecommended
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/50"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : plan.id === "freemium" ? (
                        "Start Free"
                      ) : (
                        "Get Pro"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </div>
  )
}
