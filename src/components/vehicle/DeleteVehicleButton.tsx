// FILE: src/components/vehicle/DeleteVehicleButton.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { deleteVehicle } from '@/actions/vehicles';

export interface DeleteVehicleButtonProps {
  vehicleId: string;
}

export function DeleteVehicleButton({ vehicleId }: DeleteVehicleButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    try {
      const res = await deleteVehicle(vehicleId);
      if (res.ok) {
        toast.success('Vehicle record deleted successfully');
        router.push('/vehicles');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete vehicle');
      }
    } catch {
      toast.error('An unexpected error occurred while deleting.');
    }
  }

  return (
    <ConfirmDialog
      title="Are you absolutely sure?"
      description="This action will permanently delete this vehicle record from the system. This action cannot be undone."
      confirmLabel="Delete Vehicle"
      variant="destructive"
      onConfirm={handleDelete}
      trigger={
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" /> Delete Vehicle
        </Button>
      }
    />
  );
}
