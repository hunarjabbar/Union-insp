// FILE: src/app/(dashboard)/layout.tsx
// STAGE: 7
// UPDATED: 2026-10-02
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/rbac';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}
