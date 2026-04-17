import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ItemRow = {
  id: string;
  itemType: string;
  materialId: string | null;
  dimensionJson: unknown;
};

@Injectable()
export class CalculationService {
  constructor(private readonly prisma: PrismaService) {}

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return null;
  }

  private num(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  async buildForProject(projectId: string) {
    const items = await this.prisma.projectItem.findMany({
      where: { projectId },
      select: {
        id: true,
        itemType: true,
        materialId: true,
        dimensionJson: true,
      },
    });

    const materialAgg = new Map<
      string,
      { title: string; areaM2: number; sheetsEstimate: number; cost: number }
    >();

    let panelCount = 0;
    const warnings: string[] = [];

    for (const item of items as ItemRow[]) {
      const dim = this.asRecord(item.dimensionJson);
      const wMm = dim ? this.num(dim.widthMm ?? dim.width) : null;
      const hMm = dim ? this.num(dim.heightMm ?? dim.height) : null;
      const tMm = dim ? this.num(dim.thicknessMm ?? dim.thickness) : null;

      if (item.itemType === 'panel') {
        panelCount += 1;
        if (tMm !== null && tMm < 16) {
          warnings.push('Тонкий материал панели: проверьте нагрузку и крепёж.');
        }
      }

      if (item.materialId && wMm && hMm) {
        const mat = await this.prisma.material.findUnique({
          where: { id: item.materialId },
        });
        if (!mat) continue;

        const areaM2 = (wMm * hMm) / 1_000_000;
        const sheetAreaM2 = (mat.sheetWidthMm * mat.sheetHeightMm) / 1_000_000;
        const sheetsEstimate =
          sheetAreaM2 > 0 ? Math.max(1, Math.ceil(areaM2 / sheetAreaM2)) : 1;
        const pricePerM2 = mat.pricePerM2 ? Number(mat.pricePerM2) : null;
        const costFromSheet = Number(mat.pricePerSheet) * sheetsEstimate;
        const costFromM2 = pricePerM2 !== null ? areaM2 * pricePerM2 : 0;
        const cost = pricePerM2 !== null ? costFromM2 : costFromSheet;

        const prev = materialAgg.get(mat.id);
        if (prev) {
          prev.areaM2 += areaM2;
          prev.sheetsEstimate += sheetsEstimate;
          prev.cost += cost;
        } else {
          materialAgg.set(mat.id, {
            title: mat.title,
            areaM2,
            sheetsEstimate,
            cost,
          });
        }
      }
    }

    const materials = [...materialAgg.entries()].map(([id, v]) => ({
      materialId: id,
      title: v.title,
      areaM2: Number(v.areaM2.toFixed(3)),
      sheetsEstimate: v.sheetsEstimate,
      cost: Number(v.cost.toFixed(2)),
    }));

    const hardwareUnits = Math.max(4, panelCount * 4);
    const hardware = [
      {
        category: 'fastener',
        title: 'Конфирмат (оценка)',
        unit: 'pcs',
        quantity: hardwareUnits,
        note: 'Грубая оценка по числу панелей',
      },
    ];

    const edgingM = items.reduce((sum, it) => {
      const dim = this.asRecord(it.dimensionJson);
      const wMm = dim ? this.num(dim.widthMm ?? dim.width) : null;
      const hMm = dim ? this.num(dim.heightMm ?? dim.height) : null;
      if (it.itemType === 'panel' && wMm && hMm) {
        return sum + (2 * (wMm + hMm)) / 1000;
      }
      return sum;
    }, 0);

    const edging = [
      {
        lengthM: Number(edgingM.toFixed(2)),
        note: 'Суммарный периметр панелей (грубая оценка кромки)',
      },
    ];

    const cutting = {
      note: 'Раскрой: на этом этапе возвращается заглушка; детальный раскрой — в следующих итерациях.',
      panels: panelCount,
    };

    if (panelCount === 0) {
      warnings.push('В проекте нет панелей для расчёта.');
    }

    const materialTotal = materials.reduce((s, m) => s + m.cost, 0);
    const hardwareTotal = hardwareUnits * 0.12;
    const totals = {
      material: Number(materialTotal.toFixed(2)),
      hardware: Number(hardwareTotal.toFixed(2)),
      grand: Number((materialTotal + hardwareTotal).toFixed(2)),
    };

    return {
      materialsJson: materials,
      hardwareJson: hardware,
      edgingJson: edging,
      cuttingJson: cutting,
      warningsJson: warnings,
      extraCostsJson: [],
      totalsJson: totals,
    };
  }

  totalsToDecimals(totals: {
    material: number;
    hardware: number;
    grand: number;
  }) {
    return {
      totalMaterialCostCached: new Prisma.Decimal(totals.material.toFixed(2)),
      totalHardwareCostCached: new Prisma.Decimal(totals.hardware.toFixed(2)),
      totalCostCached: new Prisma.Decimal(totals.grand.toFixed(2)),
    };
  }
}
