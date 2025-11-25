'use client';

/**
 * Dashboard Page
 * Main landing page after login
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Users, FileText, Settings, Building2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const dashboardCards = [
    {
      title: 'Leads',
      description: 'Manage potential tenant leads and track conversion',
      icon: Users,
      href: '/leads',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      testId: 'card-leads',
    },
    {
      title: 'Quotations',
      description: 'Create and manage quotations for leads',
      icon: FileText,
      href: '/quotations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      testId: 'card-quotations',
    },
    {
      title: 'Leads & Quotes',
      description: 'Combined view of leads with their quotations',
      icon: Building2,
      href: '/leads-quotes',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      testId: 'card-leads-quotes',
    },
    {
      title: 'Settings',
      description: 'Manage your account and preferences',
      icon: Settings,
      href: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      testId: 'card-settings',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your business today
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(card.href)}
              data-testid={card.testId}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(card.href);
                  }}
                >
                  Go to {card.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats - Placeholder for future implementation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
