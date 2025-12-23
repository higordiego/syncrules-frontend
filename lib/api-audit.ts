import { fetchWithAuth } from "./api-config";

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface AuditLogFilters {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    ipAddress?: string;
    limit?: number;
    offset?: number;
}

export interface AuditLogsResponse {
    success: boolean;
    data: AuditLog[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogsResponse> {
    const queryParams = new URLSearchParams();

    if (filters.userId) queryParams.append("userId", filters.userId);
    if (filters.action) queryParams.append("action", filters.action);
    if (filters.resourceType) queryParams.append("resourceType", filters.resourceType);
    if (filters.resourceId) queryParams.append("resourceId", filters.resourceId);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.ipAddress) queryParams.append("ipAddress", filters.ipAddress);
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.offset) queryParams.append("offset", filters.offset.toString());

    const response = await fetchWithAuth(`/audit/logs?${queryParams.toString()}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch audit logs");
    }

    return response.json();
}

export async function getAuditLog(id: string): Promise<AuditLog> {
    const response = await fetchWithAuth(`/audit/logs/${id}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch audit log");
    }

    const data = await response.json();
    return data.data;
}
