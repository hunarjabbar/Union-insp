// FILE: src/components/user/UserForm.tsx
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
import { createUser, updateUser } from '@/actions/users';
import { zUserCreate, zUserUpdate } from '@/lib/validation/user.schema';
import type { Station } from '@prisma/client';

export interface UserFormProps {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    stationId: string | null;
    mfaEnabled: boolean;
  };
  stations: Station[];
  mode?: 'create' | 'edit';
  onClose?: () => void;
}

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator' },
  { value: 'STATION_MANAGER', label: 'Station Manager' },
  { value: 'LEAD_INSPECTOR', label: 'Lead Inspector' },
  { value: 'COMPLIANCE_AUDITOR', label: 'Compliance Auditor' },
  { value: 'SYNDICATE_REPRESENTATIVE', label: 'Syndicate Representative' },
  { value: 'INSPECTION_TECHNICIAN', label: 'Inspection Technician' },
  { value: 'CASHIER', label: 'Cashier' },
];

export function UserForm({ user, stations, mode = 'create', onClose }: UserFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const isEdit = mode === 'edit';

  const createSchema = zUserCreate;
  const editSchema = zUserUpdate.omit({ id: true });

  const schema = isEdit ? editSchema : createSchema;
  type FormValues = z.input<typeof schema>;

  const defaultValues: Partial<any> = isEdit && user
    ? {
        fullName: user.fullName,
        stationId: user.stationId ?? '',
        mfaEnabled: user.mfaEnabled,
      }
    : {
        email: '',
        fullName: '',
        employeeId: '',
        password: '',
        role: 'INSPECTION_TECHNICIAN',
        stationId: '',
        mfaEnabled: false,
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedRole = watch('role' as any);
  const watchedStationId = watch('stationId');
  const watchedMfaEnabled = watch('mfaEnabled');

  async function onSubmit(data: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...data,
        stationId: data.stationId === 'NONE' || !data.stationId ? undefined : data.stationId,
      };

      let res;
      if (isEdit && user) {
        res = await updateUser({ id: user.id, ...payload });
      } else {
        res = await createUser(payload);
      }

      if (res.ok) {
        toast.success(
          isEdit ? 'User record updated successfully' : 'User profile created successfully'
        );
        onClose?.();
        router.push('/users');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save user details');
        if (res.fieldErrors) {
          const errorsMsg = Object.entries(res.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
            .join('; ');
          toast.error(errorsMsg);
        }
      }
    } catch {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="space-y-3">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="e.g. inspector@syndicate.gov.krd"
            {...register('email' as any)}
            disabled={isEdit}
            required={!isEdit}
          />
          {(errors as any).email && (
            <p className="text-xs text-red-500 font-medium">{(errors as any).email.message}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Representative Name *</Label>
          <Input id="fullName" placeholder="e.g. Karwan Sherwani" {...register('fullName')} required />
          {errors.fullName && (
            <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Employee ID (Create mode only) */}
        {!isEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Official Employee ID *</Label>
            <Input id="employeeId" placeholder="e.g. KTS-8756" {...register('employeeId' as any)} required />
            {(errors as any).employeeId && (
              <p className="text-xs text-red-500 font-medium">{(errors as any).employeeId.message}</p>
            )}
          </div>
        )}

        {/* Password (Create mode only) */}
        {!isEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="password">Temporary Secure Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 12 chars, upper/lower/digit"
              {...register('password' as any)}
              required
            />
            <p className="text-[10px] text-muted-foreground">Must contain upper, lower, & numeric characters</p>
            {(errors as any).password && (
              <p className="text-xs text-red-500 font-medium">{(errors as any).password.message}</p>
            )}
          </div>
        )}

        {/* Role (Create mode only) */}
        {!isEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="role">Functional Command Role *</Label>
            <Select
              value={watchedRole}
              onValueChange={(val: any) => setValue('role' as any, val, { shouldValidate: true })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Default Station Location */}
        <div className="space-y-1.5">
          <Label htmlFor="stationId">Default Station Office</Label>
          <Select
            value={watchedStationId || 'NONE'}
            onValueChange={(val) => setValue('stationId', val === 'NONE' ? undefined : val, { shouldValidate: true })}
          >
            <SelectTrigger id="stationId">
              <SelectValue placeholder="Select station of assignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Not assigned / HQ Head Office</SelectItem>
              {stations.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* MFA Switch */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Force Multi-Factor Authentication</Label>
            <p className="text-[11px] text-muted-foreground">
              Enforce TOTP authenticator requirements at key inspection check cycles.
            </p>
          </div>
          <Switch
            checked={watchedMfaEnabled}
            onCheckedChange={(checked) => setValue('mfaEnabled', checked, { shouldValidate: true })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/users')}
          disabled={pending}
        >
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
            'Register Personnel'
          )}
        </Button>
      </div>
    </form>
  );
}
