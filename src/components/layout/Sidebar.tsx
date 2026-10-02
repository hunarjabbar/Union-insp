// FILE: src/components/layout/Sidebar.tsx
// STAGE: 7
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Truck,
  Building2,
  Route,
  Wrench,
  DollarSign,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Users,
  Landmark,
  Printer,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PERMISSION_MATRIX, type AuthUser } from '@/lib/rbac';
import { RoleBadge } from '@/components/layout/RoleBadge';
import { Role } from '@prisma/client';

export interface SidebarProps {
  user: AuthUser;
}

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/inspection',
      icon: Activity,
      roles: PERMISSION_MATRIX.inspection?.read ?? [],
    },
    {
      title: 'Vehicles',
      href: '/vehicles',
      icon: Truck,
      roles: PERMISSION_MATRIX.vehicle?.read ?? [],
    },
    {
      title: 'Stations',
      href: '/stations',
      icon: Building2,
      roles: PERMISSION_MATRIX.station?.read ?? [],
    },
    {
      title: 'Lanes',
      href: '/lanes',
      icon: Route,
      roles: PERMISSION_MATRIX.lane?.read ?? [],
    },
    {
      title: 'Equipment',
      href: '/equipment',
      icon: Wrench,
      roles: PERMISSION_MATRIX.equipment?.read ?? [],
    },
    {
      title: 'Financial',
      href: '/financial',
      icon: DollarSign,
      roles: PERMISSION_MATRIX.financial?.read ?? [],
    },
    {
      title: 'Payments',
      href: '/financial/payments',
      icon: CreditCard,
      roles: PERMISSION_MATRIX.payment?.read ?? [],
    },
    {
      title: 'Audit',
      href: '/audit',
      icon: ShieldCheck,
      roles: PERMISSION_MATRIX.auditLog?.read ?? [],
    },
    {
      title: 'NCRs',
      href: '/audit/ncr',
      icon: AlertTriangle,
      roles: PERMISSION_MATRIX.ncr?.read ?? [],
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      roles: PERMISSION_MATRIX.user?.read ?? [],
    },
    {
      title: 'Syndicate',
      href: '/syndicate',
      icon: Landmark,
      roles: [
        'SUPER_ADMIN',
        'SYNDICATE_REPRESENTATIVE',
        'COMPLIANCE_AUDITOR',
      ] as Role[],
    },
    {
      title: 'Printers',
      href: '/settings/printers',
      icon: Printer,
      roles: PERMISSION_MATRIX.printer?.read ?? [],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: [
        'SUPER_ADMIN',
        'STATION_MANAGER',
        'LEAD_INSPECTOR',
        'COMPLIANCE_AUDITOR',
        'SYNDICATE_REPRESENTATIVE',
        'INSPECTION_TECHNICIAN',
        'CASHIER',
      ] as Role[],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => user.role === 'SUPER_ADMIN' || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r bg-card flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-6 border-b">
          <Link href="/inspection" className="flex flex-col space-y-0.5">
            <span className="font-bold tracking-tight text-base text-foreground">
              UNION INSPECTION
            </span>
            <span className="text-xs text-muted-foreground font-medium" dir="rtl">
              یونیەن ئینسپێکشن
            </span>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/inspection' &&
                pathname.startsWith(item.href) &&
                pathname.charAt(item.href.length) === '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t bg-card/50 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Signed in as:</span>
          <RoleBadge role={user.role} />
        </div>
        <div className="truncate text-xs font-medium text-foreground">
          {user.email}
        </div>
      </div>
    </aside>
  );
}
