# API Contracts & Integrations - Sync Rules

## Document Version
**Version:** 1.0  
**Date:** December 2024  
**Status:** API Contract Specification

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication Contracts](#authentication-contracts)
3. [User Management Contracts](#user-management-contracts)
4. [Document Management Contracts](#document-management-contracts)
5. [MCP Keys Contracts](#mcp-keys-contracts)
6. [Activity & Usage Contracts](#activity--usage-contracts)
7. [Sync Settings Contracts](#sync-settings-contracts)
8. [Plans Contracts](#plans-contracts)
9. [External Integrations](#external-integrations)
10. [Webhooks](#webhooks)
11. [Error Contracts](#error-contracts)
12. [TypeScript Types](#typescript-types)

---

## API Overview

### Base Information

**Base URL:**
```
Production: https://api.syncrules.io/v1
Development: http://localhost:3001/api/v1
Staging: https://staging-api.syncrules.io/v1
```

**API Version:** `v1`  
**Content-Type:** `application/json`  
**Authentication:** Bearer Token (JWT)

### Common Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid> (optional, for request tracking)
```

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful" // optional
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }, // optional
    "requestId": "uuid" // for tracking
  }
}
```

**Pagination:**
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

## Authentication Contracts

### POST /api/auth/google

**Description:** Authenticate user with Google OAuth 2.0

**Request:**
```http
POST /api/v1/auth/google
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "4/0AeanS8Xxxxxx", // Authorization code from Google
  "redirectUri": "https://app.syncrules.io/auth/callback" // Optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "picture": "https://lh3.googleusercontent.com/...",
      "plan": "freemium"
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CODE",
    "message": "Invalid authorization code",
    "requestId": "req_123"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_GOOGLE_FAILED",
    "message": "Google OAuth authentication failed",
    "details": {
      "reason": "Token exchange failed"
    },
    "requestId": "req_123"
  }
}
```

**TypeScript Interface:**
```typescript
interface GoogleAuthRequest {
  code: string
  redirectUri?: string
}

interface GoogleAuthResponse {
  success: true
  data: {
    token: string
    refreshToken: string
    expiresIn: number
    user: User
  }
}

interface User {
  id: string
  email: string
  name: string
  picture: string
  plan: "freemium" | "pro" | "enterprise"
}
```

---

### POST /api/auth/refresh

**Description:** Refresh access token using refresh token

**Request:**
```http
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "Invalid or expired refresh token"
  }
}
```

**TypeScript Interface:**
```typescript
interface RefreshTokenResponse {
  success: true
  data: {
    token: string
    refreshToken: string
    expiresIn: number
  }
}
```

---

### POST /api/auth/logout

**Description:** Logout user and invalidate tokens

**Request:**
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

**Description:** Get current authenticated user

**Request:**
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "plan": "freemium",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface GetMeResponse {
  success: true
  data: User & {
    createdAt: string
    updatedAt: string
  }
}
```

---

## User Management Contracts

### GET /api/users/:id

**Description:** Get user profile (own profile only)

**Request:**
```http
GET /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "plan": "freemium",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only access your own profile"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

---

### PUT /api/users/:id

**Description:** Update user profile

**Request:**
```http
PUT /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Updated",
    "picture": "https://lh3.googleusercontent.com/...",
    "plan": "freemium",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

**Validation Rules:**
- `name`: Required, string, 1-100 characters, no special characters except spaces and hyphens

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Name must be between 1 and 100 characters"
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface UpdateUserRequest {
  name: string
}

interface UpdateUserResponse {
  success: true
  data: User & {
    updatedAt: string
  }
}
```

---

### DELETE /api/users/:id

**Description:** Delete user account and all associated data

**Request:**
```http
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "scheduledDeletion": "2024-02-01T00:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface DeleteUserResponse {
  success: true
  message: string
  data: {
    scheduledDeletion: string // Permanent deletion date
  }
}
```

---

## Document Management Contracts

### GET /api/documents

**Description:** Get all documents for authenticated user

**Request:**
```http
GET /api/v1/documents?parentId=null&type=file&search=test&page=1&limit=50
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `parentId` (optional, string | null): Filter by parent folder ID
- `type` (optional, "file" | "folder"): Filter by document type
- `search` (optional, string): Search in document names (case-insensitive)
- `page` (optional, number): Page number (default: 1)
- `limit` (optional, number): Items per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "document.md",
      "type": "file",
      "parentId": "770e8400-e29b-41d4-a716-446655440000",
      "size": 1024,
      "mimeType": "text/markdown",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "My Folder",
      "type": "folder",
      "parentId": null,
      "size": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**TypeScript Interface:**
```typescript
interface GetDocumentsQuery {
  parentId?: string | null
  type?: "file" | "folder"
  search?: string
  page?: number
  limit?: number
}

interface Document {
  id: string
  name: string
  type: "file" | "folder"
  parentId: string | null
  size: number
  mimeType?: string
  createdAt: string
  updatedAt: string
}

interface GetDocumentsResponse {
  success: true
  data: Document[]
  pagination: Pagination
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
```

---

### GET /api/documents/:id

**Description:** Get single document by ID (includes content for files)

**Request:**
```http
GET /api/v1/documents/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "document.md",
    "type": "file",
    "content": "# Document Content\n\nThis is the content...",
    "parentId": "770e8400-e29b-41d4-a716-446655440000",
    "size": 1024,
    "mimeType": "text/markdown",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface GetDocumentResponse {
  success: true
  data: Document & {
    content?: string // Only for files
  }
}
```

---

### POST /api/documents

**Description:** Create new document or folder

**Request:**
```http
POST /api/v1/documents
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "new-document.md",
  "type": "file",
  "content": "# New Document\n\nContent here...",
  "parentId": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "new-document.md",
    "type": "file",
    "content": "# New Document\n\nContent here...",
    "parentId": "770e8400-e29b-41d4-a716-446655440000",
    "size": 512,
    "mimeType": "text/markdown",
    "createdAt": "2024-01-01T02:00:00Z",
    "updatedAt": "2024-01-01T02:00:00Z"
  }
}
```

**Error Responses:**

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "File limit exceeded. Upgrade to Pro for unlimited files.",
    "details": {
      "limit": 10,
      "used": 10,
      "upgradeUrl": "https://app.syncrules.io/plans"
    }
  }
}
```

**429 Too Many Requests (Storage):**
```json
{
  "success": false,
  "error": {
    "code": "STORAGE_FULL",
    "message": "Storage quota exceeded",
    "details": {
      "limit": 52428800,
      "used": 52428800,
      "required": 1024
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface CreateDocumentRequest {
  name: string
  type: "file" | "folder"
  content?: string // Required if type is "file"
  parentId?: string | null
}

interface CreateDocumentResponse {
  success: true
  data: Document & {
    content?: string
  }
}
```

---

### PUT /api/documents/:id

**Description:** Update document (rename or update content)

**Request:**
```http
PUT /api/v1/documents/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "renamed-document.md",
  "content": "# Updated Content\n\nNew content..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "renamed-document.md",
    "type": "file",
    "content": "# Updated Content\n\nNew content...",
    "parentId": "770e8400-e29b-41d4-a716-446655440000",
    "size": 2048,
    "mimeType": "text/markdown",
    "updatedAt": "2024-01-01T03:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface UpdateDocumentRequest {
  name?: string
  content?: string // Only for files
}

interface UpdateDocumentResponse {
  success: true
  data: Document & {
    content?: string
  }
}
```

---

### DELETE /api/documents/:id

**Description:** Delete document (recursive for folders)

**Request:**
```http
DELETE /api/v1/documents/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "deletedCount": 5,
    "freedStorage": 10240
  }
}
```

**TypeScript Interface:**
```typescript
interface DeleteDocumentResponse {
  success: true
  message: string
  data: {
    deletedCount: number
    freedStorage: number // bytes
  }
}
```

---

### GET /api/documents/:id/path

**Description:** Get breadcrumb path for document

**Request:**
```http
GET /api/v1/documents/660e8400-e29b-41d4-a716-446655440000/path
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "My Folder",
      "type": "folder"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "document.md",
      "type": "file"
    }
  ]
}
```

**TypeScript Interface:**
```typescript
interface DocumentPathItem {
  id: string
  name: string
  type: "file" | "folder"
}

interface GetDocumentPathResponse {
  success: true
  data: DocumentPathItem[]
}
```

---

### POST /api/documents/:id/move

**Description:** Move document to different parent folder

**Request:**
```http
POST /api/v1/documents/660e8400-e29b-41d4-a716-446655440000/move
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "parentId": "990e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "document.md",
    "parentId": "990e8400-e29b-41d4-a716-446655440000",
    "updatedAt": "2024-01-01T04:00:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Cannot move folder into itself or its descendants"
  }
}
```

**TypeScript Interface:**
```typescript
interface MoveDocumentRequest {
  parentId: string | null
}

interface MoveDocumentResponse {
  success: true
  data: {
    id: string
    name: string
    parentId: string | null
    updatedAt: string
  }
}
```

---

### POST /api/documents/upload

**Description:** Upload single or multiple files

**Request:**
```http
POST /api/v1/documents/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File[] (one or more files)
- `parentId`: string (optional, UUID or null)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "name": "file1.md",
        "type": "file",
        "size": 1024
      },
      {
        "id": "bb0e8400-e29b-41d4-a716-446655440000",
        "name": "file2.md",
        "type": "file",
        "size": 2048
      }
    ],
    "failed": [],
    "totalSize": 3072
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds maximum size of 10MB",
    "details": {
      "fileName": "large-file.md",
      "size": 15728640,
      "maxSize": 10485760
    }
  }
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type not allowed",
    "details": {
      "fileName": "document.pdf",
      "allowedTypes": [".md", ".txt"]
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface UploadFilesResponse {
  success: true
  data: {
    uploaded: Array<{
      id: string
      name: string
      type: "file"
      size: number
    }>
    failed: Array<{
      fileName: string
      reason: string
    }>
    totalSize: number
  }
}
```

---

### POST /api/documents/upload-directory

**Description:** Upload entire directory structure

**Request:**
```http
POST /api/v1/documents/upload-directory
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File[] (files with webkitRelativePath)
- `parentId`: string (optional, UUID or null)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "foldersCreated": 5,
    "filesUploaded": 10,
    "totalSize": 10240,
    "structure": {
      "root": "folder1",
      "items": [
        {
          "type": "folder",
          "name": "folder1",
          "children": [
            {
              "type": "file",
              "name": "file1.md",
              "size": 1024
            }
          ]
        }
      ]
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface UploadDirectoryResponse {
  success: true
  data: {
    foldersCreated: number
    filesUploaded: number
    totalSize: number
    structure?: DirectoryStructure
  }
}

interface DirectoryStructure {
  root: string
  items: DirectoryItem[]
}

interface DirectoryItem {
  type: "file" | "folder"
  name: string
  size?: number
  children?: DirectoryItem[]
}
```

---

### GET /api/documents/search

**Description:** Search documents by name or content

**Request:**
```http
GET /api/v1/documents/search?q=markdown&type=file&page=1&limit=20
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `q` (required, string): Search query
- `type` (optional, "file" | "folder"): Filter by type
- `page` (optional, number): Page number
- `limit` (optional, number): Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "markdown-guide.md",
      "type": "file",
      "parentId": "770e8400-e29b-41d4-a716-446655440000",
      "highlight": "Found in <mark>markdown</mark>-guide.md",
      "matchedIn": "name" // or "content" for Pro+ plans
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**TypeScript Interface:**
```typescript
interface SearchDocumentsQuery {
  q: string
  type?: "file" | "folder"
  page?: number
  limit?: number
}

interface SearchResult {
  id: string
  name: string
  type: "file" | "folder"
  parentId: string | null
  highlight: string
  matchedIn: "name" | "content"
}

interface SearchDocumentsResponse {
  success: true
  data: SearchResult[]
  pagination: Pagination
}
```

---

## MCP Keys Contracts

### GET /api/mcp-keys

**Description:** Get all MCP keys for authenticated user (masked)

**Request:**
```http
GET /api/v1/mcp-keys
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "name": "Production Key",
      "key": "SK-xxxx••••xxxx", // Masked
      "description": "Key for production environment",
      "lastUsed": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**TypeScript Interface:**
```typescript
interface MCPKey {
  id: string
  name: string
  key: string // Masked in list, full in detail
  description: string
  lastUsed?: string
  createdAt: string
}

interface GetMCPKeysResponse {
  success: true
  data: MCPKey[]
}
```

---

### GET /api/mcp-keys/:id

**Description:** Get single MCP key (unmasked)

**Request:**
```http
GET /api/v1/mcp-keys/cc0e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440000",
    "name": "Production Key",
    "key": "SK-xxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Full key
    "description": "Key for production environment",
    "lastUsed": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### POST /api/mcp-keys

**Description:** Create new MCP key

**Request:**
```http
POST /api/v1/mcp-keys
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Production Key",
  "key": "SK-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "description": "Key for production environment"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440000",
    "name": "Production Key",
    "key": "SK-xxxx••••xxxx", // Masked in response
    "description": "Key for production environment",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `key`: Required, must start with "SK-", 20-100 characters
- `description`: Optional, max 500 characters

**TypeScript Interface:**
```typescript
interface CreateMCPKeyRequest {
  name: string
  key: string
  description?: string
}

interface CreateMCPKeyResponse {
  success: true
  data: MCPKey
}
```

---

### PUT /api/mcp-keys/:id

**Description:** Update MCP key (name and description only)

**Request:**
```http
PUT /api/v1/mcp-keys/cc0e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Production Key",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Production Key",
    "key": "SK-xxxx••••xxxx",
    "description": "Updated description",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface UpdateMCPKeyRequest {
  name?: string
  description?: string
}

interface UpdateMCPKeyResponse {
  success: true
  data: MCPKey & {
    updatedAt: string
  }
}
```

---

### DELETE /api/mcp-keys/:id

**Description:** Delete MCP key

**Request:**
```http
DELETE /api/v1/mcp-keys/cc0e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "MCP key deleted successfully"
}
```

---

### POST /api/mcp-keys/:id/validate

**Description:** Validate MCP key (test connection)

**Request:**
```http
POST /api/v1/mcp-keys/cc0e8400-e29b-41d4-a716-446655440000/validate
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Key is valid and connection successful"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_KEY",
    "message": "Key validation failed",
    "details": {
      "reason": "Connection timeout"
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface ValidateMCPKeyResponse {
  success: true
  data: {
    valid: boolean
    message: string
  }
}
```

---

## Activity & Usage Contracts

### GET /api/activities

**Description:** Get activity log for authenticated user

**Request:**
```http
GET /api/v1/activities?type=upload&page=1&limit=50
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type` (optional, string): Filter by activity type
- `page` (optional, number): Page number
- `limit` (optional, number): Items per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "type": "upload",
      "description": "File \"document.md\" uploaded",
      "metadata": {
        "documentId": "660e8400-e29b-41d4-a716-446655440000",
        "fileName": "document.md",
        "size": 1024
      },
      "timestamp": "2024-01-01T00:00:00Z"
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

**TypeScript Interface:**
```typescript
interface Activity {
  id: string
  type: "upload" | "folder" | "key" | "edit" | "delete" | "sync" | "request"
  description: string
  metadata?: Record<string, any>
  timestamp: string
}

interface GetActivitiesQuery {
  type?: string
  page?: number
  limit?: number
}

interface GetActivitiesResponse {
  success: true
  data: Activity[]
  pagination: Pagination
}
```

---

### GET /api/activities/stats

**Description:** Get usage statistics

**Request:**
```http
GET /api/v1/activities/stats
Authorization: Bearer <access_token>
```

**Response (200 OK):**
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

**TypeScript Interface:**
```typescript
interface UsageStats {
  filesUsed: number
  filesLimit: number
  requestsUsed: number
  requestsLimit: number
  storageUsed: number // MB
  storageLimit: number // MB
  periodStart: string
  periodEnd: string
}

interface GetUsageStatsResponse {
  success: true
  data: UsageStats
}
```

---

### GET /api/activities/history

**Description:** Get request history for charts

**Request:**
```http
GET /api/v1/activities/history?days=7
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (optional, number): Number of days (default: 7, max: 30)

**Response (200 OK):**
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

**TypeScript Interface:**
```typescript
interface RequestHistoryItem {
  date: string // YYYY-MM-DD
  count: number
}

interface GetRequestHistoryResponse {
  success: true
  data: RequestHistoryItem[]
}
```

---

## Sync Settings Contracts

### GET /api/sync/settings

**Description:** Get MCP sync settings

**Request:**
```http
GET /api/v1/sync/settings
Authorization: Bearer <access_token>
```

**Response (200 OK):**
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

**TypeScript Interface:**
```typescript
interface MCPSettings {
  configured: boolean
  lastSync?: string
  serverUrl: string
}

interface GetMCPSettingsResponse {
  success: true
  data: MCPSettings
}
```

---

### PUT /api/sync/settings

**Description:** Update MCP sync settings

**Request:**
```http
PUT /api/v1/sync/settings
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "serverUrl": "https://mcp.syncrules.io"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "serverUrl": "https://mcp.syncrules.io",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface UpdateMCPSettingsRequest {
  serverUrl?: string
}

interface UpdateMCPSettingsResponse {
  success: true
  data: MCPSettings & {
    updatedAt: string
  }
}
```

---

### GET /api/sync/ide-connections

**Description:** Get IDE connections

**Request:**
```http
GET /api/v1/sync/ide-connections
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "ideId": "vscode",
      "name": "VS Code",
      "icon": "vscode",
      "connected": true,
      "lastSync": "2024-01-01T00:00:00Z",
      "apiKey": "SK-xxxx••••xxxx", // Masked
      "webhookUrl": "https://...",
      "autoSync": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**TypeScript Interface:**
```typescript
interface IDEConnection {
  id: string
  ideId: "vscode" | "cursor" | "copilot" | "jetbrains"
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  apiKey?: string // Masked in list
  webhookUrl?: string
  autoSync: boolean
  createdAt: string
  updatedAt: string
}

interface GetIDEConnectionsResponse {
  success: true
  data: IDEConnection[]
}
```

---

### POST /api/sync/ide-connections

**Description:** Create IDE connection

**Request:**
```http
POST /api/v1/sync/ide-connections
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ideId": "vscode",
  "apiKey": "SK-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "webhookUrl": "https://webhook.example.com/sync",
  "autoSync": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    "ideId": "vscode",
    "name": "VS Code",
    "icon": "vscode",
    "connected": true,
    "autoSync": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface CreateIDEConnectionRequest {
  ideId: "vscode" | "cursor" | "copilot" | "jetbrains"
  apiKey: string
  webhookUrl?: string
  autoSync?: boolean
}

interface CreateIDEConnectionResponse {
  success: true
  data: IDEConnection
}
```

---

### PUT /api/sync/ide-connections/:id

**Description:** Update IDE connection

**Request:**
```http
PUT /api/v1/sync/ide-connections/ee0e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "connected": true,
  "autoSync": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    "connected": true,
    "autoSync": false,
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

**TypeScript Interface:**
```typescript
interface UpdateIDEConnectionRequest {
  connected?: boolean
  autoSync?: boolean
  webhookUrl?: string
}

interface UpdateIDEConnectionResponse {
  success: true
  data: IDEConnection & {
    updatedAt: string
  }
}
```

---

### DELETE /api/sync/ide-connections/:id

**Description:** Delete IDE connection

**Request:**
```http
DELETE /api/v1/sync/ide-connections/ee0e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "IDE connection deleted"
}
```

---

### POST /api/sync/sync

**Description:** Trigger manual sync

**Request:**
```http
POST /api/v1/sync/sync
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ideId": "vscode" // optional, sync all if not provided
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "synced": true,
    "documentsSynced": 10,
    "lastSync": "2024-01-01T02:00:00Z",
    "details": {
      "vscode": {
        "synced": true,
        "documentsCount": 10
      }
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface SyncRequest {
  ideId?: string
}

interface SyncResponse {
  success: true
  data: {
    synced: boolean
    documentsSynced: number
    lastSync: string
    details: Record<string, {
      synced: boolean
      documentsCount: number
    }>
  }
}
```

---

## Plans Contracts

### GET /api/plans

**Description:** Get all available plans

**Request:**
```http
GET /api/v1/plans
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "freemium",
      "name": "Freemium",
      "price": 0,
      "billing": null,
      "limits": {
        "files": 10,
        "requests": 100,
        "storage": 52428800
      },
      "features": [
        "Up to 10 files",
        "100 requests per month",
        "50 MB storage",
        "Unlimited folders",
        "Unlimited MCP keys",
        "Markdown viewer",
        "Email support"
      ]
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 9.99,
      "billing": "monthly",
      "limits": {
        "files": -1,
        "requests": -1,
        "storage": 10737418240
      },
      "features": [
        "Unlimited files",
        "Unlimited requests",
        "10 GB storage",
        "Unlimited folders",
        "Unlimited MCP keys",
        "Advanced Markdown viewer",
        "Markdown editor",
        "Document versioning",
        "Folder sharing",
        "24/7 priority support",
        "API access"
      ]
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": null,
      "billing": "custom",
      "limits": {
        "files": -1,
        "requests": -1,
        "storage": -1
      },
      "features": [
        "Everything in Pro",
        "Unlimited storage",
        "Multiple teams and workspaces",
        "Advanced permission management",
        "SSO (Single Sign-On)",
        "Advanced audit and logs",
        "99.9% guaranteed SLA",
        "Dedicated account manager",
        "Custom onboarding",
        "Custom integration",
        "White-label support"
      ]
    }
  ]
}
```

**TypeScript Interface:**
```typescript
interface Plan {
  id: "freemium" | "pro" | "enterprise"
  name: string
  price: number | null
  billing: "monthly" | "yearly" | "custom" | null
  limits: {
    files: number // -1 for unlimited
    requests: number // -1 for unlimited
    storage: number // bytes, -1 for unlimited
  }
  features: string[]
}

interface GetPlansResponse {
  success: true
  data: Plan[]
}
```

---

### GET /api/plans/:id

**Description:** Get plan details

**Request:**
```http
GET /api/v1/plans/pro
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pro",
    "name": "Pro",
    "price": 9.99,
    "billing": "monthly",
    "limits": {
      "files": -1,
      "requests": -1,
      "storage": 10737418240
    },
    "features": [
      "Unlimited files",
      "Unlimited requests",
      "10 GB storage",
      "Unlimited folders",
      "Unlimited MCP keys",
      "Advanced Markdown viewer",
      "Markdown editor",
      "Document versioning",
      "Folder sharing",
      "24/7 priority support",
      "API access"
    ]
  }
}
```

---

### POST /api/plans/:id/subscribe

**Description:** Subscribe to plan (future - payment integration)

**Request:**
```http
POST /api/v1/plans/pro/subscribe
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentMethodId": "pm_xxxxx" // Stripe payment method ID
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plan": "pro",
    "subscriptionId": "sub_xxxxx",
    "nextBillingDate": "2024-02-01T00:00:00Z",
    "status": "active"
  }
}
```

**TypeScript Interface:**
```typescript
interface SubscribeToPlanRequest {
  paymentMethodId: string
}

interface SubscribeToPlanResponse {
  success: true
  data: {
    plan: string
    subscriptionId: string
    nextBillingDate: string
    status: "active" | "pending" | "cancelled"
  }
}
```

---

## External Integrations

### Google OAuth 2.0 Integration

**Endpoint:** `https://accounts.google.com/o/oauth2/v2/auth`

**Authorization URL:**
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id={GOOGLE_CLIENT_ID}&
  redirect_uri={REDIRECT_URI}&
  response_type=code&
  scope=openid profile email&
  access_type=offline&
  prompt=consent
```

**Token Exchange:**
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code={AUTHORIZATION_CODE}&
client_id={GOOGLE_CLIENT_ID}&
client_secret={GOOGLE_CLIENT_SECRET}&
redirect_uri={REDIRECT_URI}&
grant_type=authorization_code
```

**Response:**
```json
{
  "access_token": "ya29.xxxxx",
  "expires_in": 3599,
  "refresh_token": "1//xxxxx",
  "scope": "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**User Info:**
```
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**
```json
{
  "id": "123456789",
  "email": "user@example.com",
  "verified_email": true,
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "given_name": "John",
  "family_name": "Doe"
}
```

**Contract Interface:**
```typescript
interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: string
  id_token: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
}
```

---

### MCP Server Integration

**Base URL:** `https://mcp.syncrules.io`

**Authentication:** API Key in header
```
Authorization: Bearer SK-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Endpoints:**

#### GET /mcp/documents
**Description:** Get all documents from MCP server

**Request:**
```http
GET https://mcp.syncrules.io/mcp/documents
Authorization: Bearer SK-xxxxx
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "document.md",
      "content": "# Content",
      "path": "/folder/document.md"
    }
  ]
}
```

#### POST /mcp/documents
**Description:** Push document to MCP server

**Request:**
```http
POST https://mcp.syncrules.io/mcp/documents
Authorization: Bearer SK-xxxxx
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "document.md",
  "content": "# Content",
  "path": "/folder/document.md"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "syncedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /mcp/documents/:id
**Description:** Delete document from MCP server

**Request:**
```http
DELETE https://mcp.syncrules.io/mcp/documents/uuid
Authorization: Bearer SK-xxxxx
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted"
}
```

**Contract Interface:**
```typescript
interface MCPServerConfig {
  baseUrl: string
  apiKey: string
}

interface MCPDocument {
  id: string
  name: string
  content: string
  path: string
}

interface MCPSyncResponse {
  success: boolean
  data?: {
    id: string
    syncedAt: string
  }
  error?: {
    code: string
    message: string
  }
}
```

---

### File Storage Integration (AWS S3)

**Service:** AWS S3

**Operations:**

#### Upload File
```typescript
interface S3UploadParams {
  Bucket: string
  Key: string // {userId}/documents/{documentId}
  Body: Buffer | string
  ContentType: string
  Metadata: {
    userId: string
    documentId: string
    name: string
  }
}

interface S3UploadResponse {
  Location: string
  ETag: string
  Key: string
}
```

#### Download File
```typescript
interface S3DownloadParams {
  Bucket: string
  Key: string
}

interface S3DownloadResponse {
  Body: Buffer
  ContentType: string
  ContentLength: number
}
```

#### Generate Presigned URL
```typescript
interface GeneratePresignedUrlParams {
  Bucket: string
  Key: string
  Expires: number // seconds (default: 3600)
}

interface PresignedUrlResponse {
  url: string
  expiresAt: string
}
```

**Contract Interface:**
```typescript
interface FileStorageService {
  upload(params: S3UploadParams): Promise<S3UploadResponse>
  download(params: S3DownloadParams): Promise<S3DownloadResponse>
  delete(key: string): Promise<void>
  generatePresignedUrl(params: GeneratePresignedUrlParams): Promise<PresignedUrlResponse>
}
```

---

### Stripe Integration (Future - Payment)

**Service:** Stripe API

**Endpoints:**

#### Create Payment Method
```typescript
interface CreatePaymentMethodRequest {
  type: "card"
  card: {
    number: string
    exp_month: number
    exp_year: number
    cvc: string
  }
}

interface PaymentMethod {
  id: string
  type: string
  card: {
    brand: string
    last4: string
  }
}
```

#### Create Subscription
```typescript
interface CreateSubscriptionRequest {
  customerId: string
  paymentMethodId: string
  priceId: string
}

interface Subscription {
  id: string
  status: "active" | "pending" | "cancelled"
  current_period_start: number
  current_period_end: number
}
```

**Webhook Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Webhooks

### MCP Sync Webhook

**Endpoint:** `POST /api/webhooks/mcp-sync`

**Description:** Receive sync events from MCP server

**Headers:**
```
X-MCP-Signature: <signature>
X-MCP-Timestamp: <timestamp>
```

**Request Body:**
```json
{
  "event": "document.updated",
  "documentId": "uuid",
  "userId": "uuid",
  "data": {
    "name": "document.md",
    "content": "# Updated content"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Event Types:**
- `document.created`
- `document.updated`
- `document.deleted`
- `sync.completed`
- `sync.failed`

**Response:**
```json
{
  "success": true,
  "received": true
}
```

**Contract Interface:**
```typescript
interface MCPWebhookEvent {
  event: string
  documentId: string
  userId: string
  data: Record<string, any>
  timestamp: string
}

interface WebhookResponse {
  success: boolean
  received: boolean
}
```

---

### Stripe Webhook (Future)

**Endpoint:** `POST /api/webhooks/stripe`

**Description:** Receive payment events from Stripe

**Headers:**
```
Stripe-Signature: <signature>
```

**Request Body:** (Stripe event format)

**Response:**
```json
{
  "success": true,
  "processed": true
}
```

---

## Error Contracts

### Standard Error Response

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

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid authentication token |
| `AUTH_EXPIRED` | 401 | Authentication token expired |
| `AUTH_GOOGLE_FAILED` | 401 | Google OAuth failed |
| `AUTH_INVALID_CODE` | 400 | Invalid authorization code |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `LIMIT_EXCEEDED` | 429 | Plan limit exceeded |
| `STORAGE_FULL` | 429 | Storage quota exceeded |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `INVALID_OPERATION` | 400 | Invalid operation |
| `INVALID_KEY_FORMAT` | 400 | Invalid MCP key format |
| `INVALID_KEY` | 400 | MCP key validation failed |
| `SYNC_FAILED` | 500 | Synchronization failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Error Response Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Name is required",
      "content": "Content must be less than 10MB"
    },
    "requestId": "req_123"
  }
}
```

**Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "File limit exceeded",
    "details": {
      "limit": 10,
      "used": 10,
      "upgradeUrl": "https://app.syncrules.io/plans"
    },
    "requestId": "req_123"
  }
}
```

**TypeScript Interface:**
```typescript
interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  requestId?: string
}

interface ErrorResponse {
  success: false
  error: ApiError
}
```

---

## TypeScript Types

### Complete Type Definitions

```typescript
// ============================================
// Authentication Types
// ============================================

interface User {
  id: string
  email: string
  name: string
  picture: string
  plan: "freemium" | "pro" | "enterprise"
  createdAt?: string
  updatedAt?: string
}

interface AuthTokens {
  token: string
  refreshToken: string
  expiresIn: number
}

// ============================================
// Document Types
// ============================================

interface Document {
  id: string
  name: string
  type: "file" | "folder"
  parentId: string | null
  size: number
  mimeType?: string
  createdAt: string
  updatedAt: string
}

interface DocumentWithContent extends Document {
  content?: string
}

interface DocumentPathItem {
  id: string
  name: string
  type: "file" | "folder"
}

// ============================================
// MCP Key Types
// ============================================

interface MCPKey {
  id: string
  name: string
  key: string // Masked in list, full in detail
  description: string
  lastUsed?: string
  createdAt: string
  updatedAt?: string
}

// ============================================
// Activity Types
// ============================================

interface Activity {
  id: string
  type: "upload" | "folder" | "key" | "edit" | "delete" | "sync" | "request"
  description: string
  metadata?: Record<string, any>
  timestamp: string
}

interface UsageStats {
  filesUsed: number
  filesLimit: number
  requestsUsed: number
  requestsLimit: number
  storageUsed: number // MB
  storageLimit: number // MB
  periodStart: string
  periodEnd: string
}

interface RequestHistoryItem {
  date: string // YYYY-MM-DD
  count: number
}

// ============================================
// Sync Types
// ============================================

interface MCPSettings {
  configured: boolean
  lastSync?: string
  serverUrl: string
  updatedAt?: string
}

interface IDEConnection {
  id: string
  ideId: "vscode" | "cursor" | "copilot" | "jetbrains"
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  apiKey?: string
  webhookUrl?: string
  autoSync: boolean
  createdAt: string
  updatedAt: string
}

// ============================================
// Plan Types
// ============================================

interface Plan {
  id: "freemium" | "pro" | "enterprise"
  name: string
  price: number | null
  billing: "monthly" | "yearly" | "custom" | null
  limits: {
    files: number // -1 for unlimited
    requests: number // -1 for unlimited
    storage: number // bytes, -1 for unlimited
  }
  features: string[]
}

// ============================================
// Pagination Types
// ============================================

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================
// Response Types
// ============================================

interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: Pagination
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
    requestId?: string
  }
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
type PaginatedApiResponse<T> = PaginatedResponse<T> | ErrorResponse
```

---

## API Client Example (TypeScript)

### Complete API Client Implementation

```typescript
class SyncRulesAPIClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    return response.json()
  }

  // Authentication
  async googleAuth(code: string): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    return this.request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    return this.request("/auth/refresh", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    })
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request("/auth/me")
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request("/auth/logout", { method: "POST" })
  }

  // Users
  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`)
  }

  async updateUser(id: string, data: { name: string }): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${id}`, { method: "DELETE" })
  }

  // Documents
  async getDocuments(params?: {
    parentId?: string | null
    type?: "file" | "folder"
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedApiResponse<Document>> {
    const query = new URLSearchParams()
    if (params?.parentId !== undefined) query.set("parentId", params.parentId || "")
    if (params?.type) query.set("type", params.type)
    if (params?.search) query.set("search", params.search)
    if (params?.page) query.set("page", params.page.toString())
    if (params?.limit) query.set("limit", params.limit.toString())

    return this.request(`/documents?${query.toString()}`)
  }

  async getDocument(id: string): Promise<ApiResponse<DocumentWithContent>> {
    return this.request(`/documents/${id}`)
  }

  async createDocument(data: {
    name: string
    type: "file" | "folder"
    content?: string
    parentId?: string | null
  }): Promise<ApiResponse<DocumentWithContent>> {
    return this.request("/documents", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateDocument(
    id: string,
    data: { name?: string; content?: string }
  ): Promise<ApiResponse<DocumentWithContent>> {
    return this.request(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteDocument(id: string): Promise<ApiResponse<{ deletedCount: number; freedStorage: number }>> {
    return this.request(`/documents/${id}`, { method: "DELETE" })
  }

  async getDocumentPath(id: string): Promise<ApiResponse<DocumentPathItem[]>> {
    return this.request(`/documents/${id}/path`)
  }

  async moveDocument(id: string, parentId: string | null): Promise<ApiResponse<Document>> {
    return this.request(`/documents/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ parentId }),
    })
  }

  async uploadFiles(files: File[], parentId?: string | null): Promise<ApiResponse<{
    uploaded: Array<{ id: string; name: string; type: "file"; size: number }>
    failed: Array<{ fileName: string; reason: string }>
    totalSize: number
  }>> {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    if (parentId !== undefined) formData.append("parentId", parentId || "")

    const headers: HeadersInit = {}
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    })

    return response.json()
  }

  async uploadDirectory(files: File[], parentId?: string | null): Promise<ApiResponse<{
    foldersCreated: number
    filesUploaded: number
    totalSize: number
  }>> {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    if (parentId !== undefined) formData.append("parentId", parentId || "")

    const headers: HeadersInit = {}
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}/documents/upload-directory`, {
      method: "POST",
      headers,
      body: formData,
    })

    return response.json()
  }

  async searchDocuments(params: {
    q: string
    type?: "file" | "folder"
    page?: number
    limit?: number
  }): Promise<PaginatedApiResponse<{
    id: string
    name: string
    type: "file" | "folder"
    parentId: string | null
    highlight: string
    matchedIn: "name" | "content"
  }>> {
    const query = new URLSearchParams({ q: params.q })
    if (params.type) query.set("type", params.type)
    if (params.page) query.set("page", params.page.toString())
    if (params.limit) query.set("limit", params.limit.toString())

    return this.request(`/documents/search?${query.toString()}`)
  }

  // MCP Keys
  async getMCPKeys(): Promise<ApiResponse<MCPKey[]>> {
    return this.request("/mcp-keys")
  }

  async getMCPKey(id: string): Promise<ApiResponse<MCPKey>> {
    return this.request(`/mcp-keys/${id}`)
  }

  async createMCPKey(data: { name: string; key: string; description?: string }): Promise<ApiResponse<MCPKey>> {
    return this.request("/mcp-keys", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateMCPKey(id: string, data: { name?: string; description?: string }): Promise<ApiResponse<MCPKey>> {
    return this.request(`/mcp-keys/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteMCPKey(id: string): Promise<ApiResponse<void>> {
    return this.request(`/mcp-keys/${id}`, { method: "DELETE" })
  }

  async validateMCPKey(id: string): Promise<ApiResponse<{ valid: boolean; message: string }>> {
    return this.request(`/mcp-keys/${id}/validate`, { method: "POST" })
  }

  // Activities
  async getActivities(params?: {
    type?: string
    page?: number
    limit?: number
  }): Promise<PaginatedApiResponse<Activity>> {
    const query = new URLSearchParams()
    if (params?.type) query.set("type", params.type)
    if (params?.page) query.set("page", params.page.toString())
    if (params?.limit) query.set("limit", params.limit.toString())

    return this.request(`/activities?${query.toString()}`)
  }

  async getUsageStats(): Promise<ApiResponse<UsageStats>> {
    return this.request("/activities/stats")
  }

  async getRequestHistory(days?: number): Promise<ApiResponse<RequestHistoryItem[]>> {
    const query = days ? `?days=${days}` : ""
    return this.request(`/activities/history${query}`)
  }

  // Sync Settings
  async getMCPSettings(): Promise<ApiResponse<MCPSettings>> {
    return this.request("/sync/settings")
  }

  async updateMCPSettings(data: { serverUrl?: string }): Promise<ApiResponse<MCPSettings>> {
    return this.request("/sync/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getIDEConnections(): Promise<ApiResponse<IDEConnection[]>> {
    return this.request("/sync/ide-connections")
  }

  async createIDEConnection(data: {
    ideId: "vscode" | "cursor" | "copilot" | "jetbrains"
    apiKey: string
    webhookUrl?: string
    autoSync?: boolean
  }): Promise<ApiResponse<IDEConnection>> {
    return this.request("/sync/ide-connections", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateIDEConnection(
    id: string,
    data: { connected?: boolean; autoSync?: boolean; webhookUrl?: string }
  ): Promise<ApiResponse<IDEConnection>> {
    return this.request(`/sync/ide-connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteIDEConnection(id: string): Promise<ApiResponse<void>> {
    return this.request(`/sync/ide-connections/${id}`, { method: "DELETE" })
  }

  async sync(data?: { ideId?: string }): Promise<ApiResponse<{
    synced: boolean
    documentsSynced: number
    lastSync: string
    details: Record<string, { synced: boolean; documentsCount: number }>
  }>> {
    return this.request("/sync/sync", {
      method: "POST",
      body: JSON.stringify(data || {}),
    })
  }

  // Plans
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return this.request("/plans")
  }

  async getPlan(id: string): Promise<ApiResponse<Plan>> {
    return this.request(`/plans/${id}`)
  }
}

// Usage Example
const client = new SyncRulesAPIClient("https://api.syncrules.io/v1")

// Authenticate
const authResponse = await client.googleAuth("authorization_code")
if (authResponse.success) {
  client.setToken(authResponse.data.token)
}

// Get documents
const documentsResponse = await client.getDocuments({ parentId: null })
if (documentsResponse.success) {
  console.log(documentsResponse.data)
}
```

---

## Integration Contracts Summary

### Required External Services

1. **Google OAuth 2.0**
   - Authorization endpoint
   - Token exchange endpoint
   - User info endpoint

2. **MCP Server**
   - Document sync endpoints
   - Webhook receiver

3. **File Storage (S3/GCS/Azure)**
   - Upload endpoint
   - Download endpoint
   - Presigned URL generation
   - Delete endpoint

4. **Stripe (Future)**
   - Payment method creation
   - Subscription management
   - Webhook receiver

### Internal API Endpoints Summary

**Total Endpoints: 40+**

- Authentication: 4 endpoints
- Users: 3 endpoints
- Documents: 10 endpoints
- MCP Keys: 6 endpoints
- Activities: 3 endpoints
- Sync Settings: 6 endpoints
- Plans: 3 endpoints
- Webhooks: 2 endpoints

---

## Testing Contracts

### Test Data Examples

**Valid User:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "name": "Test User",
  "picture": "https://example.com/avatar.jpg",
  "plan": "freemium"
}
```

**Valid Document:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "test-document.md",
  "type": "file",
  "content": "# Test Document\n\nContent here.",
  "parentId": null,
  "size": 512,
  "mimeType": "text/markdown"
}
```

**Valid MCP Key:**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440000",
  "name": "Test Key",
  "key": "SK-test12345678901234567890",
  "description": "Test description"
}
```

---

## Conclusion

This document provides complete API contracts and integration specifications for the Sync Rules backend. All endpoints are documented with:

- Request/response formats
- TypeScript interfaces
- Error handling
- Validation rules
- Integration requirements

The backend implementation must follow these contracts exactly to ensure compatibility with the frontend application.

---

**Document Status:** Ready for Implementation  
**Last Updated:** December 2024  
**API Version:** v1

