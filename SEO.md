# SEO and Metadata Configuration Guide

This document explains the SEO and metadata configuration for the Voxerion application.

## Overview

The application uses Next.js metadata API for SEO optimization, providing proper metadata for search engines, social media sharing, and mobile devices. The implementation is environment-aware, ensuring that URLs adapt correctly when deployed to different environments, including the production domain at `app.voxerion.com`.

## Key Files

- **`src/app/layout.tsx`**: Root layout with global metadata configuration
- **`src/lib/metadata-utils.ts`**: Utility functions for generating page-specific metadata
- **`src/lib/environment.ts`**: Environment-aware URL generation utilities
- **`src/app/robots.ts`**: Dynamic robots.txt generation
- **`src/app/sitemap.ts`**: Dynamic sitemap.xml generation
- **`public/site.webmanifest`**: Web app manifest for PWA capabilities
- **`public/images/`**: Directory containing SEO-related images

## Metadata Components

### Base Metadata

Root-level metadata is defined in `src/app/layout.tsx` and includes:

- Title and description
- Viewport settings
- Robots directives
- Canonical URLs
- Open Graph metadata
- Twitter card metadata
- Icons and favicons
- Web app manifest
- Theme colors

### Dynamic Page Metadata

Each page can define its own metadata using the `generateMetadata` utility function:

```typescript
// src/app/[page]/metadata.ts
import { generateMetadata } from "@/lib/metadata-utils";

export default function metadata() {
  return generateMetadata({
    title: "Page Title | Voxerion",
    description: "Page description for SEO",
    path: "path/to/page",
    keywords: ["keyword1", "keyword2"],
    ogImagePath: "/images/custom-og-image.png", // Optional
  });
}
```

### Environment-Aware URLs

All URLs in metadata are generated dynamically based on the current environment:

- Development: `http://localhost:3000`
- Production: `https://app.voxerion.com`

This ensures that canonical URLs, Open Graph URLs, and image paths are always correct regardless of the deployment environment.

## Image Requirements

The SEO configuration requires the following images:

- **favicon.ico**: Main favicon
- **favicon-16x16.png**: Small favicon
- **favicon-32x32.png**: Medium favicon
- **apple-touch-icon.png**: Apple touch icon (180x180)
- **android-chrome-192x192.png**: Android Chrome icon (192x192)
- **android-chrome-512x512.png**: Android Chrome icon (512x512)
- **safari-pinned-tab.svg**: SVG mask icon for Safari
- **og-image.png**: Open Graph image (1200x630)
- **twitter-image.png**: Twitter card image (1200x600)

Place all these images in the `/public/images/` directory.

## Robots.txt and Sitemap

The application generates dynamic `robots.txt` and `sitemap.xml` files:

- **robots.txt**: Controls search engine crawling
- **sitemap.xml**: Provides search engines with a map of all important pages

These files use the environment utilities to ensure URLs are correct for the current deployment.

## Web App Manifest

The `site.webmanifest` file provides information for Progressive Web App functionality:

- App name and description
- Icons
- Theme colors
- Display settings
- Shortcut links

## Verification

To verify your SEO configuration:

1. Use the Google Search Console's URL inspection tool
2. Check Open Graph metadata with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
3. Validate Twitter cards with the [Twitter Card Validator](https://cards-dev.twitter.com/validator)
4. Test your PWA setup with [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Best Practices

- Keep titles under 60 characters
- Keep descriptions between 140-160 characters
- Use proper hierarchy for heading tags (h1, h2, etc.)
- Ensure image alt text is descriptive
- Regularly update the sitemap when adding new pages
- Set appropriate robots directives for private/admin pages