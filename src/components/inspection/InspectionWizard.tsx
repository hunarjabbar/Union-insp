// FILE: src/components/inspection/InspectionWizard.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Loader2,
  FileText,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  evaluateTireInspection,
  evaluateBrakeInspection,
  evaluateLightInspection,
  evaluateOverall,
} from '@/lib/iso/pass-fail';
import { createInspection } from '@/actions/inspections';
import { createReceipt } from '@/actions/receipts';
import { TireTestPanel, type TireValue } from '@/components/inspection/TireTestPanel';
import { BrakeTestPanel, type BrakeValue } from '@/components/inspection/BrakeTestPanel';
import { LightTestPanel, type LightValue } from '@/components/inspection/LightTestPanel';
import { PaymentStep } from '@/components/payments/PaymentStep';
import { cn } from '@/lib/utils';
import type { Station, Lane } from '@prisma/client';

export interface InspectionWizardProps {
  stations: Station[];
  lanes: Lane[];
}

type WizardStep = 'vehicle' | 'tests' | 'review' | 'issue';

export function InspectionWizard({ stations, lanes }: InspectionWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<WizardStep>('vehicle');

  // Step 1: Vehicle state
  const [vehicle, setVehicle] = React.useState({
    plate: '',
    vin: '',
    category: 'HEAVY_FREIGHT' as 'HEAVY_FREIGHT' | 'TOUR_BUS' | 'LIGHT_COMMERCIAL',
    stationId: stations[0]?.id || '',
    laneId: lanes[0]?.id || '',
  });

  // Step 2: Test panel states
  const [tire, setTire] = React.useState<TireValue>({
    treadDepthMm: [8.5, 8.5, 9.0, 9.0],
    pressureKpa: [830, 830, 830, 830],
    specPressureKpa: 830,
    sidewallCondition: ['OK', 'OK', 'OK', 'OK'],
  });

  const [brake, setBrake] = React.useState<BrakeValue>({
    axle1EfficiencyPct: 62,
    axle2EfficiencyPct: 58,
    axle1ImbalancePct: 8,
    axle2ImbalancePct: 12,
  });

  const [light, setLight] = React.useState<LightValue>({
    headlightAimLeft: 'OK',
    headlightAimRight: 'OK',
    luxLeft: 950,
    luxRight: 940,
    specLux: 800,
    indicatorStatus: {
      leftTurn: true,
      rightTurn: true,
      brake: true,
      hazard: true,
      reverse: true,
    },
  });

  // Step 4: Issuance & Payment states
  const [createdInspection, setCreatedInspection] = React.useState<{
    id: string;
    inspectionCode: string;
  } | null>(null);
  const [paymentId, setPaymentId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Filter available lanes by station
  const availableLanes = React.useMemo(() => {
    return lanes.filter((l) => l.stationId === vehicle.stationId);
  }, [lanes, vehicle.stationId]);

  // Keep laneId synchronized when station changes
  React.useEffect(() => {
    if (availableLanes.length > 0 && !availableLanes.some((l) => l.id === vehicle.laneId)) {
      setVehicle((v) => ({ ...v, laneId: availableLanes[0].id }));
    }
  }, [availableLanes, vehicle.laneId]);

  // Live ISO Evaluation
  const overallEvaluation = React.useMemo(() => {
    return evaluateOverall(
      evaluateTireInspection(tire),
      evaluateBrakeInspection(brake),
      evaluateLightInspection(light)
    );
  }, [tire, brake, light]);

  // Handlers
  const handleNextFromVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle.plate.trim()) {
      toast.error('License plate number is required');
      return;
    }
    if (!vehicle.stationId || !vehicle.laneId) {
      toast.error('Station and lane selection are required');
      return;
    }
    setStep('tests');
  };

  const handleIssueInspection = async () => {
    setSubmitting(true);
    try {
      const res = await createInspection({
        plate: vehicle.plate,
        vin: vehicle.vin || undefined,
        category: vehicle.category,
        stationId: vehicle.stationId,
        laneId: vehicle.laneId,
        tire,
        brake,
        light,
      });

      if (res.ok) {
        setCreatedInspection({
          id: res.data.id,
          inspectionCode: res.data.inspectionCode,
        });
        toast.success(`Inspection recorded: ${res.data.inspectionCode}`);
      } else {
        toast.error(res.error || 'Failed to submit inspection data');
      }
    } catch {
      toast.error('Network error during inspection creation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeReceipt = async () => {
    if (!createdInspection || !paymentId) return;
    setSubmitting(true);
    try {
      const res = await createReceipt({
        inspectionId: createdInspection.id,
        paymentId,
      });

      if (res.ok) {
        toast.success('Inspection certified and receipt ready!');
        router.push(`/inspection/${createdInspection.id}`);
      } else {
        toast.error(res.error || 'Failed to create receipt');
      }
    } catch {
      toast.error('Error generating official receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList: { id: WizardStep; label: string }[] = [
    { id: 'vehicle', label: '1. Vehicle Details' },
    { id: 'tests', label: '2. Physical & Optical Tests' },
    { id: 'review', label: '3. Compliance Review' },
    { id: 'issue', label: '4. Issuance & Payment' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between border-b pb-4">
        {stepsList.map((s, idx) => {
          const isActive = step === s.id;
          const isDone =
            (step === 'tests' && idx === 0) ||
            (step === 'review' && idx <= 1) ||
            (step === 'issue' && idx <= 2);

          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs sm:text-sm font-medium hidden sm:inline',
                  isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}
              >
                {s.label.split('. ')[1]}
              </span>
              {idx < stepsList.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 hidden sm:inline ml-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Vehicle Form */}
      {step === 'vehicle' && (
        <form onSubmit={handleNextFromVehicle} className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="font-semibold text-base">Vehicle Identification & Entry Lane</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="plate">License Plate Number *</Label>
                  <Input
                    id="plate"
                    placeholder="e.g. 21-A 45892"
                    value={vehicle.plate}
                    onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vin">Chassis VIN (Optional, 17 chars)</Label>
                  <Input
                    id="vin"
                    placeholder="17-character VIN"
                    maxLength={17}
                    value={vehicle.vin}
                    onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Vehicle Classification</Label>
                  <Select
                    value={vehicle.category}
                    onValueChange={(val: 'HEAVY_FREIGHT' | 'TOUR_BUS' | 'LIGHT_COMMERCIAL') =>
                      setVehicle({ ...vehicle, category: val })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEAVY_FREIGHT">Heavy Commercial Freight (Truck)</SelectItem>
                      <SelectItem value="TOUR_BUS">Intercity Tour Bus</SelectItem>
                      <SelectItem value="LIGHT_COMMERCIAL">Light Commercial Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="station">Inspection Station</Label>
                  <Select
                    value={vehicle.stationId}
                    onValueChange={(val) => setVehicle({ ...vehicle, stationId: val })}
                  >
                    <SelectTrigger id="station">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name} ({st.type.replace(/_/g, ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="lane">Inspection Lane</Label>
                  <Select
                    value={vehicle.laneId}
                    onValueChange={(val) => setVehicle({ ...vehicle, laneId: val })}
                  >
                    <SelectTrigger id="lane">
                      <SelectValue placeholder="Select active lane" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanes.map((lane) => (
                        <SelectItem key={lane.id} value={lane.id}>
                          Lane #{lane.laneNumber} — {lane.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2">
              Next: Test Measurements <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Test Measurements */}
      {step === 'tests' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-8">
              <TireTestPanel value={tire} onChange={setTire} />
              <BrakeTestPanel value={brake} onChange={setBrake} />
              <LightTestPanel value={light} onChange={setLight} />
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep('vehicle')} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Vehicle
            </Button>
            <Button onClick={() => setStep('review')} className="gap-2">
              Review Compliance <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Compliance Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-bold">Standard ISO Evaluation Result</h3>
                  <p className="text-xs text-muted-foreground">
                    Automated pass/fail decision matrix based on Kurdistan Transport Syndicate standards
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm px-3 py-1 font-bold',
                    overallEvaluation.outcome === 'PASS' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
                    overallEvaluation.outcome === 'CONDITIONAL_PASS' && 'bg-amber-500/10 text-amber-700 border-amber-500/30',
                    overallEvaluation.outcome === 'FAIL' && 'bg-red-500/10 text-red-700 border-red-500/30'
                  )}
                >
                  {overallEvaluation.outcome}
                </Badge>
              </div>

              {/* Defect Summary */}
              {overallEvaluation.defects.length > 0 ? (
                <div className="space-y-3">
                  <div className="font-semibold text-sm flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Detected Defects ({overallEvaluation.defects.length})
                  </div>
                  <div className="space-y-2">
                    {overallEvaluation.defects.map((d, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-md border text-xs flex items-center justify-between bg-card"
                      >
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground">{d.description}</span>
                          <div className="text-muted-foreground">
                            {d.location ? `Location: ${d.location} · ` : ''}
                            Category: {d.category}
                          </div>
                        </div>
                        <Badge
                          variant="destructive"
                          className={cn(
                            d.type === 'CRITICAL' && 'bg-red-600',
                            d.type === 'MAJOR' && 'bg-amber-600',
                            d.type === 'MINOR' && 'bg-zinc-600'
                          )}
                        >
                          {d.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>All tested systems comply with safety thresholds without any defects.</span>
                </div>
              )}

              {/* Summary details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 text-xs">
                <div>
                  <span className="text-muted-foreground block">Plate Number:</span>
                  <span className="font-semibold text-foreground">{vehicle.plate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Category:</span>
                  <span className="font-semibold text-foreground">{vehicle.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Axle 1 Efficiency:</span>
                  <span className="font-semibold text-foreground">{brake.axle1EfficiencyPct}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Avg Tread Depth:</span>
                  <span className="font-semibold text-foreground">
                    {(tire.treadDepthMm.reduce((a, b) => a + b, 0) / 4).toFixed(1)} mm
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep('tests')} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Edit Tests
            </Button>
            <Button onClick={() => setStep('issue')} className="gap-2">
              Proceed to Issuance & Payment <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Issuance & Payment */}
      {step === 'issue' && (
        <div className="space-y-6">
          {!createdInspection ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <FileText className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-lg font-bold">Ready to Issue Official Inspection Record</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Issuing this inspection will generate the cryptographic audit hash and prepare the certificate for fee collection.
                </p>
                <Button size="lg" onClick={handleIssueInspection} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Recording Inspection...
                    </span>
                  ) : (
                    'Issue Inspection'
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>
                    Inspection created: <strong>{createdInspection.inspectionCode}</strong>
                  </span>
                </div>
                <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-white">
                  30,000 IQD Due
                </Badge>
              </div>

              <PaymentStep
                inspectionId={createdInspection.id}
                amountIqd={30000}
                onComplete={(pid) => setPaymentId(pid)}
              />

              {paymentId && (
                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={handleFinalizeReceipt}
                    disabled={submitting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Finalizing...
                      </span>
                    ) : (
                      <>
                        <Printer className="h-4 w-4" /> Finalize & Print Receipt
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!createdInspection && (
            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep('review')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back to Review
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
