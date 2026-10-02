// FILE: src/components/layout/Topbar.tsx
// STAGE: 7
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/layout/RoleBadge';
import { PrinterStatusIndicator } from '@/components/layout/PrinterStatusIndicator';
import type { AuthUser } from '@/lib/rbac';

export interface TopbarProps {
  user: AuthUser;
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg) => {
    return seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  });

  const initials = user.email.slice(0, 2).toUpperCase();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/inspection" className="hover:text-foreground transition-colors">
          Home
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'hover:text-foreground transition-colors'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <PrinterStatusIndicator />

        <div className="hidden sm:block">
          <RoleBadge role={user.role} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                  {user.email.split('@')[0]}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/settings/security"
                className="flex items-center gap-2 cursor-pointer w-full"
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Security Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
