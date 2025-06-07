# Backend API Routes Documentation

This document lists all backend API routes in `/src/app/api/` directory.

## Summary

**Total Routes**: 32 unique route files  
**HTTP Methods**: GET, POST, PUT, DELETE, OPTIONS  
**Versioned Routes**: 8 routes under `/api/v1/`  
**Non-versioned Routes**: 24 routes  
**Routes with Parameters**: 6 routes with dynamic `[id]` parameters  

---

## 🔐 V1 Authentication API (Versioned)

These routes implement the new versioned authentication system with CSRF protection:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/v1/auth/login` | POST | User authentication with CSRF protection |
| `/api/v1/auth/logout` | POST | User logout with token invalidation |
| `/api/v1/auth/validate` | GET | Validate authentication token |
| `/api/v1/auth/refresh` | POST | Refresh authentication token |
| `/api/v1/auth/csrf` | GET | Generate CSRF token |
| `/api/v1/auth/reset-password/request` | POST | Request password reset |
| `/api/v1/auth/reset-password/verify` | GET | Verify password reset token |
| `/api/v1/auth/reset-password/confirm` | POST | Confirm password reset with new password |

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
| `/api/departments` | POST | None | Create new department |
| `/api/departments/[id]` | GET, PUT, DELETE | `[id]` - Department ID or name | CRUD operations for specific department |

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

⚠️ **Important**: The following endpoints are called by Google Apps Script but don't have V1 equivalents yet:

| Legacy Endpoint | Status | Action Needed |
|----------------|--------|---------------|
| `/api/users` | ❌ No V1 | Create `/api/v1/users` |
| `/api/users/email` | ❌ No V1 | Create `/api/v1/users/email` |
| `/api/users/update-insights` | ❌ No V1 | Create `/api/v1/users/update-insights` |
| `/api/companies` | ❌ No V1 | Create `/api/v1/companies` |
| `/api/companies/domain` | ❌ No V1 | Create `/api/v1/companies/domain` |
| `/api/departments` | ❌ No V1 | Create `/api/v1/departments` |
| `/api/employees` | ❌ No V1 | Create `/api/v1/employees` |
| `/api/labels` | ❌ No V1 | Create `/api/v1/labels` |
| `/api/health` | ❌ No V1 | Create `/api/v1/health` |

---

## Update History

- **2025-06-06**: Initial documentation created
- **2025-06-06**: Google Apps Script endpoints updated to use `/api/v1/` pattern (but backend V1 routes missing)