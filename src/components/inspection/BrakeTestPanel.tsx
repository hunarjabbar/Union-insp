// FILE: src/components/inspection/BrakeTestPanel.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { evaluateBrakeInspection } from '@/lib/iso/pass-fail';
import { cn } from '@/lib/utils';

export interface BrakeValue {
  axle1EfficiencyPct: number;
  axle2EfficiencyPct: number;
  axle3EfficiencyPct?: number;
  axle1ImbalancePct: number;
  axle2ImbalancePct: number;
  axle3ImbalancePct?: number;
}

export interface BrakeTestPanelProps {
  value: BrakeValue;
  onChange: (v: BrakeValue) => void;
}

export function BrakeTestPanel({ value, onChange }: BrakeTestPanelProps) {
  const hasAxle3 = value.axle3EfficiencyPct !== undefined;

  const evaluation = React.useMemo(() => {
    return evaluateBrakeInspection(value);
  }, [value]);

  const toggleAxle3 = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...value,
        axle3EfficiencyPct: 55,
        axle3ImbalancePct: 10,
      });
    } else {
      const next = { ...value };
      delete next.axle3EfficiencyPct;
      delete next.axle3ImbalancePct;
      onChange(next);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h3 className="text-base font-semibold">Roller Brake Inspection</h3>
          <p className="text-xs text-muted-foreground">
            ISO standard: Min 50% overall efficiency, Max 30% axle imbalance
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

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Axle Configuration</TableHead>
              <TableHead>Braking Efficiency (%)</TableHead>
              <TableHead>Left / Right Imbalance (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                <div>Axle 1 (Front Steering)</div>
                <div className="text-xs text-muted-foreground">Required</div>
              </TableCell>
              <TableCell>
                <div className="max-w-[140px]">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value.axle1EfficiencyPct}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        axle1EfficiencyPct: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[140px]">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value.axle1ImbalancePct}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        axle1ImbalancePct: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">
                <div>Axle 2 (Drive Axle)</div>
                <div className="text-xs text-muted-foreground">Required</div>
              </TableCell>
              <TableCell>
                <div className="max-w-[140px]">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value.axle2EfficiencyPct}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        axle2EfficiencyPct: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[140px]">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value.axle2ImbalancePct}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        axle2ImbalancePct: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </TableCell>
            </TableRow>

            {hasAxle3 && (
              <TableRow>
                <TableCell className="font-medium">
                  <div>Axle 3 (Trailer / Tag Axle)</div>
                  <div className="text-xs text-muted-foreground">Heavy Commercial</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[140px]">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={value.axle3EfficiencyPct ?? 0}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          axle3EfficiencyPct: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[140px]">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={value.axle3ImbalancePct ?? 0}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          axle3ImbalancePct: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="axle3-toggle"
          checked={hasAxle3}
          onCheckedChange={toggleAxle3}
        />
        <Label htmlFor="axle3-toggle" className="text-sm font-medium cursor-pointer">
          Include 3rd Axle (for heavy multi-axle trucks and trailers)
        </Label>
      </div>
    </div>
  );
}
