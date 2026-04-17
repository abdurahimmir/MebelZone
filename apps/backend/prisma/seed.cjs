/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'auth.email.enabled' },
    create: {
      key: 'auth.email.enabled',
      valueJson: true,
    },
    update: {
      valueJson: true,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'auth.phone.enabled' },
    create: {
      key: 'auth.phone.enabled',
      valueJson: false,
    },
    update: {
      valueJson: false,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'auth.google.enabled' },
    create: {
      key: 'auth.google.enabled',
      valueJson: false,
    },
    update: {
      valueJson: false,
    },
  });

  await prisma.tariff.upsert({
    where: { code: 'free' },
    create: {
      title: 'Free',
      code: 'free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxProjects: 10,
      maxRenderPerMonth: 5,
      maxExportPerMonth: 10,
      featuresJson: { tier: 'free' },
      isActive: true,
    },
    update: {
      title: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxProjects: 10,
      maxRenderPerMonth: 5,
      maxExportPerMonth: 10,
      featuresJson: { tier: 'free' },
      isActive: true,
    },
  });

  const existingMaterials = await prisma.material.count();
  if (existingMaterials === 0) {
    await prisma.material.createMany({
      data: [
        {
          category: 'LDSP',
          title: 'LDSP White 16mm',
          thicknessMm: 16,
          sheetWidthMm: 2800,
          sheetHeightMm: 2070,
          pricePerSheet: 45.0,
          pricePerM2: 8.5,
          isActive: true,
        },
        {
          category: 'MDF',
          title: 'MDF Painted 18mm',
          thicknessMm: 18,
          sheetWidthMm: 2800,
          sheetHeightMm: 1220,
          pricePerSheet: 62.0,
          isActive: true,
        },
      ],
    });
  }

  const existingHardware = await prisma.hardwareType.count();
  if (existingHardware === 0) {
    await prisma.hardwareType.createMany({
      data: [
        {
          category: 'fastener',
          title: 'Confirmat screw 6.3x50',
          subtype: 'confirmat',
          unit: 'pcs',
          price: 0.12,
          metaJson: { size: '6.3x50' },
          isActive: true,
        },
        {
          category: 'edge',
          title: 'Edge banding 0.4x23',
          subtype: 'pvc',
          unit: 'm',
          price: 0.35,
          isActive: true,
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
