"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authenticateWithGoogle, setTokens, clearTokens } from "@/lib/api"
import { setUser } from "@/lib/auth"
import { Logo } from "@/components/logo"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const errorParam = searchParams.get("error")

    // Se Google retornou erro
    if (errorParam) {
      setStatus("error")
      setError(
        errorParam === "access_denied"
          ? "Acesso negado. Por favor, autorize o acesso para continuar."
          : "Erro ao autenticar com Google. Tente novamente."
      )
      return
    }

    // Se não há código, erro
    if (!code) {
      setStatus("error")
      setError("Código de autorização não encontrado.")
      return
    }

    // Autentica com backend
    authenticateWithGoogle(code)
      .then((response) => {
        if (response.success && response.data) {
          // Armazena tokens
          setTokens({
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          })

          // Armazena dados do usuário
          setUser({
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
            picture: response.data.user.picture,
          })

          setStatus("success")
          // Redireciona para dashboard após 1 segundo
          setTimeout(() => {
            router.push("/dashboard")
          }, 1000)
        } else {
          setStatus("error")
          setError(response.error?.message || "Erro ao autenticar. Tente novamente.")
          clearTokens()
        }
      })
      .catch((err) => {
        setStatus("error")
        setError(err.message || "Erro inesperado. Tente novamente.")
        clearTokens()
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 backdrop-blur-sm shadow-2xl mb-6 p-3">
          <Logo className="h-14 w-14 text-primary" />
        </div>

        {status === "loading" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Autenticando...</h2>
              <p className="text-muted-foreground">Aguarde enquanto processamos sua autenticação.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Autenticação bem-sucedida!</h2>
              <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Erro na autenticação</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Voltar para login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

