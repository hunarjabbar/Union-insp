// FILE: src/components/print/printer-form.tsx
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
import { createPrinterConfig, updatePrinterConfig } from '@/actions/printers';
import { zPrinterCreate } from '@/lib/validation/printer.schema';
import type { PrinterConfig, Station, Lane } from '@prisma/client';

const formSchema = zPrinterCreate;
type FormValues = z.input<typeof formSchema>;

export interface PrinterFormProps {
  printer?: PrinterConfig;
  stations: Station[];
  lanes: Lane[];
  onClose?: () => void;
  mode?: 'create' | 'edit';
}

export function PrinterForm({
  printer,
  stations,
  lanes,
  onClose,
  mode = 'create',
}: PrinterFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const defaultValues: Partial<FormValues> = printer
    ? {
        stationId: printer.stationId,
        laneId: printer.laneId ?? undefined,
        name: printer.name,
        connectionType: printer.connectionType as 'WEBUSB' | 'WEBSERIAL' | 'NETWORK_TCP' | 'BLUETOOTH',
        vendorId: printer.vendorId ?? '',
        productId: printer.productId ?? '',
        serialNumber: printer.serialNumber ?? '',
        networkHost: printer.networkHost ?? '',
        networkPort: printer.networkPort ?? undefined,
        paperWidthMm: printer.paperWidthMm as 58 | 80,
        isDefault: printer.isDefault,
      }
    : {
        stationId: stations[0]?.id || '',
        laneId: undefined,
        name: '',
        connectionType: 'WEBUSB',
        vendorId: '0x04b8',
        productId: '0x0202',
        serialNumber: '',
        networkHost: '',
        networkPort: undefined,
        paperWidthMm: 80,
        isDefault: false,
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
  const watchedConnectionType = watch('connectionType');
  const watchedLaneId = watch('laneId');
  const watchedWidth = watch('paperWidthMm');
  const watchedIsDefault = watch('isDefault');

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
        laneId: data.laneId === 'NONE' || !data.laneId ? undefined : data.laneId,
        networkPort: data.networkPort ? Number(data.networkPort) : undefined,
        vendorId: data.vendorId && data.vendorId.trim() !== '' ? data.vendorId.trim() : undefined,
        productId: data.productId && data.productId.trim() !== '' ? data.productId.trim() : undefined,
        serialNumber: data.serialNumber && data.serialNumber.trim() !== '' ? data.serialNumber.trim() : undefined,
        networkHost: data.networkHost && data.networkHost.trim() !== '' ? data.networkHost.trim() : undefined,
      };

      let res;
      if (mode === 'edit' && printer) {
        res = await updatePrinterConfig({ id: printer.id, ...payload });
      } else {
        res = await createPrinterConfig(payload);
      }

      if (res.ok) {
        toast.success(
          mode === 'edit' ? 'Printer configuration updated' : 'Ticket printer registered successfully'
        );
        onClose?.();
        router.push('/settings/printers');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save printer configuration');
      }
    } catch {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setPending(false);
    }
  }

  const isUsbOrSerial = watchedConnectionType === 'WEBUSB' || watchedConnectionType === 'WEBSERIAL';
  const isNetwork = watchedConnectionType === 'NETWORK_TCP';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-3">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="prName">Printer Label / Descriptor *</Label>
          <Input id="prName" placeholder="e.g. Lane 1 Receipt Thermal Printer" {...register('name')} required />
          {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
        </div>

        {/* Station */}
        <div className="space-y-1.5">
          <Label htmlFor="prStation">Assigned Station Location *</Label>
          <Select
            value={watchedStationId}
            onValueChange={(val) => setValue('stationId', val, { shouldValidate: true })}
          >
            <SelectTrigger id="prStation">
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
          <Label htmlFor="prLane">Assigned Entry Lane</Label>
          <Select
            value={watchedLaneId || 'NONE'}
            onValueChange={(val) => setValue('laneId', val === 'NONE' ? undefined : val)}
          >
            <SelectTrigger id="prLane">
              <SelectValue placeholder="Not lane-specific (Shared Station Printer)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Not lane-specific (Shared Station Printer)</SelectItem>
              {filteredLanes.map((lane) => (
                <SelectItem key={lane.id} value={lane.id}>
                  Lane #{lane.laneNumber} — {lane.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Connection Type */}
        <div className="space-y-1.5">
          <Label htmlFor="prType">Physical Hardware Interface *</Label>
          <Select
            value={watchedConnectionType}
            onValueChange={(val: any) => setValue('connectionType', val, { shouldValidate: true })}
          >
            <SelectTrigger id="prType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEBUSB">WebUSB (Direct POS Connection)</SelectItem>
              <SelectItem value="WEBSERIAL">WebSerial (Serial / RS232)</SelectItem>
              <SelectItem value="NETWORK_TCP">Network TCP/IP Socket (LAN)</SelectItem>
              <SelectItem value="BLUETOOTH">Bluetooth / BLE Printer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* USB specific fields */}
        {isUsbOrSerial && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 border rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-xs">USB Vendor ID (HEX) *</Label>
              <Input placeholder="e.g. 0x04b8" {...register('vendorId')} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">USB Product ID (HEX) *</Label>
              <Input placeholder="e.g. 0x0202" {...register('productId')} required />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Device Serial Number (Optional)</Label>
              <Input placeholder="e.g. 158275928" {...register('serialNumber')} />
            </div>
          </div>
        )}

        {/* Network specific fields */}
        {isNetwork && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 border rounded-lg text-xs">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Printer IP Address / Host *</Label>
              <Input placeholder="e.g. 192.168.1.150" {...register('networkHost')} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">TCP Port *</Label>
              <Input type="number" placeholder="9100" {...register('networkPort', { valueAsNumber: true })} required />
              {errors.networkPort && (
                <p className="text-[10px] text-red-500 font-medium">{errors.networkPort.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Paper Width */}
        <div className="space-y-1.5">
          <Label htmlFor="prWidth">Thermal Roll Paper Width *</Label>
          <Select
            value={String(watchedWidth)}
            onValueChange={(val) => setValue('paperWidthMm', Number(val) as any, { shouldValidate: true })}
          >
            <SelectTrigger id="prWidth">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="80">80mm Standard Thermal Paper Roll</SelectItem>
              <SelectItem value="58">58mm Mobile Thermal Paper Roll</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Is Default Station Printer Switch */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold">Set as Default Station Printer</Label>
            <p className="text-[10px] text-muted-foreground">
              Direct all incoming payment receipt receipts to this printing unit as the default fallback.
            </p>
          </div>
          <Switch
            checked={watchedIsDefault}
            onCheckedChange={(checked) => setValue('isDefault', checked, { shouldValidate: true })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose?.()}
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
            'Register Printer'
          )}
        </Button>
      </div>
    </form>
  );
}
