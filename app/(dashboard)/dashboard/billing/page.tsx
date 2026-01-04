"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Building2,
  Loader2,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
} from "lucide-react"
import { useAccount } from "@/context/AccountContext"
import { getMe } from "@/lib/api"
import { listPlans, type Plan } from "@/lib/api-plans"
import { updateAccount } from "@/lib/api-accounts"
import { getUsageStats, type UsageStats } from "@/lib/api-usage"
import { useToast } from "@/components/ui/use-toast"
import { createToastFromResponse } from "@/lib/toast-utils"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PaymentHistory {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  plan: string
  invoiceUrl?: string
}

export default function BillingPage() {
  const { toast } = useToast()
  const { selectedAccount, refreshAccounts } = useAccount()
  const [currentPlan, setCurrentPlan] = useState<string>("freemium")
  const [plans, setPlans] = useState<Plan[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<string | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])

  useEffect(() => {
    loadBillingData()
  }, [selectedAccount])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      const [userResponse, plansResponse, usageResponse] = await Promise.all([
        getMe(),
        listPlans(),
        selectedAccount ? getUsageStats() : Promise.resolve({ success: false, data: null }),
      ])

      // Use account plan if available, otherwise fallback to user plan
      if (selectedAccount?.plan) {
        setCurrentPlan(selectedAccount.plan)
      } else if (userResponse.success && userResponse.data?.plan) {
        setCurrentPlan(userResponse.data.plan)
      } else {
        setCurrentPlan("freemium")
      }

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data)
      }

      if (usageResponse.success && usageResponse.data) {
        setUsageStats(usageResponse.data)
      }

      // Mock payment history (will be replaced with real API call when Stripe is integrated)
      setPaymentHistory([
        {
          id: "1",
          date: new Date().toISOString(),
          amount: 0,
          status: "paid",
          plan: currentPlan,
        },
      ])
    } catch (error) {
      console.error("Error loading billing data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load billing information",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return

    setSelectedPlanToUpgrade(planId)
    setUpgradeDialogOpen(true)
  }

  const confirmUpgrade = async () => {
    if (!selectedPlanToUpgrade || !selectedAccount) return

    try {
      setSubscribing(selectedPlanToUpgrade)
      const response = await updateAccount(selectedAccount.id, {
        plan: selectedPlanToUpgrade as "freemium" | "pro" | "enterprise",
      })
      
      const toastConfig = createToastFromResponse(
        response,
        "Plan Updated",
        `Successfully ${selectedPlanToUpgrade === "freemium" ? "downgraded" : "upgraded"} to ${selectedPlanToUpgrade} plan`,
        "Upgrade Failed",
        "Failed to update plan. Please try again."
      )

      toast(toastConfig)

      if (response.success) {
        setUpgradeDialogOpen(false)
        setSelectedPlanToUpgrade(null)
        // Refresh account context to get updated plan
        await refreshAccounts()
        await loadBillingData()
      }
    } catch (error) {
      console.error("Error upgrading plan:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update plan. Please try again.",
      })
    } finally {
      setSubscribing(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "pro":
        return Zap
      case "enterprise":
        return Crown
      default:
        return Building2
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "pro":
        return "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
      case "enterprise":
        return "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
      default:
        return "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
    }
  }

  const formatStorage = (bytes: number | undefined | null): string => {
    if (bytes === undefined || bytes === null || bytes === -1) return "Unlimited"
    if (bytes === 0) return "0 MB"
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
    return `${mb.toFixed(0)} MB`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1 || limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const currentPlanData = plans.find((p) => p.id === currentPlan)
  const canUpgrade = currentPlan === "freemium"
  const canDowngrade = currentPlan !== "freemium"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription, payment methods, and billing history
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Change Plan</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription plan</CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm font-semibold px-3 py-1",
                    getPlanColor(currentPlan)
                  )}
                >
                  {currentPlanData?.name || currentPlan.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Monthly Price
                  </div>
                  <div className="text-2xl font-bold">
                    {currentPlanData?.price === 0
                      ? "Free"
                      : formatCurrency(currentPlanData?.price || 0)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Billing Cycle
                  </div>
                  <div className="text-2xl font-bold">Monthly</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Status
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Active
                  </div>
                </div>
              </div>

              {canUpgrade && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    className="w-full sm:w-auto"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Summary */}
          {usageStats && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
                <CardDescription>Your current usage vs plan limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Files Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Files</span>
                    <span className="font-medium">
                      {usageStats.filesUsed} /{" "}
                      {usageStats.filesLimit === -1
                        ? "∞"
                        : usageStats.filesLimit}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(usageStats.filesUsed, usageStats.filesLimit)}
                    className="h-2"
                  />
                </div>

                {/* Requests Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API Requests (30 days)</span>
                    <span className="font-medium">
                      {usageStats.requestsUsed} /{" "}
                      {usageStats.requestsLimit === -1
                        ? "∞"
                        : usageStats.requestsLimit}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(
                      usageStats.requestsUsed,
                      usageStats.requestsLimit
                    )}
                    className="h-2"
                  />
                </div>

                {/* Storage Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium">
                      {formatStorage(usageStats.storageUsed)} /{" "}
                      {formatStorage(usageStats.storageLimit)}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(
                      usageStats.storageUsed,
                      usageStats.storageLimit
                    )}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No payment method</p>
                    <p className="text-sm text-muted-foreground">
                      Add a payment method to enable paid plans
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Add Payment Method
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Payment method management will be available when Stripe integration is enabled.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Plan Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Available Plans</h2>
            <p className="text-muted-foreground">
              Choose the plan that best fits your needs. You can upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.id)
              const isCurrentPlan = plan.id === currentPlan
              const isUpgrade = plan.id === "pro" && currentPlan === "freemium"
              const isDowngrade = plan.id === "freemium" && currentPlan !== "freemium"

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col",
                    isCurrentPlan && "border-2 border-primary shadow-lg"
                  )}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          plan.id === "pro" && "bg-green-100 dark:bg-green-900/20",
                          plan.id === "enterprise" &&
                            "bg-purple-100 dark:bg-purple-900/20",
                          plan.id === "freemium" &&
                            "bg-blue-100 dark:bg-blue-900/20"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            plan.id === "pro" && "text-green-600 dark:text-green-400",
                            plan.id === "enterprise" &&
                              "text-purple-600 dark:text-purple-400",
                            plan.id === "freemium" &&
                              "text-blue-600 dark:text-blue-400"
                          )}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-bold">
                        {plan.price === 0 ? (
                          "Free"
                        ) : (
                          <>
                            {formatCurrency(plan.price)}
                            <span className="text-lg font-normal text-muted-foreground">
                              /month
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          Files:{" "}
                          {plan.limits.filesLimit === -1
                            ? "Unlimited"
                            : plan.limits.filesLimit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          Requests:{" "}
                          {plan.limits.requestsLimit === -1
                            ? "Unlimited"
                            : plan.limits.requestsLimit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Storage: {formatStorage(plan.limits.storageLimit)}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {isCurrentPlan ? (
                        <Button disabled className="w-full" variant="outline">
                          <Check className="h-4 w-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : plan.id === "enterprise" ? (
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            toast({
                              title: "Contact Sales",
                              description:
                                "Please contact our sales team for Enterprise pricing.",
                              variant: "default",
                            })
                          }}
                        >
                          Contact Sales
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={subscribing === plan.id}
                        >
                          {subscribing === plan.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isUpgrade ? (
                            <>
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Upgrade
                            </>
                          ) : isDowngrade ? (
                            <>
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Downgrade
                            </>
                          ) : (
                            "Switch Plan"
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Usage & Limits Tab */}
        <TabsContent value="usage" className="space-y-6">
          {usageStats ? (
            <>
              <div>
                <h2 className="text-2xl font-bold mb-2">Usage & Limits</h2>
                <p className="text-muted-foreground">
                  Monitor your usage against your plan limits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Files Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold">
                        {usageStats.filesUsed}
                        <span className="text-lg font-normal text-muted-foreground">
                          {" "}
                          /{" "}
                          {usageStats.filesLimit === -1
                            ? "∞"
                            : usageStats.filesLimit}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usageStats.filesUsed,
                          usageStats.filesLimit
                        )}
                        className="h-2"
                      />
                      {usageStats.filesLimit !== -1 &&
                        usageStats.filesUsed >= usageStats.filesLimit * 0.9 && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            Approaching limit
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>

                {/* Requests Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      API Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold">
                        {usageStats.requestsUsed}
                        <span className="text-lg font-normal text-muted-foreground">
                          {" "}
                          /{" "}
                          {usageStats.requestsLimit === -1
                            ? "∞"
                            : usageStats.requestsLimit}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usageStats.requestsUsed,
                          usageStats.requestsLimit
                        )}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold">
                        {formatStorage(usageStats.storageUsed)}
                        <span className="text-lg font-normal text-muted-foreground">
                          {" "}
                          / {formatStorage(usageStats.storageLimit)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          usageStats.storageUsed,
                          usageStats.storageLimit
                        )}
                        className="h-2"
                      />
                      {usageStats.storageLimit !== -1 &&
                        usageStats.storageUsed >= usageStats.storageLimit * 0.9 && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            Storage almost full
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No usage data available</p>
                  <p className="text-sm mt-1">
                    Select an organization to view usage statistics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment History</h2>
            <p className="text-muted-foreground">
              View and download your invoices and payment history
            </p>
          </div>

          {paymentHistory.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            payment.status === "paid" &&
                              "bg-green-100 dark:bg-green-900/20",
                            payment.status === "pending" &&
                              "bg-amber-100 dark:bg-amber-900/20",
                            payment.status === "failed" &&
                              "bg-red-100 dark:bg-red-900/20"
                          )}
                        >
                          {payment.status === "paid" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : payment.status === "pending" ? (
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {payment.plan.charAt(0).toUpperCase() +
                              payment.plan.slice(1)}{" "}
                            Plan
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </p>
                          <Badge
                            variant={
                              payment.status === "paid"
                                ? "default"
                                : payment.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs mt-1"
                          >
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </Badge>
                        </div>
                        {payment.invoiceUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment history</p>
                  <p className="text-sm mt-1">
                    Payment history will appear here once you have active subscriptions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPlanToUpgrade === "freemium"
                ? "Downgrade Plan"
                : "Upgrade Plan"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlanToUpgrade === "freemium"
                ? "Are you sure you want to downgrade to the Freemium plan? You'll lose access to premium features."
                : selectedPlanToUpgrade
                  ? `Are you sure you want to upgrade to the ${selectedPlanToUpgrade.toUpperCase()} plan?`
                  : "Confirm plan change"}
            </DialogDescription>
          </DialogHeader>
          {selectedPlanToUpgrade && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <span className="font-semibold">
                    {currentPlanData?.name || currentPlan.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Plan</span>
                  <span className="font-semibold">
                    {plans.find((p) => p.id === selectedPlanToUpgrade)?.name ||
                      selectedPlanToUpgrade.toUpperCase()}
                  </span>
                </div>
                {selectedPlanToUpgrade !== "freemium" && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Monthly Price
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(
                          plans.find((p) => p.id === selectedPlanToUpgrade)?.price || 0
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUpgradeDialogOpen(false)
                setSelectedPlanToUpgrade(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpgrade}
              disabled={!selectedPlanToUpgrade || subscribing === selectedPlanToUpgrade}
            >
              {selectedPlanToUpgrade && subscribing === selectedPlanToUpgrade ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

