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
  Settings,
  LogOut,
  Truck,
  UserCog,
  Receipt,
  DollarSign,
  Car,
  Landmark,
  ChevronRight,
  CreditCard,
  CalendarClock,
  Package,
  Megaphone,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ChevronsUpDown,
  BadgeCheck,
  Bell,
  HelpCircle,
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
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
          { label: 'Financial', href: '/finance/dashboard' },
          { label: 'Maintenance', href: '/maintenance/dashboard' },
          { label: 'Vendors', href: '/vendors/dashboard' },
          { label: 'Assets', href: '/assets/dashboard' },
        ],
      },
    ],
  },
  {
    groupLabel: 'Portfolio',
    items: [
      {
        icon: Building2,
        label: 'Properties',
        href: '/properties',
        permission: 'properties:read',
      },
      {
        icon: Car,
        label: 'Parking Spots',
        href: '/parking-spots',
        permission: 'properties:read',
      },
      {
        icon: Package,
        label: 'Assets',
        href: '/assets',
        permission: 'properties:read',
      },
    ],
  },
  {
    groupLabel: 'Leasing',
    items: [
      {
        icon: UserPlus,
        label: 'Leads & Quotes',
        href: '/leads',
        permission: 'leads:read',
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
    ],
  },
  {
    groupLabel: 'Maintenance',
    items: [
      {
        icon: Wrench,
        label: 'Work Orders',
        href: '/property-manager/work-orders',
        permission: 'work-orders:read',
      },
      {
        icon: CalendarClock,
        label: 'PM Schedules',
        href: '/property-manager/pm-schedules',
        permission: 'work-orders:read',
      },
      {
        icon: Truck,
        label: 'Vendors',
        href: '/property-manager/vendors',
        permission: 'vendor:read',
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
        label: 'PDC Management',
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
        // Visible to users with finance access (backend restricts to SUPER_ADMIN, ADMIN, FINANCE_MANAGER)
      },
    ],
  },
  {
    groupLabel: 'Administration',
    items: [
      {
        icon: BarChart3,
        label: 'Reports',
        href: '/reports',
        permission: 'reports:read',
      },
      {
        icon: Megaphone,
        label: 'Announcements',
        href: '/announcements',
        role: 'ADMIN',
      },
      {
        icon: UserCog,
        label: 'User Management',
        href: '/settings/users',
        permission: 'users:read',
      },
      {
        icon: Settings,
        label: 'Settings',
        items: [
          { label: 'Profile Settings', href: '/settings/profile' },
          { label: 'System Preferences', href: '/settings' },
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
      {groupLabel && (
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-3">
          {groupLabel}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) =>
            item.items ? (
              <Collapsible
                className="group/collapsible"
                key={item.label}
                defaultOpen={item.label === 'Dashboards'}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.label}
                      className="truncate group/menu-button hover:bg-primary/5 transition-colors rounded-lg mx-1"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover/menu-button:bg-primary/10 transition-colors">
                        <item.icon className="size-4 text-muted-foreground group-hover/menu-button:text-primary transition-colors" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                      <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 border-l border-border/50 pl-3">
                      {item.items
                        .filter((subItem) => {
                          if (subItem.role && !hasRole(subItem.role)) return false;
                          if (subItem.permission && !hasPermission(subItem.permission)) return false;
                          return true;
                        })
                        .map((subItem) => (
                          <SidebarMenuSubItem key={subItem.label}>
                            <SidebarMenuSubButton
                              className={`justify-between rounded-lg transition-all hover:bg-primary/5 ${
                                isItemActive(subItem.href)
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : ''
                              }`}
                              asChild
                              isActive={isItemActive(subItem.href)}
                            >
                              <Link href={subItem.href}>
                                <span className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    isItemActive(subItem.href) ? 'bg-primary' : 'bg-muted-foreground/30'
                                  }`} />
                                  {subItem.label}
                                </span>
                                {subItem.badge && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                                    {subItem.badge}
                                  </Badge>
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
                  className={`group/menu-button hover:bg-primary/5 transition-colors rounded-lg mx-1 ${
                    isItemActive(item.href) ? 'bg-primary/10' : ''
                  }`}
                >
                  <Link href={item.href}>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                      isItemActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 group-hover/menu-button:bg-primary/10'
                    }`}>
                      <item.icon className={`size-4 transition-colors ${
                        isItemActive(item.href)
                          ? ''
                          : 'text-muted-foreground group-hover/menu-button:text-primary'
                      }`} />
                    </div>
                    <span className={`font-medium ${isItemActive(item.href) ? 'text-primary' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                      {item.badge}
                    </Badge>
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

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'PROPERTY_MANAGER':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return 'User';
    return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <Sidebar
      collapsible="icon"
      className="!border-r-0 [&_[data-slot=sidebar-inner]]:bg-muted"
      {...props}
    >
      {/* Header with Logo */}
      <SidebarHeader className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-3 !bg-transparent hover:!bg-primary/5 transition-colors rounded-xl group"
              asChild
            >
              <Link href="/dashboard">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                  <Logo className="h-6 w-6 [&_rect]:fill-primary-foreground [&_line]:stroke-primary-foreground [&_path]:stroke-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight">Ultra BMS</span>
                  <span className="text-xs text-muted-foreground">Property Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-2 py-4">
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

      {/* Footer with User Profile */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-primary/5 hover:bg-primary/5 rounded-xl transition-colors w-full"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 rounded-xl border-2 border-border/50 shadow-sm">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                        {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl p-2"
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-2 py-3 text-left">
                    <div className="relative">
                      <Avatar className="h-12 w-12 rounded-xl border-2 border-border/50">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 font-semibold">
                          {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                    </div>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold text-base">
                        {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">{user?.email}</span>
                      <Badge variant="outline" className={`mt-1.5 w-fit text-xs ${getRoleBadgeColor(user?.role)}`}>
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        {formatRole(user?.role)}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/settings/profile" className="flex items-center gap-3 px-2 py-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">My Profile</span>
                        <span className="text-xs text-muted-foreground">View and edit profile</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/settings" className="flex items-center gap-3 px-2 py-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Settings</span>
                        <span className="text-xs text-muted-foreground">Manage preferences</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="#" className="flex items-center gap-3 px-2 py-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Notifications</span>
                        <span className="text-xs text-muted-foreground">Configure alerts</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="#" className="flex items-center gap-3 px-2 py-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Help & Support</span>
                        <span className="text-xs text-muted-foreground">Get assistance</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                  onClick={() => logout()}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-destructive/10">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Sign out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
