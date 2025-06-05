# Environment Configuration Guide

This document explains the environment configuration system for the Kantor onboarding application, including how to set up different environments, required environment variables, and deployment considerations.

## Table of Contents

1. [Overview](#overview)
2. [Environment Files](#environment-files)
3. [Environment Variables](#environment-variables)
4. [Development Setup](#development-setup)
5. [Deployment Environments](#deployment-environments)
6. [Domain Transition](#domain-transition)
7. [API Configuration](#api-configuration)

## Overview

The application uses a robust environment configuration system that supports multiple deployment environments (development, QA, production) and facilitates a smooth transition from development domains to the production domain (app.voxerion.com).

Key features:
- Type-safe environment variable access
- Validation to catch missing variables early
- Consistent API URL handling across environments
- Cross-domain support for authentication
- Relative path usage when appropriate

## Environment Files

The application uses the following environment files:

- `.env`: Base environment variables for all environments
- `.env.development`: Development-specific variables (for `npm run dev`)
- `.env.production`: Production-specific variables (for production builds)
- `.env.local`: Local overrides (not committed to git)
- `.env.testing`: Variables for testing environment

Files are loaded in the following order of precedence (highest to lowest):
1. `.env.local`
2. `.env.{environment}` (e.g., `.env.development` or `.env.production`)
3. `.env`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | The base URL for the application | `https://kantor-onboarding.vercel.app` |
| `NEXT_PUBLIC_API_URL` | The base URL for API requests | `https://kantor-onboarding.vercel.app/api/v1` |
| `NEXT_PUBLIC_ENV` | The current environment | `development`, `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` |
| `JWT_EXPIRY` | Expiry time for JWT tokens | `7d` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_COOKIE_DOMAIN` | Domain for cookies | `.voxerion.com` in production, `undefined` in development |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `false` |
| `LOG_LEVEL` | Logging level | `info` |

## Development Setup

### Local Development

1. Clone the repository
2. Copy `.env.local.example` to `.env.local`
3. Update variables in `.env.local` with your development values
4. Run `npm install`
5. Run `npm run dev`

The application will use the combined environment from `.env.local`, `.env.development`, and `.env`.

### Environment Validation

The application validates required environment variables at startup using `src/lib/environment.ts`. If any required variables are missing, the application will:
- In development: Show a warning in the console
- In production: Log an error and may prevent startup

## Deployment Environments

### Development (kantor-onboarding.vercel.app)

- Used for development and testing
- Uses `.env.development` variables
- Authentication cookies are set without a specific domain

### Production (app.voxerion.com)

- Production environment
- Uses `.env.production` variables
- Authentication cookies are set with domain `.voxerion.com`
- API requests use the production API URL

### QA/Staging

- For pre-production testing
- Uses `.env.qa` variables
- Similar configuration to production but with QA-specific endpoints

## Domain Transition

The application is designed to transition smoothly from `kantor-onboarding.vercel.app` to `app.voxerion.com` with minimal changes:

1. **URL Configuration**: Uses environment variables for all URLs
2. **API Endpoints**: API client automatically uses correct base URL
3. **Cookies**: Set with appropriate domain based on environment
4. **Assets**: Use relative paths where possible

To transition to the production domain:
1. Update `NEXT_PUBLIC_BASE_URL` in `.env.production`
2. Set `NEXT_PUBLIC_COOKIE_DOMAIN=.voxerion.com` in `.env.production`
3. Deploy to the production environment

## API Configuration

The API client (`src/lib/api-client.ts`) automatically:
- Uses the correct base URL from environment variables
- Adds appropriate authentication headers
- Handles CSRF protection
- Uses relative paths when possible for better cross-domain support

### Usage Examples

```typescript
// Get the current environment
import { getEnv } from '@/lib/environment';
const env = getEnv();

// Get the base URL
import { getBaseUrl } from '@/lib/environment';
const baseUrl = getBaseUrl();

// Make an API request
import { apiClient } from '@/lib/api-client';
const response = await apiClient.get('/users/me');
```

## Configuration Files

Key configuration files:

- `src/lib/environment.ts`: Environment detection and validation
- `src/lib/api-client.ts`: API client configuration
- `next.config.ts`: Next.js configuration
- `vercel.json`: Vercel deployment configuration
- `middleware.ts`: API routing and CORS configuration

## Troubleshooting

### Common Issues

**Environment variables not loading**
- Check that you've created the correct `.env` files
- Restart the development server after changing environment files
- In Vercel, check the Environment Variables section in project settings

**API endpoints not working**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check for CORS issues in browser console
- Ensure API routes are correctly configured in `src/app/api`

**Authentication problems across domains**
- Verify cookie domain settings in `src/lib/auth/constants.ts`
- Check that CSRF protection is properly configured
- Ensure cookies are being set with the correct domain