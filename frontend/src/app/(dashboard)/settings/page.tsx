'use client';

/**
 * Settings Page
 * Main settings landing page with links to different settings sections
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Bell, Palette, Building2 } from 'lucide-react';
import { usePermission } from '@/contexts/auth-context';

interface SettingsSection {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
  requiresRole?: string[];
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Security',
    description: 'Manage your password and active sessions',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Profile',
    description: 'Update your personal information',
    href: '/settings/profile',
    icon: User,
    comingSoon: true,
  },
  {
    title: 'Notifications',
    description: 'Manage email notification settings and view logs',
    href: '/settings/notifications',
    icon: Bell,
    requiresRole: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of the application',
    href: '/settings/appearance',
    icon: Palette,
  },
  {
    title: 'Company Profile',
    description: 'Manage company information for invoices and documents',
    href: '/settings/company',
    icon: Building2,
    requiresRole: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'PROPERTY_MANAGER'],
  },
];

export default function SettingsPage() {
  const { hasRole } = usePermission();

  // Filter sections based on role requirements
  const visibleSections = settingsSections.filter((section) => {
    if (!section.requiresRole) return true;
    return section.requiresRole.some((role) => hasRole(role));
  });

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleSections.map((section) => {
          const Icon = section.icon;

          if (section.comingSoon) {
            return (
              <Card key={section.title} className="opacity-60 cursor-not-allowed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {section.title}
                    <span className="ml-auto text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          }

          return (
            <Link key={section.title} href={section.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
