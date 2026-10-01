// FILE: prisma/seed.ts
// STAGE: 2
// UPDATED: 2026-10-01
import { PrismaClient, Role, UserStatus, StationType, LaneStatus, VehicleCategory, InspectionStatus, EquipmentStatus, NcrStatus, FeeCollectionStatus, PaymentProvider, PaymentStatus, PrinterStatus, PrinterConnectionType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Use raw SQL or separate prisma delete calls to clear tables in correct order
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.nCR.deleteMany();
  await prisma.calibrationLog.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.override.deleteMany();
  await prisma.defect.deleteMany();
  await prisma.lightInspection.deleteMany();
  await prisma.brakeInspection.deleteMany();
  await prisma.tireInspection.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.fleetOwner.deleteMany();
  await prisma.printerConfig.deleteMany();
  await prisma.lane.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.syndicatePayout.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  // Hash password
  const passwordHash = await argon2.hash('Admin123456!', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // 1. Create 5 Stations (3 border, 2 city)
  const stationTypes = [
    StationType.BORDER_TERMINAL,
    StationType.BORDER_TERMINAL,
    StationType.BORDER_TERMINAL,
    StationType.CITY_CENTER_CHECKPOINT,
    StationType.CITY_CENTER_CHECKPOINT,
  ];

  const stations = [];
  for (let i = 0; i < 5; i++) {
    const s = await prisma.station.create({
      data: {
        id: `ST-${100 + i}`,
        name: `Sulaymaniyah Station ${i + 1}`,
        nameAr: `محطة السليمانية ${i + 1}`,
        nameKu: `وێستگەی سلێمانی ${i + 1}`,
        type: stationTypes[i],
        address: `Sarchinar Road, Sulaymaniyah, Kurdistan`,
        latitude: 35.56 + i * 0.01,
        longitude: 45.43 + i * 0.01,
        isActive: true,
      },
    });
    stations.push(s);
  }

  // 2. Create 8 Users with argon2id hashes
  const roles = [
    Role.SUPER_ADMIN,
    Role.STATION_MANAGER,
    Role.LEAD_INSPECTOR,
    Role.COMPLIANCE_AUDITOR,
    Role.SYNDICATE_REPRESENTATIVE,
    Role.INSPECTION_TECHNICIAN,
    Role.CASHIER,
    Role.STATION_MANAGER,
  ];

  const users = [];
  for (let i = 0; i < 8; i++) {
    const u = await prisma.user.create({
      data: {
        email: `user${i + 1}@union-inspection.com`,
        passwordHash,
        fullName: `Staff Member ${i + 1}`,
        role: roles[i],
        status: UserStatus.ACTIVE,
        employeeId: `EMP-${200 + i}`,
        stationId: i > 0 ? stations[i % 5].id : null,
      },
    });
    users.push(u);
  }

  // 3. Create 15 Lanes (3 per station)
  const lanes = [];
  for (const s of stations) {
    for (let lNum = 1; lNum <= 3; lNum++) {
      const lane = await prisma.lane.create({
        data: {
          stationId: s.id,
          laneNumber: lNum,
          name: `Lane ${lNum} for ${s.name}`,
          status: LaneStatus.ACTIVE,
        },
      });
      lanes.push(lane);
    }
  }

  // 4. Create 45 Equipment rows (9 per station)
  const equipments = [];
  for (const s of stations) {
    const stationLanes = lanes.filter(l => l.stationId === s.id);
    for (let eqIdx = 1; eqIdx <= 9; eqIdx++) {
      const assignedLane = stationLanes[(eqIdx - 1) % stationLanes.length];
      const eq = await prisma.equipment.create({
        data: {
          stationId: s.id,
          laneId: assignedLane.id,
          serialNumber: `EQ-SR-${s.id}-${eqIdx}`,
          name: `Scanner Unit ${eqIdx}`,
          status: EquipmentStatus.OPERATIONAL,
          calibrationDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      });
      equipments.push(eq);
    }
  }

  // 5. Create 5 PrinterConfig rows (1 per station)
  for (let i = 0; i < 5; i++) {
    await prisma.printerConfig.create({
      data: {
        stationId: stations[i].id,
        name: `Printer ${i + 1}`,
        connectionType: PrinterConnectionType.WEBUSB,
        paperWidthMm: 80,
        status: PrinterStatus.ONLINE,
        isDefault: true,
      },
    });
  }

  // 6. Create 5 Fleet Owners + Vehicles
  const fleetOwners = [];
  for (let i = 0; i < 5; i++) {
    const fo = await prisma.fleetOwner.create({
      data: {
        companyName: `Sulaymaniyah Transport Co ${i + 1}`,
        isActive: true,
      },
    });
    fleetOwners.push(fo);
  }

  const vehicles = [];
  const categories = [
    VehicleCategory.HEAVY_FREIGHT,
    VehicleCategory.TOUR_BUS,
    VehicleCategory.HAZMAT,
    VehicleCategory.HEAVY_FREIGHT,
    VehicleCategory.TOUR_BUS,
  ];

  for (let i = 0; i < 5; i++) {
    const v = await prisma.vehicle.create({
      data: {
        vin: `VIN1234567890123${i}`,
        plateNumber: `SUL-${8000 + i}`,
        plateCountry: 'Iraq-Kurdistan',
        category: categories[i],
        fleetOwnerId: fleetOwners[i].id,
        complianceScore: 100,
      },
    });
    vehicles.push(v);
  }

  // 7. Create 50 Historical Inspections with children + payments + receipts
  for (let i = 1; i <= 50; i++) {
    const assocVehicle = vehicles[i % 5];
    const assocStation = stations[i % 5];
    const stationLanes = lanes.filter(l => l.stationId === assocStation.id);
    const assocLane = stationLanes[i % stationLanes.length];
    const assocInspector = users.find(u => u.role === Role.INSPECTION_TECHNICIAN) || users[0];

    const code = `UI-${2026}-${100000 + i}`;
    const insp = await prisma.inspection.create({
      data: {
        inspectionCode: code,
        vehicleId: assocVehicle.id,
        stationId: assocStation.id,
        laneId: assocLane.id,
        inspectorId: assocInspector.id,
        status: InspectionStatus.PASSED,
        overallResult: 'PASSED',
        feeAmountIqd: 150000,
        paymentStatus: FeeCollectionStatus.COLLECTED,
        createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.tireInspection.create({
      data: {
        inspectionId: insp.id,
        vehicleId: assocVehicle.id,
        overallResult: 'PASSED',
        scannedAt: insp.createdAt,
      },
    });

    await prisma.brakeInspection.create({
      data: {
        inspectionId: insp.id,
        vehicleId: assocVehicle.id,
        overallResult: 'PASSED',
        testedAt: insp.createdAt,
      },
    });

    await prisma.lightInspection.create({
      data: {
        inspectionId: insp.id,
        vehicleId: assocVehicle.id,
        overallResult: 'PASSED',
        testedAt: insp.createdAt,
      },
    });

    await prisma.payment.create({
      data: {
        inspectionId: insp.id,
        provider: PaymentProvider.CASH,
        amountIqd: 150000,
        status: PaymentStatus.COMPLETED,
        idempotencyKey: `IDEM-${insp.id}`,
        gatewayRef: `REF-${insp.id}`,
        createdAt: insp.createdAt,
      },
    });

    await prisma.receipt.create({
      data: {
        inspectionId: insp.id,
        receiptNumber: `RCP-${2026}-${100000 + i}`,
        qrPayloadUrl: `https://union-inspection.com/verify/${insp.id}`,
        createdAt: insp.createdAt,
      },
    });
  }

  // 8. Create 150 DailyReport rows (30 days * 5 stations)
  for (const s of stations) {
    for (let day = 1; day <= 30; day++) {
      await prisma.dailyReport.create({
        data: {
          stationId: s.id,
          reportDate: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
          passedCount: 8,
          failedCount: 2,
          revenueIqd: 1200000,
          payoutAmount: 240000,
          reconciled: true,
        },
      });
    }
  }

  // 9. Create 3 NCRs (Non-Conformance Reports)
  for (let i = 1; i <= 3; i++) {
    const assocEq = equipments[i % equipments.length];
    const raisedBy = users.find(u => u.role === Role.COMPLIANCE_AUDITOR) || users[0];
    await prisma.nCR.create({
      data: {
        ncrNumber: `NCR-${2026}-000${i}`,
        equipmentId: assocEq.id,
        raisedById: raisedBy.id,
        description: `Calibration variance exceeding standard tolerances on scanner.`,
        status: NcrStatus.OPEN,
      },
    });
  }

  // 10. AuditLog rows use hash="SEED_PLACEHOLDER", previousHash=null
  await prisma.auditLog.create({
    data: {
      userId: users[0].id,
      action: 'DATABASE_INITIAL_SEED',
      entityType: 'SYSTEM',
      hash: 'SEED_PLACEHOLDER',
      previousHash: null,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
