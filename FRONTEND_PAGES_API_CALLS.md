# Frontend Pages API Calls Documentation

This document provides a comprehensive analysis of all frontend pages and their API calls in the Kantor Onboarding application.

## Summary

**Total Pages Analyzed**: 20  
**Pages with API Calls**: 14  
**Pages without API Calls**: 6  
**Total Unique API Endpoints**: 17  
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
  - `GET /api/v1/departments` - List all departments with populated user names
  - `GET /api/v1/employees` - List all employees
- **When**: Tab switching in dashboard
- **Purpose**: Display entity data in tables
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Special Features**: 
  - Departments endpoint populates `department_lead_name` with actual user names
  - Preserves `department_lead_id` for editing purposes

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
    "department_desc": "department_description",
    "user_head": "selected_user_id"
  }
  ```

#### **Features**:
- ✅ Dynamic company loading
- ✅ User filtering by company
- ✅ Department head assignment
- ✅ Real-time form validation
- ✅ Loading states for all dropdowns

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

## 📊 **API Usage Summary**

### **Most Used Endpoints**:
1. `POST /api/v1/admin/verify-password` - Used by 8 admin pages
2. `POST /api/v1/add-user` - Used by 4 different creation flows
3. `GET /api/v1/users` - Used by admin dashboard and department creation
4. Authentication endpoints - Used across multiple pages

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

---

## 🔄 **Update History**

- **2025-06-17**: Initial comprehensive documentation created
  - Analyzed 20 frontend pages
  - Documented 17 unique API endpoints
  - Covered all authentication and data management flows
  - Identified mock data that needs real API integration