import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('materials')
  materials() {
    return this.prisma.material.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  @Get('textures')
  textures() {
    return this.prisma.texture.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  @Get('hardware')
  hardware() {
    return this.prisma.hardwareType.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  @Get('profiles')
  profiles() {
    return this.prisma.hardwarePreset.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  @Get('default-presets')
  defaultPresets() {
    return this.prisma.hardwarePreset.findMany({
      where: { isActive: true },
      take: 50,
      orderBy: { title: 'asc' },
    });
  }
}
