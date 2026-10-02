// FILE: src/components/equipment/EquipmentPageClient.tsx
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
import { EquipmentTable, type EquipmentRow } from './EquipmentTable';
import { EquipmentForm } from './EquipmentForm';
import { Plus, LayoutGrid, CalendarRange } from 'lucide-react';
import Link from 'next/link';
import type { Station, Lane } from '@prisma/client';

export interface EquipmentPageClientProps {
  equipment: EquipmentRow[];
  stations: Station[];
  lanes: Lane[];
  isSuperAdmin: boolean;
  canCreate: boolean;
}

export function EquipmentPageClient({
  equipment,
  stations,
  lanes,
  isSuperAdmin,
  canCreate,
}: EquipmentPageClientProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diagnostic Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Manage biometric, mechanical, optical, and thermal sensors across all lane entry configurations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 h-9">
            <Link href="/equipment/calibration">
              <CalendarRange className="h-4 w-4" /> Calibration Board
            </Link>
          </Button>

          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-9">
                  <Plus className="h-4 w-4" /> Register Hardware
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register Diagnostic Hardware</DialogTitle>
                </DialogHeader>
                <EquipmentForm
                  stations={stations}
                  lanes={lanes}
                  onClose={() => setOpen(false)}
                  mode="create"
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <EquipmentTable rows={equipment} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
