"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authenticateWithGoogle, setTokens, clearTokens } from "@/lib/api"
import { setUser } from "@/lib/auth"
import { Logo } from "@/components/logo"
import { InvitesPendingDialog } from "@/components/invites-pending-dialog"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [showInvitesDialog, setShowInvitesDialog] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")

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
      .then(async (response) => {
        if (response.success && response.data) {
          // Armazena tokens
          setTokens({
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          })

          // Armazena dados do usuário
          const userData = {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
            picture: response.data.user.picture,
          }
          setUser(userData)
          setUserEmail(userData.email)

          setStatus("success")
          
          // Verificar convites pendentes primeiro
          const { getMyPendingInvites } = await import("@/lib/api-invites")
          try {
            const invitesResponse = await getMyPendingInvites()
            if (invitesResponse.success && invitesResponse.data && invitesResponse.data.length > 0) {
              // Há convites pendentes, mostrar diálogo
              setShowInvitesDialog(true)
              return // Não redirecionar ainda, aguardar ação do usuário
            }
          } catch (error) {
            console.error("Failed to check invites:", error)
            // Continuar normalmente mesmo se houver erro ao verificar convites
          }
          
          // Verificar se usuário tem organizações
          // Importar dinamicamente para evitar problemas de SSR
          const { listAccounts } = await import("@/lib/api-accounts")
          try {
            const accountsResponse = await listAccounts()
            if (accountsResponse.success && accountsResponse.data && accountsResponse.data.length > 0) {
              // Usuário tem organizações, redirecionar para seleção
              setTimeout(() => {
                router.push("/onboarding/select-account")
              }, 1000)
            } else {
              // Usuário não tem organizações, forçar criação
              setTimeout(() => {
                router.push("/onboarding/select-account")
              }, 1000)
            }
          } catch (error) {
            // Em caso de erro, redirecionar para seleção mesmo assim
            console.error("Failed to check accounts:", error)
            setTimeout(() => {
              router.push("/onboarding/select-account")
            }, 1000)
          }
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

  // Function to handle redirection after invites are resolved
  const handleInvitesResolved = async () => {
    setShowInvitesDialog(false)
    // Re-run account check and redirect
    const { listAccounts } = await import("@/lib/api-accounts")
    try {
      const accountsResponse = await listAccounts()
      if (accountsResponse.success && accountsResponse.data && accountsResponse.data.length > 0) {
        router.push("/onboarding/select-account")
      } else {
        router.push("/onboarding/select-account")
      }
    } catch (error) {
      console.error("Failed to check accounts after invites resolved:", error)
      router.push("/onboarding/select-account")
    }
  }

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
              <p className="text-muted-foreground">Redirecionando...</p>
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

      {showInvitesDialog && userEmail && (
        <InvitesPendingDialog
          userEmail={userEmail}
          onClose={handleInvitesResolved}
        />
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 backdrop-blur-sm shadow-2xl mb-6 p-3">
              <Logo className="h-14 w-14 text-primary" />
            </div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Carregando...</h2>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}

