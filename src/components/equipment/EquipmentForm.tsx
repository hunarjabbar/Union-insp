// FILE: src/components/equipment/EquipmentForm.tsx
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { createEquipment, updateEquipment } from '@/actions/equipment';
import { zEquipmentCreate } from '@/lib/validation/equipment.schema';
import type { Equipment, Station, Lane } from '@prisma/client';

const formSchema = zEquipmentCreate;
type FormValues = z.infer<typeof formSchema>;

export interface EquipmentFormProps {
  equipment?: Equipment;
  stations: Station[];
  lanes: Lane[];
  onClose: () => void;
  mode?: 'create' | 'edit';
}

const EQUIPMENT_TYPES = [
  { value: 'TIRE_SCANNER_3D', label: '3D Laser Tire Tread Scanner' },
  { value: 'BRAKE_ROLLER_TESTER', label: 'Roller Brake Tester (Dynamometer)' },
  { value: 'LIGHT_BEAM_ALIGNER', label: 'Photometric Headlight Aligner' },
  { value: 'LUX_METER', label: 'Luminous Intensity Lux Meter' },
  { value: 'PRESSURE_SENSOR', label: 'Wireless Tire Pressure Sensor' },
  { value: 'QR_PRINTER', label: 'High-Speed Thermal QR Receipt Printer' },
  { value: 'LANE_CONTROLLER', label: 'Lane Controller Terminal Hub' },
];

export function EquipmentForm({
  equipment,
  stations,
  lanes,
  onClose,
  mode = 'create',
}: EquipmentFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const defaultValues: Partial<FormValues> = equipment
    ? {
        stationId: equipment.stationId,
        laneId: equipment.laneId ?? undefined,
        type: equipment.type as any,
        serialNumber: equipment.serialNumber,
        name: equipment.name,
        calibrationDue: new Date(equipment.calibrationDue).toISOString().split('T')[0],
        manufacturer: equipment.manufacturer ?? '',
        model: equipment.model ?? '',
        notes: equipment.notes ?? '',
      }
    : {
        stationId: stations[0]?.id || '',
        laneId: undefined,
        type: 'TIRE_SCANNER_3D',
        serialNumber: '',
        name: '',
        calibrationDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 180 days default
        manufacturer: '',
        model: '',
        notes: '',
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

  const watchedStationId = watch('stationId');
  const watchedType = watch('type');
  const watchedLaneId = watch('laneId');

  // Filter lanes by selected stationId
  const filteredLanes = React.useMemo(() => {
    return lanes.filter((lane) => lane.stationId === watchedStationId);
  }, [lanes, watchedStationId]);

  // Keep lane selection in sync
  React.useEffect(() => {
    if (watchedStationId && filteredLanes.length > 0) {
      if (watchedLaneId && !filteredLanes.some((l) => l.id === watchedLaneId)) {
        setValue('laneId', undefined);
      }
    } else {
      setValue('laneId', undefined);
    }
  }, [watchedStationId, filteredLanes, watchedLaneId, setValue]);

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...data,
        calibrationDue: new Date(data.calibrationDue).toISOString(),
        laneId: data.laneId === 'NONE' || !data.laneId ? undefined : data.laneId,
      };

      let res;
      if (mode === 'edit' && equipment) {
        res = await updateEquipment({ id: equipment.id, ...payload });
      } else {
        res = await createEquipment(payload);
      }

      if (res.ok) {
        toast.success(
          mode === 'edit' ? 'Equipment record updated' : 'Equipment registered successfully'
        );
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save equipment registry');
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
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="eqName">Equipment Name *</Label>
          <Input id="eqName" placeholder="e.g. Laser Scanner FL-100" {...register('name')} required />
          {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
        </div>

        {/* Serial Number */}
        <div className="space-y-1.5">
          <Label htmlFor="eqSerial">Unique Serial Number *</Label>
          <Input id="eqSerial" placeholder="e.g. SN-987258-B" {...register('serialNumber')} required />
          {errors.serialNumber && (
            <p className="text-xs text-red-500 font-medium">{errors.serialNumber.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label htmlFor="eqType">Hardware Classification *</Label>
          <Select
            value={watchedType}
            onValueChange={(val: any) => setValue('type', val, { shouldValidate: true })}
          >
            <SelectTrigger id="eqType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Station */}
        <div className="space-y-1.5">
          <Label htmlFor="eqStation">Assigned Station *</Label>
          <Select
            value={watchedStationId}
            onValueChange={(val) => setValue('stationId', val, { shouldValidate: true })}
          >
            <SelectTrigger id="eqStation">
              <SelectValue placeholder="Select station location" />
            </SelectTrigger>
            <SelectContent>
              {stations.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lane */}
        <div className="space-y-1.5">
          <Label htmlFor="eqLane">Assigned Entry Lane</Label>
          <Select
            value={watchedLaneId || 'NONE'}
            onValueChange={(val) => setValue('laneId', val === 'NONE' ? undefined : val)}
          >
            <SelectTrigger id="eqLane">
              <SelectValue placeholder="Standalone hardware / Not lane-specific" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Standalone hardware / Not lane-specific</SelectItem>
              {filteredLanes.map((lane) => (
                <SelectItem key={lane.id} value={lane.id}>
                  Lane #{lane.laneNumber} — {lane.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calibration Due */}
        <div className="space-y-1.5">
          <Label htmlFor="calibrationDue">Calibration Expiry Deadline *</Label>
          <Input id="calibrationDue" type="date" {...register('calibrationDue')} required />
        </div>

        {/* Manufacturer & Model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input id="manufacturer" placeholder="e.g. Bosch" {...register('manufacturer')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Model Code</Label>
            <Input id="model" placeholder="e.g. SDL-4390" {...register('model')} />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Technical Maintenance Notes</Label>
          <Textarea id="notes" placeholder="Notes, firmware requirements, etc." {...register('notes')} className="min-h-[70px] text-xs" />
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
          ) : mode === 'edit' ? (
            'Save Changes'
          ) : (
            'Register Hardware'
          )}
        </Button>
      </div>
    </form>
  );
}
