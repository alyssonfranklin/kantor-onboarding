# Google Apps Script API Calls Documentation

This document lists all API calls made from the Google Apps Script files in `/src/google-calendar-scripts/`.

## Summary

**Total API Endpoints**: 22 unique endpoints  
**Services Used**: 3 (MongoDB/Backend, OpenAI, Google Calendar)  
**API Version**: v1  
**Authentication**: JWT Bearer tokens (with non-auth fallbacks)

---

## 1. MongoDB/Backend API Calls

**Base URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app`

### Authentication & User Management

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/api/v1/auth/login` | POST | `2-databaseUtilities.gs` | `authenticate()` | User login authentication |
| `/api/v1/auth/logout` | POST | `2-databaseUtilities.gs` | `invalidateToken()` | Logout and invalidate JWT token |
| `/api/v1/users` | GET | `2-databaseUtilities.gs` | `getUserByFilter()` | Get users with filters |
| `/api/v1/users/{id}` | GET | `2-databaseUtilities.gs` | `getEntityById()` | Get user by ID |
| `/api/v1/users/{id}` | PUT | `2-databaseUtilities.gs` | `updateEntity()` | Update user data |
| `/api/v1/users/{id}` | DELETE | `2-databaseUtilities.gs` | `deleteEntity()` | Delete user |
| `/api/v1/users/email?email={email}` | GET | `2-databaseUtilities.gs` | `checkUserExists()` | Check if user exists (no auth) |
| `/api/v1/users/update-insights` | POST | `2-databaseUtilities.gs`, `7-insights.gs` | `updateUserInsightsCount()`, `generateInsights()` | Update user insights count |

### Company Management

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/api/v1/companies` | GET | `2-databaseUtilities.gs` | `getCompanies()` | Get companies with filters |
| `/api/v1/companies/{id}` | GET | `2-databaseUtilities.gs` | `getEntityById()` | Get company by ID |
| `/api/v1/companies/{id}` | PUT | `2-databaseUtilities.gs` | `updateEntity()` | Update company data |
| `/api/v1/companies/{id}` | DELETE | `2-databaseUtilities.gs` | `deleteEntity()` | Delete company |
| `/api/v1/companies/domain?domain={domain}` | GET | `2-databaseUtilities.gs` | `getCompanyByDomain()` | Get company by domain |

### Department Management

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/api/v1/departments` | GET | `2-databaseUtilities.gs` | `getDepartments()` | Get departments with filters |
| `/api/v1/departments` | POST | `2-databaseUtilities.gs` | `createEntity()` | Create new department |
| `/api/v1/departments/{id}` | GET | `2-databaseUtilities.gs` | `getEntityById()` | Get department by ID |
| `/api/v1/departments/{id}` | PUT | `2-databaseUtilities.gs` | `updateEntity()` | Update department data |
| `/api/v1/departments/{id}` | DELETE | `2-databaseUtilities.gs` | `deleteEntity()` | Delete department |

### Employee Management

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/api/v1/employees` | GET | `2-databaseUtilities.gs` | `getEmployees()` | Get employees with filters |
| `/api/v1/employees` | POST | `2-databaseUtilities.gs` | `createEntity()` | Create new employee |
| `/api/v1/employees/{id}` | GET | `2-databaseUtilities.gs` | `getEntityById()` | Get employee by ID |
| `/api/v1/employees/{id}` | PUT | `2-databaseUtilities.gs` | `updateEntity()` | Update employee data |
| `/api/v1/employees/{id}` | DELETE | `2-databaseUtilities.gs` | `deleteEntity()` | Delete employee |

### System & Content

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/api/v1/health` | GET | `3-assets.gs` | `checkSystemHealth()` | Check MongoDB API health |
| `/api/v1/labels?locale={locale}` | GET | `2-databaseUtilities.gs` | `getLabels()` | Get localized labels from MongoDB |

### Static Assets (No Versioning)

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/labels/{locale}.json` | GET | `2-databaseUtilities.gs`, `3-assets.gs`, `3.5-asset-utilities.gs` | `getLabels()`, fallback methods | Fetch static localized labels as fallback |

---

## 2. OpenAI API Calls

**Base URL**: `https://api.openai.com`

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/v1/assistants?limit=1` | GET | `6-openai.gs` | `makeOpenAIRequest()` | List available assistants |
| `/v1/assistants/{assistantId}` | GET | `6-openai.gs` | `makeOpenAIRequest()` | Validate specific assistant |
| `/v1/threads` | POST | `6-openai.gs` | `makeOpenAIRequest()` | Create conversation thread |
| `/v1/threads/{threadId}/messages` | POST | `6-openai.gs` | `makeOpenAIRequest()` | Add message to thread |
| `/v1/threads/{threadId}/runs` | POST | `6-openai.gs` | `makeOpenAIRequest()` | Start assistant processing |
| `/v1/threads/{threadId}/runs/{runId}` | GET | `6-openai.gs` | `makeOpenAIRequest()` | Check run status |
| `/v1/threads/{threadId}/messages` | GET | `6-openai.gs` | `makeOpenAIRequest()` | Retrieve assistant response |

**Authentication**: Bearer token with OpenAI API key

---

## 3. Google Calendar API Calls

**Base URL**: `https://www.googleapis.com/calendar/v3`

| Endpoint | Method | File | Function | Purpose |
|----------|--------|------|----------|---------|
| `/calendars/{calendarId}/events/{eventId}` | GET | `9-backgroundTasks.gs` | `preGenerateInsightsForEvent()` | Get detailed event info including attendees |

**Authentication**: OAuth access token

---

## Authentication Details

### JWT Token Authentication (MongoDB/Backend APIs)
- **Header**: `Authorization: Bearer {token}`
- **Token Storage**: Google Apps Script CacheService
- **Token Management**: Automatic refresh and invalidation
- **Fallback**: Some endpoints work without authentication for Google Calendar integration

### Non-Authenticated Endpoints
These endpoints are specifically designed for Google Calendar integration and don't require authentication:
- `/api/v1/users/email?email={email}` - Check user existence
- `/api/v1/users/update-insights` - Update insights count (security by design)
- `/api/v1/health` - System health check
- `/labels/{locale}.json` - Static labels

### OpenAI Authentication
- **Header**: `Authorization: Bearer {api_key}`
- **Key Storage**: Stored in Google Apps Script properties

### Google Calendar Authentication
- **Method**: OAuth access token
- **Scopes**: Defined in `appscript.json`

---

## Error Handling

All API calls include:
- **Timeout handling**: Default 5-second timeout for health checks
- **HTTP exception muting**: `muteHttpExceptions: true`
- **Response code validation**: Check for 2xx status codes
- **Fallback mechanisms**: Multiple fallback strategies for resilience
- **Detailed logging**: Comprehensive logging for debugging

---

## Caching Strategy

### Labels Caching
- **Primary**: Google Apps Script CacheService (4 hours)
- **Fallback**: In-memory cache in DatabaseManager class
- **Refresh**: Force refresh option available

### User Data Caching
- **Storage**: Google Apps Script CacheService
- **TTL**: Variable based on data type
- **Invalidation**: Manual cache clearing functions available

---

## URL Fetch Whitelist (from appscript.json)

All external API calls are restricted to these domains:
- `https://api.openai.com/`
- `https://kantor-onboarding-alysson-franklins-projects.vercel.app/`
- `https://kantor-onboarding.vercel.app/`
- `https://data.mongodb-api.com/`

---

## Update History

- **2025-06-06**: Updated all endpoints to use `/api/v1/` versioning pattern
- **Previous**: Endpoints used `/api/` without versioning