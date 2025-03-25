# Voxerion API

A REST API with JSON storage for the Voxerion application, built with Node.js, Express, and lowdb.

## Features

- JSON file-based database using lowdb
- JWT authentication
- Five data models: users, companies, departments, employees, and accessTokens
- RESTful API endpoints with proper validation
- CORS enabled for secure access from Google Apps Script
- Error handling and logging
- Environment variable configuration

## Tech Stack

- Node.js & TypeScript
- Express.js
- lowdb for JSON storage
- JWT for authentication
- bcrypt for password hashing
- Winston for logging
- Zod for validation
- Helmet for security
- CORS for cross-origin access

## Project Structure

This project includes both a Next.js frontend and the new REST API:

- `/src/app` - Next.js frontend 
- `/src/server` - Express REST API with JSON storage
- `/src/components` - Frontend React components
- `/src/lib` - Shared utility functions

## API Endpoints

### Authentication

- **POST /api/auth/login** - User login
- **POST /api/auth/logout** - User logout
- **GET /api/auth/verify** - Verify JWT token

### Users

- **POST /api/users** - Create a new user
- **GET /api/users/company/:companyId** - Get all users by company
- **GET /api/users/:id** - Get user by ID
- **PUT /api/users/:id** - Update user
- **DELETE /api/users/:id** - Delete user

### Companies

- **POST /api/companies** - Create a new company
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

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

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

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_key
   JWT_EXPIRY=7d

   # Database Configuration
   DB_PATH=./data

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,https://script.google.com

   # Log Configuration
   LOG_LEVEL=info
   ```

### Running the Application

#### Frontend (Next.js)
```
npm run dev
```

#### API Server (Express)
```
npm run server:dev
```

#### Production
```
npm run build
npm start         # Run Next.js frontend
npm run server    # Run Express API
```

### Database Structure

The JSON database is stored in `./data/db.json` (configurable via environment variables) and follows this structure:

```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "company_id": "company-id",
      "role": "user",
      "created_at": "2023-01-01T00:00:00.000Z",
      "department": "Department Name",
      "company_role": "Employee",
      "password": "hashed-password"
    }
  ],
  "companies": [
    {
      "company_id": "company-id",
      "name": "Company Name",
      "assistant_id": "assistant-id",
      "status": "active",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  ],
  "accessTokens": [
    {
      "token": "jwt-token",
      "user_id": "user-id",
      "expires_at": "2023-01-08T00:00:00.000Z"
    }
  ],
  "departments": [
    {
      "company_id": "company-id",
      "department_name": "Department Name",
      "department_desc": "Department Description",
      "user_head": "user-id"
    }
  ],
  "employees": [
    {
      "employee_id": "employee-id",
      "employee_name": "Employee Name",
      "employee_role": "Role",
      "employee_leader": "leader-user-id",
      "company_id": "company-id"
    }
  ]
}
```

## Google Apps Script Integration

To update your Google Apps Script code to connect to this API:

```javascript
function authenticate(email, password) {
  const apiUrl = 'https://your-api-domain.com/api/auth/login';
  
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

- The API uses JWT for authentication
- Passwords are hashed using bcrypt
- HTTPS should be enabled in production
- Input validation is performed using Zod
- Rate limiting is implemented for sensitive endpoints
- Helmet is used to set secure HTTP headers

## Deployment

This application can be deployed on Vercel, Heroku, or any other platform that supports Node.js applications.

### Next.js Frontend

The frontend can be deployed on Vercel:

```
vercel
```

### Express API

The API can be deployed separately on a platform like Heroku:

```
heroku create
git push heroku main
```

## License

MIT
