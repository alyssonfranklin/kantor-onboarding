# Backend API Routes Documentation

This document lists all backend API routes in `/src/app/api/` directory.

## Summary

**Total Routes**: 57 unique route files  
**HTTP Methods**: GET, POST, PUT, DELETE, OPTIONS  
**Versioned Routes**: 31 routes under `/api/v1/`  
**Non-versioned Routes**: 26 routes (legacy, deprecated)  
**Routes with Parameters**: 11 routes with dynamic `[id]` parameters  

---

## 🔐 V1 Authentication API (Versioned)

These routes implement the new versioned authentication system with CSRF protection:

| Route | Methods | Purpose | Status |
|-------|---------|---------|--------|
| `/api/v1/auth/login` | POST | User authentication with CSRF protection | ✅ Live |
| `/api/v1/auth/logout` | POST | User logout with token invalidation | ✅ Live |
| `/api/v1/auth/validate` | GET | Validate authentication token | ✅ Live |
| `/api/v1/auth/refresh` | POST | Refresh authentication token | ✅ Live |
| `/api/v1/auth/csrf` | GET | Generate CSRF token | ✅ Live |
| `/api/v1/auth/reset-password/request` | POST | Request password reset | ✅ Live |
| `/api/v1/auth/reset-password/verify` | GET | Verify password reset token | ✅ Live |
| `/api/v1/auth/reset-password/confirm` | POST | Confirm password reset with new password | ✅ Live |

## 🔐 V1 Data API (Versioned)

These V1 data routes are deployed and working on main branch:

| Route | Methods | Purpose | Status |
|-------|---------|---------|--------|
| `/api/v1/users` | GET, POST | List users with filtering, create new users | ✅ Live |
| `/api/v1/users/[id]` | GET, PUT, DELETE | CRUD operations for specific user | ✅ Live |
| `/api/v1/users/[id]/update-password` | PUT | Update user password (admin only) | ✅ Live |
| `/api/v1/companies` | GET, POST | List companies with filtering, create new companies | ✅ Live |
| `/api/v1/companies/[id]` | GET, PUT, DELETE | CRUD operations for specific company | ✅ Live |
| `/api/v1/departments` | GET, POST | List departments with filtering by company, create new departments | ✅ Live |
| `/api/v1/departments/[id]` | GET, PUT, DELETE | CRUD operations for specific department | ✅ Live |
| `/api/v1/employees` | GET, POST | List employees with filtering, create new employees | ✅ Live |
| `/api/v1/employees/[id]` | GET, PUT, DELETE | CRUD operations for specific employee | ✅ Live |
| `/api/v1/labels` | GET | Get labels for internationalization (supports en, pt, es) | ✅ Live |
| `/api/v1/health` | GET | Health check for API and database connectivity | ✅ Live |
| `/api/v1/users/update-insights` | GET, POST | Update user insights count (public endpoint) | ✅ Live |

### 🔐 Password Management

| Route | Methods | Purpose | Authentication |
|-------|---------|---------|---------------|
| `/api/v1/users/[id]/update-password` | PUT | Update user password | Admin only |

**Request Body for Password Update**:
```json
{
  "newPassword": "new_password_here"
}
```

**Features**:
- ✅ Admin-only access control
- ✅ Password strength validation (minimum 6 characters)
- ✅ Automatic bcrypt hashing
- ✅ Direct database update (bypasses Mongoose validation)
- ✅ Timeout protection (10 seconds)

## 🔧 V1 Assistant/AI Management (Versioned)

| Route | Methods | Purpose | Status |
|-------|---------|---------|--------|
| `/api/v1/update-assistant` | POST | Update OpenAI assistant instructions | ✅ Live |
| `/api/v1/create-agent` | POST | Create new OpenAI assistant for company | ✅ Live |
| `/api/v1/upload-files` | POST | Upload files to existing assistant | ✅ Live |
| `/api/v1/create-assistant-with-files` | POST, OPTIONS | Create assistant and upload files in one operation | ✅ Live |
| `/api/v1/add-user` | POST | Add user and company to database | ✅ Live |

## 🔐 V1 Admin Authentication (Versioned)

| Route | Methods | Purpose | Status |
|-------|---------|---------|--------|
| `/api/v1/admin/verify-password` | POST | Admin password verification with rate limiting | ✅ Live |
| `/api/v1/admin/initialize-db` | POST | Initialize database with default admin user | ✅ Live |
| `/api/v1/admin/seed-labels` | POST | Seed labels collection for internationalization | ✅ Live |
| `/api/v1/verify-password` | POST | User password verification with rate limiting | ✅ Live |

---

## 👤 User Management

| Route | Methods | Parameters | Purpose |
|-------|---------|------------|---------|
| `/api/users` | GET, POST | None | List users with filtering, create new users |
| `/api/users/[id]` | GET, PUT, DELETE | `[id]` - User ID | CRUD operations for specific user |
| `/api/users/email` | GET, OPTIONS | None | Get user by email (public endpoint for Google Calendar) |
| `/api/users/update-insights` | GET, POST, OPTIONS | None | Update user insights count (public endpoint) |
| `/api/users/login` | GET, POST | None | User authentication (legacy endpoint) |
| `/api/add-user` | POST | None | Add user and company to database |

---

## 🏢 Company Management

| Route | Methods | Parameters | Purpose |
|-------|---------|------------|---------|
| `/api/companies` | GET, POST | None | List companies with filtering, create new companies |
| `/api/companies/[id]` | GET, PUT, DELETE | `[id]` - Company ID | CRUD operations for specific company |
| `/api/companies/domain` | GET | None | Get company by domain |

---

## 🏢 Department Management

| Route | Methods | Parameters | Purpose |
|-------|---------|------------|---------|
| `/api/departments` | GET, POST | None | List departments with filtering, create new department |
| `/api/departments/[id]` | GET, PUT, DELETE | `[id]` - Department ID or name | CRUD operations for specific department |

### 🆕 **V1 Department API (Updated Schema)**

**Endpoint**: `POST /api/v1/departments`  
**Purpose**: Create new department with updated schema  
**Authentication**: Required (JWT Bearer token)

**Updated Department Schema**:
```json
{
  "department_id": "dept_1703123456789_abc123def", // Auto-generated unique ID
  "company_id": "company_id_here",                 // Required
  "department_name": "Department Name",           // Required  
  "department_lead": "user_id_here",              // Optional (can be null)
  "department_lead_name": "John Doe",             // Populated in GET responses
  "department_lead_id": "user_id_here"            // Original ID for editing
}
```

**Request Payload**:
```json
{
  "company_id": "selected_company_id",
  "department_name": "Human Resources"
}
```

**GET Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "department_id": "dept_1703123456789_abc123def",
      "company_id": "comp_1703123456789_xyz789",
      "department_name": "Human Resources",
      "department_lead": "user_1703123456789_def456",
      "department_lead_name": "John Doe",
      "department_lead_id": "user_1703123456789_def456",
      "createdAt": "2025-06-26T10:30:00.000Z",
      "updatedAt": "2025-06-26T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "skip": 0
  }
}
```

**Features**:
- ✅ **Auto-generated department_id**: Uses timestamp + random string pattern
- ✅ **Company filtering**: `GET /api/v1/departments?companyId={company_id}`
- ✅ **User name population**: department_lead_name shows actual user names instead of IDs
- ✅ **Edit-friendly**: department_lead_id preserved for form editing
- ✅ **Optional department lead**: Can be null when creating departments
- ✅ **Access control**: Users can only see/create departments for their company
- ✅ **Compound uniqueness**: Department name must be unique within each company

---

## 👥 Employee Management

| Route | Methods | Parameters | Purpose |
|-------|---------|------------|---------|
| `/api/employees` | GET, POST | None | List employees with filtering, create new employees |
| `/api/employees/[id]` | GET, PUT, DELETE | `[id]` - Employee ID | CRUD operations for specific employee |

---

## 🔧 Assistant/AI Management

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/update-assistant` | POST | Update OpenAI assistant instructions |
| `/api/create-agent` | POST | Create new OpenAI assistant for company |
| `/api/check-assistant` | GET | Retrieve assistant details and tools |
| `/api/upload-files` | POST | Upload files to existing assistant |
| `/api/create-assistant-with-files` | POST, OPTIONS | Create assistant and upload files in one operation |

---

## 🔐 Authentication & Security (Legacy)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/verify-password` | POST | User password verification with rate limiting |
| `/api/logout` | POST | User logout (legacy endpoint) |

---

## 🔐 Admin Authentication

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/verify-password` | POST | Admin password verification with rate limiting |
| `/api/admin/initialize-db` | POST | Initialize database with default admin user |
| `/api/admin/seed-labels` | POST | Seed labels collection for internationalization |

---

## 🌐 Internationalization

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/labels` | GET | Get labels for internationalization (supports en, pt, es) |

---

## 🔧 System & Utilities

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/test` | GET | Test MongoDB connection and provide API documentation |
| `/api/health` | GET | Health check for API and database connectivity |
| `/api/og` | GET | Dynamic Open Graph image generator |

---

## Authentication Details

### V1 Authentication (Recommended)
- **Implementation**: JWT tokens with CSRF protection
- **Middleware**: Modern `withAuth` middleware
- **Features**: Token refresh, secure logout, password reset flow
- **CORS**: Properly configured for cross-origin requests

### Legacy Authentication
- **Implementation**: Basic JWT tokens
- **Usage**: Backward compatibility for existing integrations
- **Status**: Deprecated, migrate to V1 when possible

---

## Public Endpoints (No Authentication Required)

These endpoints can be accessed without authentication:

| Route | Purpose | Used By |
|-------|---------|---------|
| `/api/health` | System health check | Monitoring systems |
| `/api/test` | API documentation | Development |
| `/api/users/email` | User existence check | Google Calendar integration |
| `/api/users/update-insights` | Update insights count | Google Calendar integration |
| `/api/og` | Open Graph images | Social media sharing |

---

## CORS Configuration

Several endpoints are configured for cross-origin requests to support Google Apps Script integration:

- **Allowed Origins**: Configured for Google Apps Script domains
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-CSRF-Token
- **Credentials**: Supported where needed

---

## Rate Limiting

Implemented on sensitive endpoints:

| Route | Limit | Window |
|-------|-------|--------|
| `/api/verify-password` | 5 attempts | 15 minutes |
| `/api/admin/verify-password` | 3 attempts | 15 minutes |
| `/api/v1/auth/login` | 5 attempts | 15 minutes |

---

## Missing V1 Endpoints

⚠️ **Note**: Most endpoints now have V1 equivalents. Remaining legacy endpoints:

| Legacy Endpoint | V1 Status | Priority |
|----------------|-----------|----------|
| `/api/users/email` | ❌ Missing | Medium - Used by Google Apps Script |
| `/api/companies/domain` | ❌ Missing | Medium - Used by Google Apps Script |
| `/api/check-assistant` | ❌ Missing | Low - No frontend usage found |
| `/api/logout` | ❌ Missing | Low - V1 auth logout available |

## ✅ V1 Endpoints Working on Main Branch

The following V1 endpoints have been successfully deployed and tested:

| V1 Endpoint | Test Result | Status |
|-------------|-------------|--------|
| `/api/v1/health` | 200 OK | ✅ Working |
| `/api/v1/labels` | 200 OK | ✅ Working |
| `/api/v1/users` | 401 Unauthorized (requires auth) | ✅ Working |
| `/api/v1/users/[id]/update-password` | 401 Unauthorized (requires admin auth) | ✅ Working |
| `/api/v1/companies` | 401 Unauthorized (requires auth) | ✅ Working |
| `/api/v1/departments` | 401 Unauthorized (requires auth) | ✅ Working |
| `/api/v1/employees` | 401 Unauthorized (requires auth) | ✅ Working |
| `/api/v1/users/update-insights` | 400 Bad Request (expects data) | ✅ Working |
| `/api/v1/auth/*` | Various (login, logout, etc.) | ✅ Working |

---

## Update History

- **2025-06-06**: Initial documentation created
- **2025-06-06**: Google Apps Script endpoints updated to use `/api/v1/` pattern
- **2025-06-06**: Tested all V1 endpoints on main branch, updated documentation with actual deployment status
- **2025-06-06**: Confirmed 9 out of 11 required V1 endpoints are working on main branch
- **2025-06-11**: **MAJOR UPDATE**: Created comprehensive V1 API migration
  - Added 15 new V1 endpoints (create-agent, update-assistant, add-user, upload-files, etc.)
  - Migrated ALL frontend components to use V1 APIs exclusively
  - Added V1 CRUD endpoints for users, companies, departments, employees
  - Updated 12 frontend files to use V1 API calls
  - Now 28 V1 routes vs 19 legacy routes (legacy routes deprecated)
- **2025-06-17**: Added password update functionality
  - Added `/api/v1/users/[id]/update-password` endpoint for admin password updates
  - Updated admin dashboard with password update feature using icons
  - Enhanced departments create page with real API integration
  - Total routes now: 57 (31 V1 + 26 legacy)
- **2025-06-26**: Enhanced department management functionality
  - **Updated department schema**: Changed to `department_id`, `company_id`, `department_name`, `department_lead`
  - **Auto-generated department IDs**: Using timestamp + random string pattern
  - **Company filtering**: `GET /api/v1/departments?companyId={company_id}` for dependent dropdowns
  - **Admin users create page**: Added dependent department dropdown and "New Department" modal
  - **Real-time department creation**: Create departments on-the-fly without page refresh
  - **Form reordering**: Department field moved after company selection
  - **Enhanced UX**: Loading states, keyboard support, modal validation