# Deployment Guide for MongoDB Implementation

## What's Done

1. JSON file storage (lowdb) has been replaced with MongoDB
2. MongoDB connection with connection pooling for Next.js
3. Mongoose models for all entities with proper schema validation
4. Authentication using JWT with token tracking in MongoDB
5. API routes updated to use MongoDB, including:
   - User login/verification
   - User and company creation
   - Department API endpoints
   - Employee API endpoints
6. ESLint and TypeScript configuration updated
7. Proper error handling for database operations

## Deployment Requirements

### Environment Variables

Create a `.env.local` file on Vercel (or in your production environment) with these variables:

```
# MongoDB Configuration (required)
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority

# JWT Configuration (required)
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRY=7d

# OpenAI Configuration (if using assistants)
OPENAI_API_KEY=your_openai_api_key

# Application URL (for CORS and callbacks)
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### MongoDB Setup

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (free tier is fine for development)
3. Create a database user with read/write permissions
4. Whitelist your IP or set it to allow connections from anywhere (0.0.0.0/0)
5. Get your connection string from the Atlas dashboard
6. Replace the placeholder values in the connection string with your actual username and password

### Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Set the environment variables in the Vercel dashboard
3. Deploy with the "Production" environment selected

## Troubleshooting

- **Database Connection Issues**: If you're having trouble connecting to MongoDB, check that your connection string is correct and that your IP is whitelisted in MongoDB Atlas.
- **API Routes Return 500**: Check the server logs for error messages. Most likely the MongoDB connection is failing.
- **JWT Authentication Fails**: Make sure your JWT_SECRET is properly set and consistent across deployments.

## API Usage

See the `README.md` file for complete API documentation and usage examples.