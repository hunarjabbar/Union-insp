// FILE: src/app/(dashboard)/users/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requireRole } from '@/lib/rbac';
import { listUsers } from '@/actions/users';
import { listStations } from '@/actions/stations';
import { UsersPageClient } from '@/components/user/UsersPageClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requireRole(user, ['SUPER_ADMIN']);
  } catch {
    redirect('/unauthorized');
  }

  const [usersRes, stationsRes] = await Promise.all([
    listUsers(),
    listStations(),
  ]);

  const users = usersRes.ok ? usersRes.data : [];
  const stations = stationsRes.ok ? stationsRes.data : [];

  return (
    <UsersPageClient users={users as any} stations={stations} />
  );
}
