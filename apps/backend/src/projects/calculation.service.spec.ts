import { CalculationService } from './calculation.service';

describe('CalculationService', () => {
  it('aggregates panels and returns warnings for thin MDF', async () => {
    const prisma = {
      projectItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '1',
            itemType: 'panel',
            materialId: 'm1',
            dimensionJson: { widthMm: 800, heightMm: 2000, thicknessMm: 16 },
          },
          {
            id: '2',
            itemType: 'panel',
            materialId: 'm1',
            dimensionJson: { widthMm: 400, heightMm: 2000, thicknessMm: 16 },
          },
        ]),
      },
      material: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm1',
          title: 'MDF Board',
          category: 'MDF',
          sheetWidthMm: 2800,
          sheetHeightMm: 2070,
          pricePerSheet: 50,
          pricePerM2: null,
        }),
      },
    } as unknown as import('../prisma/prisma.service').PrismaService;

    const svc = new CalculationService(prisma);
    const result = await svc.buildForProject('p1');

    expect(Array.isArray(result.warningsJson)).toBe(true);
    expect(result.warningsJson.some((w) => w.includes('МДФ'))).toBe(true);
    expect(
      (result.materialsJson as { sheetsEstimate: number }[])[0].sheetsEstimate,
    ).toBeGreaterThanOrEqual(1);
    expect((result.totalsJson as { grand: number }).grand).toBeGreaterThan(0);
  });
});
