# Frontend Pages API Calls Documentation

This document provides a comprehensive analysis of all frontend pages and their API calls in the Kantor Onboarding application.

## Summary

**Total Pages Analyzed**: 20  
**Pages with API Calls**: 14  
**Pages without API Calls**: 6  
**Total Unique API Endpoints**: 23  
**Authentication Protected Pages**: 12  

---

## 🏠 **Homepage & Landing Pages**

### 📄 **/** (Homepage)
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/`

**API Calls**: None

**Purpose**: Landing page with navigation links and company information

**Features**:
- ✅ Static content display
- ✅ Navigation to other sections
- ✅ Company branding and information

---

### 🎉 **Welcome Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/welcome`

**API Calls**: None

**Purpose**: Static onboarding wizard explaining the platform features

**Features**:
- ✅ Multi-step onboarding walkthrough
- ✅ Feature explanations
- ✅ Getting started guidance
- ✅ No backend integration

---

## 🔐 **Authentication Pages**

### 🔑 **Login Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/login`

#### **API Calls**:

**1. User Authentication**
- **Endpoint**: `POST /api/v1/auth/login`
- **When**: Form submission with email/password
- **Purpose**: Authenticate user and establish session
- **Headers**:
  ```
  Content-Type: application/json
  X-CSRF-Token: csrf_token_value
  ```
- **Payload**:
  ```json
  {
    "email": "user@company.com",
    "password": "user_password",
    "rememberMe": true
  }
  ```

#### **Features**:
- ✅ Email/password authentication
- ✅ Remember me functionality
- ✅ CSRF protection
- ✅ Session establishment
- ✅ Redirect to dashboard on success

---

### 📝 **Signup Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/signup`

#### **API Calls**:

**1. User and Company Registration**
- **Endpoint**: `POST /api/v1/add-user`
- **When**: Form submission with user details
- **Purpose**: Create new user account and company
- **Payload**:
  ```json
  {
    "name": "User Full Name",
    "email": "user@company.com",
    "companyName": "Company Name",
    "password": "secure_password",
    "version": "1.0",
    "assistantId": "default_assistant_id"
  }
  ```

#### **Features**:
- ✅ User account creation
- ✅ Company creation
- ✅ Email validation
- ✅ Password strength validation
- ✅ Assistant integration setup

---

### 🔒 **Forgot Password Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/forgot-password`

#### **API Calls**:

**1. Password Reset Request**
- **Endpoint**: `POST /api/v1/auth/reset-password/request`
- **When**: Form submission with email
- **Purpose**: Send password reset email to user
- **Payload**:
  ```json
  {
    "email": "user@company.com"
  }
  ```

#### **Features**:
- ✅ Email validation
- ✅ Reset email sending
- ✅ User feedback on success/failure
- ✅ Rate limiting protection

---

### 🔄 **Reset Password Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/reset-password`

#### **API Calls**:

**1. Token Verification**
- **Endpoint**: `GET /api/v1/auth/reset-password/verify?token={token}`
- **When**: Page load with token parameter
- **Purpose**: Verify if reset token is valid
- **Parameters**: Token from URL query string

**2. Password Reset Confirmation**
- **Endpoint**: `POST /api/v1/auth/reset-password/confirm`
- **When**: Form submission with new password
- **Purpose**: Set new password using reset token
- **Payload**:
  ```json
  {
    "token": "reset_token_from_url",
    "password": "new_password"
  }
  ```

#### **Features**:
- ✅ Token validation on page load
- ✅ New password setting
- ✅ Password strength validation
- ✅ Automatic redirect to login

---

## 👤 **User Dashboard Pages**

### 📊 **Main Dashboard**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/dashboard`

**API Calls**: None (Redirects immediately)

**Purpose**: Entry point that redirects to `/dashboard/onboarding`

**Authentication**: ✅ Protected by `ProtectedRoute`

---

### 🎯 **Dashboard Onboarding**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/dashboard/onboarding`

**API Calls**: None

**Purpose**: Company onboarding flow and setup guidance

**Authentication**: ✅ Protected by `ProtectedRoute`

**Features**:
- ✅ Multi-step onboarding wizard
- ✅ Company setup guidance
- ✅ Progress tracking

---

### 👥 **Dashboard Onboarding Users**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/dashboard/onboarding-users`

**API Calls**: None

**Purpose**: User management and onboarding flow

**Authentication**: ✅ Protected by `ProtectedRoute`

**Features**:
- ✅ User onboarding steps
- ✅ Team setup guidance
- ✅ Role assignment information

---

## 🏗️ **Setup Pages**

### ⚙️ **Setup Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/setup`

**API Calls**: None

**Purpose**: Multi-step company setup wizard

**Authentication**: ✅ Likely protected

**Features**:
- ✅ Company configuration steps
- ✅ Settings customization
- ✅ Progress tracking

---

### 👤 **Setup Users Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/setup-users`

**API Calls**: None

**Purpose**: Department and user management setup

**Authentication**: ✅ Likely protected

**Features**:
- ✅ User role configuration
- ✅ Department structure setup
- ✅ Permission settings

---

### 📊 **Company Status Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/company-status`

#### **API Calls**:

**1. Admin Authentication**
- **Endpoint**: `POST /api/v1/verify-password`
- **When**: Page initialization for testing
- **Purpose**: Get JWT token for API access
- **Payload**:
  ```json
  {
    "email": "admin@voxerion.com",
    "password": "admin123"
  }
  ```

**2. Get Company Status**
- **Endpoint**: `GET /api/v1/company-status?companyId={company_id}`
- **When**: Page load or manual refresh
- **Purpose**: Retrieve current company onboarding status and progress
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Parameters**: 
  - `companyId` (optional) - For testing mode, uses user's company from auth context in production

#### **Features**:
- ✅ **Test Mode**: Manual company ID input for backend testing
- ✅ **Progress Visualization**: Progress bar showing completion percentage
- ✅ **Step Tracking**: Visual indicators for each onboarding step
- ✅ **Status History**: Timeline of recent status changes
- ✅ **Real-time Updates**: Refresh functionality to check latest status
- ✅ **Company Information**: Display of company details and metadata
- ✅ **Responsive Design**: Mobile-friendly layout with proper spacing
- ✅ **Smart Authentication**: Automatic token handling for API requests

---

## 🤖 **AI Assistant Management**

### 🎨 **Create Assistant Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/create-assistant`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Page access authentication
- **Purpose**: Admin access verification
- **Payload**:
  ```json
  {
    "password": "admin_password"
  }
  ```

**2. Create Assistant with Files**
- **Endpoint**: `POST /api/v1/create-assistant-with-files`
- **When**: Form submission with assistant details and files
- **Purpose**: Create new OpenAI assistant with uploaded files
- **Payload**: FormData with:
  ```
  assistantName: "Assistant Name"
  files: [File objects]
  ```

#### **Features**:
- ✅ Password-protected admin access
- ✅ OpenAI assistant creation
- ✅ File upload integration
- ✅ Vector database setup

---

### 📁 **Upload Assessment Page**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/upload-assessment`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Page access authentication
- **Purpose**: Admin access verification
- **Payload**:
  ```json
  {
    "password": "admin_password"
  }
  ```

**2. Upload Files to Assistant**
- **Endpoint**: `POST /api/v1/upload-files`
- **When**: Form submission with files and assistant ID
- **Purpose**: Upload assessment files to existing assistant
- **Payload**: FormData with:
  ```
  assistantId: "assistant_id"
  enableRetrieval: true
  files: [File objects]
  ```

#### **Features**:
- ✅ Password-protected admin access
- ✅ File upload to existing assistants
- ✅ Vector database integration
- ✅ Progress tracking

---

### 🏢 **Company Onboarding Form**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/onboarding-company`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Page access authentication
- **Purpose**: Admin access verification
- **Payload**:
  ```json
  {
    "password": "admin_password"
  }
  ```

**2. Update Assistant Instructions**
- **Endpoint**: `POST /api/v1/update-assistant`
- **When**: Form submission with company details
- **Purpose**: Update OpenAI assistant with company-specific instructions
- **Payload**:
  ```json
  {
    "instructions": "formatted_company_instructions",
    "assistantId": "openai_assistant_id"
  }
  ```

#### **Client-Side Features**:
- 📊 Real-time token counting
- 💰 Cost estimation
- 🔄 Debounced input processing

#### **Features**:
- ✅ Password-protected admin access
- ✅ Company information collection (Portuguese)
- ✅ OpenAI assistant customization
- ✅ Real-time token/cost calculation
- ✅ **Usage Logging**: Automatically logs status `6123-98712312-8923` after successful onboarding completion

---

### 🎯 **Agent Organization Creation**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/agent-org-creation`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Page access authentication
- **Purpose**: Admin access verification
- **Payload**:
  ```json
  {
    "password": "admin_password"
  }
  ```

**2. Create OpenAI Agent**
- **Endpoint**: `POST /api/v1/create-agent`
- **When**: First step of form submission
- **Purpose**: Create OpenAI assistant for company
- **Payload**:
  ```json
  {
    "name": "Company Name"
  }
  ```

**3. Add User to Database**
- **Endpoint**: `POST /api/v1/add-user`
- **When**: Second step after agent creation
- **Purpose**: Create company and admin user
- **Headers**:
  ```
  Content-Type: application/json
  x-create-default-department: "true" | "false"
  ```
- **Payload**:
  ```json
  {
    "email": "admin@company.com",
    "name": "Admin Name",
    "companyName": "Company Name",
    "password": "admin_password",
    "version": "Free|Basic|Business",
    "assistantId": "assistant_id_from_step_2"
  }
  ```

#### **Features**:
- ✅ Password-protected admin access
- ✅ Complete organization setup
- ✅ OpenAI assistant creation
- ✅ Admin user creation
- ✅ Department creation option
- ✅ **Usage Logging**: Automatically logs status `6233-832932-1313` after successful account creation

---

## 🔧 **Admin Panel Pages**

### 🏠 **Admin Home**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/admin`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Admin section access
- **Purpose**: Admin authentication
- **Payload**:
  ```json
  {
    "password": "admin_password"
  }
  ```

#### **Features**:
- ✅ Password-protected admin access
- ✅ Navigation to admin sections
- ✅ API documentation links

---

### 📊 **Admin Dashboard**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/admin/dashboard`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Admin section access
- **Purpose**: Admin authentication

**2. Database Initialization**
- **Endpoint**: `POST /api/v1/admin/initialize-db`
- **When**: Page load initialization
- **Purpose**: Ensure database is properly set up

**3. Admin Login**
- **Endpoint**: `POST /api/v1/verify-password`
- **When**: Automatic login for admin functions
- **Purpose**: Get JWT token for API requests
- **Payload**:
  ```json
  {
    "email": "admin@voxerion.com",
    "password": "admin123"
  }
  ```

**4. Fetch Data (Multiple Endpoints)**
- **Endpoints**: 
  - `GET /api/v1/users` - List all users
  - `GET /api/v1/companies` - List all companies  
  - `GET /api/v1/departments` - List all departments with populated company names, user names and descriptions
  - `GET /api/v1/employees` - List all employees
- **When**: Tab switching in dashboard
- **Purpose**: Display entity data in tables
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Special Features**: 
  - Departments endpoint populates `company_name` with actual company names
  - Departments endpoint populates `department_lead_name` with actual user names
  - Preserves `department_lead_id` for editing purposes
  - Includes `department_description` field for department details

**5. Update Entity**
- **Endpoints**: 
  - `PUT /api/v1/users/[id]` - Update user
  - `PUT /api/v1/companies/[id]` - Update company
  - `PUT /api/v1/departments/[id]` - Update department
  - `PUT /api/v1/employees/[id]` - Update employee
- **When**: Edit form submission
- **Purpose**: Update entity information

**6. Update User Password**
- **Endpoint**: `PUT /api/v1/users/[id]/update-password`
- **When**: Password update form submission
- **Purpose**: Change user password (admin only)
- **Payload**:
  ```json
  {
    "newPassword": "new_password"
  }
  ```

**7. Delete Entity**
- **Endpoints**: 
  - `DELETE /api/v1/users/[id]` - Delete user
  - `DELETE /api/v1/companies/[id]` - Delete company
  - `DELETE /api/v1/departments/[id]` - Delete department
  - `DELETE /api/v1/employees/[id]` - Delete employee
- **When**: Delete confirmation
- **Purpose**: Remove entity from database

#### **Enhanced Department Management Features**:
- ✅ **User Name Display**: Shows actual user names instead of IDs in department_lead column
- ✅ **Smart Edit Modal**: Dropdown populated with company users for department lead selection
- ✅ **Dual Field Support**: API returns both `department_lead_name` for display and `department_lead_id` for editing
- ✅ **Company-filtered Users**: Edit modal only shows users from the same company as the department

#### **Features**:
- ✅ Multi-tab interface (Users, Companies, Departments, Employees, Tokens)
- ✅ CRUD operations with icons (Edit ✏️, Password 🔑, Delete 🗑️)
- ✅ Real-time data fetching
- ✅ Password update functionality
- ✅ Enhanced department management with user name resolution
- ✅ Comprehensive admin controls

---

### 👤 **Admin Create User**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/admin/users/create`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Admin section access
- **Purpose**: Admin authentication

**2. Database Initialization**
- **Endpoint**: `POST /api/v1/admin/initialize-db`
- **When**: Page load initialization
- **Purpose**: Ensure database connectivity

**3. Admin Authentication**
- **Endpoint**: `POST /api/v1/verify-password`
- **When**: Automatic login for API access
- **Purpose**: Get JWT token for subsequent requests

**4. Fetch Companies**
- **Endpoint**: `GET /api/v1/companies`
- **When**: Page load after authentication
- **Purpose**: Populate company dropdown
- **Headers**: `Authorization: Bearer {jwt_token}`

**5. Fetch Departments by Company**
- **Endpoint**: `GET /api/v1/departments?companyId={company_id}`
- **When**: Company selection change in form
- **Purpose**: Populate department dropdown based on selected company
- **Headers**: `Authorization: Bearer {jwt_token}`

**6. Create New Department**
- **Endpoint**: `POST /api/v1/departments`
- **When**: User selects "New Department" option and submits modal form
- **Purpose**: Create new department for selected company
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Payload**:
  ```json
  {
    "company_id": "selected_company_id",
    "department_name": "Department Name"
  }
  ```

**7. Create User and Company**
- **Endpoint**: `POST /api/v1/add-user`
- **When**: Form submission
- **Purpose**: Create new user and company
- **Payload**:
  ```json
  {
    "name": "User Full Name",
    "email": "user@company.com",
    "password": "user_password",
    "companyName": "Selected Company Name",
    "role": "user|orgadmin|admin",
    "department": "Department Name",
    "company_role": "Company Role",
    "assistantId": "openai_assistant_id",
    "version": "1.0"
  }
  ```

#### **Features**:
- ✅ Comprehensive user creation form
- ✅ Role-based access control
- ✅ **Company dropdown** (dynamically loaded from API)
- ✅ **Department dropdown** (dependent on company selection)
- ✅ **"New Department" modal** for creating departments on-the-fly
- ✅ **Auto-generated department_id** using timestamp + random string
- ✅ Department field reordered to appear after company selection
- ✅ OpenAI assistant linking
- ✅ Loading states for company and department dropdowns
- ✅ Form validation and error handling
- ✅ Keyboard support in modal (Enter to submit, Escape to close)
- ✅ **Usage Logging**: Automatically logs status `6723-09823413-0002` after successful user creation

---

### 🏢 **Admin Create Company**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/admin/companies/create`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Admin section access
- **Purpose**: Admin authentication

**2. Create Company with Admin**
- **Endpoint**: `POST /api/v1/add-user`
- **When**: Form submission
- **Purpose**: Create company with organization admin
- **Payload**:
  ```json
  {
    "name": "Admin Name",
    "email": "admin@company.com",
    "password": "admin_password",
    "companyName": "Company Name",
    "assistantId": "assistant_id",
    "version": "version_number",
    "role": "orgadmin",
    "department": "Management",
    "company_role": "Admin"
  }
  ```

#### **Features**:
- ✅ Company creation with admin user
- ✅ Organization admin setup
- ✅ Assistant integration
- ✅ Management department creation

---

### 🏢 **Admin Create Department**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/admin/departments/create`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Admin section access
- **Purpose**: Admin authentication

**2. Database Initialization**
- **Endpoint**: `POST /api/v1/admin/initialize-db`
- **When**: Page load initialization
- **Purpose**: Ensure database connectivity

**3. Admin Authentication**
- **Endpoint**: `POST /api/v1/verify-password`
- **When**: Automatic login for API access
- **Purpose**: Get JWT token for subsequent requests

**4. Fetch Companies**
- **Endpoint**: `GET /api/v1/companies`
- **When**: Page load after authentication
- **Purpose**: Populate company dropdown
- **Headers**: `Authorization: Bearer {jwt_token}`

**5. Fetch Users by Company**
- **Endpoint**: `GET /api/v1/users?companyId={company_id}`
- **When**: Company selection change
- **Purpose**: Populate department head dropdown
- **Headers**: `Authorization: Bearer {jwt_token}`

**6. Create Department**
- **Endpoint**: `POST /api/v1/departments`
- **When**: Form submission
- **Purpose**: Create new department
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Payload**:
  ```json
  {
    "company_id": "selected_company_id",
    "department_name": "department_name",
    "department_description": "department_description",
    "department_lead": "selected_user_id"
  }
  ```

#### **Features**:
- ✅ Dynamic company loading
- ✅ User filtering by company
- ✅ Department head assignment
- ✅ Real-time form validation
- ✅ Loading states for all dropdowns
- ✅ **Usage Logging**: Automatically logs status `8290-90232442-0233` after successful department creation

---

### 👥 **Admin Create Employee**
**URL**: `https://kantor-onboarding-alysson-franklins-projects.vercel.app/admin/employees/create`

#### **API Calls**:

**1. Password Protection**
- **Endpoint**: `POST /api/v1/admin/verify-password`
- **When**: Admin section access
- **Purpose**: Admin authentication

**2. Create Employee** (Currently Mocked)
- **Endpoint**: `POST /api/v1/employees`
- **When**: Form submission
- **Purpose**: Create new employee
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Payload**:
  ```json
  {
    "employee_name": "Employee Name",
    "employee_role": "Employee Role",
    "employee_leader": "Leader ID",
    "company_id": "Company ID"
  }
  ```

#### **Mock Data Note**:
Currently uses hardcoded company and employee leader data. Real API integration needed.

#### **Features**:
- ✅ Employee creation form
- ✅ Company association
- ✅ Leader assignment
- ⚠️ Mock data (needs real API integration)

---

## 📊 **Statistics & Analytics Endpoints**

### 📈 **Department Statistics**
**URL**: `GET /api/v1/users/department-stats`

#### **API Call Details**:

**Authentication**: ✅ Required (JWT token)

**Purpose**: Count employees and leaders per department for the authenticated user's company

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "department": "Engineering",
      "totalEmployees": 15,
      "leaders": 2
    },
    {
      "department": "Marketing", 
      "totalEmployees": 8,
      "leaders": 1
    },
    {
      "department": "Sales",
      "totalEmployees": 12,
      "leaders": 3
    }
  ]
}
```

#### **Key Features**:
- ✅ **Company Scoped**: Only returns data for the authenticated user's company
- ✅ **Employee Counting**: Total employees per department
- ✅ **Leader Identification**: Counts users where `id` equals `reports_to` (self-reporting leaders)
- ✅ **Sorted Results**: Departments sorted alphabetically
- ✅ **Aggregation Pipeline**: Uses MongoDB aggregation for efficient querying
- ✅ **Error Handling**: Comprehensive error responses with proper status codes

#### **Business Logic**:
- **Employee Count**: All users assigned to each department
- **Leader Definition**: Users where their `user.id` matches their `user.reports_to` field
- **Company Isolation**: Results filtered by the user's `company_id` for security
- **Performance**: Single database query using aggregation pipeline

#### **Usage Scenarios**:
- Management dashboards showing organizational structure
- HR analytics and reporting
- Department head identification
- Organizational charts and statistics
- Resource allocation planning

---

## 🏷️ **Tags Management Endpoints**

### 📝 **Tags CRUD Operations**

#### **Get All Tags**
**URL**: `GET /api/v1/tags`

**Authentication**: ✅ Required (JWT token)

**Query Parameters**:
- `userId` (optional) - Filter tags for specific user

**Purpose**: Retrieve all tags for company or specific user

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "tag_id": "uuid-string",
      "user_id": "user123",
      "company_id": "company456",
      "tag_name": "Leadership",
      "tag_color": "#3B82F6",
      "created_at": "2025-07-01T10:00:00Z",
      "created_by": "admin123"
    }
  ]
}
```

---

#### **Create Tag**
**URL**: `POST /api/v1/tags`

**Authentication**: ✅ Required (JWT token)

**Payload**:
```json
{
  "user_id": "user123",
  "tag_name": "Leadership",
  "tag_color": "#3B82F6"
}
```

**Purpose**: Create a new tag for a user

**Features**:
- ✅ Duplicate tag prevention per user
- ✅ Default color assignment
- ✅ Company scoping for security

---

#### **Get Specific Tag**
**URL**: `GET /api/v1/tags/[id]`

**Authentication**: ✅ Required (JWT token)

**Purpose**: Retrieve details of a specific tag

---

#### **Update Tag**
**URL**: `PUT /api/v1/tags/[id]`

**Authentication**: ✅ Required (JWT token)

**Payload**:
```json
{
  "tag_name": "Senior Leadership",
  "tag_color": "#10B981"
}
```

**Purpose**: Update tag name and/or color

**Features**:
- ✅ Duplicate name validation
- ✅ Company scoping

---

#### **Delete Tag**
**URL**: `DELETE /api/v1/tags/[id]`

**Authentication**: ✅ Required (JWT token)

**Purpose**: Remove a specific tag

---

### 👥 **Users with Tags**

#### **Get Users with Tags**
**URL**: `GET /api/v1/users/with-tags`

**Authentication**: ✅ Required (JWT token)

**Purpose**: Retrieve all company users with their associated tags

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "name": "John Smith",
      "email": "john@company.com",
      "department": "Engineering",
      "company_role": "Senior Developer",
      "tags": [
        {
          "tag_id": "tag456",
          "tag_name": "Leadership",
          "tag_color": "#3B82F6",
          "created_at": "2025-07-01T10:00:00Z"
        }
      ]
    }
  ]
}
```

**Features**:
- ✅ **Password Excluded**: User passwords filtered out for security
- ✅ **Sorted Results**: Users sorted by name, tags by tag name
- ✅ **Aggregated Data**: Combines user and tag information efficiently

---

### 🔄 **Bulk Tag Operations**

#### **Bulk Create/Assign Tags**
**URL**: `POST /api/v1/tags/bulk`

**Authentication**: ✅ Required (JWT token)

**Operations Supported**:

**1. Create Multiple Tags**
```json
{
  "operation": "create_multiple",
  "data": [
    {
      "user_id": "user123",
      "tag_name": "Leadership",
      "tag_color": "#3B82F6"
    },
    {
      "user_id": "user456",
      "tag_name": "Assessment",
      "tag_color": "#10B981"
    }
  ]
}
```

**2. Assign Tags to Multiple Users**
```json
{
  "operation": "assign_to_users",
  "data": {
    "tag_names": ["Leadership", "Assessment"],
    "user_ids": ["user123", "user456", "user789"],
    "tag_color": "#6366F1"
  }
}
```

**3. Remove Tags from Users**
```json
{
  "operation": "remove_from_users",
  "data": {
    "tag_names": ["Leadership"],
    "user_ids": ["user123", "user456"]
  }
}
```

**Features**:
- ✅ **Batch Processing**: Handle multiple operations efficiently
- ✅ **Duplicate Prevention**: Skips existing tag combinations
- ✅ **Smart Assignment**: Bulk assign tags to multiple users at once

---

#### **Bulk Delete Tags**
**URL**: `DELETE /api/v1/tags/bulk`

**Authentication**: ✅ Required (JWT token)

**Payload**:
```json
{
  "tag_ids": ["tag123", "tag456", "tag789"]
}
```

**Purpose**: Delete multiple tags in a single operation

**Response Format**:
```json
{
  "success": true,
  "message": "3 tags deleted successfully",
  "deletedCount": 3
}
```

---

### 🏷️ **Tag System Features**

#### **Database Schema**:
- **tag_id**: Unique identifier (UUID)
- **user_id**: Links to users.id (employee association)
- **company_id**: Company scoping for multi-tenant security
- **tag_name**: Tag display name
- **tag_color**: Hex color for UI display
- **created_at**: Timestamp of creation
- **created_by**: ID of user who created the tag

#### **Key Features**:
- ✅ **Multi-tenant Security**: All operations scoped to user's company
- ✅ **User Association**: Tags linked to specific users via user_id
- ✅ **Color Coding**: Visual categorization with customizable colors
- ✅ **Duplicate Prevention**: No duplicate tag names per user
- ✅ **Efficient Indexing**: Optimized database queries with compound indexes
- ✅ **Bulk Operations**: Support for large-scale tag management
- ✅ **Audit Trail**: Tracks who created each tag

#### **Use Cases**:
- Employee skill tagging and categorization
- Performance assessment labels
- Training status indicators
- Role-based classifications
- Custom organizational labels
- HR analytics and reporting

---

## 📊 **API Usage Summary**

### **Most Used Endpoints**:
1. `POST /api/v1/admin/verify-password` - Used by 8 admin pages
2. `POST /api/v1/add-user` - Used by 4 different creation flows
3. `GET /api/v1/users` - Used by admin dashboard and department creation
4. `GET /api/v1/users/department-stats` - Analytics endpoint for organizational statistics
5. `GET /api/v1/tags` - Tags management and filtering
6. `GET /api/v1/users/with-tags` - Users with associated tags
7. Authentication endpoints - Used across multiple pages

### **Authentication Patterns**:
- **Admin Protection**: 8 pages use `PasswordProtection` component
- **User Protection**: 4 pages use `ProtectedRoute` wrapper
- **JWT Tokens**: Used for authenticated API requests
- **CSRF Protection**: Implemented on auth forms

### **File Upload Integration**:
- **OpenAI Assistant Management**: 2 pages handle file uploads
- **Vector Database**: Automatic integration with OpenAI's retrieval system
- **Progress Tracking**: Real-time upload progress

### **Real-time Features**:
- **Token Counting**: Live calculation on company onboarding
- **Dynamic Loading**: User lists based on company selection
- **Form Validation**: Client-side and server-side validation

### **Usage Logging System**:
- **Purpose**: Controls Voxerion access based on company status progression
- **API Endpoint**: `POST /api/v1/usage-logs`
- **Integration Points**:
  - **Account Creation**: Status `6233-832932-1313` (agent-org-creation)
  - **Onboarding Completion**: Status `6123-98712312-8923` (onboarding-company)
  - **Department Creation**: Status `8290-90232442-0233` (admin/departments/create)
  - **User Creation**: Status `6723-09823413-0002` (admin/users/create)
- **Features**: Automatic logging, company filtering, chronological tracking

---

## 🔄 **Update History**

- **2025-07-01**: Added department statistics and tags management endpoints
  - New endpoint: `GET /api/v1/users/department-stats`
  - Added `reports_to` field to User model for leader identification
  - **Tags Management System**: Complete CRUD API for employee tagging
    - `GET/POST /api/v1/tags` - Basic tag operations
    - `GET/PUT/DELETE /api/v1/tags/[id]` - Individual tag management
    - `GET /api/v1/users/with-tags` - Users with associated tags
    - `POST/DELETE /api/v1/tags/bulk` - Bulk tag operations
  - Created Tag model with user_id linking to users.id
  - Updated total unique API endpoints to 23
  - Enhanced analytics and employee management capabilities

- **2025-06-17**: Initial comprehensive documentation created
  - Analyzed 20 frontend pages
  - Documented 17 unique API endpoints
  - Covered all authentication and data management flows
  - Identified mock data that needs real API integration