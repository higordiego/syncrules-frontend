"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, Plug, AlertCircle, CheckCircle2 } from "lucide-react"
import { listMCPKeys } from "@/lib/api-mcp-keys"
import { getMCPSettings } from "@/lib/api-sync"
import { useToast } from "@/components/ui/use-toast"
import { isKeyViewed } from "@/lib/mcp-key-storage"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { MCPKey, MCPKeyScope } from "@/lib/api-mcp-keys"
import type { Project } from "@/lib/types/governance"

interface ProjectSyncSettingsProps {
  projectId: string
  projectName: string
  availableProjects: Project[] // Para seleção de múltiplos projetos (monorepo)
  hasPermission: boolean // Se o usuário tem permissão para ver tokens
}

export function ProjectSyncSettings({
  projectId,
  projectName,
  availableProjects,
  hasPermission,
}: ProjectSyncSettingsProps) {
  const { toast } = useToast()
  const [mcpKey, setMCPKey] = useState<string>("")
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState("https://mcp.syncrules.io")
  const [copiedServer, setCopiedServer] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [keys, setKeys] = useState<MCPKey[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([projectId]) // Múltiplos projetos para monorepo

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load MCP settings
      const settingsResponse = await getMCPSettings()
      if (settingsResponse.success && settingsResponse.data) {
        setServerUrl(settingsResponse.data.serverUrl || "https://mcp.syncrules.io")
      }

      // Load MCP keys filtradas por projeto
      const keysResponse = await listMCPKeys()
      if (keysResponse.success && keysResponse.data) {
        const projectKeys = Array.isArray(keysResponse.data)
          ? keysResponse.data.filter((key: MCPKey) => {
              // Filtrar chaves que têm acesso ao projeto atual
              if (key.scope === "all_projects") return true
              if (key.scope === "account") return true // Assumindo que account inclui todos os projetos
              if (key.scope === "project") {
                return (
                  key.projectId === projectId ||
                  (key.projectIds && key.projectIds.includes(projectId))
                )
              }
              return false
            })
          : []
        setKeys(projectKeys)

        // Selecionar primeira chave válida
        if (projectKeys.length > 0) {
          setSelectedKeyId(projectKeys[0].id)
          setMCPKey(projectKeys[0].key || "")
        }
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

  useEffect(() => {
    if (selectedKeyId && keys.length > 0) {
      const key = keys.find((k) => k.id === selectedKeyId)
      if (key) {
        setMCPKey(key.key || "")
      }
    }
  }, [selectedKeyId, keys])

  const handleProjectToggle = (projId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects((prev) => [...prev, projId])
    } else {
      setSelectedProjects((prev) => prev.filter((id) => id !== projId))
    }
  }

  const generateMCPConfig = () => {
    const selectedProjectsData = availableProjects.filter((p) =>
      selectedProjects.includes(p.id)
    )
    const projectNames = selectedProjectsData.map((p) => p.name).join(", ")

    // Se múltiplos projetos, criar configuração com múltiplos servidores
    if (selectedProjects.length > 1) {
      const servers: Record<string, any> = {}
      selectedProjects.forEach((projId, index) => {
        const proj = availableProjects.find((p) => p.id === projId)
        const serverName = `sync-rules-${proj?.name.toLowerCase().replace(/\s+/g, "-") || `project-${index + 1}`}`
        servers[serverName] = {
          command: "npx",
          args: ["-y", "@syncrules/mcp-server"],
          env: {
            SYNC_RULES_API_KEY: mcpKey || "SUA_CHAVE_MCP_AQUI",
            SYNC_RULES_PROJECT_ID: projId,
          },
        }
      })

      return JSON.stringify(
        {
          mcpServers: servers,
        },
        null,
        2
      )
    }

    // Configuração simples para um projeto
    return JSON.stringify(
      {
        mcpServers: {
          "sync-rules": {
            command: "npx",
            args: ["-y", "@syncrules/mcp-server"],
            env: {
              SYNC_RULES_API_KEY: mcpKey || "SUA_CHAVE_MCP_AQUI",
              SYNC_RULES_PROJECT_ID: projectId,
            },
          },
        },
      },
      null,
      2
    )
  }

  const mcpConfig = generateMCPConfig()

  const copyToClipboard = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied!",
      description: "Configuration copied to clipboard",
    })
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return "***"
    return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  if (!hasPermission) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Permission Required</p>
              <p className="text-sm text-muted-foreground">
                You don't have permission to view MCP configuration for this project.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Plug className="h-5 w-5" />
                MCP Connection Status
              </CardTitle>
              <CardDescription>Model Context Protocol synchronization configuration</CardDescription>
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
          {/* Project Selection (Monorepo Support) */}
          {availableProjects.length > 1 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Projects (Monorepo)</Label>
              <p className="text-xs text-muted-foreground">
                Select one or more projects to include in the MCP configuration. Useful for monorepositories with
                multiple projects (e.g., frontend, backend).
              </p>
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {availableProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={(checked) => handleProjectToggle(project.id, checked as boolean)}
                      disabled={project.id === projectId && selectedProjects.length === 1} // Não pode desmarcar o projeto atual se for o único
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {project.name}
                      {project.id === projectId && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Current
                        </Badge>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              {selectedProjects.length > 1 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedProjects.length} projects selected. Configuration will include multiple MCP servers.
                </p>
              )}
            </div>
          )}

          {/* MCP Key Selection */}
          {keys.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">MCP API Key</Label>
              <Select value={selectedKeyId || ""} onValueChange={setSelectedKeyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an MCP key" />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      <div className="flex items-center gap-2">
                        <span>{key.name}</span>
                        {key.scope === "all_projects" && (
                          <Badge variant="outline" className="text-xs">
                            All Projects
                          </Badge>
                        )}
                        {key.scope === "account" && (
                          <Badge variant="outline" className="text-xs">
                            Account
                          </Badge>
                        )}
                        {key.scope === "project" && (
                          <Badge variant="outline" className="text-xs">
                            Project
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Server URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">MCP Server URL</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(serverUrl, setCopiedServer)}
              >
                {copiedServer ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 text-xs">{copiedServer ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm text-foreground">
              {serverUrl}
            </div>
          </div>

          {/* API Key Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">MCP API Key</Label>
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
              {mcpKey 
                ? (selectedKeyId && isKeyViewed(selectedKeyId) ? maskKey(mcpKey) : mcpKey)
                : "No MCP key selected"}
            </div>
            {mcpKey && selectedKeyId && !isKeyViewed(selectedKeyId) && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">
                  ⚠️ Save this key now! You won't be able to see it again after refreshing.
                </p>
              </div>
            )}
            {!mcpKey && (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Create an MCP key on the MCP Keys page to configure synchronization
              </p>
            )}
          </div>

          {/* JSON Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">JSON Configuration</Label>
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
              Paste this configuration into your IDE's MCP configuration file (e.g.,{" "}
              <code className="bg-muted px-1 py-0.5 rounded">.vscode/mcp-config.json</code>)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <span>📖</span>
            How to Configure
          </CardTitle>
          <CardDescription>Follow these steps to enable MCP synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">Select Projects</p>
                <p className="text-sm text-muted-foreground">
                  {availableProjects.length > 1
                    ? "Select one or more projects to include in your MCP configuration (useful for monorepositories)."
                    : `This configuration is for the "${projectName}" project.`}
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">Copy JSON Configuration</p>
                <p className="text-sm text-muted-foreground">
                  Click the "Copy" button next to the JSON Configuration above
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">Configure in Your IDE</p>
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
                </div>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                ✓
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">Restart IDE</p>
                <p className="text-sm text-muted-foreground">
                  Restart your IDE completely to apply the MCP settings. Your rules will be automatically
                  synchronized.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

