"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth"

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const user = getUserSync()

    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [router, mounted])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
