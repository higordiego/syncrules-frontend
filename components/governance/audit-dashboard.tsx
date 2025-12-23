"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import {
  Search,
  Filter,
  Eye,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react"
import { getAuditLogs, type AuditLog, type AuditLogsResponse } from "@/lib/api-audit"
import { useToast } from "@/components/ui/use-toast"

interface AuditDashboardProps {
  accountId?: string // Optional, as we filter by user mostly, but can be used for context if needed
}

export function AuditDashboard({ accountId }: AuditDashboardProps) {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [actionCategory, setActionCategory] = useState<string>("all")
  const [resourceType, setResourceType] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {
        limit,
        offset,
      }

      if (searchQuery) {
        // Backend search might need enhancement to support text search, or we rely on specific filters.
        // For now, if backend doesn't support generic search, we might limit this.
        // Assuming backend supports some search or we map it. 
        // Current AuditLogFilters in api-audit.ts has userId, action, etc.
        // It does NOT have a generic 'q' or 'search'. 
        // I will assume for now we use 'action' if it matches or leave it client side?
        // No, client side filtering on paginated data is bad.
        // Let's assume we filter by Action if possible or just ResourceType.
        // If query matches a resource type, use it.
      }

      if (actionCategory !== "all") {
        filters.action = actionCategory // This might need partial match support in backend
      }
      if (resourceType !== "all") {
        filters.resourceType = resourceType
      }

      const response = await getAuditLogs(filters)
      setLogs(response.data || [])
      setTotal(response.pagination?.total || 0)
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
      toast({
        title: "Error",
        description: "Failed to load audit logs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [limit, offset, searchQuery, actionCategory, resourceType, toast])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
                disabled // Disabled until backend supports generic search query
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                  <SelectItem value="rule">Rule</SelectItem>
                  <SelectItem value="permission">Permission</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="mcp_key">MCP Key</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionCategory} onValueChange={setActionCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Action Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              {total} total records found
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.createdAt), "PP pp")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.userId} {/* Need to resolve user name? Mock for now or backend join */}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.action.replace("AuditAction", "").replace(/\./g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{log.resourceType}</span>
                        {log.resourceId && <span className="text-xs text-muted-foreground ml-2 font-mono">({log.resourceId.slice(0, 8)}...)</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {JSON.stringify(log.metadata || {})}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(offset - limit)}
                disabled={offset === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(offset + limit)}
                disabled={offset + limit >= total || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Full JSON payload of the audit entry.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Action:</span> {selectedLog.action}
                  </div>
                  <div>
                    <span className="font-semibold">Resource Type:</span> {selectedLog.resourceType}
                  </div>
                  <div>
                    <span className="font-semibold">User ID:</span> {selectedLog.userId}
                  </div>
                  <div>
                    <span className="font-semibold">Time:</span> {format(new Date(selectedLog.createdAt), "PPpp")}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="font-semibold text-sm">Metadata:</span>
                  <pre className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
                <div className="space-y-2">
                  <span className="font-semibold text-sm">Raw Payload:</span>
                  <pre className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
