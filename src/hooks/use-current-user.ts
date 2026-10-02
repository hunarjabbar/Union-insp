// FILE: src/hooks/use-current-user.ts
// STAGE: 7
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import type { AuthUser } from '@/lib/rbac';

export function useCurrentUser() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Failed to fetch user session');
        }
        const data = await res.json();
        if (mounted) {
          setUser(data.user ?? null);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading, error };
}
