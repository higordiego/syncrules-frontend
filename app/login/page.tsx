"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getGoogleAuthUrl } from "@/lib/api"
import { Sparkles, Zap, Lock, Brain } from "lucide-react"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    setLoading(true)
    // Redireciona para Google OAuth
    // O Google redirecionará de volta para /auth/callback
    window.location.href = getGoogleAuthUrl()
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-blue-800 relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          <div className="mb-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-2xl mb-6 animate-float p-3">
              <Logo className="h-14 w-14 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 text-balance">Sync Rules</h1>
            <p className="text-xl text-blue-100 text-balance">Manage your AI rules in one place</p>
          </div>

          {/* Features com ícones animados */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Centralized Context</h3>
                <p className="text-blue-100 text-sm">
                  Organize rules and documents for your IDE in smart folders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Key Management</h3>
                <p className="text-blue-100 text-sm">Securely store and manage your MCP keys</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Instant Sync</h3>
                <p className="text-blue-100 text-sm">Your rules always updated and accessible in your IDE</p>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-10 right-10 opacity-20">
            <Sparkles className="w-8 h-8 animate-spin-slow" />
          </div>
          <div className="absolute bottom-10 left-10 opacity-20">
            <Sparkles className="w-6 h-6 animate-spin-slow delay-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg mb-4 p-2">
              <Logo className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground dark:text-slate-100">Sync Rules</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-slate-100">Welcome back</h2>
              <p className="text-muted-foreground dark:text-slate-400">Sign in with your Google account to continue</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 text-base font-medium bg-card hover:bg-accent border-2 border-border text-foreground shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </div>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background dark:bg-slate-950 px-2 text-muted-foreground dark:text-slate-500">Secure and fast access</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent p-4 backdrop-blur-sm dark:bg-slate-900/50 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center ring-1 ring-primary/20 dark:ring-primary/30">
                    <Sparkles className="w-5 h-5 text-primary dark:text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-primary dark:text-primary mb-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      Powered by AI
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                      Intelligent document management system with Markdown support and automatic organization
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-600 dark:text-slate-400 px-8">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-slate-700 dark:text-slate-300">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-slate-700 dark:text-slate-300">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
