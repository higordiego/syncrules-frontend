"use client"

import { useState, useEffect } from "react"
import { getActivities, getUsageStats, getRequestsHistory, type Activity, type UsageStats } from "@/lib/activity"

export function useActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats>({
    filesUsed: 0,
    filesLimit: 10,
    requestsUsed: 0,
    requestsLimit: 100,
    storageUsed: 0,
    storageLimit: 50,
  })
  const [requestsHistory, setRequestsHistory] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setActivities(getActivities())
    setUsageStats(getUsageStats())
    setRequestsHistory(getRequestsHistory())
    setLoading(false)
  }, [])

  return {
    activities,
    usageStats,
    requestsHistory,
    loading,
  }
}

