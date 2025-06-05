import { Metadata } from "next";
import { getAbsoluteUrl, getBaseUrl } from "./environment";
import { getDynamicOgImageUrl } from "./image-utils";

/**
 * Generates metadata for a specific page
 * 
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title 
 * @param {string} options.description - Page description
 * @param {string} options.path - Page path (without leading slash)
 * @param {string} options.ogImagePath - Path to OG image (defaults to dynamic OG image)
 * @param {string[]} options.keywords - Additional keywords for this page
 * @param {boolean} options.useDynamicOg - Whether to use dynamic OG image generation
 * @param {string} options.ogTemplate - Template to use for dynamic OG image
 * @return {Metadata} The page metadata
 */
export function generateMetadata({
  title,
  description,
  path = "",
  ogImagePath,
  keywords = [],
  useDynamicOg = true,
  ogTemplate = "default",
}: {
  title: string;
  description: string;
  path?: string;
  ogImagePath?: string;
  keywords?: string[];
  useDynamicOg?: boolean;
  ogTemplate?: string;
}): Metadata {
  const baseUrl = getBaseUrl();
  const url = getAbsoluteUrl(path);
  
  // Determine OG image URL
  let ogImageUrl: string;
  
  if (useDynamicOg) {
    // Use dynamic OG image generator
    ogImageUrl = getDynamicOgImageUrl({
      title,
      description,
      template: ogTemplate
    });
  } else {
    // Use static OG image
    ogImageUrl = `${baseUrl}${ogImagePath || "/images/og-image.png"}`;
  }
  
  return {
    title,
    description,
    keywords: [
      "voxerion",
      "productivity",
      "business",
      "teams",
      "collaboration",
      ...keywords,
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200, 
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Generate SEO-friendly page title
 * 
 * @param {string} title - Page title
 * @param {string} suffix - Optional suffix to append
 * @returns {string} Formatted page title
 */
export function formatPageTitle(title: string, suffix = "Voxerion"): string {
  if (!title) return suffix;
  if (title.includes(suffix)) return title;
  return `${title} | ${suffix}`;
}