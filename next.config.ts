import type { NextConfig } from "next";

/**
 * Next.js Configuration
 * 
 * This configuration file includes environment detection, custom domain handling,
 * and optimization settings for Next.js.
 */

// Determine the current environment
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';

// Deployment URLs
const prodDomain = 'app.voxerion.com';
const prodUrl = `https://${prodDomain}`;
const devUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  // Environment variables that should be available at runtime (frontend)
  env: {
    NEXT_PUBLIC_APP_URL: isProduction ? prodUrl : devUrl,
    NEXT_PUBLIC_API_URL: `${isProduction ? prodUrl : devUrl}/api`,
    NEXT_PUBLIC_ASSETS_URL: isProduction ? prodUrl : devUrl,
  },
  
  // Configure rewrites for API proxying if needed
  async rewrites() {
    return [
      // Example: Proxy API requests to a backend server in development
      // {
      //   source: '/api/:path*',
      //   destination: `${process.env.API_URL || 'http://localhost:4000'}/api/:path*`,
      // },
    ];
  },
  
  // Configure redirects for custom domain handling
  async redirects() {
    return [
      // Redirect www to non-www in production
      isProduction ? {
        source: '/from-www/:path*',
        destination: `https://${prodDomain}/:path*`,
        permanent: true,
      } : null,
    ].filter(Boolean) as any[];
  },
  
  // Asset optimization
  images: {
    domains: ['localhost', prodDomain],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Build optimization
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Error handling during builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: isProduction,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: isProduction,
  },
  
  // Optional: Configure webpack
  webpack: (config, { dev, isServer }) => {
    // Custom webpack configurations can be added here
    return config;
  },
};

export default nextConfig;