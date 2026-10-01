// FILE: src/lib/iso/pass-fail.ts
// STAGE: 4
// UPDATED: 2026-10-01
import { DefectCategory, DefectType } from '@prisma/client';

export type InspectionOutcome = 'PASS' | 'CONDITIONAL_PASS' | 'FAIL';

export interface EvaluatedDefect {
  category: DefectCategory;
  type: DefectType;
  description: string;
  measuredValue?: string;
  requiredValue?: string;
  location?: string;
}

export interface EvaluationResult {
  outcome: InspectionOutcome;
  defects: EvaluatedDefect[];
}

export function makeDefect(
  category: DefectCategory,
  type: DefectType,
  description: string,
  measuredValue?: string,
  requiredValue?: string,
  location?: string
): EvaluatedDefect {
  return {
    category,
    type,
    description,
    measuredValue,
    requiredValue,
    location,
  };
}

function resolveOutcome(defects: EvaluatedDefect[]): InspectionOutcome {
  const hasCritical = defects.some((d) => d.type === DefectType.CRITICAL);
  if (hasCritical) return 'FAIL';
  const hasMajor = defects.some((d) => d.type === DefectType.MAJOR);
  if (hasMajor) return 'CONDITIONAL_PASS';
  return 'PASS';
}

const TIRE_LOCATIONS = [
  'Wheel 1 (FL)',
  'Wheel 2 (FR)',
  'Wheel 3 (RL)',
  'Wheel 4 (RR)',
];

export function evaluateTireInspection(input: {
  treadDepthMm: number[];
  pressureKpa: number[];
  specPressureKpa: number;
  sidewallCondition: ('OK' | 'MINOR_CUT' | 'CORD_EXPOSED' | 'BULGE')[];
}): EvaluationResult {
  const defects: EvaluatedDefect[] = [];
  const count = Math.max(
    input.treadDepthMm.length,
    input.pressureKpa.length,
    input.sidewallCondition.length
  );

  for (let i = 0; i < count; i++) {
    const location = TIRE_LOCATIONS[i] || `Wheel ${i + 1}`;
    const tread = input.treadDepthMm[i];
    const pressure = input.pressureKpa[i];
    const sidewall = input.sidewallCondition[i];

    if (tread !== undefined) {
      if (tread < 1.6) {
        defects.push(
          makeDefect(
            DefectCategory.TIRE_TREAD_DEPTH,
            DefectType.CRITICAL,
            'Tread depth is below safe regulatory minimum of 1.6mm',
            `${tread}mm`,
            '>= 1.6mm',
            location
          )
        );
      } else if (tread < 3.0) {
        defects.push(
          makeDefect(
            DefectCategory.TIRE_TREAD_DEPTH,
            DefectType.MAJOR,
            'Tread depth is low (between 1.6mm and 3.0mm)',
            `${tread}mm`,
            '>= 3.0mm',
            location
          )
        );
      }
    }

    if (pressure !== undefined && input.specPressureKpa) {
      const dev = Math.abs(pressure - input.specPressureKpa) / input.specPressureKpa;
      if (dev > 0.15) {
        defects.push(
          makeDefect(
            DefectCategory.TIRE_PRESSURE,
            DefectType.MAJOR,
            'Tire pressure deviation exceeds ±15% of specification',
            `${pressure} kPa`,
            `${input.specPressureKpa} kPa ±15%`,
            location
          )
        );
      }
    }

    if (sidewall) {
      if (sidewall === 'CORD_EXPOSED' || sidewall === 'BULGE') {
        defects.push(
          makeDefect(
            DefectCategory.TIRE_SIDEWALL,
            DefectType.CRITICAL,
            `Sidewall structural failure detected: ${sidewall.replace('_', ' ')}`,
            sidewall,
            'OK / No exposed cords or bulges',
            location
          )
        );
      } else if (sidewall === 'MINOR_CUT') {
        defects.push(
          makeDefect(
            DefectCategory.TIRE_SIDEWALL,
            DefectType.MINOR,
            'Minor cut or abrasion present on tire sidewall',
            sidewall,
            'OK',
            location
          )
        );
      }
    }
  }

  return {
    outcome: resolveOutcome(defects),
    defects,
  };
}

export function evaluateBrakeInspection(input: {
  axle1EfficiencyPct: number;
  axle2EfficiencyPct: number;
  axle3EfficiencyPct?: number;
  axle1ImbalancePct: number;
  axle2ImbalancePct: number;
  axle3ImbalancePct?: number;
}): EvaluationResult {
  const defects: EvaluatedDefect[] = [];

  const checkAxle = (
    num: number,
    efficiency: number | undefined,
    imbalance: number | undefined
  ) => {
    const loc = `Axle ${num}`;
    if (efficiency !== undefined) {
      if (efficiency < 40) {
        defects.push(
          makeDefect(
            DefectCategory.BRAKE_EFFICIENCY,
            DefectType.CRITICAL,
            'Braking efficiency is critically low (under 40%)',
            `${efficiency}%`,
            '>= 40%',
            loc
          )
        );
      } else if (efficiency < 50) {
        defects.push(
          makeDefect(
            DefectCategory.BRAKE_EFFICIENCY,
            DefectType.MAJOR,
            'Braking efficiency is sub-optimal (between 40% and 50%)',
            `${efficiency}%`,
            '>= 50%',
            loc
          )
        );
      }
    }

    if (imbalance !== undefined) {
      if (imbalance > 40) {
        defects.push(
          makeDefect(
            DefectCategory.BRAKE_IMBALANCE,
            DefectType.CRITICAL,
            'Axle braking imbalance exceeds dangerous threshold of 40%',
            `${imbalance}%`,
            '<= 40%',
            loc
          )
        );
      } else if (imbalance > 30) {
        defects.push(
          makeDefect(
            DefectCategory.BRAKE_IMBALANCE,
            DefectType.MAJOR,
            'Axle braking imbalance is high (between 30% and 40%)',
            `${imbalance}%`,
            '<= 30%',
            loc
          )
        );
      }
    }
  };

  checkAxle(1, input.axle1EfficiencyPct, input.axle1ImbalancePct);
  checkAxle(2, input.axle2EfficiencyPct, input.axle2ImbalancePct);

  if (input.axle3EfficiencyPct !== undefined || input.axle3ImbalancePct !== undefined) {
    checkAxle(3, input.axle3EfficiencyPct, input.axle3ImbalancePct);
  }

  return {
    outcome: resolveOutcome(defects),
    defects,
  };
}

export function evaluateLightInspection(input: {
  headlightAimLeft: 'OK' | 'LOW' | 'HIGH' | 'OFF';
  headlightAimRight: 'OK' | 'LOW' | 'HIGH' | 'OFF';
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
}): EvaluationResult {
  const defects: EvaluatedDefect[] = [];

  // Left headlight aim
  if (input.headlightAimLeft === 'OFF') {
    defects.push(
      makeDefect(
        DefectCategory.HEADLIGHT_AIM,
        DefectType.CRITICAL,
        'Left headlight aim is completely non-functional or switched off',
        'OFF',
        'OK',
        'Headlight Left'
      )
    );
  } else if (input.headlightAimLeft === 'LOW' || input.headlightAimLeft === 'HIGH') {
    defects.push(
      makeDefect(
        DefectCategory.HEADLIGHT_AIM,
        DefectType.MAJOR,
        `Left headlight alignment is off (${input.headlightAimLeft})`,
        input.headlightAimLeft,
        'OK',
        'Headlight Left'
      )
    );
  }

  // Right headlight aim
  if (input.headlightAimRight === 'OFF') {
    defects.push(
      makeDefect(
        DefectCategory.HEADLIGHT_AIM,
        DefectType.CRITICAL,
        'Right headlight aim is completely non-functional or switched off',
        'OFF',
        'OK',
        'Headlight Right'
      )
    );
  } else if (input.headlightAimRight === 'LOW' || input.headlightAimRight === 'HIGH') {
    defects.push(
      makeDefect(
        DefectCategory.HEADLIGHT_AIM,
        DefectType.MAJOR,
        `Right headlight alignment is off (${input.headlightAimRight})`,
        input.headlightAimRight,
        'OK',
        'Headlight Right'
      )
    );
  }

  // Headlight intensities
  if (input.specLux) {
    const halfSpec = input.specLux * 0.5;
    const eightyPctSpec = input.specLux * 0.8;

    if (input.luxLeft < halfSpec) {
      defects.push(
        makeDefect(
          DefectCategory.HEADLIGHT_INTENSITY,
          DefectType.CRITICAL,
          'Left headlight intensity is severely deficient (less than 50% spec)',
          `${input.luxLeft} lux`,
          `>= ${halfSpec} lux`,
          'Headlight Left'
        )
      );
    } else if (input.luxLeft < eightyPctSpec) {
      defects.push(
        makeDefect(
          DefectCategory.HEADLIGHT_INTENSITY,
          DefectType.MAJOR,
          'Left headlight intensity is low (less than 80% spec)',
          `${input.luxLeft} lux`,
          `>= ${eightyPctSpec} lux`,
          'Headlight Left'
        )
      );
    }

    if (input.luxRight < halfSpec) {
      defects.push(
        makeDefect(
          DefectCategory.HEADLIGHT_INTENSITY,
          DefectType.CRITICAL,
          'Right headlight intensity is severely deficient (less than 50% spec)',
          `${input.luxRight} lux`,
          `>= ${halfSpec} lux`,
          'Headlight Right'
        )
      );
    } else if (input.luxRight < eightyPctSpec) {
      defects.push(
        makeDefect(
          DefectCategory.HEADLIGHT_INTENSITY,
          DefectType.MAJOR,
          'Right headlight intensity is low (less than 80% spec)',
          `${input.luxRight} lux`,
          `>= ${eightyPctSpec} lux`,
          'Headlight Right'
        )
      );
    }
  }

  // Indicators
  const indicators = input.indicatorStatus || {};
  (Object.keys(indicators) as Array<keyof typeof indicators>).forEach((key) => {
    if (indicators[key] === false) {
      defects.push(
        makeDefect(
          DefectCategory.SIGNAL_INDICATOR,
          DefectType.CRITICAL,
          `Signal indicator is non-functional: ${key}`,
          'FAULTY',
          'OK',
          `Indicator ${key}`
        )
      );
    }
  });

  return {
    outcome: resolveOutcome(defects),
    defects,
  };
}

export function evaluateOverall(
  tire: EvaluationResult,
  brake: EvaluationResult,
  light: EvaluationResult
): EvaluationResult {
  const defects = [...tire.defects, ...brake.defects, ...light.defects];
  return {
    outcome: resolveOutcome(defects),
    defects,
  };
}
