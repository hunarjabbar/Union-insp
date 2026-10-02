// FILE: src/components/user/UsersPageClient.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserTable, type UserRow } from './UserTable';
import { UserForm } from './UserForm';
import { UserPlus } from 'lucide-react';
import type { Station } from '@prisma/client';

export interface UsersPageClientProps {
  users: UserRow[];
  stations: Station[];
}

export function UsersPageClient({ users, stations }: UsersPageClientProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Personnel & Access Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage station managers, lead inspectors, syndicates, and lane technician credentials.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 h-9">
              <UserPlus className="h-4 w-4" /> New Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Personnel</DialogTitle>
            </DialogHeader>
            <UserForm stations={stations} onClose={() => setOpen(false)} mode="create" />
          </DialogContent>
        </Dialog>
      </div>

      <UserTable rows={users} />
    </div>
  );
}
