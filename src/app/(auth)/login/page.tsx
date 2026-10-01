// FILE: src/app/(auth)/login/page.tsx
// STAGE: 5
// UPDATED: 2026-10-01
import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/rbac';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const user = await getAuthUser();
  if (user) redirect('/inspection');
  return <LoginForm />;
}
// Note: Handled by server side redirect if already logged in.
