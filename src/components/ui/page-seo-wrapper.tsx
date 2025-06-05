'use client';

import { CanonicalUrl } from './canonical-url';
import { Breadcrumbs } from './breadcrumbs';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type PageSEOWrapperProps = {
  children: ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  canonicalPath?: string;
  breadcrumbItems?: Array<{ name: string; href: string }>;
  className?: string;
};

/**
 * PageSEOWrapper applies SEO enhancing elements to a page
 * including canonical URLs and breadcrumbs
 */
export function PageSEOWrapper({
  children,
  showBreadcrumbs = true,
  canonicalPath,
  breadcrumbItems,
  className = '',
}: PageSEOWrapperProps) {
  const pathname = usePathname();
  
  return (
    <div className={className}>
      {/* Add canonical URL */}
      <CanonicalUrl path={canonicalPath} />
      
      {/* Add breadcrumbs if needed */}
      {showBreadcrumbs && (
        <div className="mb-6">
          <Breadcrumbs 
            items={breadcrumbItems}
            className="text-gray-500"
          />
        </div>
      )}
      
      {/* Page content */}
      {children}
    </div>
  );
}