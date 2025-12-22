# Backend Requirements - Sync Rules

## Document Version
**Version:** 1.0  
**Date:** December 2024  
**Status:** Requirements Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoints Specification](#api-endpoints-specification)
5. [Data Models & Validation](#data-models--validation)
6. [Business Rules](#business-rules)
7. [Security Requirements](#security-requirements)
8. [Performance Requirements](#performance-requirements)
9. [Error Handling](#error-handling)
10. [Database Requirements](#database-requirements)
11. [File Storage Requirements](#file-storage-requirements)
12. [Integration Requirements](#integration-requirements)
13. [Testing Requirements](#testing-requirements)
14. [Deployment Requirements](#deployment-requirements)

---

## Executive Summary

This document specifies all backend requirements for the **Sync Rules** application. The backend must provide a RESTful API that supports:

- User authentication via Google OAuth
- Document and folder management with hierarchical structure
- MCP API keys management with encryption
- Activity tracking and usage statistics
- Plan-based feature access and limits enforcement
- IDE synchronization via MCP protocol
- File upload/download with storage management

**Critical Requirements:**
- All operations must be user-scoped (users can only access their own data)
- Plan limits must be enforced on every operation
- MCP keys must be encrypted at rest
- File storage must support hierarchical folder structures
- Real-time usage statistics calculation

---

## Architecture Overview

### Recommended Technology Stack

**Runtime & Framework:**
- Node.js 18+ with Express.js / NestJS
- OR: Python 3.11+ with FastAPI / Django

**Database:**
- PostgreSQL 14+ (Primary database)
- Redis (Caching and session management)

**File Storage:**
- AWS S3 / Google Cloud Storage / Azure Blob Storage

**Authentication:**
- JWT tokens for API authentication
- Google OAuth 2.0 for user login

**Other Services:**
- Message Queue: Bull (Node.js) or Celery (Python)
- Monitoring: Prometheus + Grafana
- Logging: Winston / Pino (Node.js) or Loguru (Python)

### System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │ HTTPS/REST API
         │ JWT Authentication
┌────────▼────────────────────────────────────┐
│         Backend API Server                  │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Auth       │  │  Documents   │        │
│  │   Service    │  │   Service    │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   MCP Keys   │  │   Activity   │        │
│  │   Service    │  │   Service    │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Sync       │  │   Usage      │        │
│  │   Service    │  │   Service    │        │
│  └──────────────┘  └──────────────┘        │
└────────┬────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬─────────────┐
    │         │              │             │
┌───▼───┐ ┌──▼────┐  ┌──────▼────┐  ┌────▼────┐
│Postgre│ │ Redis  │  │ File      │  │  Queue  │
│  SQL  │ │ Cache  │  │ Storage   │  │ Service │
└───────┘ └────────┘  └───────────┘  └─────────┘
```

---

## Authentication & Authorization

### Authentication Flow

**1. Google OAuth Login**

```
Frontend → Backend: POST /api/auth/google
  Body: { code: "authorization_code" }
  
Backend:
  1. Exchange code for access token with Google
  2. Fetch user profile from Google
  3. Create or update user in database
  4. Generate JWT token
  5. Return token to frontend
  
Response: {
  success: true,
  data: {
    token: "jwt_token_here",
    user: { id, email, name, picture, plan }
  }
}
```

**2. Token Validation**

All protected endpoints must:
- Validate JWT token in `Authorization: Bearer <token>` header
- Check token expiration
- Verify user exists and is active
- Extract `userId` from token payload

**3. Token Refresh**

```
POST /api/auth/refresh
Headers: { Authorization: Bearer <refresh_token> }

Response: {
  success: true,
  data: {
    token: "new_jwt_token",
    refreshToken: "new_refresh_token"
  }
}
```

### Authorization Rules

1. **User Scoping**: All resources must be scoped to the authenticated user
2. **Resource Ownership**: Users can only access/modify their own resources
3. **Plan-Based Access**: Feature access based on user's plan tier
4. **Rate Limiting**: Different limits per plan tier

### JWT Token Structure

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "plan": "freemium",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiration:**
- Access Token: 1 hour
- Refresh Token: 7 days

---

## API Endpoints Specification

### Base URL
```
Production: https://api.syncrules.io/v1
Development: http://localhost:3001/api/v1
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 1. Authentication Endpoints

#### POST /api/auth/google
**Description:** Authenticate user with Google OAuth

**Request:**
```json
{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://...",
      "plan": "freemium"
    }
  }
}
```

**Business Rules:**
- Exchange authorization code for access token
- Fetch user profile from Google API
- Create user if doesn't exist
- Update user if exists (update name, picture)
- Set default plan to "freemium"
- Generate JWT tokens

**Error Codes:**
- `AUTH_GOOGLE_FAILED`: Google OAuth failed
- `AUTH_INVALID_CODE`: Invalid authorization code

---

#### POST /api/auth/refresh
**Description:** Refresh access token

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

**Error Codes:**
- `AUTH_INVALID_TOKEN`: Invalid refresh token
- `AUTH_EXPIRED`: Refresh token expired

---

#### POST /api/auth/logout
**Description:** Logout user (invalidate tokens)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET /api/auth/me
**Description:** Get current authenticated user

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "plan": "freemium",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2. User Endpoints

#### GET /api/users/:id
**Description:** Get user profile (own profile only)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "plan": "freemium",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Authorization:**
- User can only access their own profile (`userId` from token must match `:id`)

**Error Codes:**
- `FORBIDDEN`: Trying to access another user's profile
- `NOT_FOUND`: User not found

---

#### PUT /api/users/:id
**Description:** Update user profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "New Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "New Name",
    "picture": "https://...",
    "plan": "freemium",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validation:**
- `name`: Required, string, 1-100 characters
- Cannot update `email` or `plan` via this endpoint

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input
- `FORBIDDEN`: Not authorized

---

#### DELETE /api/users/:id
**Description:** Delete user account and all associated data

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Business Rules:**
- Soft delete user (mark as deleted, don't remove data immediately)
- Delete all user's documents, folders, MCP keys
- Delete all activities
- Delete from file storage
- Schedule permanent deletion after 30 days

**Error Codes:**
- `FORBIDDEN`: Not authorized

---

### 3. Document Endpoints

#### GET /api/documents
**Description:** Get all documents for authenticated user

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `parentId` (optional): Filter by parent folder ID (null for root)
- `type` (optional): Filter by type ("file" | "folder")
- `search` (optional): Search in document names
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "document.md",
      "type": "file",
      "parentId": "uuid",
      "size": 1024,
      "mimeType": "text/markdown",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Business Rules:**
- Only return documents owned by authenticated user
- Sort: folders first, then files, then alphabetically
- If `parentId` provided, only return direct children
- If `search` provided, search in names (case-insensitive)

---

#### GET /api/documents/:id
**Description:** Get single document by ID

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "document.md",
    "type": "file",
    "content": "# Document content...",
    "parentId": "uuid",
    "size": 1024,
    "mimeType": "text/markdown",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Include `content` only for files
- Verify document belongs to authenticated user

**Error Codes:**
- `NOT_FOUND`: Document not found
- `FORBIDDEN`: Not authorized

---

#### POST /api/documents
**Description:** Create new document or folder

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "new-document.md",
  "type": "file",
  "content": "# Content here...",
  "parentId": "uuid" // or null for root
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "new-document.md",
    "type": "file",
    "content": "# Content here...",
    "parentId": "uuid",
    "size": 1024,
    "mimeType": "text/markdown",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validation:**
- `name`: Required, string, 1-255 characters, no invalid characters (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`)
- `type`: Required, enum ["file", "folder"]
- `content`: Required if type is "file", string, max 10MB
- `parentId`: Optional, UUID or null, must exist and be owned by user if provided

**Business Rules:**
- **Plan Limit Check**: Before creating file, check `filesUsed < filesLimit`
- **Storage Check**: Calculate new storage size, check `storageUsed + newSize < storageLimit`
- If `parentId` provided, verify it's a folder owned by user
- Calculate file size from content
- Set `mimeType` based on file extension
- Create activity log entry
- Update usage statistics

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input
- `LIMIT_EXCEEDED`: File limit exceeded
- `STORAGE_FULL`: Storage quota exceeded
- `NOT_FOUND`: Parent folder not found
- `FORBIDDEN`: Not authorized

---

#### PUT /api/documents/:id
**Description:** Update document (rename or update content)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "renamed-document.md", // optional
  "content": "# Updated content..." // optional, only for files
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "renamed-document.md",
    "type": "file",
    "content": "# Updated content...",
    "parentId": "uuid",
    "size": 2048,
    "mimeType": "text/markdown",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validation:**
- `name`: Optional, string, 1-255 characters
- `content`: Optional, string, max 10MB (only for files)

**Business Rules:**
- Verify document belongs to authenticated user
- If updating content, recalculate size and check storage limit
- Update `updatedAt` timestamp
- Create activity log entry
- Update usage statistics if size changed

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input
- `STORAGE_FULL`: Storage quota exceeded (if content updated)
- `NOT_FOUND`: Document not found
- `FORBIDDEN`: Not authorized

---

#### DELETE /api/documents/:id
**Description:** Delete document (recursive for folders)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "deletedCount": 5, // Number of documents deleted (including children)
    "freedStorage": 10240 // Bytes freed
  }
}
```

**Business Rules:**
- Verify document belongs to authenticated user
- If folder, recursively delete all children
- Delete files from storage
- Update usage statistics (decrease file count and storage)
- Create activity log entry
- Return count of deleted items and freed storage

**Error Codes:**
- `NOT_FOUND`: Document not found
- `FORBIDDEN`: Not authorized

---

#### GET /api/documents/:id/path
**Description:** Get breadcrumb path for document

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Root",
      "type": "folder"
    },
    {
      "id": "uuid",
      "name": "Folder 1",
      "type": "folder"
    },
    {
      "id": "uuid",
      "name": "document.md",
      "type": "file"
    }
  ]
}
```

**Business Rules:**
- Build path from root to document
- Verify all path items belong to authenticated user

---

#### POST /api/documents/:id/move
**Description:** Move document to different parent folder

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "parentId": "uuid" // or null for root
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "document.md",
    "parentId": "uuid",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Verify document belongs to authenticated user
- Verify new parent exists and belongs to user (if provided)
- Prevent moving folder into itself or its descendants
- Update `updatedAt` timestamp
- Create activity log entry

**Error Codes:**
- `VALIDATION_ERROR`: Invalid parentId
- `INVALID_OPERATION`: Cannot move folder into itself or descendants
- `NOT_FOUND`: Document or parent not found
- `FORBIDDEN`: Not authorized

---

#### POST /api/documents/upload
**Description:** Upload single or multiple files

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File[] (one or more files)
- `parentId`: string (optional, UUID or null)

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "uuid",
        "name": "file1.md",
        "type": "file",
        "size": 1024
      }
    ],
    "failed": [],
    "totalSize": 1024
  }
}
```

**Business Rules:**
- Validate file types (only `.md`, `.txt` allowed)
- Validate file sizes (max 10MB per file)
- Check plan limits before upload
- Check storage quota before upload
- Upload files to storage service
- Create document records
- Update usage statistics
- Create activity log entries

**Error Codes:**
- `VALIDATION_ERROR`: Invalid files
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed
- `LIMIT_EXCEEDED`: File limit exceeded
- `STORAGE_FULL`: Storage quota exceeded

---

#### POST /api/documents/upload-directory
**Description:** Upload entire directory structure

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File[] (files with webkitRelativePath)
- `parentId`: string (optional, UUID or null)

**Response:**
```json
{
  "success": true,
  "data": {
    "foldersCreated": 5,
    "filesUploaded": 10,
    "totalSize": 10240
  }
}
```

**Business Rules:**
- Parse `webkitRelativePath` from files
- Create folder structure first (shallowest to deepest)
- Then upload files to correct folders
- Check plan limits before processing
- Check storage quota before processing
- Create activity log entry

**Error Codes:**
- `VALIDATION_ERROR`: Invalid directory structure
- `LIMIT_EXCEEDED`: File limit exceeded
- `STORAGE_FULL`: Storage quota exceeded

---

#### GET /api/documents/search
**Description:** Search documents by name or content

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `q`: string (required) - Search query
- `type` (optional): Filter by type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "document.md",
      "type": "file",
      "parentId": "uuid",
      "highlight": "Found in <mark>document</mark>.md"
    }
  ],
  "pagination": { ... }
}
```

**Business Rules:**
- Search in document names (case-insensitive)
- Optionally search in file content (for Pro+ plans)
- Return matching documents with highlight
- Auto-expand parent folders in results

---

### 4. MCP Keys Endpoints

#### GET /api/mcp-keys
**Description:** Get all MCP keys for authenticated user

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Key",
      "key": "SK-xxxxx", // Masked: SK-xxxx••••xxxx
      "description": "Key for production environment",
      "lastUsed": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Business Rules:**
- Return keys masked (show first 4 and last 4 characters)
- Only return keys owned by authenticated user
- Sort by `createdAt` descending

---

#### GET /api/mcp-keys/:id
**Description:** Get single MCP key (unmasked)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Key",
    "key": "SK-xxxxxxxxxxxxxxxxxxxx", // Full key
    "description": "Key for production environment",
    "lastUsed": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Return full key (unmasked) only to owner
- Verify key belongs to authenticated user

**Error Codes:**
- `NOT_FOUND`: Key not found
- `FORBIDDEN`: Not authorized

---

#### POST /api/mcp-keys
**Description:** Create new MCP key

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "Production Key",
  "key": "SK-xxxxxxxxxxxxxxxxxxxx",
  "description": "Key for production environment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Key",
    "key": "SK-xxxx••••xxxx", // Masked
    "description": "Key for production environment",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validation:**
- `name`: Required, string, 1-100 characters
- `key`: Required, string, must start with "SK-", 20-100 characters
- `description`: Optional, string, max 500 characters

**Business Rules:**
- Encrypt key before storing in database
- Add "SK-" prefix if not present
- Validate key format
- Create activity log entry

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input
- `INVALID_KEY_FORMAT`: Key format invalid

---

#### PUT /api/mcp-keys/:id
**Description:** Update MCP key

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "key": "SK-xxxx••••xxxx",
    "description": "Updated description",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Cannot update `key` field (must delete and recreate)
- Verify key belongs to authenticated user
- Create activity log entry

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input
- `NOT_FOUND`: Key not found
- `FORBIDDEN`: Not authorized

---

#### DELETE /api/mcp-keys/:id
**Description:** Delete MCP key

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "MCP key deleted successfully"
}
```

**Business Rules:**
- Verify key belongs to authenticated user
- Permanently delete encrypted key from database
- Create activity log entry

**Error Codes:**
- `NOT_FOUND`: Key not found
- `FORBIDDEN`: Not authorized

---

#### POST /api/mcp-keys/:id/validate
**Description:** Validate MCP key (test connection)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Key is valid"
  }
}
```

**Business Rules:**
- Decrypt key
- Test connection to MCP server
- Update `lastUsed` timestamp
- Return validation result

**Error Codes:**
- `NOT_FOUND`: Key not found
- `INVALID_KEY`: Key validation failed

---

### 5. Activity Endpoints

#### GET /api/activities
**Description:** Get activity log for authenticated user

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type` (optional): Filter by activity type
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "upload",
      "description": "File \"document.md\" uploaded",
      "metadata": {
        "documentId": "uuid",
        "fileName": "document.md"
      },
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Business Rules:**
- Only return activities for authenticated user
- Sort by `timestamp` descending
- Limit to last 1000 activities

---

#### GET /api/activities/stats
**Description:** Get usage statistics

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filesUsed": 5,
    "filesLimit": 10,
    "requestsUsed": 45,
    "requestsLimit": 100,
    "storageUsed": 25.5, // MB
    "storageLimit": 50, // MB
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-02-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Calculate real-time statistics from database
- Get limits from user's plan
- Calculate storage from file sizes
- Return current billing period dates

---

#### GET /api/activities/history
**Description:** Get request history for charts

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (optional): Number of days (default: 7, max: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "count": 15
    },
    {
      "date": "2024-01-02",
      "count": 20
    }
  ]
}
```

**Business Rules:**
- Aggregate request activities by date
- Return data for last N days
- Include zero counts for dates with no requests

---

### 6. Sync Settings Endpoints

#### GET /api/sync/settings
**Description:** Get MCP sync settings

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "lastSync": "2024-01-01T00:00:00Z",
    "serverUrl": "https://mcp.syncrules.io"
  }
}
```

---

#### PUT /api/sync/settings
**Description:** Update MCP sync settings

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "serverUrl": "https://mcp.syncrules.io"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "serverUrl": "https://mcp.syncrules.io",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### GET /api/sync/ide-connections
**Description:** Get IDE connections

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ideId": "vscode",
      "name": "VS Code",
      "icon": "vscode",
      "connected": true,
      "lastSync": "2024-01-01T00:00:00Z",
      "autoSync": true
    }
  ]
}
```

---

#### POST /api/sync/ide-connections
**Description:** Create IDE connection

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "ideId": "vscode",
  "apiKey": "SK-xxxxx",
  "webhookUrl": "https://...",
  "autoSync": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ideId": "vscode",
    "name": "VS Code",
    "connected": true,
    "autoSync": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### PUT /api/sync/ide-connections/:id
**Description:** Update IDE connection

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "connected": true,
  "autoSync": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "connected": true,
    "autoSync": false,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### DELETE /api/sync/ide-connections/:id
**Description:** Delete IDE connection

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "IDE connection deleted"
}
```

---

#### POST /api/sync/sync
**Description:** Trigger manual sync

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "ideId": "vscode" // optional, sync all if not provided
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": true,
    "documentsSynced": 10,
    "lastSync": "2024-01-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Sync documents to specified IDE or all connected IDEs
- Update `lastSync` timestamp
- Create activity log entry
- Return sync statistics

---

### 7. Usage & Limits Endpoints

#### GET /api/usage/stats
**Description:** Get current usage statistics (alias for /api/activities/stats)

---

#### GET /api/usage/limits
**Description:** Get plan limits

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "freemium",
    "limits": {
      "files": 10,
      "requests": 100,
      "storage": 52428800, // bytes (50 MB)
      "features": {
        "markdown_viewer": true,
        "markdown_editor": false,
        "versioning": false,
        "sharing": false,
        "api_access": false
      }
    }
  }
}
```

---

#### GET /api/usage/history
**Description:** Get usage history over time

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period` (optional): "week" | "month" | "year" (default: "month")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "filesUsed": 5,
      "storageUsed": 10240,
      "requestsUsed": 15
    }
  ]
}
```

---

### 8. Plans Endpoints

#### GET /api/plans
**Description:** Get all available plans

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "freemium",
      "name": "Freemium",
      "price": 0,
      "limits": {
        "files": 10,
        "requests": 100,
        "storage": 52428800
      },
      "features": [ ... ]
    }
  ]
}
```

---

#### GET /api/plans/:id
**Description:** Get plan details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pro",
    "name": "Pro",
    "price": 9.99,
    "billing": "monthly",
    "limits": { ... },
    "features": [ ... ]
  }
}
```

---

#### POST /api/plans/:id/subscribe
**Description:** Subscribe to plan

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "paymentMethodId": "pm_xxxxx" // Stripe payment method ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "pro",
    "subscriptionId": "sub_xxxxx",
    "nextBillingDate": "2024-02-01T00:00:00Z"
  }
}
```

**Business Rules:**
- Process payment via Stripe
- Update user plan
- Reset usage period
- Create subscription record

---

---

## Data Models & Validation

### User Model

```typescript
interface User {
  id: string // UUID
  email: string // Unique, validated email format
  name: string // 1-100 characters
  picture: string // URL
  plan: "freemium" | "pro" | "enterprise"
  googleId: string // Unique Google user ID
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date // Soft delete
}
```

**Validation Rules:**
- `email`: Required, valid email format, unique
- `name`: Required, 1-100 characters, no special characters except spaces and hyphens
- `plan`: Required, enum value
- `googleId`: Required, unique

---

### Document Model

```typescript
interface Document {
  id: string // UUID
  userId: string // Foreign key to users
  name: string // 1-255 characters
  type: "file" | "folder"
  content?: string // Only for files, max 10MB
  parentId?: string // Foreign key to documents, nullable
  size: number // Bytes, calculated from content
  mimeType?: string // e.g., "text/markdown"
  storageKey?: string // Key in file storage service
  createdAt: Date
  updatedAt: Date
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters, no invalid characters (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`)
- `type`: Required, enum ["file", "folder"]
- `content`: Required if type is "file", string, max 10MB
- `parentId`: Optional, must exist and be folder if provided
- `size`: Calculated automatically from content

**Constraints:**
- Cannot have circular parent references
- Cannot move folder into itself or descendants
- File size must fit within storage quota

---

### MCP Key Model

```typescript
interface MCPKey {
  id: string // UUID
  userId: string // Foreign key to users
  name: string // 1-100 characters
  keyEncrypted: string // Encrypted key value
  keyHash: string // Hash for validation
  description?: string // Max 500 characters
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `key`: Required, must start with "SK-", 20-100 characters
- `description`: Optional, max 500 characters

**Security:**
- Key must be encrypted using AES-256-GCM
- Store key hash for validation
- Never return full key in list endpoints

---

### Activity Model

```typescript
interface Activity {
  id: string // UUID
  userId: string // Foreign key to users
  type: "upload" | "folder" | "key" | "edit" | "delete" | "sync" | "request"
  description: string // Max 500 characters
  metadata?: Record<string, any> // JSON
  timestamp: Date
}
```

**Validation Rules:**
- `type`: Required, enum value
- `description`: Required, max 500 characters
- `metadata`: Optional, valid JSON

---

### Usage Stats Model

```typescript
interface UsageStats {
  userId: string // Foreign key to users
  filesUsed: number // Count of files
  requestsUsed: number // Count of API requests
  storageUsed: number // Bytes
  periodStart: Date // Billing period start
  periodEnd: Date // Billing period end
  updatedAt: Date
}
```

**Business Rules:**
- Reset on billing period start
- Calculate from actual data (not stored, computed)
- Update on every file operation

---

## Business Rules

### Plan Limits Enforcement

**Freemium Plan:**
- Files: 10 maximum
- Requests: 100 per month
- Storage: 50 MB maximum
- Features: Markdown viewer only

**Pro Plan:**
- Files: Unlimited
- Requests: Unlimited
- Storage: 10 GB maximum
- Features: All features except enterprise-specific

**Enterprise Plan:**
- Files: Unlimited
- Requests: Unlimited
- Storage: Unlimited
- Features: All features

**Enforcement Points:**
1. **Before File Creation**: Check `filesUsed < filesLimit`
2. **Before Content Update**: Check `storageUsed + newSize < storageLimit`
3. **On API Request**: Check `requestsUsed < requestsLimit` (if not unlimited)
4. **Feature Access**: Check plan features before allowing operation

**Error Responses:**
- `429 Too Many Requests` with `LIMIT_EXCEEDED` error code
- Include upgrade link in error response

---

### Document Operations Rules

**1. Folder Hierarchy:**
- Root level: `parentId = null`
- Maximum depth: 10 levels
- Cannot create circular references
- Cannot move folder into itself or descendants

**2. File Operations:**
- Files can only be created in folders (not root)
- File content max size: 10MB
- Supported file types: `.md`, `.txt`
- File size calculated from content length

**3. Deletion:**
- Deleting folder deletes all children recursively
- Update usage statistics after deletion
- Free storage quota after deletion

**4. Search:**
- Search in names: All plans
- Search in content: Pro+ plans only
- Case-insensitive search
- Return results with highlight

---

### MCP Keys Rules

**1. Key Format:**
- Must start with "SK-"
- Minimum length: 20 characters
- Maximum length: 100 characters
- Auto-add "SK-" prefix if missing

**2. Encryption:**
- Encrypt using AES-256-GCM
- Use per-user encryption key (derived from user ID)
- Store encrypted value only
- Never log or return full key in logs

**3. Validation:**
- Test connection to MCP server
- Update `lastUsed` on validation
- Return validation result

---

### Activity Logging Rules

**1. Automatic Logging:**
- Document create/update/delete
- Folder create/delete
- MCP key create/update/delete
- Sync operations
- API requests (counted, not logged individually)

**2. Retention:**
- Keep last 1000 activities per user
- Archive older activities
- Delete archived after 1 year

**3. Metadata:**
- Include relevant IDs (documentId, keyId, etc.)
- Include operation details
- Include timestamps

---

### Storage Management Rules

**1. File Storage:**
- Store files in cloud storage (S3/GCS/Azure)
- Organize by user ID: `{userId}/documents/{documentId}`
- Store content for small files (< 1MB) in database
- Store large files (> 1MB) in cloud storage

**2. Storage Calculation:**
- Calculate from actual file sizes
- Update on every file operation
- Include metadata overhead (10% buffer)

**3. Quota Enforcement:**
- Check before upload
- Check before content update
- Return clear error if exceeded

---

## Security Requirements

### Authentication Security

1. **JWT Tokens:**
   - Use RS256 algorithm (asymmetric keys)
   - Store private key securely (environment variable)
   - Validate token signature on every request
   - Check expiration on every request

2. **Token Storage:**
   - Access token: 1 hour expiration
   - Refresh token: 7 days expiration
   - Store refresh tokens in database (hashed)
   - Revoke tokens on logout

3. **Password Security:**
   - Not applicable (OAuth only)
   - Future: If password auth added, use bcrypt with salt rounds 12+

---

### Data Security

1. **Encryption at Rest:**
   - Encrypt MCP keys using AES-256-GCM
   - Use per-user encryption keys
   - Store encryption keys in secure key management service

2. **Encryption in Transit:**
   - HTTPS/TLS 1.3 for all API communications
   - Certificate pinning in mobile apps (future)

3. **Data Isolation:**
   - All queries must include `userId` filter
   - Row-level security in database
   - Never return other users' data

---

### Input Validation

1. **Sanitization:**
   - Sanitize all user inputs
   - Validate file uploads (type, size, content)
   - Prevent injection attacks (SQL, NoSQL, XSS)

2. **File Upload Security:**
   - Validate file types (whitelist)
   - Scan for malware
   - Limit file sizes
   - Validate file content structure

3. **Rate Limiting:**
   - Per-user rate limits
   - Per-endpoint rate limits
   - Plan-based rate limits
   - Return 429 with retry-after header

---

### Authorization Security

1. **Resource Ownership:**
   - Verify user owns resource on every operation
   - Use database constraints (foreign keys)
   - Return 403 Forbidden if not authorized

2. **Plan-Based Access:**
   - Check plan before feature access
   - Return 402 Payment Required if upgrade needed
   - Include upgrade link in error response

---

## Performance Requirements

### Response Time Targets

- **Authentication**: < 500ms
- **Document List**: < 200ms (50 items)
- **Document Get**: < 100ms
- **Document Create**: < 300ms
- **File Upload**: < 2s per MB
- **Search**: < 500ms
- **Usage Stats**: < 200ms

### Scalability Targets

- **Concurrent Users**: 10,000+
- **API Requests**: 100,000+ per day
- **Database Connections**: Connection pooling (max 100)
- **File Storage**: Unlimited (cloud storage)

### Caching Strategy

1. **Redis Cache:**
   - User sessions: 1 hour TTL
   - Usage stats: 5 minutes TTL
   - Plan limits: 1 hour TTL
   - Document metadata: 10 minutes TTL

2. **Database Indexing:**
   - Index on `userId` for all user-scoped tables
   - Index on `parentId` for documents
   - Index on `timestamp` for activities
   - Composite indexes for common queries

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "validation error details"
    },
    "requestId": "uuid-for-tracking"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid authentication token |
| `AUTH_EXPIRED` | 401 | Authentication token expired |
| `AUTH_GOOGLE_FAILED` | 401 | Google OAuth failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `LIMIT_EXCEEDED` | 429 | Plan limit exceeded |
| `STORAGE_FULL` | 429 | Storage quota exceeded |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `INVALID_OPERATION` | 400 | Invalid operation (e.g., circular reference) |
| `SYNC_FAILED` | 500 | Synchronization failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Error Logging

- Log all errors with context
- Include request ID for tracking
- Log stack traces for 5xx errors
- Alert on repeated errors
- Never expose internal errors to clients

---

## Database Requirements

### Database Schema

See `DOCUMENTATION.md` for complete schema.

### Key Requirements

1. **Transactions:**
   - Use transactions for multi-step operations
   - Rollback on errors
   - Ensure data consistency

2. **Migrations:**
   - Version-controlled migrations
   - Backward compatible migrations
   - Rollback capability

3. **Backups:**
   - Daily automated backups
   - Point-in-time recovery
   - Test restore procedures monthly

4. **Performance:**
   - Connection pooling
   - Query optimization
   - Index optimization
   - Query monitoring

---

## File Storage Requirements

### Storage Service

**Recommended:** AWS S3, Google Cloud Storage, or Azure Blob Storage

**Organization:**
```
bucket/
  {userId}/
    documents/
      {documentId}/
        content (file content)
        metadata.json (document metadata)
```

### Requirements

1. **Upload:**
   - Multipart upload for large files (> 5MB)
   - Progress tracking
   - Resume capability

2. **Download:**
   - Presigned URLs for secure access
   - 1-hour expiration
   - Direct download for authenticated users

3. **Management:**
   - Lifecycle policies (archive after 1 year)
   - Versioning (for Pro+ plans)
   - Deletion on document delete

---

## Integration Requirements

### Google OAuth Integration

**Required Scopes:**
- `openid`
- `profile`
- `email`

**Flow:**
1. Redirect to Google OAuth consent screen
2. Receive authorization code
3. Exchange code for access token
4. Fetch user profile
5. Create/update user account

**Error Handling:**
- Handle OAuth errors gracefully
- Retry on transient failures
- Log OAuth failures

---

### MCP Server Integration

**Protocol:** Model Context Protocol

**Endpoints:**
- `https://mcp.syncrules.io` (production)
- Authentication via API key (SK-xxxxx)

**Operations:**
- Push documents to IDE
- Pull documents from IDE
- Real-time sync via webhooks

**Error Handling:**
- Retry on failures (exponential backoff)
- Queue failed syncs for retry
- Notify user on sync failures

---

### Payment Integration (Future)

**Provider:** Stripe

**Operations:**
- Create subscription
- Update subscription
- Cancel subscription
- Handle webhooks

**Security:**
- Verify webhook signatures
- Idempotent operations
- Secure API keys

---

## Testing Requirements

### Unit Tests

- Test all business logic functions
- Test validation functions
- Test utility functions
- Target: 80%+ code coverage

### Integration Tests

- Test API endpoints
- Test database operations
- Test file storage operations
- Test authentication flow

### E2E Tests

- Test complete user flows
- Test error scenarios
- Test plan limit enforcement
- Test file upload/download

### Performance Tests

- Load testing (1000+ concurrent users)
- Stress testing
- Database performance testing
- API response time testing

---

## Deployment Requirements

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
# OR
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS=path-to-credentials.json

# Redis
REDIS_URL=redis://host:6379

# Application
NODE_ENV=production
PORT=3001
API_URL=https://api.syncrules.io

# Encryption
ENCRYPTION_KEY=your-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Infrastructure

1. **Server:**
   - Minimum: 2 CPU cores, 4GB RAM
   - Recommended: 4 CPU cores, 8GB RAM
   - Auto-scaling based on CPU/memory

2. **Database:**
   - PostgreSQL 14+
   - Read replicas for scaling
   - Automated backups

3. **Caching:**
   - Redis cluster
   - High availability

4. **File Storage:**
   - Cloud storage (S3/GCS/Azure)
   - CDN for file delivery

### Monitoring

1. **Application Monitoring:**
   - Error tracking (Sentry)
   - Performance monitoring (APM)
   - Log aggregation

2. **Infrastructure Monitoring:**
   - Server metrics (CPU, memory, disk)
   - Database metrics
   - API metrics (response time, error rate)

3. **Alerts:**
   - Error rate > 1%
   - Response time > 1s
   - Database connection pool exhausted
   - Storage quota > 80%

---

## Implementation Priority

### Phase 1: Core Infrastructure (Week 1-2)
1. Database setup and migrations
2. Authentication service
3. User management
4. Basic API structure

### Phase 2: Document Management (Week 3-4)
1. Document CRUD operations
2. File upload/download
3. Storage integration
4. Usage statistics

### Phase 3: MCP Keys & Activity (Week 5)
1. MCP keys management
2. Activity logging
3. Usage tracking

### Phase 4: Sync & Advanced Features (Week 6)
1. Sync settings
2. IDE connections
3. MCP server integration

### Phase 5: Testing & Deployment (Week 7-8)
1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Production deployment

---

## Conclusion

This document specifies all backend requirements for the Sync Rules application. The backend must be:

- **Secure**: Proper authentication, authorization, and data encryption
- **Scalable**: Handle growth in users and data
- **Performant**: Fast response times and efficient operations
- **Reliable**: Error handling, logging, and monitoring
- **Maintainable**: Clean code, documentation, and testing

All endpoints must enforce user scoping, plan limits, and security best practices. The system should be designed for horizontal scaling and high availability.

---

**Document Status:** Ready for Implementation  
**Last Updated:** December 2024  
**Next Review:** After Phase 1 completion

