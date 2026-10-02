// FILE: src/components/station/StationForm.tsx
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { createStation, updateStation } from '@/actions/stations';
import type { Station } from '@prisma/client';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'English name is required').max(100),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameKu: z.string().min(1, 'Kurdish name is required'),
  type: z.enum(['BORDER_TERMINAL', 'CITY_CENTER_CHECKPOINT']),
  address: z.string().min(1, 'Physical address is required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  isActive: z.boolean().default(true),
});

type FormValues = z.input<typeof formSchema>;

export interface StationFormProps {
  station?: Station;
  mode?: 'create' | 'edit';
}

export function StationForm({ station, mode = 'create' }: StationFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const defaultValues: Partial<FormValues> = station
    ? {
        id: station.id,
        name: station.name,
        nameAr: station.nameAr ?? '',
        nameKu: station.nameKu ?? '',
        type: station.type as 'BORDER_TERMINAL' | 'CITY_CENTER_CHECKPOINT',
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        isActive: station.isActive,
      }
    : {
        name: '',
        nameAr: '',
        nameKu: '',
        type: 'BORDER_TERMINAL',
        address: '',
        latitude: 36.2,
        longitude: 44.0,
        isActive: true,
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

  const watchedType = watch('type');
  const watchedIsActive = watch('isActive');

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      let res;
      if (mode === 'edit' && station) {
        res = await updateStation({ id: station.id, ...data });
      } else {
        res = await createStation(data);
      }

      if (res.ok) {
        toast.success(
          mode === 'edit'
            ? 'Station details updated successfully'
            : 'Station created successfully'
        );
        router.push('/stations');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save station');
      }
    } catch {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Custom Station ID (only for creation) */}
        {mode === 'create' && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="id">Station Code ID (Optional — e.g. ERB-01)</Label>
            <Input id="id" placeholder="Leave blank for automatic generation" {...register('id')} />
          </div>
        )}

        {/* English Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Station Name (English) *</Label>
          <Input id="name" placeholder="e.g. Erbil Main Station" {...register('name')} required />
          {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
        </div>

        {/* Kurdish Name */}
        <div className="space-y-1.5">
          <Label htmlFor="nameKu">Station Name (Kurdish) *</Label>
          <Input id="nameKu" placeholder="e.g. وێستگەی سەرەکی هەولێر" {...register('nameKu')} required />
          {errors.nameKu && <p className="text-xs text-red-500 font-medium">{errors.nameKu.message}</p>}
        </div>

        {/* Arabic Name */}
        <div className="space-y-1.5">
          <Label htmlFor="nameAr">Station Name (Arabic) *</Label>
          <Input id="nameAr" placeholder="e.g. محطة أربيل الرئيسية" {...register('nameAr')} required />
          {errors.nameAr && <p className="text-xs text-red-500 font-medium">{errors.nameAr.message}</p>}
        </div>

        {/* Station Type */}
        <div className="space-y-1.5">
          <Label htmlFor="type">Station Classification *</Label>
          <Select
            value={watchedType}
            onValueChange={(val: 'BORDER_TERMINAL' | 'CITY_CENTER_CHECKPOINT') =>
              setValue('type', val, { shouldValidate: true })
            }
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BORDER_TERMINAL">Border Customs Terminal</SelectItem>
              <SelectItem value="CITY_CENTER_CHECKPOINT">City Center Checkpoint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Physical Address */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Physical Address Description *</Label>
          <Input id="address" placeholder="e.g. Erbil-Duhok Highway, Khabat, Iraq" {...register('address')} required />
          {errors.address && <p className="text-xs text-red-500 font-medium">{errors.address.message}</p>}
        </div>

        {/* Latitude */}
        <div className="space-y-1.5">
          <Label htmlFor="latitude">GPS Latitude Coordinate *</Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            placeholder="e.g. 36.1911"
            {...register('latitude')}
            required
          />
          {errors.latitude && <p className="text-xs text-red-500 font-medium">{errors.latitude.message}</p>}
        </div>

        {/* Longitude */}
        <div className="space-y-1.5">
          <Label htmlFor="longitude">GPS Longitude Coordinate *</Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            placeholder="e.g. 44.0092"
            {...register('longitude')}
            required
          />
          {errors.longitude && <p className="text-xs text-red-500 font-medium">{errors.longitude.message}</p>}
        </div>

        {/* Is Active Status Switch */}
        <div className="flex items-center justify-between p-3 border rounded-lg sm:col-span-2">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Station Operational Status</Label>
            <p className="text-[11px] text-muted-foreground">
              Deactivated stations are suspended from generating certificates and logging incoming lanes.
            </p>
          </div>
          <Switch
            checked={watchedIsActive}
            onCheckedChange={(checked) => setValue('isActive', checked, { shouldValidate: true })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/stations')}
          disabled={pending}
        >
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
            'Create Station'
          )}
        </Button>
      </div>
    </form>
  );
}
