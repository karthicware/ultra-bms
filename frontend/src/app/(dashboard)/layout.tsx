'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { SessionExpiryWarning } from '@/components/auth/session-expiry-warning';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SessionExpiryWarning />
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto p-6">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
}
