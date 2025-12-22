"use client"

export interface User {
  id: string
  email: string
  name: string
  picture: string
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

export function setUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem("user")
}

export function updateUserName(name: string) {
  const user = getUser()
  if (user) {
    user.name = name
    setUser(user)
  }
}

export function deleteAccount() {
  localStorage.removeItem("user")
  localStorage.removeItem("mcpKeys")
  localStorage.removeItem("documents")
  localStorage.removeItem("folders")
}

export function simulateGoogleLogin(): User {
  const mockUser: User = {
    id: "1",
    email: "usuario@gmail.com",
    name: "Usuário Demo",
    picture: "/diverse-user-avatars.png",
  }
  setUser(mockUser)
  return mockUser
}
