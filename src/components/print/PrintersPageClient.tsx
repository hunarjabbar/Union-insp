// FILE: src/components/print/PrintersPageClient.tsx
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
import { PrinterTable, type PrinterConfigRow } from './printer-table';
import { PrinterForm } from './printer-form';
import { Plus, Printer } from 'lucide-react';
import type { Station, Lane } from '@prisma/client';

export interface PrintersPageClientProps {
  printers: PrinterConfigRow[];
  stations: Station[];
  lanes: Lane[];
  isSuperAdmin: boolean;
  canCreate: boolean;
}

export function PrintersPageClient({
  printers,
  stations,
  lanes,
  isSuperAdmin,
  canCreate,
}: PrintersPageClientProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thermal Receipt Printers</h1>
          <p className="text-sm text-muted-foreground">
            Configure POS ESC/POS hardware, thermal printing widths, and WebUSB/Bluetooth connectivity profiles.
          </p>
        </div>

        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 h-9">
                <Plus className="h-4 w-4" /> Add Printer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register Thermal Printer peripheral</DialogTitle>
              </DialogHeader>
              <PrinterForm
                stations={stations}
                lanes={lanes}
                onClose={() => setOpen(false)}
                mode="create"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <PrinterTable rows={printers} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
