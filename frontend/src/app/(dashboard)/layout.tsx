'use client';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SessionExpiryWarning } from '@/components/auth/session-expiry-warning';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="bg-muted flex min-h-dvh w-full">
        <SidebarProvider>
          <SessionExpiryWarning />
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="size-full flex-1 px-4 py-6 sm:px-6">
              <Card className="min-h-[calc(100vh-11rem)]">
                <CardContent className="h-full p-6">
                  {children}
                </CardContent>
              </Card>
            </main>
            <Footer />
          </div>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}
