'use client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log('[DASHBOARD LAYOUT] Simple layout rendering');
  return <div>{children}</div>;
}
