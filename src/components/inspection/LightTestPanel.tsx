// FILE: src/components/inspection/LightTestPanel.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { evaluateLightInspection } from '@/lib/iso/pass-fail';
import { cn } from '@/lib/utils';

export type AimValue = 'OK' | 'LOW' | 'HIGH' | 'OFF';

export interface LightValue {
  headlightAimLeft: AimValue;
  headlightAimRight: AimValue;
  luxLeft: number;
  luxRight: number;
  specLux: number;
  indicatorStatus: {
    leftTurn: boolean;
    rightTurn: boolean;
    brake: boolean;
    hazard: boolean;
    reverse: boolean;
  };
}

export interface LightTestPanelProps {
  value: LightValue;
  onChange: (v: LightValue) => void;
}

export function LightTestPanel({ value, onChange }: LightTestPanelProps) {
  const evaluation = React.useMemo(() => {
    return evaluateLightInspection(value);
  }, [value]);

  const updateIndicator = (key: keyof LightValue['indicatorStatus'], val: boolean) => {
    onChange({
      ...value,
      indicatorStatus: {
        ...value.indicatorStatus,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h3 className="text-base font-semibold">Headlight Alignment & Optical Lux</h3>
          <p className="text-xs text-muted-foreground">
            ISO optical photometer testing: Min 80% of nominal lux, valid aim alignment
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Headlight */}
        <div className="p-4 rounded-lg border bg-card/60 space-y-4">
          <div className="font-medium text-sm text-foreground">Left Headlight</div>

          <div className="space-y-1.5">
            <Label className="text-xs">Aim Alignment</Label>
            <Select
              value={value.headlightAimLeft}
              onValueChange={(val: AimValue) =>
                onChange({ ...value, headlightAimLeft: val })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OK">OK — Centered</SelectItem>
                <SelectItem value="LOW">LOW — Below Target</SelectItem>
                <SelectItem value="HIGH">HIGH — Above Target</SelectItem>
                <SelectItem value="OFF">OFF — Non-functional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Luminous Intensity (Lux)</Label>
            <Input
              type="number"
              min="0"
              max="5000"
              value={value.luxLeft}
              onChange={(e) =>
                onChange({
                  ...value,
                  luxLeft: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        {/* Right Headlight */}
        <div className="p-4 rounded-lg border bg-card/60 space-y-4">
          <div className="font-medium text-sm text-foreground">Right Headlight</div>

          <div className="space-y-1.5">
            <Label className="text-xs">Aim Alignment</Label>
            <Select
              value={value.headlightAimRight}
              onValueChange={(val: AimValue) =>
                onChange({ ...value, headlightAimRight: val })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OK">OK — Centered</SelectItem>
                <SelectItem value="LOW">LOW — Below Target</SelectItem>
                <SelectItem value="HIGH">HIGH — Above Target</SelectItem>
                <SelectItem value="OFF">OFF — Non-functional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Luminous Intensity (Lux)</Label>
            <Input
              type="number"
              min="0"
              max="5000"
              value={value.luxRight}
              onChange={(e) =>
                onChange({
                  ...value,
                  luxRight: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border bg-card/40 max-w-xs space-y-1.5">
        <Label className="text-xs font-medium">Specification Nominal Intensity (Lux)</Label>
        <Input
          type="number"
          min="100"
          max="2000"
          value={value.specLux}
          onChange={(e) =>
            onChange({
              ...value,
              specLux: parseFloat(e.target.value) || 800,
            })
          }
        />
        <p className="text-[11px] text-muted-foreground">Standard nominal benchmark: 800 lux</p>
      </div>

      {/* Signal Indicators */}
      <div className="space-y-3 pt-2">
        <div className="font-medium text-sm text-foreground">
          Auxiliary Signal & Warning Lamps
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { key: 'leftTurn', label: 'Left Turn Signal' },
            { key: 'rightTurn', label: 'Right Turn Signal' },
            { key: 'brake', label: 'Brake Stop Lamps' },
            { key: 'hazard', label: 'Hazard Flashers' },
            { key: 'reverse', label: 'Reverse Warning' },
          ].map(({ key, label }) => {
            const isWorking = value.indicatorStatus[key as keyof LightValue['indicatorStatus']];
            return (
              <div
                key={key}
                className="flex flex-col justify-between p-3 rounded-lg border bg-card/50 space-y-2"
              >
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isWorking ? 'text-emerald-600' : 'text-red-500'
                    )}
                  >
                    {isWorking ? 'Functional' : 'Defective'}
                  </span>
                  <Switch
                    checked={isWorking}
                    onCheckedChange={(checked) =>
                      updateIndicator(key as keyof LightValue['indicatorStatus'], checked)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
