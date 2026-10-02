// FILE: src/app/(dashboard)/settings/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Printer, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure security, hardware peripheral bindings, and supervisor registries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Security Preferences Card */}
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/settings/security">
            <CardHeader className="pb-3 flex flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold leading-none hover:underline">Security Settings</CardTitle>
                <CardDescription className="text-xs">
                  MFA tokens, auth sessions, audit codes, and passwords.
                </CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        {/* Printer peripherals Card */}
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/settings/printers">
            <CardHeader className="pb-3 flex flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600">
                <Printer className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold leading-none hover:underline">Printers & Peripherals</CardTitle>
                <CardDescription className="text-xs">
                  POS WebUSB printers, paper widths, and lane indicators.
                </CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        {/* Personnel Registry (SUPER_ADMIN only) */}
        {isSuperAdmin && (
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <Link href="/users">
              <CardHeader className="pb-3 flex flex-row items-start gap-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold leading-none hover:underline">Personnel Directory</CardTitle>
                  <CardDescription className="text-xs">
                    Command access lists, role escalations, and suspensions.
                  </CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
