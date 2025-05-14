# Deployment Guide

This document explains how to configure and deploy the application to different environments, including local development, staging, and production on app.voxerion.com.

## Environment Configuration System

The project uses a robust environment configuration system that supports multiple deployment targets while maintaining type safety and validation.

### Environment Files

The application uses the following environment files:

- `.env.local.example` - Template for local environment variables (copy to `.env.local`)
- `.env.development` - Development environment defaults
- `.env.test` - Testing environment configuration
- `.env.production` - Production environment configuration

**Important**: Never commit sensitive values in these files. Set them as environment variables in your deployment platform.

### Environment Variables

Key environment variables used in the application:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development`, `test`, `production` |
| `PORT` | Server port | `3000` |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application | `https://app.voxerion.com` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | `https://app.voxerion.com` |
| `NEXT_PUBLIC_API_URL` | API endpoint URL | `https://app.voxerion.com/api` |
| `NEXT_PUBLIC_ASSETS_URL` | URL for static assets | `https://app.voxerion.com` |
| `JWT_SECRET` | Secret for JWT authentication | `your_secure_jwt_secret_key` |
| `JWT_EXPIRY` | JWT token expiration | `7d` |
| `JWT_REFRESH_EXPIRY` | JWT refresh token expiration | `30d` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://app.voxerion.com,https://www.google.com` |
| `OPENAI_API_KEY` | OpenAI API key (if using assistants) | `your_openai_api_key` |

### Environment Utility

The application uses a centralized environment utility at `src/lib/environment.ts` that provides:

- Type-safe access to environment variables
- Validation using Zod
- Environment detection functions
- URL generation utilities

Usage example:

```typescript
import env, { getApiUrl, isProduction } from '../lib/environment';

// Check current environment
if (isProduction()) {
  // Do production-specific logic
}

// Generate API URLs
const userApiUrl = getApiUrl() + '/users';

// Access typed environment variables
const port = env.PORT;
const jwtSecret = env.JWT_SECRET;
```

## API Client Configuration

The application includes a centralized API client at `src/lib/api-client.ts` that:

- Uses the correct environment-specific URLs
- Handles authentication
- Provides consistent error handling
- Supports type safety for requests and responses

Usage example:

```typescript
import apiClient from '../lib/api-client';

// GET request
const users = await apiClient.get('/users', { token: userToken });

// POST request
const newUser = await apiClient.post('/users', { name: 'John', email: 'john@example.com' }, { token: adminToken });
```

## MongoDB Setup

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (free tier is fine for development)
3. Create a database user with read/write permissions
4. Whitelist your IP or set it to allow connections from anywhere (0.0.0.0/0)
5. Get your connection string from the Atlas dashboard
6. Replace the placeholder values in the connection string with your actual username and password

## Deployment Process

### Local Development

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and set your local variables
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

### Production Deployment (Vercel)

1. Push your code to your Git repository
2. Connect your repository to Vercel
3. Configure the following environment variables in Vercel:
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_APP_URL`: `https://app.voxerion.com`
   - `NEXT_PUBLIC_BASE_URL`: `https://app.voxerion.com`
   - `NEXT_PUBLIC_API_URL`: `https://app.voxerion.com/api`
   - `NEXT_PUBLIC_ASSETS_URL`: `https://app.voxerion.com`
   - `MONGODB_URI`: Your production MongoDB connection string
   - `JWT_SECRET`: Your production secret key
   - `JWT_EXPIRY`: `7d`
   - `JWT_REFRESH_EXPIRY`: `30d`
   - `ALLOWED_ORIGINS`: Your allowed origins
   - `OPENAI_API_KEY`: Your OpenAI API key (if using assistants)
4. Deploy using the Vercel dashboard or CLI

### Domain Configuration

The application is configured to run on `app.voxerion.com`. To set this up:

1. Add the domain in your Vercel project settings
2. Configure your DNS provider to point to Vercel
3. Verify the domain in Vercel

The configuration includes redirects from `www.app.voxerion.com` to `app.voxerion.com`.

## Color System Configuration

The application uses a custom color palette defined in `tailwind.config.ts`:

- Primary colors (orange/red): `#E64A19` (main brand color)
- Secondary colors (purple): `#6B21A8`
- Gray scale: From `#F9FAFB` to `#030712`
- Success colors (green): `#10B981`
- Warning colors (amber): `#F59E0B`
- Error colors (red): `#EF4444`

These colors are available as CSS classes (e.g., `bg-primary-500`, `text-error-600`) and as semantic aliases for shadcn/ui components.

## Troubleshooting

### Common Deployment Issues

1. **Environment variables missing**: Check that all required environment variables are set in your deployment platform.
2. **API calls failing**: Verify your `NEXT_PUBLIC_API_URL` is correctly set and matches your actual API endpoint.
3. **CORS errors**: Ensure your `ALLOWED_ORIGINS` includes all necessary domains.
4. **MongoDB connection issues**: Verify your `MONGODB_URI` is correct and the database is accessible from your deployment environment. Also, check that your IP is whitelisted in MongoDB Atlas.
5. **JWT Authentication Fails**: Make sure your JWT_SECRET is properly set and consistent across deployments.

For more detailed troubleshooting, check the application logs in your deployment platform.