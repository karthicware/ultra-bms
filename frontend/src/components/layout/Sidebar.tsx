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
  ChevronDown,
  ChevronRight,
  CreditCard,
  CalendarClock,
  Package,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePermission, useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { getMyProfile } from '@/services/user-profile.service';
import { getUserInitials, getDisplayNameOrFullName } from '@/types/user-profile';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string;
  children?: NavItem[];
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
        children: [
          {
            name: 'All Tenants',
            href: '/tenants',
            icon: Users,
            permission: 'tenants:read',
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
        ],
      },
      {
        name: 'Parking Spots',
        href: '/parking-spots',
        icon: Car,
        permission: 'properties:read',
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
      {
        name: 'PM Schedules',
        href: '/property-manager/pm-schedules',
        icon: CalendarClock,
        permission: 'work-orders:read',
      },
      {
        name: 'Assets',
        href: '/assets',
        icon: Package,
        permission: 'properties:read',
      },
      {
        name: 'Compliance',
        href: '/property-manager/compliance',
        icon: ShieldCheck,
        permission: 'properties:read',
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
        name: 'PDC',
        href: '/pdc',
        icon: CreditCard,
        permission: 'pdc:read',
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
        name: 'Announcements',
        href: '/announcements',
        icon: Megaphone,
        role: 'ADMIN',
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
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Fetch user profile for avatar and display name (Story 2.9)
  useEffect(() => {
    const fetchProfile = async () => {
      // Only fetch for authenticated staff users (not tenants) after auth is fully loaded
      if (authLoading || !isAuthenticated || !user || user.role === 'TENANT') return;

      try {
        const profile = await getMyProfile();
        setAvatarUrl(profile.avatarUrl);
        setDisplayName(profile.displayName);
      } catch (error) {
        // Silently fail - will show initials fallback
        console.debug('Could not fetch user profile for avatar:', error);
      }
    };

    fetchProfile();
  }, [user, authLoading, isAuthenticated]);

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => {
        if (item.role && !hasRole(item.role)) return false;
        if (item.permission && !hasPermission(item.permission)) return false;
        return true;
      })
      .map((item) => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
      }));
  };

  const isItemActive = (item: NavItem): boolean => {
    // Exact match only for /settings to prevent parent highlighting when on child routes
    if (item.href === '/settings') {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => isItemActive(child));
  };

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  // Auto-expand items with active children
  const isExpanded = (item: NavItem): boolean => {
    return expandedItems.includes(item.href) || isChildActive(item);
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const active = isItemActive(item);
    const expanded = hasChildren && isExpanded(item);

    if (hasChildren) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleExpand(item.href)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isChildActive(item)
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1 text-left">{item.name}</span>
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expanded && (
            <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
              {item.children!.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          isChild && 'text-sm'
        )}
      >
        <Icon className={cn('h-5 w-5', isChild && 'h-4 w-4')} />
        {item.name}
      </Link>
    );
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
                  {filteredItems.map((item) => renderNavItem(item))}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile Section - Story 2.9: Avatar Integration */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9" data-testid="sidebar-user-avatar">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile photo" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-sm font-medium">
              {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
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
