'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BreadcrumbStructuredData } from './structured-data';

type BreadcrumbItem = {
  name: string;
  href: string;
};

type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
  homeLabel?: string;
  className?: string;
  separator?: React.ReactNode;
  showStructuredData?: boolean;
};

/**
 * Breadcrumbs component that supports both manual and automatic breadcrumb generation
 * Also adds structured data for SEO
 */
export function Breadcrumbs({
  items,
  homeLabel = 'Home',
  className = '',
  separator = '/',
  showStructuredData = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Generate breadcrumbs automatically if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname, homeLabel);
  
  // Format for structured data
  const structuredDataItems = breadcrumbs.map(item => ({
    name: item.name,
    item: item.href,
  }));

  return (
    <>
      {showStructuredData && <BreadcrumbStructuredData items={structuredDataItems} />}
      
      <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
        <ol className="flex flex-wrap items-center space-x-2">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-400" aria-hidden="true">
                    {separator}
                  </span>
                )}
                
                {isLast ? (
                  <span aria-current="page" className="font-medium">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-primary-500 hover:text-primary-600 transition"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Generate breadcrumbs from a path
 */
function generateBreadcrumbs(path: string, homeLabel: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { name: homeLabel, href: '/' },
  ];

  let currentPath = '';
  segments.forEach(segment => {
    currentPath += `/${segment}`;
    
    // Create a formatted label from the segment
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      name: label,
      href: currentPath,
    });
  });

  return breadcrumbs;
}