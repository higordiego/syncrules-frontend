"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { getUserSync, clearUser } from "@/lib/auth"
import { getMe, logout } from "@/lib/api"
import { updateUser, deleteUser } from "@/lib/api-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Save, AlertTriangle } from "lucide-react"

function ProfileContent() {
  const router = useRouter()
  const [user, setUser] = useState(getUserSync())
  const [name, setName] = useState(user?.name || "")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await getMe()
      if (response.success && response.data) {
        const userData = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          picture: response.data.picture,
          plan: response.data.plan,
        }
        setUser(userData)
        setName(userData.name)
      }
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }

  const handleSaveName = async () => {
    if (!name.trim() || !user) return

    try {
      setLoading(true)
      const response = await updateUser(user.id, { name: name.trim() })
      if (response.success && response.data) {
        setUser({
          ...user,
          name: response.data.name,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Error updating name:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      setLoading(true)
      await deleteUser(user.id)
      await logout()
      clearUser()
      router.push("/login")
    } catch (error) {
      console.error("Error deleting account:", error)
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col">
      <main className="flex-1 p-4 lg:p-6 bg-background">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>

          {/* Informações da Conta */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Account Information</CardTitle>
              <CardDescription>Your login data and personal settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
                  Email
                </Label>
                <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>



              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-card-foreground">
                  Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1"
                  />
                  <Button onClick={handleSaveName} className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                {saved && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">Name updated successfully!</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
          <Card className="border-destructive/50 bg-card">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions on your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDeleteConfirm ? (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently remove your account and all associated data
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-3">
                      <p className="font-semibold">Are you sure you want to delete your account?</p>
                      <p className="text-sm">
                        This action is irreversible. All your documents, MCP keys, and data will be permanently
                        removed.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeleteAccount}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, delete my account
                        </Button>
                        <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProfileContent />
  )
}
