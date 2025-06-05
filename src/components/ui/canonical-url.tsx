'use client';

import { getAbsoluteUrl } from '@/lib/environment';
import Head from 'next/head';
import { usePathname } from 'next/navigation';

/**
 * CanonicalUrl component to dynamically set the canonical URL based on the current path
 * This is essential for SEO when a site can be accessed from multiple URLs
 * 
 * @param {Object} props - Component props
 * @param {string} props.path - Optional override path (without leading slash)
 */
export function CanonicalUrl({ path }: { path?: string }) {
  const pathname = usePathname();
  const canonicalPath = path || pathname || '';
  
  // Remove any trailing slashes except for the root path
  const normalizedPath = canonicalPath === '/' 
    ? '' 
    : canonicalPath.replace(/\/+$/, '');
  
  // Generate the full canonical URL
  const canonicalUrl = getAbsoluteUrl(normalizedPath);

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

/**
 * AlternateLanguageLinks component to add hreflang tags for multi-language support
 * 
 * @param {Object} props - Component props
 * @param {Record<string, string>} props.languages - Map of language codes to relative paths
 * @param {string} props.defaultLanguage - The default language code
 */
export function AlternateLanguageLinks({ 
  languages,
  defaultLanguage = 'en'
}: { 
  languages: Record<string, string>,
  defaultLanguage?: string 
}) {
  return (
    <Head>
      {Object.entries(languages).map(([lang, path]) => (
        <link 
          key={lang}
          rel="alternate" 
          hrefLang={lang} 
          href={getAbsoluteUrl(path)} 
        />
      ))}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={getAbsoluteUrl(languages[defaultLanguage] || '')} 
      />
    </Head>
  );
}