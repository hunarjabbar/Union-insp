// FILE: src/components/lane/LaneForm.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { createLane, updateLane } from '@/actions/lanes';
import type { Lane } from '@prisma/client';

const formSchema = z.object({
  laneNumber: z.coerce.number().int().positive('Lane number must be a positive integer'),
  name: z.string().min(1, 'Name is required').max(50),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'OFFLINE', 'CALIBRATION_REQUIRED']),
  lastCalibration: z.string().optional().or(z.literal('')),
  nextCalibration: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export interface LaneFormProps {
  stationId: string;
  lane?: Lane;
  onClose: () => void;
}

export function LaneForm({ stationId, lane, onClose }: LaneFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const isEdit = !!lane;

  const defaultValues: Partial<FormValues> = lane
    ? {
        laneNumber: lane.laneNumber,
        name: lane.name,
        status: lane.status as 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'CALIBRATION_REQUIRED',
        lastCalibration: lane.lastCalibration ? new Date(lane.lastCalibration).toISOString().split('T')[0] : '',
        nextCalibration: lane.nextCalibration ? new Date(lane.nextCalibration).toISOString().split('T')[0] : '',
      }
    : {
        laneNumber: undefined,
        name: '',
        status: 'ACTIVE',
        lastCalibration: '',
        nextCalibration: '',
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchedStatus = watch('status');

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...data,
        stationId,
        lastCalibration: data.lastCalibration ? new Date(data.lastCalibration).toISOString() : undefined,
        nextCalibration: data.nextCalibration ? new Date(data.nextCalibration).toISOString() : undefined,
      };

      let res;
      if (isEdit && lane) {
        res = await updateLane({ id: lane.id, ...payload });
      } else {
        res = await createLane(payload);
      }

      if (res.ok) {
        toast.success(isEdit ? 'Lane updated successfully' : 'Lane created successfully');
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save lane details');
      }
    } catch {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-3">
        {/* Lane Number */}
        <div className="space-y-1.5">
          <Label htmlFor="laneNumber">Lane Number *</Label>
          <Input
            id="laneNumber"
            type="number"
            placeholder="e.g. 1"
            {...register('laneNumber')}
            required
            disabled={isEdit}
          />
          {errors.laneNumber && (
            <p className="text-xs text-red-500 font-medium">{errors.laneNumber.message}</p>
          )}
        </div>

        {/* Lane Name */}
        <div className="space-y-1.5">
          <Label htmlFor="laneName">Lane Descriptor / Name *</Label>
          <Input id="laneName" placeholder="e.g. Heavy Duty Roller Brake & Alignment Lane" {...register('name')} required />
          {errors.name && (
            <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Operational Status */}
        <div className="space-y-1.5">
          <Label htmlFor="laneStatus">Operational Status *</Label>
          <Select
            value={watchedStatus}
            onValueChange={(val: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'CALIBRATION_REQUIRED') =>
              setValue('status', val, { shouldValidate: true })
            }
          >
            <SelectTrigger id="laneStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE — Operating Normal</SelectItem>
              <SelectItem value="MAINTENANCE">MAINTENANCE — Tech Inspection</SelectItem>
              <SelectItem value="OFFLINE">OFFLINE — Deactivated</SelectItem>
              <SelectItem value="CALIBRATION_REQUIRED">CALIBRATION REQUIRED — Expired Hardware</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Last Calibration Date */}
        <div className="space-y-1.5">
          <Label htmlFor="lastCalibration">Last Hardware Calibration Date</Label>
          <Input id="lastCalibration" type="date" {...register('lastCalibration')} />
        </div>

        {/* Next Calibration Date */}
        <div className="space-y-1.5">
          <Label htmlFor="nextCalibration">Next Calibration Due Date</Label>
          <Input id="nextCalibration" type="date" {...register('nextCalibration')} />
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </span>
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Create Lane'
          )}
        </Button>
      </div>
    </form>
  );
}
