// FILE: src/components/equipment/CalibrationForm.tsx
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
import { logCalibration } from '@/actions/equipment';
import { zCalibrationCreate } from '@/lib/validation/equipment.schema';

const formSchema = zCalibrationCreate;
type FormValues = z.infer<typeof formSchema>;

export interface CalibrationFormProps {
  equipmentId: string;
  onClose: () => void;
}

export function CalibrationForm({ equipmentId, onClose }: CalibrationFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const defaultValues: Partial<FormValues> = {
    equipmentId,
    calibrationDate: new Date().toISOString().split('T')[0],
    nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 180 days default
    certificateNo: '',
    certificateUrl: '',
    result: 'PASS',
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

  const watchedResult = watch('result');

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...data,
        calibrationDate: new Date(data.calibrationDate).toISOString(),
        nextDueDate: new Date(data.nextDueDate).toISOString(),
        certificateUrl: data.certificateUrl && data.certificateUrl.trim() !== '' ? data.certificateUrl.trim() : undefined,
        certificateNo: data.certificateNo && data.certificateNo.trim() !== '' ? data.certificateNo.trim() : undefined,
      };

      const res = await logCalibration(payload);
      if (res.ok) {
        toast.success('Calibration cycle logged successfully');
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to submit calibration log');
      }
    } catch {
      toast.error('An unexpected error occurred while logging.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-3 text-xs">
        {/* Calibration Date */}
        <div className="space-y-1.5">
          <Label htmlFor="calDate">Calibrated At Date *</Label>
          <Input id="calDate" type="date" {...register('calibrationDate')} required />
        </div>

        {/* Next Due Date */}
        <div className="space-y-1.5">
          <Label htmlFor="nextDueDate">Next Calibration Due Date *</Label>
          <Input id="nextDueDate" type="date" {...register('nextDueDate')} required />
        </div>

        {/* Certificate Number */}
        <div className="space-y-1.5">
          <Label htmlFor="certNo">Official Certificate Serial Number</Label>
          <Input id="certNo" placeholder="e.g. CERT-2026-9871" {...register('certificateNo')} />
        </div>

        {/* Certificate URL */}
        <div className="space-y-1.5">
          <Label htmlFor="certUrl">Certificate Scan URL (Optional)</Label>
          <Input id="certUrl" placeholder="https://..." {...register('certificateUrl')} />
          {errors.certificateUrl && (
            <p className="text-xs text-red-500 font-medium">{errors.certificateUrl.message}</p>
          )}
        </div>

        {/* Calibration Result */}
        <div className="space-y-1.5">
          <Label htmlFor="result">Diagnostic Assessment Outcome *</Label>
          <Select
            value={watchedResult}
            onValueChange={(val: 'PASS' | 'FAIL' | 'ADJUSTED') =>
              setValue('result', val, { shouldValidate: true })
            }
          >
            <SelectTrigger id="result">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PASS">PASS — Verified Operable</SelectItem>
              <SelectItem value="ADJUSTED">ADJUSTED — Calibrated & Restored</SelectItem>
              <SelectItem value="FAIL">FAIL — Defective / Quarantined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calibration Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Technical Calibration & Tolerance Notes</Label>
          <Textarea id="notes" placeholder="e.g. Adjusted sensor offset by -2.4% to correct brake load balance tolerances." {...register('notes')} className="min-h-[80px]" />
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Logging...
            </span>
          ) : (
            'Log Calibration Cycle'
          )}
        </Button>
      </div>
    </form>
  );
}
