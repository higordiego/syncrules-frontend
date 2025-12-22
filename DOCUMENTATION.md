# Sync Rules - Complete System Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Features](#core-features)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Authentication & Authorization](#authentication--authorization)
7. [User Plans & Limits](#user-plans--limits)
8. [Frontend Components](#frontend-components)
9. [Backend Requirements](#backend-requirements)
10. [Database Schema](#database-schema)
11. [Integration Points](#integration-points)

---

## Overview

**Sync Rules** is a web application designed to help users manage AI rules and documents in a centralized location with MCP (Model Context Protocol) synchronization. The application allows users to organize documents and folders, manage MCP API keys, and sync their rules across different IDEs.

### Key Value Propositions

- **Centralized Context**: Organize rules and documents for IDEs in smart folders
- **Key Management**: Securely store and manage MCP keys
- **IDE Synchronization**: Sync rules across VS Code, Cursor, GitHub Copilot, and JetBrains IDEs
- **Markdown Support**: Full Markdown editing and preview capabilities
- **Activity Tracking**: Monitor usage and activity logs

### Technology Stack

- **Frontend Framework**: Next.js 16.0.10 (React 19.2.0)
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS 4.1.9
- **Markdown**: react-markdown with remark-gfm
- **State Management**: React hooks + localStorage (current), needs backend migration
- **Authentication**: Google OAuth (simulated, needs real implementation)
- **Analytics**: Vercel Analytics

---

## System Architecture

### Current Architecture (Frontend-Only)

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Next.js    │  │   React      │  │  localStorage│ │
│  │   App Router │  │   Components │  │  (Temporary) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Pages & Components                   │  │
│  │  - Dashboard  - Documents  - MCP Keys            │  │
│  │  - Profile    - Activity   - Sync Settings       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Target Architecture (With Backend)

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│              Next.js Frontend Application               │
└────────────────────┬───────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼───────────────────────────────────┐
│              Backend API Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth API   │  │  Documents   │  │   MCP Sync   │ │
│  │   Service    │  │   Service    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬───────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│              Database (PostgreSQL/MongoDB)             │
│  - Users  - Documents  - MCP Keys  - Activities       │
└────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. User Authentication

**Current Implementation:**
- Simulated Google OAuth login
- User data stored in localStorage
- Session management via ProtectedRoute component

**Features:**
- Google OAuth integration (needs real implementation)
- User profile management
- Account deletion
- Session persistence

**User Model:**
```typescript
interface User {
  id: string
  email: string
  name: string
  picture: string
}
```

### 2. Document Management

**Features:**
- **Hierarchical Structure**: Folders and files with parent-child relationships
- **Multiple View Modes**: Tree view, Grid view, List view
- **File Operations**:
  - Create files and folders
  - Create subfolders within folders
  - Rename documents
  - Delete documents (recursive deletion for folders)
  - Move documents via drag-and-drop
  - Upload single files or entire directory structures
- **Markdown Support**:
  - Full Markdown editor with IDE-style interface
  - Live preview (Edit/Split/Preview modes)
  - Syntax highlighting
  - GFM (GitHub Flavored Markdown) support
- **Search**: Real-time search across all documents
- **Breadcrumb Navigation**: Navigate folder hierarchy

**Document Model:**
```typescript
interface DocumentItem {
  id: string
  name: string
  type: "file" | "folder"
  content?: string  // Only for files
  parentId: string | null
  createdAt: string
  updatedAt: string
}
```

**Key Operations:**
- `getDocuments()`: Get all documents
- `getDocumentsByParent(parentId)`: Get documents in a folder
- `addDocument(doc)`: Create new document/folder
- `updateDocument(id, updates)`: Update document
- `deleteDocument(id)`: Delete document (recursive)
- `moveDocument(id, newParentId)`: Move document
- `getDocumentPath(id)`: Get breadcrumb path
- `processDirectoryUpload(files, parentId)`: Upload folder structure

### 3. MCP Keys Management

**Features:**
- Create, read, update, delete MCP API keys
- Key masking for security
- Copy to clipboard functionality
- Key visibility toggle
- Automatic "SK-" prefix handling

**MCP Key Model:**
```typescript
interface MCPKey {
  id: string
  name: string
  key: string  // Format: SK-xxxxx
  description: string
  createdAt: string
}
```

**Key Operations:**
- `getMCPKeys()`: Get all keys
- `addMCPKey(key)`: Create new key
- `updateMCPKey(id, updates)`: Update key
- `deleteMCPKey(id)`: Delete key

### 4. Activity Tracking

**Features:**
- Track user activities (upload, folder creation, edits, deletions, key management)
- Usage statistics (files, requests, storage)
- Activity history (last 50 activities)
- Request history (last 7 days)

**Activity Model:**
```typescript
interface Activity {
  id: string
  type: "upload" | "folder" | "key" | "edit" | "delete"
  description: string
  timestamp: string
}

interface UsageStats {
  filesUsed: number
  filesLimit: number
  requestsUsed: number
  requestsLimit: number
  storageUsed: number  // in MB
  storageLimit: number  // in MB
}
```

**Key Operations:**
- `getActivities()`: Get activity log
- `addActivity(activity)`: Log new activity
- `getUsageStats()`: Get current usage statistics
- `incrementRequests()`: Increment API request counter
- `getRequestsHistory()`: Get request history chart data

### 5. Sync Settings

**Features:**
- MCP server configuration
- IDE connection management (VS Code, Cursor, GitHub Copilot, JetBrains)
- Auto-sync settings
- Connection status tracking
- Configuration export (JSON format)

**IDE Connection Model:**
```typescript
interface IDEConnection {
  id: string
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  apiKey?: string
  webhookUrl?: string
  autoSync: boolean
}

interface MCPSettings {
  configured: boolean
  lastSync?: string
  serverUrl: string  // Default: "https://mcp.syncrules.io"
}
```

**Key Operations:**
- `getSyncSettings()`: Get IDE connections
- `getMCPSettings()`: Get MCP server settings
- `updateIDEConnection(ideId, updates)`: Update IDE connection
- `toggleIDEConnection(ideId)`: Toggle connection status
- `updateMCPSync()`: Update last sync timestamp

### 6. User Plans & Limits

**Plan Tiers:**

**Freemium:**
- Up to 10 files
- 100 requests per month
- 50 MB storage
- Unlimited folders
- Unlimited MCP keys
- Markdown viewer
- Email support

**Pro:**
- Unlimited files
- Unlimited requests
- 10 GB storage
- Unlimited folders
- Unlimited MCP keys
- Advanced Markdown viewer
- Markdown editor
- Document versioning
- Folder sharing
- 24/7 priority support
- API access

**Enterprise:**
- Everything in Pro
- Unlimited storage
- Multiple teams and workspaces
- Advanced permission management
- SSO (Single Sign-On)
- Advanced audit and logs
- 99.9% guaranteed SLA
- Dedicated account manager
- Custom onboarding
- Custom integration
- White-label support

**Current Implementation:**
- Hardcoded limits in `getUsageStats()`
- Plan checking in document operations
- Limit warnings displayed to users

---

## Data Models

### Complete Data Structure

```typescript
// User
interface User {
  id: string
  email: string
  name: string
  picture: string
  plan: "freemium" | "pro" | "enterprise"
  createdAt: string
  updatedAt: string
}

// Document
interface DocumentItem {
  id: string
  userId: string  // Owner
  name: string
  type: "file" | "folder"
  content?: string  // Only for files
  parentId: string | null
  createdAt: string
  updatedAt: string
  size?: number  // File size in bytes
  mimeType?: string  // For future file type support
}

// MCP Key
interface MCPKey {
  id: string
  userId: string  // Owner
  name: string
  key: string  // Encrypted in backend
  description: string
  createdAt: string
  updatedAt: string
  lastUsed?: string
}

// Activity
interface Activity {
  id: string
  userId: string
  type: "upload" | "folder" | "key" | "edit" | "delete" | "sync" | "request"
  description: string
  metadata?: Record<string, any>  // Additional context
  timestamp: string
}

// Usage Stats
interface UsageStats {
  userId: string
  filesUsed: number
  filesLimit: number
  requestsUsed: number
  requestsLimit: number
  storageUsed: number  // MB
  storageLimit: number  // MB
  periodStart: string  // Billing period start
  periodEnd: string    // Billing period end
}

// IDE Connection
interface IDEConnection {
  id: string
  userId: string
  ideId: string  // "vscode", "cursor", etc.
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

// MCP Settings
interface MCPSettings {
  userId: string
  configured: boolean
  lastSync?: string
  serverUrl: string
  updatedAt: string
}
```

---

## API Specifications

### Authentication Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/google
```

### User Endpoints

```
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/:id/profile
PUT    /api/users/:id/profile
```

### Document Endpoints

```
GET    /api/documents
GET    /api/documents/:id
POST   /api/documents
PUT    /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/:id/path
POST   /api/documents/:id/move
POST   /api/documents/upload
POST   /api/documents/upload-directory
GET    /api/documents/search?q=query
```

### MCP Keys Endpoints

```
GET    /api/mcp-keys
GET    /api/mcp-keys/:id
POST   /api/mcp-keys
PUT    /api/mcp-keys/:id
DELETE /api/mcp-keys/:id
POST   /api/mcp-keys/:id/validate
```

### Activity Endpoints

```
GET    /api/activities
GET    /api/activities/stats
GET    /api/activities/history
POST   /api/activities
```

### Sync Settings Endpoints

```
GET    /api/sync/settings
PUT    /api/sync/settings
GET    /api/sync/ide-connections
POST   /api/sync/ide-connections
PUT    /api/sync/ide-connections/:id
DELETE /api/sync/ide-connections/:id
POST   /api/sync/sync
POST   /api/sync/webhook
```

### Usage & Limits Endpoints

```
GET    /api/usage/stats
GET    /api/usage/limits
GET    /api/usage/history
```

### Plans Endpoints

```
GET    /api/plans
GET    /api/plans/:id
POST   /api/plans/:id/subscribe
POST   /api/plans/cancel
```

---

## Authentication & Authorization

### Current Implementation

- Simulated Google OAuth
- localStorage-based session
- ProtectedRoute component for route protection

### Backend Requirements

**Authentication Flow:**
1. User clicks "Sign in with Google"
2. Frontend redirects to Google OAuth
3. Google returns authorization code
4. Backend exchanges code for access token
5. Backend fetches user info from Google
6. Backend creates/updates user in database
7. Backend generates JWT token
8. Frontend stores token and redirects to dashboard

**JWT Token Structure:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "plan": "freemium",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Authorization:**
- All API requests require Bearer token in Authorization header
- User can only access their own resources
- Plan-based feature access control

---

## User Plans & Limits

### Plan Enforcement

**Backend Should:**
1. Check user plan on every request
2. Enforce limits before operations
3. Return appropriate error codes:
   - `429 Too Many Requests` - Limit exceeded
   - `403 Forbidden` - Plan doesn't allow feature
   - `402 Payment Required` - Upgrade required

**Limit Checks:**
- File creation: Check `filesUsed < filesLimit`
- Storage: Check `storageUsed < storageLimit`
- API requests: Check `requestsUsed < requestsLimit`
- Features: Check plan tier (e.g., versioning only for Pro+)

---

## Frontend Components

### Page Components

1. **Login Page** (`app/login/page.tsx`)
   - Google OAuth button
   - Feature highlights
   - Terms and privacy links

2. **Dashboard** (`app/dashboard/page.tsx`)
   - Usage statistics cards
   - Quick access links
   - Recent activity
   - Plan information

3. **Documents Page** (`app/documents/page.tsx`)
   - Tree/Grid/List view toggle
   - Search functionality
   - Create folder/file buttons
   - Upload files/folders
   - Drag-and-drop support
   - Markdown editor modal
   - Document viewer modal

4. **MCP Keys Page** (`app/mcp-keys/page.tsx`)
   - List of MCP keys
   - Add/edit/delete keys
   - Key visibility toggle
   - Copy to clipboard

5. **Sync Settings Page** (`app/sync-settings/page.tsx`)
   - MCP server configuration
   - IDE connection management
   - Configuration export

6. **Activity Page** (`app/activity/page.tsx`)
   - Activity log
   - Usage statistics
   - Request history chart

7. **Profile Page** (`app/profile/page.tsx`)
   - User information
   - Name editing
   - Account deletion

8. **Plans Page** (`app/plans/page.tsx`)
   - Plan comparison
   - Upgrade options
   - Feature lists

### Reusable Components

- `TreeView`: Hierarchical document tree
- `MarkdownEditor`: IDE-style markdown editor
- `MarkdownViewer`: Rendered markdown display
- `Breadcrumb`: Navigation breadcrumbs
- `DocumentItem`: Document/folder item display
- `PageLayout`: Consistent page layout
- `ProtectedRoute`: Route protection wrapper

---

## Backend Requirements

### Technology Recommendations

- **Runtime**: Node.js 18+ or Python 3.11+
- **Framework**: Express.js / FastAPI / NestJS
- **Database**: PostgreSQL (recommended) or MongoDB
- **ORM/ODM**: Prisma / TypeORM / Mongoose
- **Authentication**: Passport.js / Auth0 / Firebase Auth
- **File Storage**: AWS S3 / Google Cloud Storage / Azure Blob
- **Caching**: Redis
- **Queue**: Bull / Celery (for async tasks)

### Core Services Needed

1. **Authentication Service**
   - Google OAuth integration
   - JWT token generation/validation
   - Session management
   - Password reset (future)

2. **User Service**
   - User CRUD operations
   - Profile management
   - Plan management
   - Usage tracking

3. **Document Service**
   - Document CRUD operations
   - File upload/download
   - Storage management
   - Search functionality
   - Version control (Pro+)

4. **MCP Keys Service**
   - Key CRUD operations
   - Key encryption/decryption
   - Key validation
   - Usage tracking

5. **Sync Service**
   - MCP protocol implementation
   - IDE connection management
   - Webhook handling
   - Sync scheduling

6. **Activity Service**
   - Activity logging
   - Usage statistics
   - Analytics

7. **Storage Service**
   - File upload/download
   - Storage quota management
   - File versioning

### Security Requirements

1. **Data Encryption**
   - Encrypt MCP keys at rest
   - Use HTTPS for all communications
   - Encrypt sensitive user data

2. **Authentication**
   - Secure JWT implementation
   - Token refresh mechanism
   - Rate limiting

3. **Authorization**
   - Resource ownership validation
   - Plan-based access control
   - API rate limiting per plan

4. **Input Validation**
   - Validate all inputs
   - Sanitize file uploads
   - Prevent injection attacks

5. **File Security**
   - Scan uploads for malware
   - Limit file types/sizes
   - Secure file storage

---

## Database Schema

### PostgreSQL Schema (Recommended)

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  plan VARCHAR(50) DEFAULT 'freemium',
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('file', 'folder')),
  content TEXT,
  parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  size BIGINT DEFAULT 0,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_circular_reference CHECK (id != parent_id)
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_documents_type ON documents(type);

-- MCP Keys Table
CREATE TABLE mcp_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_encrypted TEXT NOT NULL,  -- Encrypted key
  description TEXT,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mcp_keys_user_id ON mcp_keys(user_id);

-- Activities Table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_type ON activities(type);

-- IDE Connections Table
CREATE TABLE ide_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ide_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  connected BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP,
  api_key TEXT,
  webhook_url TEXT,
  auto_sync BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ide_id)
);

CREATE INDEX idx_ide_connections_user_id ON ide_connections(user_id);

-- MCP Settings Table
CREATE TABLE mcp_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  configured BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP,
  server_url VARCHAR(255) DEFAULT 'https://mcp.syncrules.io',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Stats Table
CREATE TABLE usage_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  files_used INTEGER DEFAULT 0,
  requests_used INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,  -- in bytes
  period_start TIMESTAMP DEFAULT NOW(),
  period_end TIMESTAMP DEFAULT (NOW() + INTERVAL '1 month'),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plan Limits Table
CREATE TABLE plan_limits (
  plan VARCHAR(50) PRIMARY KEY,
  files_limit INTEGER,
  requests_limit INTEGER,
  storage_limit BIGINT,  -- in bytes
  features JSONB  -- Additional features
);

INSERT INTO plan_limits VALUES
  ('freemium', 10, 100, 52428800, '{"markdown_viewer": true}'),
  ('pro', -1, -1, 10737418240, '{"markdown_viewer": true, "markdown_editor": true, "versioning": true, "sharing": true, "api_access": true}'),
  ('enterprise', -1, -1, -1, '{"markdown_viewer": true, "markdown_editor": true, "versioning": true, "sharing": true, "api_access": true, "sso": true, "audit_logs": true, "white_label": true}');
```

---

## Integration Points

### MCP Server Integration

**MCP Protocol:**
- Server URL: `https://mcp.syncrules.io`
- Protocol: Model Context Protocol
- Authentication: API Key (SK-xxxxx)

**Configuration Format:**
```json
{
  "mcpServers": {
    "sync-rules": {
      "command": "npx",
      "args": ["-y", "@syncrules/mcp-server"],
      "env": {
        "SYNC_RULES_API_KEY": "SK-xxxxx"
      }
    }
  }
}
```

**Sync Operations:**
- Push documents to IDE
- Pull documents from IDE
- Real-time sync via webhooks
- Conflict resolution

### Google OAuth Integration

**OAuth Flow:**
1. Redirect to Google OAuth consent screen
2. User grants permissions
3. Receive authorization code
4. Exchange code for access token
5. Fetch user profile
6. Create/update user account

**Required Scopes:**
- `openid`
- `profile`
- `email`

### File Storage Integration

**Storage Options:**
- AWS S3 (recommended)
- Google Cloud Storage
- Azure Blob Storage

**File Organization:**
```
bucket/
  {userId}/
    documents/
      {documentId}/
        versions/
          {versionId}
        current
```

---

## Migration Plan

### Phase 1: Backend Setup
1. Set up database
2. Create API server
3. Implement authentication
4. Implement user management

### Phase 2: Core Features
1. Document API
2. MCP Keys API
3. Activity API
4. Sync Settings API

### Phase 3: Frontend Migration
1. Replace localStorage with API calls
2. Update authentication flow
3. Add error handling
4. Add loading states

### Phase 4: Advanced Features
1. File storage integration
2. MCP server implementation
3. Real-time sync
4. Version control

### Phase 5: Production
1. Security hardening
2. Performance optimization
3. Monitoring and logging
4. Deployment

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.syncrules.io
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/syncrules
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
REDIS_URL=redis://localhost:6379
```

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
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

### Pagination Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Error Codes

- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid authentication token
- `AUTH_EXPIRED`: Authentication token expired
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `LIMIT_EXCEEDED`: Plan limit exceeded
- `STORAGE_FULL`: Storage quota exceeded
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed
- `SYNC_FAILED`: Synchronization failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Testing Requirements

### Unit Tests
- Data model validation
- Business logic functions
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- External service integrations

### E2E Tests
- User authentication flow
- Document CRUD operations
- File upload/download
- Sync operations

---

## Deployment Considerations

### Frontend
- Static site generation where possible
- CDN for static assets
- Environment-based configuration
- Error tracking (Sentry)

### Backend
- Horizontal scaling support
- Database connection pooling
- Caching layer (Redis)
- Queue for async tasks
- Monitoring and logging
- Health check endpoints

### Infrastructure
- Load balancer
- Auto-scaling
- Database backups
- Disaster recovery plan

---

## Future Enhancements

1. **Document Versioning** (Pro+)
   - Version history
   - Rollback capability
   - Diff viewing

2. **Collaboration** (Pro+)
   - Folder sharing
   - Real-time collaboration
   - Comments and annotations

3. **Advanced Search**
   - Full-text search
   - Tag system
   - Advanced filters

4. **Export/Import**
   - Export to various formats
   - Bulk import
   - Backup/restore

5. **API Access** (Pro+)
   - RESTful API
   - GraphQL API
   - Webhooks

6. **Analytics**
   - Usage analytics
   - Document analytics
   - Sync analytics

---

## Conclusion

This documentation provides a comprehensive overview of the Sync Rules application. The system is currently frontend-only with localStorage, but designed to migrate to a full-stack architecture with a robust backend API.

Key priorities for backend implementation:
1. Authentication and authorization
2. Document management with file storage
3. MCP keys management with encryption
4. Activity tracking and usage limits
5. MCP server for IDE synchronization

The backend should be designed for scalability, security, and maintainability, with proper error handling, logging, and monitoring in place.

