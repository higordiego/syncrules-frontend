"use client"

export interface Activity {
  id: string
  type: "upload" | "folder" | "key" | "edit" | "delete"
  description: string
  timestamp: string
}

export interface UsageStats {
  filesUsed: number
  filesLimit: number
  requestsUsed: number
  requestsLimit: number
  storageUsed: number
  storageLimit: number
}

export function getActivities(): Activity[] {
  if (typeof window === "undefined") return []
  const activitiesStr = localStorage.getItem("activities")
  return activitiesStr ? JSON.parse(activitiesStr) : []
}

export function addActivity(activity: Omit<Activity, "id" | "timestamp">) {
  const activities = getActivities()
  const newActivity: Activity = {
    ...activity,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  }
  activities.unshift(newActivity)
  // Keep only last 50 activities
  if (activities.length > 50) {
    activities.pop()
  }
  localStorage.setItem("activities", JSON.stringify(activities))
}

export function getUsageStats(): UsageStats {
  if (typeof window === "undefined") {
    return { filesUsed: 0, filesLimit: 10, requestsUsed: 0, requestsLimit: 100, storageUsed: 0, storageLimit: 50 }
  }

  const documentsStr = localStorage.getItem("documents")
  const documents = documentsStr ? JSON.parse(documentsStr) : []
  const files = documents.filter((d: any) => d.type === "file")

  const usageStr = localStorage.getItem("usageStats")
  const usage = usageStr ? JSON.parse(usageStr) : { requestsUsed: 0 }

  // Calculate storage in MB
  let storageUsed = 0
  files.forEach((file: any) => {
    if (file.content) {
      storageUsed += new Blob([file.content]).size / (1024 * 1024)
    }
  })

  return {
    filesUsed: files.length,
    filesLimit: 10, // Freemium limit
    requestsUsed: usage.requestsUsed || 0,
    requestsLimit: 100, // Freemium limit
    storageUsed: Math.round(storageUsed * 10) / 10,
    storageLimit: 50, // Freemium limit in MB
  }
}

export function incrementRequests() {
  const usageStr = localStorage.getItem("usageStats")
  const usage = usageStr ? JSON.parse(usageStr) : { requestsUsed: 0 }
  usage.requestsUsed = (usage.requestsUsed || 0) + 1
  localStorage.setItem("usageStats", JSON.stringify(usage))
}

export function getRequestsHistory(): { date: string; count: number }[] {
  if (typeof window === "undefined") return []
  const historyStr = localStorage.getItem("requestsHistory")
  const history = historyStr ? JSON.parse(historyStr) : []

  // Generate last 7 days
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const found = history.find((h: any) => h.date === dateStr)
    last7Days.push({
      date: dateStr,
      count: found ? found.count : Math.floor(Math.random() * 20), // Mock data
    })
  }

  return last7Days
}
