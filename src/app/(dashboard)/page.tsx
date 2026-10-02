// FILE: src/app/(dashboard)/page.tsx
// STAGE: 7
// UPDATED: 2026-10-02
import { getAuthUser } from '@/lib/rbac';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  const displayName =
    (user as { fullName?: string; email: string }).fullName ||
    user.email.split('@')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {displayName}
        </h1>
        <p className="text-muted-foreground">
          Inspection operations overview and real-time station metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inspections Today
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active shifts in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue Today
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 IQD</div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected fees (cash & electronic)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pass Rate (30d)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Compliance benchmark threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Minutes per standard inspection
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
