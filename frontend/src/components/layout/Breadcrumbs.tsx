'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  leads: 'Leads',
  'leads-quotes': 'Leads & Quotes',
  quotations: 'Quotations',
  settings: 'Settings',
  security: 'Security',
  units: 'Units',
  'property-manager': 'Property Manager',
  vendors: 'Vendors',
  'work-orders': 'Work Orders',
  'pm-schedules': 'PM Schedules',
  unassigned: 'Unassigned',
  'expiring-documents': 'Expiring Documents',
  ranking: 'Ranking',
  compare: 'Compare',
  tenant: 'Tenant Portal',
  requests: 'Requests',
  profile: 'Profile',
  create: 'Create',
  new: 'New',
  edit: 'Edit',
};

function formatSegment(segment: string): string {
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }
  // Check if it's a dynamic segment (UUID or number)
  if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
    return 'Details';
  }
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on root dashboard
  if (pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items with accumulated paths
  const breadcrumbItems = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;

    return { segment, path, label, isLast };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="size-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map(({ segment, path, label, isLast }) => (
          <span key={path} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={path}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
