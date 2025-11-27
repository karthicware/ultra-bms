'use client';

/**
 * Settings Page
 * Main settings landing page with links to different settings sections
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Bell, Palette } from 'lucide-react';

const settingsSections = [
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
    description: 'Configure your notification preferences',
    href: '/settings/notifications',
    icon: Bell,
    comingSoon: true,
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of the application',
    href: '/settings/appearance',
    icon: Palette,
    comingSoon: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
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
