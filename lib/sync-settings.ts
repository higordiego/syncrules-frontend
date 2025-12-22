export interface IDEConnection {
  id: string
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  apiKey?: string
  webhookUrl?: string
  autoSync: boolean
}

export interface MCPSettings {
  configured: boolean
  lastSync?: string
  serverUrl: string
}

const DEFAULT_IDES: IDEConnection[] = [
  {
    id: "vscode",
    name: "VS Code",
    icon: "vscode",
    connected: false,
    autoSync: true,
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    icon: "cursor",
    connected: false,
    autoSync: true,
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    icon: "copilot",
    connected: false,
    autoSync: true,
  },
  {
    id: "jetbrains",
    name: "JetBrains IDEs",
    icon: "jetbrains",
    connected: false,
    autoSync: true,
  },
]

const DEFAULT_SETTINGS: MCPSettings = {
  configured: false,
  serverUrl: "https://mcp.syncrules.io",
}

export function getSyncSettings(): IDEConnection[] {
  if (typeof window === "undefined") return DEFAULT_IDES

  const stored = localStorage.getItem("syncSettings")
  if (!stored) {
    localStorage.setItem("syncSettings", JSON.stringify(DEFAULT_IDES))
    return DEFAULT_IDES
  }
  return JSON.parse(stored)
}

export function getMCPSettings(): MCPSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS

  const stored = localStorage.getItem("mcpSettings")
  if (!stored) {
    localStorage.setItem("mcpSettings", JSON.stringify(DEFAULT_SETTINGS))
    return DEFAULT_SETTINGS
  }
  return JSON.parse(stored)
}

export function saveSyncSettings(settings: IDEConnection[]): void {
  localStorage.setItem("syncSettings", JSON.stringify(settings))
}

export function saveMCPSettings(settings: MCPSettings): void {
  localStorage.setItem("mcpSettings", JSON.stringify(settings))
}

export function updateIDEConnection(ideId: string, updates: Partial<IDEConnection>): void {
  const settings = getSyncSettings()
  const updatedSettings = settings.map((ide) =>
    ide.id === ideId ? { ...ide, ...updates, lastSync: new Date().toISOString() } : ide,
  )
  saveSyncSettings(updatedSettings)
}

export function toggleIDEConnection(ideId: string): void {
  const settings = getSyncSettings()
  const updatedSettings = settings.map((ide) =>
    ide.id === ideId ? { ...ide, connected: !ide.connected, lastSync: new Date().toISOString() } : ide,
  )
  saveSyncSettings(updatedSettings)
}

export function updateMCPSync(): void {
  const settings = getMCPSettings()
  settings.lastSync = new Date().toISOString()
  settings.configured = true
  saveMCPSettings(settings)
}
