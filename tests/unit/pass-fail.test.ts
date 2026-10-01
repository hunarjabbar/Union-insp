// FILE: tests/unit/pass-fail.test.ts
// STAGE: 4
// UPDATED: 2026-10-01
import { describe, it, expect } from 'vitest';
import {
  evaluateTireInspection,
  evaluateBrakeInspection,
  evaluateLightInspection,
  evaluateOverall,
} from '@/lib/iso/pass-fail';

describe('evaluateTireInspection', () => {
  it('returns PASS when all values are within spec', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [4.0, 5.0, 4.5, 4.5],
      pressureKpa: [220, 225, 220, 220],
      specPressureKpa: 220,
      sidewallCondition: ['OK', 'OK', 'OK', 'OK'],
    });
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(0);
  });

  it('returns FAIL when any tread depth < 1.6mm', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [1.2, 5.0, 4.5, 4.5],
      pressureKpa: [220, 220, 220, 220],
      specPressureKpa: 220,
      sidewallCondition: ['OK', 'OK', 'OK', 'OK'],
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('TIRE_TREAD_DEPTH');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns CONDITIONAL_PASS when tread depth is 1.6–3.0mm', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [2.5, 5.0, 4.5, 4.5],
      pressureKpa: [220, 220, 220, 220],
      specPressureKpa: 220,
      sidewallCondition: ['OK', 'OK', 'OK', 'OK'],
    });
    expect(res.outcome).toBe('CONDITIONAL_PASS');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('TIRE_TREAD_DEPTH');
    expect(res.defects[0].type).toBe('MAJOR');
  });

  it('returns CONDITIONAL_PASS when pressure is off by more than 15%', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [4.0, 5.0, 4.5, 4.5],
      pressureKpa: [180, 220, 220, 220], // 180 is off from 220 by > 15%
      specPressureKpa: 220,
      sidewallCondition: ['OK', 'OK', 'OK', 'OK'],
    });
    expect(res.outcome).toBe('CONDITIONAL_PASS');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('TIRE_PRESSURE');
    expect(res.defects[0].type).toBe('MAJOR');
  });

  it('returns FAIL when sidewall is CORD_EXPOSED', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [4.0, 5.0, 4.5, 4.5],
      pressureKpa: [220, 220, 220, 220],
      specPressureKpa: 220,
      sidewallCondition: ['CORD_EXPOSED', 'OK', 'OK', 'OK'],
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('TIRE_SIDEWALL');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns FAIL when sidewall is BULGE', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [4.0, 5.0, 4.5, 4.5],
      pressureKpa: [220, 220, 220, 220],
      specPressureKpa: 220,
      sidewallCondition: ['BULGE', 'OK', 'OK', 'OK'],
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('TIRE_SIDEWALL');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns PASS with a MINOR defect when sidewall is MINOR_CUT', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [4.0, 5.0, 4.5, 4.5],
      pressureKpa: [220, 220, 220, 220],
      specPressureKpa: 220,
      sidewallCondition: ['MINOR_CUT', 'OK', 'OK', 'OK'],
    });
    // A single MINOR defect should result in 'PASS' overall if there are no CRITICAL/MAJOR defects
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('TIRE_SIDEWALL');
    expect(res.defects[0].type).toBe('MINOR');
  });

  it('handles empty arrays without throwing', () => {
    const res = evaluateTireInspection({
      treadDepthMm: [],
      pressureKpa: [],
      specPressureKpa: 220,
      sidewallCondition: [],
    });
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(0);
  });
});

describe('evaluateBrakeInspection', () => {
  it('returns PASS when all axles are above threshold', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 65,
      axle2EfficiencyPct: 60,
      axle1ImbalancePct: 15,
      axle2ImbalancePct: 20,
    });
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(0);
  });

  it('returns FAIL when any axle efficiency < 40%', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 35,
      axle2EfficiencyPct: 60,
      axle1ImbalancePct: 15,
      axle2ImbalancePct: 20,
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('BRAKE_EFFICIENCY');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns CONDITIONAL_PASS when efficiency is 40–50%', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 45,
      axle2EfficiencyPct: 60,
      axle1ImbalancePct: 15,
      axle2ImbalancePct: 20,
    });
    expect(res.outcome).toBe('CONDITIONAL_PASS');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('BRAKE_EFFICIENCY');
    expect(res.defects[0].type).toBe('MAJOR');
  });

  it('returns FAIL when any axle imbalance > 40%', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 65,
      axle2EfficiencyPct: 60,
      axle1ImbalancePct: 45,
      axle2ImbalancePct: 20,
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('BRAKE_IMBALANCE');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns CONDITIONAL_PASS when imbalance is 30–40%', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 65,
      axle2EfficiencyPct: 60,
      axle1ImbalancePct: 35,
      axle2ImbalancePct: 20,
    });
    expect(res.outcome).toBe('CONDITIONAL_PASS');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('BRAKE_IMBALANCE');
    expect(res.defects[0].type).toBe('MAJOR');
  });

  it('skips axle 3 when undefined', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 65,
      axle2EfficiencyPct: 60,
      axle1ImbalancePct: 15,
      axle2ImbalancePct: 20,
      axle3EfficiencyPct: undefined,
      axle3ImbalancePct: undefined,
    });
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(0);
  });

  it('includes axle 3 when defined', () => {
    const res = evaluateBrakeInspection({
      axle1EfficiencyPct: 65,
      axle2EfficiencyPct: 60,
      axle3EfficiencyPct: 35, // FAIL
      axle1ImbalancePct: 15,
      axle2ImbalancePct: 20,
      axle3ImbalancePct: 10,
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].location).toBe('Axle 3');
  });
});

describe('evaluateLightInspection', () => {
  it('returns PASS when both headlights and all indicators are OK', () => {
    const res = evaluateLightInspection({
      headlightAimLeft: 'OK',
      headlightAimRight: 'OK',
      luxLeft: 500,
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: true,
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(0);
  });

  it('returns FAIL when headlight aim is OFF', () => {
    const res = evaluateLightInspection({
      headlightAimLeft: 'OFF',
      headlightAimRight: 'OK',
      luxLeft: 500,
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: true,
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('HEADLIGHT_AIM');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns CONDITIONAL_PASS when headlight aim is LOW or HIGH', () => {
    const res1 = evaluateLightInspection({
      headlightAimLeft: 'OK',
      headlightAimRight: 'LOW',
      luxLeft: 500,
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: true,
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res1.outcome).toBe('CONDITIONAL_PASS');
    expect(res1.defects.length).toBe(1);

    const res2 = evaluateLightInspection({
      headlightAimLeft: 'HIGH',
      headlightAimRight: 'OK',
      luxLeft: 500,
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: true,
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res2.outcome).toBe('CONDITIONAL_PASS');
    expect(res2.defects.length).toBe(1);
  });

  it('returns FAIL when any Lux is below 50% of spec', () => {
    const res = evaluateLightInspection({
      headlightAimLeft: 'OK',
      headlightAimRight: 'OK',
      luxLeft: 200, // < 250 (50% of 500)
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: true,
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('HEADLIGHT_INTENSITY');
    expect(res.defects[0].type).toBe('CRITICAL');
  });

  it('returns CONDITIONAL_PASS when Lux is 50–80% of spec', () => {
    const res = evaluateLightInspection({
      headlightAimLeft: 'OK',
      headlightAimRight: 'OK',
      luxLeft: 350, // Between 250 and 400 (50% - 80% of 500)
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: true,
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res.outcome).toBe('CONDITIONAL_PASS');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('HEADLIGHT_INTENSITY');
    expect(res.defects[0].type).toBe('MAJOR');
  });

  it('returns FAIL when any indicator is false', () => {
    const res = evaluateLightInspection({
      headlightAimLeft: 'OK',
      headlightAimRight: 'OK',
      luxLeft: 500,
      luxRight: 520,
      specLux: 500,
      indicatorStatus: {
        leftTurn: true,
        rightTurn: false, // FAIL
        brake: true,
        hazard: true,
        reverse: true,
      },
    });
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(1);
    expect(res.defects[0].category).toBe('SIGNAL_INDICATOR');
    expect(res.defects[0].type).toBe('CRITICAL');
  });
});

describe('evaluateOverall', () => {
  const passRes = { outcome: 'PASS' as const, defects: [] };
  const condRes = {
    outcome: 'CONDITIONAL_PASS' as const,
    defects: [
      {
        category: 'TIRE_TREAD_DEPTH' as const,
        type: 'MAJOR' as const,
        description: 'Tread depth is low',
      },
    ],
  };
  const failRes = {
    outcome: 'FAIL' as const,
    defects: [
      {
        category: 'BRAKE_EFFICIENCY' as const,
        type: 'CRITICAL' as const,
        description: 'Critically low braking efficiency',
      },
    ],
  };

  it('returns PASS when all children PASS', () => {
    const res = evaluateOverall(passRes, passRes, passRes);
    expect(res.outcome).toBe('PASS');
    expect(res.defects.length).toBe(0);
  });

  it('returns CONDITIONAL_PASS when children are PASS + CONDITIONAL', () => {
    const res = evaluateOverall(passRes, condRes, passRes);
    expect(res.outcome).toBe('CONDITIONAL_PASS');
    expect(res.defects.length).toBe(1);
  });

  it('returns FAIL when any child is FAIL', () => {
    const res = evaluateOverall(passRes, condRes, failRes);
    expect(res.outcome).toBe('FAIL');
    expect(res.defects.length).toBe(2); // tread depth + brake efficiency
  });
});
