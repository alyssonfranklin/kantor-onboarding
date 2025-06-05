import { getBaseUrl } from "./environment";

/**
 * Generates an absolute URL for an image path
 * 
 * @param {string} imagePath - Relative path to the image
 * @param {boolean} addImagePrefix - Whether to add /images/ prefix automatically
 * @returns {string} Absolute URL to the image
 */
export function getImageUrl(imagePath: string, addImagePrefix = true): string {
  const baseUrl = getBaseUrl();
  
  // Clean the image path
  let path = imagePath;
  
  // Add /images/ prefix if needed and not already present
  if (addImagePrefix && !path.startsWith('/images/')) {
    path = `/images/${path.startsWith('/') ? path.substring(1) : path}`;
  }
  
  // Ensure path starts with a slash
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  
  return `${baseUrl}${path}`;
}

/**
 * Generates a dynamic Open Graph image URL with query parameters
 * for pages that need dynamically generated images
 * 
 * @param {Object} params - Parameters to pass to the OG image generator
 * @param {string} params.title - Title to display on the image
 * @param {string} params.description - Description to display on the image
 * @param {string} params.template - Template to use (default: 'default')
 * @returns {string} URL to the generated OG image
 */
export function getDynamicOgImageUrl({
  title,
  description,
  template = 'default'
}: {
  title: string;
  description?: string;
  template?: string;
}): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  
  params.append('title', title);
  if (description) params.append('description', description);
  params.append('template', template);
  
  return `${baseUrl}/api/og?${params.toString()}`;
}

/**
 * Asset file types for web apps
 */
export enum AssetType {
  Icon = 'icon',
  Apple = 'apple',
  Android = 'android',
  Favicon = 'favicon',
  Social = 'social'
}

/**
 * Get all required image paths for a specific asset type
 * 
 * @param {AssetType} type - Type of asset
 * @returns {string[]} Array of image paths
 */
export function getAssetPaths(type: AssetType): string[] {
  switch (type) {
    case AssetType.Icon:
      return [
        '/favicon.ico',
        '/images/favicon-16x16.png',
        '/images/favicon-32x32.png'
      ];
    case AssetType.Apple:
      return [
        '/images/apple-touch-icon.png'
      ];
    case AssetType.Android:
      return [
        '/images/android-chrome-192x192.png',
        '/images/android-chrome-512x512.png'
      ];
    case AssetType.Favicon:
      return [
        '/favicon.ico',
        '/images/favicon-16x16.png',
        '/images/favicon-32x32.png',
        '/images/apple-touch-icon.png',
        '/images/android-chrome-192x192.png',
        '/images/android-chrome-512x512.png',
        '/images/safari-pinned-tab.svg'
      ];
    case AssetType.Social:
      return [
        '/images/og-image.png',
        '/images/twitter-image.png'
      ];
    default:
      return [];
  }
}