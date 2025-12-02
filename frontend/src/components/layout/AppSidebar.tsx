'use client';

import type { ComponentType } from 'react';
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
  ChevronRight,
  CreditCard,
  CalendarClock,
  Package,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePermission, useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { getMyProfile } from '@/services/user-profile.service';
import { getUserInitials, getDisplayNameOrFullName } from '@/types/user-profile';
import Logo from '@/assets/svg/logo';

type MenuSubItem = {
  label: string;
  href: string;
  badge?: string;
  permission?: string;
  role?: string;
};

type MenuItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  permission?: string;
  role?: string;
} & (
  | {
      href: string;
      badge?: string;
      items?: never;
    }
  | { href?: never; badge?: never; items: MenuSubItem[] }
);

type MenuSection = {
  groupLabel?: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    items: [
      {
        icon: LayoutDashboard,
        label: 'Dashboards',
        items: [
          { label: 'Executive Summary', href: '/dashboard' },
          { label: 'Occupancy', href: '/dashboard/occupancy' },
          { label: 'Maintenance', href: '/maintenance/dashboard' },
          { label: 'Vendors', href: '/vendors/dashboard' },
          { label: 'Finance', href: '/finance/dashboard' },
          { label: 'Assets', href: '/assets/dashboard' },
        ],
      },
    ],
  },
  {
    groupLabel: 'Main',
    items: [
      {
        icon: UserPlus,
        label: 'Leads & Quotes',
        href: '/leads',
        permission: 'leads:read',
      },
      {
        icon: Building2,
        label: 'Properties',
        href: '/properties',
        permission: 'properties:read',
      },
      {
        icon: Users,
        label: 'Tenants',
        permission: 'tenants:read',
        items: [
          { label: 'All Tenants', href: '/tenants', permission: 'tenants:read' },
          { label: 'Checkouts', href: '/checkouts', permission: 'tenants:read' },
          { label: 'Lease Extensions', href: '/leases/extensions', permission: 'tenants:read' },
        ],
      },
      {
        icon: Car,
        label: 'Parking Spots',
        href: '/parking-spots',
        permission: 'properties:read',
      },
      {
        icon: Wrench,
        label: 'Work Orders',
        href: '/property-manager/work-orders',
        permission: 'work-orders:read',
      },
      {
        icon: Truck,
        label: 'Vendors',
        href: '/property-manager/vendors',
        permission: 'vendor:read',
      },
      {
        icon: CalendarClock,
        label: 'PM Schedules',
        href: '/property-manager/pm-schedules',
        permission: 'work-orders:read',
      },
      {
        icon: Package,
        label: 'Assets',
        href: '/assets',
        permission: 'properties:read',
      },
      {
        icon: ShieldCheck,
        label: 'Compliance',
        href: '/property-manager/compliance',
        permission: 'properties:read',
      },
    ],
  },
  {
    groupLabel: 'Finance',
    items: [
      {
        icon: Receipt,
        label: 'Invoices',
        href: '/invoices',
        permission: 'invoices:read',
      },
      {
        icon: CreditCard,
        label: 'PDC',
        href: '/pdc',
        permission: 'pdc:read',
      },
      {
        icon: DollarSign,
        label: 'Expenses',
        href: '/expenses',
        permission: 'expenses:read',
      },
      {
        icon: Landmark,
        label: 'Bank Accounts',
        href: '/settings/bank-accounts',
        role: 'ADMIN',
      },
    ],
  },
  {
    groupLabel: 'Documents',
    items: [
      {
        icon: FileText,
        label: 'Reports',
        href: '/reports',
        permission: 'reports:read',
      },
    ],
  },
  {
    groupLabel: 'Admin',
    items: [
      {
        icon: UserCog,
        label: 'User Management',
        href: '/settings/users',
        permission: 'users:read',
      },
      {
        icon: Megaphone,
        label: 'Announcements',
        href: '/announcements',
        role: 'ADMIN',
      },
      {
        icon: Settings,
        label: 'Settings',
        items: [
          { label: 'Profile Settings', href: '/settings/profile' },
          { label: 'General Preferences', href: '/settings' },
        ],
      },
    ],
  },
];

function SidebarGroupedMenuItems({
  data,
  groupLabel,
  hasPermission,
  hasRole,
  pathname,
}: {
  data: MenuItem[];
  groupLabel?: string;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  pathname: string;
}) {
  const isItemActive = (href: string): boolean => {
    if (href === '/settings') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const filteredItems = data.filter((item) => {
    if (item.role && !hasRole(item.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  if (filteredItems.length === 0) return null;

  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) =>
            item.items ? (
              <Collapsible className="group/collapsible" key={item.label}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.label} className="truncate">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items
                        .filter((subItem) => {
                          if (subItem.role && !hasRole(subItem.role)) return false;
                          if (subItem.permission && !hasPermission(subItem.permission)) return false;
                          return true;
                        })
                        .map((subItem) => (
                          <SidebarMenuSubItem key={subItem.label}>
                            <SidebarMenuSubButton
                              className="justify-between"
                              asChild
                              isActive={isItemActive(subItem.href)}
                            >
                              <Link href={subItem.href}>
                                {subItem.label}
                                {subItem.badge && (
                                  <span className="bg-primary/10 flex h-5 min-w-5 items-center justify-center rounded-full text-xs">
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  tooltip={item.label}
                  asChild
                  isActive={isItemActive(item.href)}
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge className="bg-primary/10 rounded-full">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { hasPermission, hasRole } = usePermission();
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading || !isAuthenticated || !user || user.role === 'TENANT') return;

      try {
        const profile = await getMyProfile();
        setAvatarUrl(profile.avatarUrl);
        setDisplayName(profile.displayName);
      } catch (error) {
        console.debug('Could not fetch user profile for avatar:', error);
      }
    };

    fetchProfile();
  }, [user, authLoading, isAuthenticated]);

  return (
    <Sidebar collapsible="icon" className="[&_[data-slot=sidebar-inner]]:bg-muted !border-r-0" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2.5 !bg-transparent [&>svg]:size-8" asChild>
              <Link href="/dashboard">
                <Logo className="[&_rect]:fill-muted [&_rect:first-child]:fill-primary" />
                <span className="text-xl font-semibold">Ultra BMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, idx) => (
          <SidebarGroupedMenuItems
            key={idx}
            data={section.items}
            groupLabel={section.groupLabel}
            hasPermission={hasPermission}
            hasRole={hasRole}
            pathname={pathname}
          />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                    <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-medium">
                      {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
