"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, CheckCircle2, Plug } from "lucide-react"
import { listMCPKeys } from "@/lib/api-mcp-keys"
import { getMCPSettings } from "@/lib/api-sync"
import { useToast } from "@/components/ui/use-toast"
import { InfoTooltip } from "@/components/ui/info-tooltip"

export default function SyncSettingsPage() {
  const { toast } = useToast()
  const [mcpKey, setMCPKey] = useState("")
  const [serverUrl, setServerUrl] = useState("https://mcp.syncrules.io")
  const [copiedServer, setCopiedServer] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load MCP settings
      const settingsResponse = await getMCPSettings()
      if (settingsResponse.success && settingsResponse.data) {
        setServerUrl(settingsResponse.data.serverUrl || "https://mcp.syncrules.io")
      }

      // Load MCP keys
      const keysResponse = await listMCPKeys()
      if (keysResponse.success && keysResponse.data && keysResponse.data.length > 0) {
        // Note: Keys are encrypted on backend, so we show a placeholder
        // In production, you might want to decrypt or show masked version
        setMCPKey(keysResponse.data[0].key || "***ENCRYPTED***")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const mcpConfig = `{
  "mcpServers": {
    "sync-rules": {
      "command": "npx",
      "args": ["-y", "@syncrules/mcp-server"],
      "env": {
        "SYNC_RULES_API_KEY": "${mcpKey || "SUA_CHAVE_MCP_AQUI"}"
      }
    }
  }
}`

  const copyToClipboard = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 p-4 lg:p-6 bg-background">
        <div className="mx-auto max-w-4xl space-y-4 lg:space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">MCP Configuration</h1>
            <p className="mt-2 text-sm lg:text-base text-muted-foreground">
              Configure the Model Context Protocol to sync your rules in any IDE
            </p>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Plug className="h-5 w-5" />
                    MCP Connection Status
                  </CardTitle>
                  <CardDescription>Model Context Protocol synchronization server</CardDescription>
                </div>
                <Badge variant={mcpKey ? "default" : "secondary"} className="text-xs">
                  {mcpKey ? (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Configured
                    </div>
                  ) : (
                    "Not configured"
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">MCP Server URL</label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(serverUrl, setCopiedServer)}>
                      {copiedServer ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-2 text-xs">{copiedServer ? "Copied!" : "Copy"}</span>
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm text-foreground">
                    {serverUrl}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">MCP API Key</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(mcpKey, setCopiedKey)}
                      disabled={!mcpKey}
                    >
                      {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-2 text-xs">{copiedKey ? "Copied!" : "Copy"}</span>
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm text-foreground break-all">
                    {mcpKey || "Configure your MCP key on the MCP Keys page"}
                  </div>
                  {!mcpKey && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <span>⚠️</span>
                      You need to create an MCP key before configuring synchronization
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">JSON Configuration</label>
                    <InfoTooltip
                      title="MCP Integration"
                      content="MCP allows your rules and documents to be accessed directly by your IDE's AI assistant. Organize your documents by folder for better context and accuracy in responses."
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(mcpConfig, setCopiedConfig)}>
                    {copiedConfig ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2 text-xs">{copiedConfig ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4 font-mono text-xs text-foreground overflow-x-auto">
                  <pre>{mcpConfig}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste this configuration into your IDE's configuration file
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <span>📖</span>
                How to Configure in Any IDE
              </CardTitle>
              <CardDescription>Follow the steps below to enable synchronization</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-foreground">Create your MCP Key</p>
                    <p className="text-sm text-muted-foreground">
                      Go to the <strong>MCP Keys</strong> page and create a new key if you don't have one yet
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-foreground">Copy the JSON Configuration</p>
                    <p className="text-sm text-muted-foreground">
                      Click the "Copy" button next to the <strong>JSON Configuration</strong> above
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-foreground">Configure in your IDE</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Paste the configuration into your IDE's MCP configuration file:
                    </p>
                    <div className="space-y-2 ml-4 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-foreground">VS Code / Cursor:</strong>
                          <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            .vscode/mcp-config.json
                          </code>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-foreground">JetBrains:</strong>
                          <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            .idea/mcp-config.json
                          </code>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-foreground">GitHub Copilot:</strong>
                          <span className="ml-2 text-muted-foreground">
                            Settings → MCP → Add server
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    4
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-foreground">Restart your IDE</p>
                    <p className="text-sm text-muted-foreground">
                      Completely restart your IDE to apply the MCP settings
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    ✓
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-foreground">Done!</p>
                    <p className="text-sm text-muted-foreground">
                      Your rules will be automatically synchronized. Any document added to the{" "}
                      <strong>Documents</strong> folder will be available in your IDE through MCP.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
