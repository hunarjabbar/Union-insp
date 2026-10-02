// FILE: src/components/lane/StationLanesGroup.tsx
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
import { LaneTable, type LaneRow } from './LaneTable';
import { LaneForm } from './LaneForm';
import { Plus, Layers } from 'lucide-react';

export interface StationLanesGroupProps {
  station: { id: string; name: string };
  lanes: LaneRow[];
  canCreate: boolean;
  isSuperAdmin: boolean;
}

export function StationLanesGroup({
  station,
  lanes,
  canCreate,
  isSuperAdmin,
}: StationLanesGroupProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border rounded-xl bg-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">{station.name}</h2>
        </div>

        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="h-4 w-4" /> Add Lane
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Test Lane to {station.name}</DialogTitle>
              </DialogHeader>
              <LaneForm stationId={station.id} onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <LaneTable rows={lanes} stationId={station.id} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
