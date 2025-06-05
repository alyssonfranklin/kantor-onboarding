# Authentication System Guide

This guide explains how to use the new authentication system with cross-domain support for app.voxerion.com.

## Overview

The authentication system provides:

1. Secure cookie-based authentication that works across domains
2. JWT token management with automatic refresh
3. Protection against CSRF attacks
4. Session synchronization across tabs
5. React hooks and components for easy integration
6. Password reset functionality with time-limited tokens

## Getting Started

### 1. SessionProvider

The SessionProvider is already configured in the root layout (`src/app/layout.tsx`). This provides authentication state to all components.

```tsx
// This is already set up in the root layout
import SessionProvider from "@/lib/auth";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 2. Authentication Hooks

Use these hooks in your components to access authentication functionality:

#### useAuth

```tsx
import { useAuth } from "@/lib/auth";

function MyComponent() {
  const { user, isAuthenticated, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome, {user?.name || user?.email}!</div>;
}
```

#### useLogin

```tsx
import { useLogin } from "@/lib/auth";

function LoginComponent() {
  const { login, loginInProgress } = useLogin();
  
  const handleLogin = async () => {
    try {
      await login(email, password, rememberMe);
      // Success, user will be redirected
    } catch (err) {
      // Handle error (already handled by the hook)
    }
  };
  
  return <button onClick={handleLogin} disabled={loginInProgress}>Login</button>;
}
```

#### useLogout

```tsx
import { useLogout } from "@/lib/auth";

function LogoutComponent() {
  const { logout, logoutInProgress } = useLogout();
  
  return (
    <button 
      onClick={() => logout()}
      disabled={logoutInProgress}
    >
      Logout
    </button>
  );
}
```

### 3. Pre-built Components

Several pre-built components are available:

#### LoginForm

```tsx
import { LoginForm } from "@/components/auth";

function LoginPage() {
  return <LoginForm />;
}
```

#### LogoutButton

```tsx
import { LogoutButton } from "@/components/auth";

function NavBar() {
  return <LogoutButton redirectTo="/login" />;
}
```

#### ProtectedRoute

```tsx
import { ProtectedRoute } from "@/components/auth";

function SecurePage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}

// With role restriction
function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
      <div>Admin-only content</div>
    </ProtectedRoute>
  );
}
```

## API Routes

The authentication system provides several API routes:

### Authentication

- **POST /api/v1/auth/login** - Authenticate a user
- **POST /api/v1/auth/logout** - Log out a user
- **GET /api/v1/auth/validate** - Validate current session
- **POST /api/v1/auth/refresh** - Refresh authentication token
- **GET /api/v1/auth/csrf** - Get a CSRF token for forms

### Password Reset

- **POST /api/v1/auth/reset-password/request** - Request a password reset email
- **GET /api/v1/auth/reset-password/verify** - Verify a password reset token
- **POST /api/v1/auth/reset-password/confirm** - Reset password with a valid token

## CSRF Protection

For mutating requests (POST, PUT, DELETE), use CSRF protection:

```tsx
import { clientCsrf } from "@/lib/auth";

// In forms
<form>
  {clientCsrf.hiddenField()}
  {/* form fields */}
</form>

// In fetch requests
const headers = clientCsrf.addToHeaders({
  'Content-Type': 'application/json'
});

fetch('/api/v1/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data)
});
```

## Password Reset Flow

The password reset system uses time-limited tokens (5 minutes) and follows this flow:

1. User requests a password reset on the `/forgot-password` page
2. System generates a unique token linked to the user's email
3. A reset link is sent to the user's email (in production)
4. User clicks the link which takes them to `/reset-password?token=xyz`
5. System verifies the token is valid and not expired
6. User enters a new password
7. System updates the password and invalidates the token

### Password Reset Token Utilities

For custom implementations, you can use these utilities:

```tsx
import { 
  generateResetToken, 
  verifyResetToken, 
  createResetUrl 
} from "@/lib/auth";

// Generate a token for a user
const token = generateResetToken(userId, userEmail);

// Create a reset URL
const resetUrl = createResetUrl(token);

// Verify a token
const decodedToken = verifyResetToken(token);
if (decodedToken) {
  // Token is valid, get user info
  const { id, email } = decodedToken;
}
```

## Cookie Domains

Cookies are configured to work with:

- In production: `.voxerion.com` (works for all subdomains)
- In development: `localhost`

This ensures seamless authentication across `app.voxerion.com` and any other subdomains.

## Session Expiration

Sessions will automatically:
- Refresh tokens when 70% of their lifetime has passed
- Synchronize logout across tabs
- Detect inactivity and log out after 30 minutes of inactivity

## Security Features

- Cookies use HttpOnly, Secure, and SameSite flags
- JWTs are validated on both client and server
- CSRF protection for all mutating requests
- Separate refresh and auth tokens
- Domain-specific cookie configuration
- Time-limited password reset tokens (5 minutes)

## Environment Variables

The authentication system looks for these environment variables:

```
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d  # 7 days
JWT_REFRESH_EXPIRY=30d  # 30 days
```

Default values are provided if these are not set.