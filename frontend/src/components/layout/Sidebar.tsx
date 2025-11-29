'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  UserPlus,
  FileText,
  Settings,
  LogOut,
  Truck,
  UserCog,
  LogOut as LogOutIcon,
  Receipt,
  DollarSign,
  RefreshCw,
  Car,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePermission, useAuth } from '@/contexts/auth-context';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Main',
    items: [
      {
        name: 'Leads & Quotes',
        href: '/leads',
        icon: UserPlus,
        permission: 'leads:read',
      },
      {
        name: 'Properties',
        href: '/properties',
        icon: Building2,
        permission: 'properties:read',
      },
      {
        name: 'Tenants',
        href: '/tenants',
        icon: Users,
        permission: 'tenants:read',
      },
      {
        name: 'Parking Spots',
        href: '/parking-spots',
        icon: Car,
        permission: 'properties:read',
      },
      {
        name: 'Checkouts',
        href: '/checkouts',
        icon: LogOutIcon,
        permission: 'tenants:read',
      },
      {
        name: 'Lease Extensions',
        href: '/leases/extensions',
        icon: RefreshCw,
        permission: 'tenants:read',
      },
      {
        name: 'Work Orders',
        href: '/property-manager/work-orders',
        icon: Wrench,
        permission: 'work-orders:read',
      },
      {
        name: 'Vendors',
        href: '/property-manager/vendors',
        icon: Truck,
        permission: 'vendor:read',
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        name: 'Invoices',
        href: '/invoices',
        icon: Receipt,
        permission: 'invoices:read',
      },
      {
        name: 'Expenses',
        href: '/expenses',
        icon: DollarSign,
        permission: 'expenses:read',
      },
      {
        name: 'Bank Accounts',
        href: '/settings/bank-accounts',
        icon: Landmark,
        role: 'ADMIN',
      },
    ],
  },
  {
    title: 'Documents',
    items: [
      {
        name: 'Reports',
        href: '/reports',
        icon: FileText,
        permission: 'reports:read',
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        name: 'User Management',
        href: '/settings/users',
        icon: UserCog,
        permission: 'users:read',
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        // No role restriction - all authenticated users can access settings (Story 2.7 AC#11)
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, hasRole } = usePermission();
  const { user, logout } = useAuth();

  const filterItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.role && !hasRole(item.role)) return false;
      if (item.permission && !hasPermission(item.permission)) return false;
      return true;
    });
  };

  return (
    <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-background">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Ultra BMS</h1>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {navigationSections.map((section, sectionIdx) => {
            const filteredItems = filterItems(section.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={sectionIdx}>
                {section.title && (
                  <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h2>
                )}
                <div className="flex flex-col gap-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {user?.role && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
                {user.role}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
