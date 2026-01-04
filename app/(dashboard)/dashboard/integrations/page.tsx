"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Code,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Terminal,
  FileCode,
  Settings,
  Key,
  Zap,
  BookOpen,
  Sparkles,
} from "lucide-react"
import { useAccount } from "@/context/AccountContext"
import { listMCPKeys, getMCPKey, type MCPKey } from "@/lib/api-mcp-keys"
import { listProjects } from "@/lib/api-projects"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface IDEIntegration {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  status: "connected" | "not_connected" | "available"
  docsUrl?: string
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const { selectedAccount } = useAccount()
  const [mcpKeys, setMcpKeys] = useState<MCPKey[]>([])
  const [selectedKey, setSelectedKey] = useState<MCPKey | null>(null)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedAccount])

  const loadData = async () => {
    try {
      const [keysResponse, projectsResponse] = await Promise.all([
        listMCPKeys(),
        listProjects(),
      ])

      if (keysResponse.success && keysResponse.data) {
        const keys = Array.isArray(keysResponse.data) ? keysResponse.data : []
        setMcpKeys(keys)
        if (keys.length > 0) {
          setSelectedKey(keys[0])
        }
      }

      if (projectsResponse.success && projectsResponse.data) {
        const projs = Array.isArray(projectsResponse.data) ? projectsResponse.data : []
        setProjects(projs)
        if (projs.length > 0) {
          setSelectedProject(projs[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const ideIntegrations: IDEIntegration[] = [
    {
      id: "cursor",
      name: "Cursor",
      icon: Code,
      description: "AI-powered code editor with context awareness",
      status: "available",
      docsUrl: "https://docs.cursor.com",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      icon: Sparkles,
      description: "Google's AI assistant for code generation",
      status: "available",
      docsUrl: "https://ai.google.dev",
    },
    {
      id: "vscode",
      name: "VS Code",
      icon: FileCode,
      description: "Visual Studio Code with MCP extension",
      status: "available",
    },
  ]

  const handleRevealKey = async (keyId: string) => {
    if (revealedKey) return // Already revealed
    setLoadingKey(true)
    try {
      const response = await getMCPKey(keyId)
      if (response.success && response.data) {
        setRevealedKey(response.data.key)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reveal key. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to reveal key:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reveal key. Please try again.",
      })
    } finally {
      setLoadingKey(false)
    }
  }

  const getMCPConfig = (ideId: string, keyValue?: string) => {
    const apiKey = keyValue || revealedKey || selectedKey?.key || "YOUR_MCP_KEY_HERE"
    
    if (ideId === "cursor") {
      return `{
  "mcpServers": {
    "sync-rules": {
      "command": "npx",
      "args": ["-y", "@syncrules/mcp-server"],
      "env": {
        "SYNC_RULES_API_KEY": "${apiKey}",
        "SYNC_RULES_ACCOUNT_ID": "${selectedAccount?.id || ""}"
      }
    }
  }
}`
    }

    if (ideId === "gemini") {
      return `{
  "mcpServers": {
    "sync-rules": {
      "command": "npx",
      "args": ["-y", "@syncrules/mcp-server"],
      "env": {
        "SYNC_RULES_API_KEY": "${apiKey}",
        "SYNC_RULES_ACCOUNT_ID": "${selectedAccount?.id || ""}"
      }
    }
  }
}`
    }

    return `{
  "mcpServers": {
    "sync-rules": {
      "command": "npx",
      "args": ["-y", "@syncrules/mcp-server"],
      "env": {
        "SYNC_RULES_API_KEY": "${apiKey}"
      }
    }
  }
}`
  }

  const getConfigPath = (ideId: string) => {
    switch (ideId) {
      case "cursor":
        return "~/.cursor/mcp.json"
      case "gemini":
        return "~/.config/gemini/mcp.json"
      case "vscode":
        return "~/.vscode/mcp.json"
      default:
        return "~/.mcp.json"
    }
  }

  const getSetupSteps = (ideId: string) => {
    const steps = [
      {
        title: "Create MCP Key",
        description: "Generate an API key in the MCP Keys section",
        icon: Key,
        action: (
          <Link href="/mcp-keys">
            <Button variant="outline" size="sm">
              Go to MCP Keys
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        ),
      },
      {
        title: "Copy Configuration",
        description: "Copy the MCP configuration JSON",
        icon: Copy,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(getMCPConfig(ideId))
              setCopiedConfig(ideId)
              setTimeout(() => setCopiedConfig(null), 2000)
              toast({
                variant: "success",
                title: "Configuration copied!",
                description: "Paste it into your IDE's MCP config file",
              })
            }}
          >
            {copiedConfig === ideId ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Config
              </>
            )}
          </Button>
        ),
      },
      {
        title: "Configure IDE",
        description: `Create or edit ${getConfigPath(ideId)} and paste the configuration`,
        icon: Settings,
        action: (
          <div className="text-sm text-muted-foreground">
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {getConfigPath(ideId)}
            </code>
          </div>
        ),
      },
      {
        title: "Restart IDE",
        description: "Restart your IDE to load the MCP server",
        icon: Zap,
        action: (
          <Badge variant="secondary" className="text-xs">
            Required
          </Badge>
        ),
      },
    ]

    return steps
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    toast({
      variant: "success",
      title: "Copied!",
      description: "API key copied to clipboard",
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Zap className="h-8 w-8" />
                Integrations
              </h1>
              <p className="text-muted-foreground mt-1">
                Connect your projects with AI-powered IDEs using MCP (Model Context Protocol)
              </p>
            </div>
            <Link href="/mcp-keys">
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Manage MCP Keys
              </Button>
            </Link>
          </div>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                How It Works
              </CardTitle>
              <CardDescription>
                Understand how Sync Rules integrates with your IDE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">1. MCP Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a secure API key that authenticates your IDE with Sync Rules
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">2. Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Add the MCP server configuration to your IDE's settings file
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">3. Auto-Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Your rules automatically sync to your IDE's AI context in real-time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MCP Key Selection */}
          {mcpKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Select MCP Key
                </CardTitle>
                <CardDescription>
                  Choose which API key to use for IDE integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {mcpKeys.map((key) => (
                    <Button
                      key={key.id}
                      variant={selectedKey?.id === key.id ? "default" : "outline"}
                      onClick={() => setSelectedKey(key)}
                      className="flex items-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      {key.name}
                      {key.scope === "all_projects" && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          All Projects
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                {selectedKey && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{selectedKey.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedKey.description || "No description"}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-xs font-mono bg-background px-2 py-1 rounded border">
                            {revealedKey || (selectedKey.key?.substring(0, 8) + "•".repeat(32) + selectedKey.key?.slice(-8)) || "Key not available"}
                          </p>
                          {!revealedKey && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevealKey(selectedKey.id)}
                              disabled={loadingKey}
                            >
                              {loadingKey ? "Loading..." : "Reveal"}
                            </Button>
                          )}
                          {revealedKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(revealedKey)}
                            >
                              {copiedKey ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {mcpKeys.length === 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      No MCP Keys Found
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      You need to create an MCP key before setting up IDE integrations.
                    </p>
                    <Link href="/mcp-keys" className="mt-3 inline-block">
                      <Button variant="outline" size="sm">
                        Create MCP Key
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* IDE Integrations */}
          <Tabs defaultValue="cursor" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              {ideIntegrations.map((ide) => (
                <TabsTrigger key={ide.id} value={ide.id} className="flex items-center gap-2">
                  <ide.icon className="h-4 w-4" />
                  {ide.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {ideIntegrations.map((ide) => (
              <TabsContent key={ide.id} value={ide.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ide.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{ide.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {ide.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={ide.status === "connected" ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {ide.status === "connected" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </>
                        ) : (
                          "Available"
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Setup Steps */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Setup Instructions
                      </h3>
                      <div className="space-y-4">
                        {getSetupSteps(ide.id).map((step, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <step.icon className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">
                                    Step {index + 1}: {step.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {step.description}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">{step.action}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Configuration Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <FileCode className="h-5 w-5" />
                          Configuration
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(getMCPConfig(ide.id))
                            setCopiedConfig(ide.id)
                            setTimeout(() => setCopiedConfig(null), 2000)
                            toast({
                              variant: "success",
                              title: "Configuration copied!",
                              description: `Paste into ${getConfigPath(ide.id)}`,
                            })
                          }}
                        >
                          {copiedConfig === ide.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Config
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <pre className="p-4 bg-muted rounded-lg border overflow-x-auto text-sm">
                          <code>{getMCPConfig(ide.id)}</code>
                        </pre>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {getConfigPath(ide.id)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Start */}
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              Quick Start
                            </h4>
                            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                              <li className="flex items-start gap-2">
                                <span className="font-semibold">1.</span>
                                <span>
                                  Create an MCP key in the{" "}
                                  <Link href="/mcp-keys" className="underline font-medium">
                                    MCP Keys
                                  </Link>{" "}
                                  section
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-semibold">2.</span>
                                <span>
                                  Copy the configuration JSON above and save it to{" "}
                                  <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-xs">
                                    {getConfigPath(ide.id)}
                                  </code>
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-semibold">3.</span>
                                <span>Restart your IDE to load the MCP server</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="font-semibold">4.</span>
                                <span>
                                  Your rules will automatically sync to your IDE context
                                </span>
                              </li>
                            </ol>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
    </div>
  )
}

