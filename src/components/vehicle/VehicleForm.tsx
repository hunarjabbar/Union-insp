// FILE: src/components/vehicle/VehicleForm.tsx
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
import { zVehicleCreate } from '@/lib/validation/vehicle.schema';
import { createVehicle, updateVehicle } from '@/actions/vehicles';
import type { Vehicle } from '@prisma/client';
import { z } from 'zod';

export interface VehicleFormProps {
  vehicle?: Vehicle;
  fleetOwners: { id: string; companyName: string }[];
  stations: { id: string; name: string }[];
  mode?: 'create' | 'edit';
}

const formSchema = zVehicleCreate;
type FormValues = z.infer<typeof formSchema>;

export function VehicleForm({
  vehicle,
  fleetOwners,
  stations,
  mode = 'create',
}: VehicleFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const defaultValues: Partial<FormValues> = vehicle
    ? {
        plateNumber: vehicle.plateNumber,
        vin: vehicle.vin ?? '',
        category: vehicle.category as 'HEAVY_FREIGHT' | 'TOUR_BUS' | 'LIGHT_COMMERCIAL',
        make: vehicle.make ?? '',
        model: vehicle.model ?? '',
        year: vehicle.year ?? undefined,
        grossWeightKg: vehicle.grossWeightKg ?? undefined,
        fleetOwnerId: vehicle.fleetOwnerId ?? undefined,
        stationId: vehicle.stationId ?? undefined,
      }
    : {
        plateNumber: '',
        vin: '',
        category: 'HEAVY_FREIGHT',
        make: '',
        model: '',
        year: undefined,
        grossWeightKg: undefined,
        fleetOwnerId: undefined,
        stationId: undefined,
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

  const watchedCategory = watch('category');
  const watchedFleetOwnerId = watch('fleetOwnerId');
  const watchedStationId = watch('stationId');

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...data,
        vin: data.vin && data.vin.trim().length === 17 ? data.vin.trim().toUpperCase() : undefined,
        year: data.year ? Number(data.year) : undefined,
        grossWeightKg: data.grossWeightKg ? Number(data.grossWeightKg) : undefined,
        fleetOwnerId: data.fleetOwnerId === 'NONE' || !data.fleetOwnerId ? undefined : data.fleetOwnerId,
        stationId: data.stationId === 'NONE' || !data.stationId ? undefined : data.stationId,
      };

      let res;
      if (mode === 'edit' && vehicle) {
        res = await updateVehicle({ id: vehicle.id, ...payload });
      } else {
        res = await createVehicle(payload);
      }

      if (res.ok) {
        toast.success(
          mode === 'edit'
            ? 'Vehicle record updated successfully'
            : 'Vehicle record created successfully'
        );
        router.push('/vehicles');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save vehicle details');
        if (res.fieldErrors) {
          const errorsMsg = Object.entries(res.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
            .join('; ');
          toast.error(errorsMsg);
        }
      }
    } catch (e) {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plate Number */}
        <div className="space-y-1.5">
          <Label htmlFor="plateNumber">License Plate Number *</Label>
          <Input
            id="plateNumber"
            placeholder="e.g. 21-A 45892"
            {...register('plateNumber')}
            required
          />
          {errors.plateNumber && (
            <p className="text-xs text-red-500 font-medium">{errors.plateNumber.message}</p>
          )}
        </div>

        {/* VIN */}
        <div className="space-y-1.5">
          <Label htmlFor="vin">Chassis VIN (17 Characters)</Label>
          <Input
            id="vin"
            placeholder="17-char chassis number"
            maxLength={17}
            {...register('vin')}
          />
          <p className="text-[10px] text-muted-foreground">Exactly 17 characters if provided</p>
          {errors.vin && (
            <p className="text-xs text-red-500 font-medium">{errors.vin.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">Vehicle Category *</Label>
          <Select
            value={watchedCategory}
            onValueChange={(val: 'HEAVY_FREIGHT' | 'TOUR_BUS' | 'LIGHT_COMMERCIAL') =>
              setValue('category', val, { shouldValidate: true })
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HEAVY_FREIGHT">Heavy Commercial Freight (Truck)</SelectItem>
              <SelectItem value="TOUR_BUS">Intercity Tour Bus</SelectItem>
              <SelectItem value="LIGHT_COMMERCIAL">Light Commercial Vehicle</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-red-500 font-medium">{errors.category.message}</p>
          )}
        </div>

        {/* Fleet Owner */}
        <div className="space-y-1.5">
          <Label htmlFor="fleetOwnerId">Fleet Corporate Owner</Label>
          <Select
            value={watchedFleetOwnerId || 'NONE'}
            onValueChange={(val) =>
              setValue('fleetOwnerId', val === 'NONE' ? undefined : val, { shouldValidate: true })
            }
          >
            <SelectTrigger id="fleetOwnerId">
              <SelectValue placeholder="Select corporate owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Private Owner / Individual</SelectItem>
              {fleetOwners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Make */}
        <div className="space-y-1.5">
          <Label htmlFor="make">Make / Manufacturer</Label>
          <Input id="make" placeholder="e.g. Scania, Volvo, Toyota" {...register('make')} />
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <Label htmlFor="model">Model</Label>
          <Input id="model" placeholder="e.g. R450, Coaster, Hilux" {...register('model')} />
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <Label htmlFor="year">Manufacturing Year</Label>
          <Input
            id="year"
            type="number"
            placeholder="e.g. 2018"
            {...register('year', { valueAsNumber: true })}
          />
          {errors.year && (
            <p className="text-xs text-red-500 font-medium">{errors.year.message}</p>
          )}
        </div>

        {/* Gross Weight */}
        <div className="space-y-1.5">
          <Label htmlFor="grossWeightKg">Gross Weight (kg)</Label>
          <Input
            id="grossWeightKg"
            type="number"
            placeholder="e.g. 18000"
            {...register('grossWeightKg', { valueAsNumber: true })}
          />
          {errors.grossWeightKg && (
            <p className="text-xs text-red-500 font-medium">{errors.grossWeightKg.message}</p>
          )}
        </div>

        {/* Default Station */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="stationId">Registered Station Location</Label>
          <Select
            value={watchedStationId || 'NONE'}
            onValueChange={(val) =>
              setValue('stationId', val === 'NONE' ? undefined : val, { shouldValidate: true })
            }
          >
            <SelectTrigger id="stationId">
              <SelectValue placeholder="Select station location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Not assigned / National Registry</SelectItem>
              {stations.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/vehicles')}
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
            'Create Vehicle'
          )}
        </Button>
      </div>
    </form>
  );
}
