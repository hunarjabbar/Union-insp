// FILE: src/components/audit/NcrForm.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { createNcr } from '@/actions/ncrs';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'ADVISORY']),
  isoStandard: z.enum(['ISO_17020', 'ISO_27001', 'ISO_9001', 'ISO_39001']),
  inspectionId: z.string().optional().or(z.literal('')),
  stationId: z.string().optional().or(z.literal('')),
  assignedTo: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export interface NcrFormProps {
  onClose: () => void;
}

export function NcrForm({ onClose }: NcrFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      severity: 'MAJOR',
      isoStandard: 'ISO_17020',
      inspectionId: '',
      stationId: '',
      assignedTo: '',
      dueDate: '',
    },
  });

  const watchedSeverity = watch('severity');
  const watchedIso = watch('isoStandard');

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...data,
        inspectionId: data.inspectionId && data.inspectionId.trim() !== '' ? data.inspectionId.trim() : undefined,
        stationId: data.stationId && data.stationId.trim() !== '' ? data.stationId.trim() : undefined,
        assignedTo: data.assignedTo && data.assignedTo.trim() !== '' ? data.assignedTo.trim() : undefined,
        dueDate: data.dueDate && data.dueDate.trim() !== '' ? new Date(data.dueDate).toISOString() : undefined,
      };

      const res = await createNcr(payload);
      if (res.ok) {
        toast.success('Non-Conformity Report successfully generated');
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to create NCR');
      }
    } catch {
      toast.error('An unexpected error occurred while creating NCR.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-3 text-xs">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Non-Conformity Title *</Label>
          <Input id="title" placeholder="e.g. Brake dynamometer load sensor calibration drift" {...register('title')} required />
          {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
        </div>

        {/* ISO Standard */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="isoStandard">ISO Standard Reference *</Label>
            <Select
              value={watchedIso}
              onValueChange={(val: any) => setValue('isoStandard', val, { shouldValidate: true })}
            >
              <SelectTrigger id="isoStandard">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ISO_17020">ISO/IEC 17020 (Inspection Bodies)</SelectItem>
                <SelectItem value="ISO_27001">ISO 27001 (Information Security)</SelectItem>
                <SelectItem value="ISO_9001">ISO 9001 (Quality Management)</SelectItem>
                <SelectItem value="ISO_39001">ISO 39001 (Road Traffic Safety)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label htmlFor="severity">Severity Classification *</Label>
            <Select
              value={watchedSeverity}
              onValueChange={(val: any) => setValue('severity', val, { shouldValidate: true })}
            >
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRITICAL">CRITICAL — Immediate Shutdown</SelectItem>
                <SelectItem value="MAJOR">MAJOR — Corrective Action Required</SelectItem>
                <SelectItem value="MINOR">MINOR — Minor Observation</SelectItem>
                <SelectItem value="ADVISORY">ADVISORY — Recommendation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Detailed Description & Evidence *</Label>
          <Textarea
            id="description"
            placeholder="Describe the non-conformity, observed failure, and supporting audit evidence..."
            {...register('description')}
            className="min-h-[100px]"
            required
          />
          {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Corrective Action Due Date</Label>
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating...
            </span>
          ) : (
            'Publish NCR'
          )}
        </Button>
      </div>
    </form>
  );
}
