// FILE: src/components/inspection/TireTestPanel.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { evaluateTireInspection } from '@/lib/iso/pass-fail';
import { cn } from '@/lib/utils';

export type SidewallStatus = 'OK' | 'MINOR_CUT' | 'CORD_EXPOSED' | 'BULGE';

export interface TireValue {
  treadDepthMm: number[];
  pressureKpa: number[];
  specPressureKpa: number;
  sidewallCondition: SidewallStatus[];
}

export interface TireTestPanelProps {
  value: TireValue;
  onChange: (v: TireValue) => void;
}

const WHEELS = [
  { id: 0, label: 'Wheel 1 — Front Left (FL)' },
  { id: 1, label: 'Wheel 2 — Front Right (FR)' },
  { id: 2, label: 'Wheel 3 — Rear Left (RL)' },
  { id: 3, label: 'Wheel 4 — Rear Right (RR)' },
];

export function TireTestPanel({ value, onChange }: TireTestPanelProps) {
  const evaluation = React.useMemo(() => {
    return evaluateTireInspection(value);
  }, [value]);

  const updateDepth = (index: number, val: number) => {
    const depths = [...value.treadDepthMm];
    depths[index] = val;
    onChange({ ...value, treadDepthMm: depths });
  };

  const updatePressure = (index: number, val: number) => {
    const pressures = [...value.pressureKpa];
    pressures[index] = val;
    onChange({ ...value, pressureKpa: pressures });
  };

  const updateSidewall = (index: number, val: SidewallStatus) => {
    const sidewalls = [...value.sidewallCondition];
    sidewalls[index] = val;
    onChange({ ...value, sidewallCondition: sidewalls });
  };

  const updateSpecPressure = (val: number) => {
    onChange({ ...value, specPressureKpa: val });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h3 className="text-base font-semibold">Tire Condition & Tread Depth</h3>
          <p className="text-xs text-muted-foreground">
            ISO 39001: min tread 2.0mm, max pressure deviation ±20%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Badge
            variant="outline"
            className={cn(
              evaluation.outcome === 'PASS' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
              evaluation.outcome === 'CONDITIONAL_PASS' && 'bg-amber-500/10 text-amber-700 border-amber-500/30',
              evaluation.outcome === 'FAIL' && 'bg-red-500/10 text-red-700 border-red-500/30'
            )}
          >
            {evaluation.outcome} ({evaluation.defects.length} defect{evaluation.defects.length !== 1 ? 's' : ''})
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {WHEELS.map((wheel) => (
          <div
            key={wheel.id}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg border bg-card/60 items-end"
          >
            <div className="space-y-1.5 sm:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {wheel.label}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tread Depth (mm)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="25"
                value={value.treadDepthMm[wheel.id] ?? 0}
                onChange={(e) => updateDepth(wheel.id, parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pressure (kPa)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                max="1200"
                value={value.pressureKpa[wheel.id] ?? 0}
                onChange={(e) => updatePressure(wheel.id, parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sidewall Condition</Label>
              <Select
                value={value.sidewallCondition[wheel.id] ?? 'OK'}
                onValueChange={(val: SidewallStatus) => updateSidewall(wheel.id, val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK / Intact</SelectItem>
                  <SelectItem value="MINOR_CUT">Minor Cut</SelectItem>
                  <SelectItem value="CORD_EXPOSED">Cord Exposed</SelectItem>
                  <SelectItem value="BULGE">Bulge / Deformation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg border bg-card/40 max-w-xs space-y-1.5">
        <Label className="text-xs font-medium">Specification Nominal Pressure (kPa)</Label>
        <Input
          type="number"
          step="5"
          value={value.specPressureKpa}
          onChange={(e) => updateSpecPressure(parseInt(e.target.value, 10) || 830)}
        />
        <p className="text-[11px] text-muted-foreground">Default: 830 kPa for heavy commercial trucks</p>
      </div>
    </div>
  );
}
