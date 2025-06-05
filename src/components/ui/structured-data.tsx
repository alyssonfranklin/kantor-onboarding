'use client';

import { getBaseUrl } from '@/lib/environment';
import Script from 'next/script';

type OrganizationProps = {
  name: string;
  logo?: string;
  url?: string;
  description?: string;
  socialProfiles?: string[];
};

type WebsiteProps = {
  name: string;
  url?: string;
  description?: string;
  language?: string;
};

type BreadcrumbItem = {
  name: string;
  item: string;
};

type BreadcrumbListProps = {
  items: BreadcrumbItem[];
};

/**
 * Generates structured data for an organization
 */
export function OrganizationStructuredData({
  name,
  logo,
  url,
  description,
  socialProfiles,
}: OrganizationProps) {
  const baseUrl = getBaseUrl();
  const logoUrl = logo ? `${baseUrl}${logo}` : `${baseUrl}/images/logo.png`;
  const websiteUrl = url || baseUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: websiteUrl,
    logo: logoUrl,
    ...(description && { description }),
    ...(socialProfiles && {
      sameAs: socialProfiles,
    }),
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Generates structured data for a website
 */
export function WebsiteStructuredData({
  name,
  url,
  description,
  language = 'en-US',
}: WebsiteProps) {
  const baseUrl = url || getBaseUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: baseUrl,
    ...(description && { description }),
    inLanguage: language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Generates breadcrumb structured data
 */
export function BreadcrumbStructuredData({ items }: BreadcrumbListProps) {
  const baseUrl = getBaseUrl();

  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.item.startsWith('http') ? item.item : `${baseUrl}${item.item}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Component that provides all structured data
 */
export function StructuredData() {
  return (
    <>
      <WebsiteStructuredData
        name="Voxerion"
        description="Business productivity platform for modern teams"
      />
      <OrganizationStructuredData
        name="Voxerion"
        description="Productivity and collaboration platform for modern businesses"
        socialProfiles={[
          'https://twitter.com/voxerion',
          'https://linkedin.com/company/voxerion',
        ]}
      />
    </>
  );
}