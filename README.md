# Voxerion API

A REST API with MongoDB storage for the Voxerion application, built with Next.js API routes and Mongoose.

## Features

- MongoDB Atlas database with Mongoose
- JWT authentication with token tracking
- Five data models: users, companies, departments, employees, and tokens
- RESTful API endpoints with proper validation
- Connection pooling for MongoDB with Next.js
- Error handling and logging
- Environment variable configuration

## Tech Stack

- Next.js 15 with API routes
- TypeScript
- MongoDB Atlas
- Mongoose for MongoDB object modeling
- JWT for authentication
- bcrypt for password hashing
- Custom ID generation
- TailwindCSS for frontend styling

## Project Structure

This project includes both a Next.js frontend and REST API:

- `/src/app` - Next.js pages and app router structure
- `/src/app/api` - Next.js API routes
- `/src/components` - Frontend React components
- `/src/lib` - Shared utility functions
- `/src/lib/mongodb` - MongoDB connection and models

## API Endpoints

### Authentication

- **POST /api/verify-password** - User login
- **POST /api/logout** - User logout (invalidates token)

### Users and Companies

- **POST /api/add-user** - Create a new user and company
- **GET /api/users/company/:companyId** - Get all users by company
- **GET /api/users/:id** - Get user by ID
- **PUT /api/users/:id** - Update user
- **DELETE /api/users/:id** - Delete user

### Companies

- **GET /api/companies** - Get all companies
- **GET /api/companies/:id** - Get company by ID
- **PUT /api/companies/:id** - Update company
- **DELETE /api/companies/:id** - Delete company

### Departments

- **POST /api/departments** - Create a new department
- **GET /api/departments/company/:companyId** - Get departments by company
- **GET /api/departments/:companyId/:departmentName** - Get department by company ID and name
- **PUT /api/departments/:companyId/:departmentName** - Update department
- **DELETE /api/departments/:companyId/:departmentName** - Delete department

### Employees

- **POST /api/employees** - Create a new employee
- **GET /api/employees/company/:companyId** - Get employees by company
- **GET /api/employees/leader/:leaderId** - Get employees by leader
- **GET /api/employees/:id** - Get employee by ID
- **PUT /api/employees/:id** - Update employee
- **DELETE /api/employees/:id** - Delete employee

## MongoDB Models

### User Model

```typescript
{
  id: string;                 // Custom format: USER_xxxx
  email: string;              // Unique identifier
  password: string;           // Bcrypt hashed
  name?: string;              // Optional user name
  company_id: string;         // Reference to company
  role: string;               // User role (admin, user)
  created_at: Date;           // Creation timestamp
  department?: string;        // Optional department name
  company_role?: string;      // Role within company
}
```

### Company Model

```typescript
{
  company_id: string;         // Custom format: COMP_xxxx
  name: string;               // Company name
  assistant_id?: string;      // OpenAI assistant ID if applicable
  status: string;             // Company status (active, inactive)
  created_at: Date;           // Creation timestamp
  updated_at: Date;           // Last update timestamp
}
```

### Department Model

```typescript
{
  company_id: string;         // Reference to company
  department_name: string;    // Department name (unique within company)
  department_desc?: string;   // Optional description
  user_head?: string;         // Optional department head (user ID)
}
```

### Employee Model

```typescript
{
  employee_id: string;        // Custom format: EMP_xxxx
  employee_name: string;      // Employee name
  employee_role?: string;     // Optional role within company
  employee_leader?: string;   // Optional manager/leader (user ID)
  company_id: string;         // Reference to company
}
```

### Token Model

```typescript
{
  token: string;              // JWT token
  user_id: string;            // Reference to user
  expires_at: Date;           // Expiration timestamp with TTL index
}
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/voxerion-api.git
   cd voxerion-api
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # MongoDB Configuration (required)
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority

   # JWT Configuration (required)
   JWT_SECRET=your_secure_jwt_secret_key
   JWT_EXPIRY=7d

   # OpenAI Configuration (if using assistants)
   OPENAI_API_KEY=your_openai_api_key

   # Application URL (for CORS and callbacks)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Running the Application

```
npm run dev
```

This will start the Next.js application with both frontend and API endpoints on the same port (default 3000).

### Vercel Deployment

This application is designed to be deployed on Vercel:

```
vercel
```

Make sure to set up your environment variables in the Vercel dashboard.

## Google Apps Script Integration

To update your Google Apps Script code to connect to this API:

```javascript
function authenticate(email, password) {
  const apiUrl = 'https://your-api-domain.com/api/verify-password';
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({
      email: email,
      password: password
    })
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.success && responseData.token) {
      return responseData.token;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

function fetchDataFromApi(endpoint, token) {
  const apiUrl = `https://your-api-domain.com/api/${endpoint}`;
  
  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}
```

## Security Considerations

- The API uses JWT for authentication with token tracking
- Tokens are stored in MongoDB with TTL indexes for automatic expiration
- Passwords are hashed using bcrypt with Mongoose pre-save hooks
- HTTPS is enforced in production
- Input validation is performed on all endpoints
- Connection pooling is used to prevent MongoDB connection leaks
- Environment variables are used for all sensitive configuration

## License

MIT