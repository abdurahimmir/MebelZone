import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CurrentUser,
  type JwtUserPayload,
} from '../common/decorators/current-user.decorator';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import {
  CreateHardwarePresetAdminDto,
  UpdateHardwarePresetAdminDto,
} from './dto/hardware-preset-admin.dto';
import {
  CreateHardwareTypeAdminDto,
  UpdateHardwareTypeAdminDto,
} from './dto/hardware-type-admin.dto';
import {
  CreateMaterialAdminDto,
  UpdateMaterialAdminDto,
} from './dto/material-admin.dto';
import {
  CreateTariffAdminDto,
  UpdateTariffAdminDto,
} from './dto/tariff-admin.dto';
import {
  CreateTextureAdminDto,
  UpdateTextureAdminDto,
} from './dto/texture-admin.dto';
import { UpsertSystemSettingDto } from './dto/system-setting.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@UseGuards(JwtAuthGuard, AdminRoleGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Put('users/:id/role')
  updateUserRole(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.admin.updateUserRole(admin.sub, id, dto.role);
  }

  @Put('users/:id/status')
  updateUserStatus(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.admin.updateUserStatus(admin.sub, id, dto.status);
  }

  @Post('users/:id/subscription')
  assignSubscription(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignSubscriptionDto,
  ) {
    return this.admin.assignSubscription(admin.sub, id, dto.tariffId);
  }

  @Get('projects')
  projects() {
    return this.admin.projects();
  }

  @Get('materials')
  materials() {
    return this.admin.materials();
  }

  @Post('materials')
  createMaterial(
    @CurrentUser() admin: JwtUserPayload,
    @Body() dto: CreateMaterialAdminDto,
  ) {
    return this.admin.createMaterial(admin.sub, {
      category: dto.category,
      title: dto.title,
      thicknessMm: dto.thicknessMm,
      sheetWidthMm: dto.sheetWidthMm,
      sheetHeightMm: dto.sheetHeightMm,
      pricePerSheet: new Prisma.Decimal(dto.pricePerSheet),
      pricePerM2:
        dto.pricePerM2 === undefined
          ? undefined
          : new Prisma.Decimal(dto.pricePerM2),
      density:
        dto.density === undefined ? undefined : new Prisma.Decimal(dto.density),
      defaultTexture:
        dto.defaultTextureId === undefined || dto.defaultTextureId === null
          ? undefined
          : { connect: { id: dto.defaultTextureId } },
      isActive: dto.isActive ?? true,
    });
  }

  @Put('materials/:id')
  updateMaterial(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialAdminDto,
  ) {
    return this.admin.updateMaterial(admin.sub, id, {
      category: dto.category,
      title: dto.title,
      thicknessMm: dto.thicknessMm,
      sheetWidthMm: dto.sheetWidthMm,
      sheetHeightMm: dto.sheetHeightMm,
      pricePerSheet:
        dto.pricePerSheet === undefined
          ? undefined
          : new Prisma.Decimal(dto.pricePerSheet),
      pricePerM2:
        dto.pricePerM2 === undefined
          ? undefined
          : dto.pricePerM2 === null
            ? null
            : new Prisma.Decimal(dto.pricePerM2),
      density:
        dto.density === undefined
          ? undefined
          : dto.density === null
            ? null
            : new Prisma.Decimal(dto.density),
      defaultTexture:
        dto.defaultTextureId === undefined
          ? undefined
          : dto.defaultTextureId === null
            ? { disconnect: true }
            : { connect: { id: dto.defaultTextureId } },
      isActive: dto.isActive,
    });
  }

  @Delete('materials/:id')
  deleteMaterial(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.deleteMaterial(admin.sub, id);
  }

  @Get('textures')
  textures() {
    return this.admin.textures();
  }

  @Post('textures')
  createTexture(
    @CurrentUser() admin: JwtUserPayload,
    @Body() dto: CreateTextureAdminDto,
  ) {
    return this.admin.createTexture(admin.sub, {
      title: dto.title,
      previewImage: dto.previewImage,
      texturePath: dto.texturePath,
      normalMapPath: dto.normalMapPath ?? undefined,
      roughnessMapPath: dto.roughnessMapPath ?? undefined,
      isActive: dto.isActive ?? true,
    });
  }

  @Put('textures/:id')
  updateTexture(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTextureAdminDto,
  ) {
    return this.admin.updateTexture(admin.sub, id, {
      title: dto.title,
      previewImage: dto.previewImage,
      texturePath: dto.texturePath,
      normalMapPath: dto.normalMapPath,
      roughnessMapPath: dto.roughnessMapPath,
      isActive: dto.isActive,
    });
  }

  @Delete('textures/:id')
  deleteTexture(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.deleteTexture(admin.sub, id);
  }

  @Get('hardware')
  hardware() {
    return this.admin.hardwareTypes();
  }

  @Post('hardware')
  createHardware(
    @CurrentUser() admin: JwtUserPayload,
    @Body() dto: CreateHardwareTypeAdminDto,
  ) {
    return this.admin.createHardwareType(admin.sub, {
      category: dto.category,
      title: dto.title,
      subtype: dto.subtype,
      unit: dto.unit,
      price: new Prisma.Decimal(dto.price),
      metaJson: (dto.metaJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      isActive: dto.isActive ?? true,
    });
  }

  @Put('hardware/:id')
  updateHardware(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHardwareTypeAdminDto,
  ) {
    return this.admin.updateHardwareType(admin.sub, id, {
      category: dto.category,
      title: dto.title,
      subtype: dto.subtype,
      unit: dto.unit,
      price:
        dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
      metaJson:
        dto.metaJson === null
          ? Prisma.JsonNull
          : (dto.metaJson as Prisma.InputJsonValue | undefined),
      isActive: dto.isActive,
    });
  }

  @Delete('hardware/:id')
  deleteHardware(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.deleteHardwareType(admin.sub, id);
  }

  @Get('profiles')
  profiles() {
    return this.admin.hardwarePresets();
  }

  @Post('profiles')
  createProfile(
    @CurrentUser() admin: JwtUserPayload,
    @Body() dto: CreateHardwarePresetAdminDto,
  ) {
    return this.admin.createHardwarePreset(admin.sub, {
      title: dto.title,
      category: dto.category,
      configJson: dto.configJson as Prisma.InputJsonValue,
      isActive: dto.isActive ?? true,
    });
  }

  @Put('profiles/:id')
  updateProfile(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHardwarePresetAdminDto,
  ) {
    return this.admin.updateHardwarePreset(admin.sub, id, {
      title: dto.title,
      category: dto.category,
      configJson: dto.configJson as Prisma.InputJsonValue | undefined,
      isActive: dto.isActive,
    });
  }

  @Delete('profiles/:id')
  deleteProfile(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.deleteHardwarePreset(admin.sub, id);
  }

  @Get('tariffs')
  tariffs() {
    return this.admin.tariffs();
  }

  @Post('tariffs')
  createTariff(
    @CurrentUser() admin: JwtUserPayload,
    @Body() dto: CreateTariffAdminDto,
  ) {
    return this.admin.createTariff(admin.sub, {
      title: dto.title,
      code: dto.code,
      monthlyPrice: new Prisma.Decimal(dto.monthlyPrice),
      yearlyPrice:
        dto.yearlyPrice === undefined || dto.yearlyPrice === null
          ? undefined
          : new Prisma.Decimal(dto.yearlyPrice),
      maxProjects: dto.maxProjects ?? undefined,
      maxRenderPerMonth: dto.maxRenderPerMonth ?? undefined,
      maxExportPerMonth: dto.maxExportPerMonth ?? undefined,
      featuresJson: dto.featuresJson as Prisma.InputJsonValue | undefined,
      isActive: dto.isActive ?? true,
    });
  }

  @Put('tariffs/:id')
  updateTariff(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTariffAdminDto,
  ) {
    return this.admin.updateTariff(admin.sub, id, {
      title: dto.title,
      monthlyPrice:
        dto.monthlyPrice === undefined
          ? undefined
          : new Prisma.Decimal(dto.monthlyPrice),
      yearlyPrice:
        dto.yearlyPrice === undefined
          ? undefined
          : dto.yearlyPrice === null
            ? null
            : new Prisma.Decimal(dto.yearlyPrice),
      maxProjects: dto.maxProjects,
      maxRenderPerMonth: dto.maxRenderPerMonth,
      maxExportPerMonth: dto.maxExportPerMonth,
      featuresJson: dto.featuresJson as Prisma.InputJsonValue | undefined,
      isActive: dto.isActive,
    });
  }

  @Delete('tariffs/:id')
  deleteTariff(
    @CurrentUser() admin: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.deleteTariff(admin.sub, id);
  }

  @Get('settings')
  settings() {
    return this.admin.systemSettings();
  }

  @Post('settings')
  upsertSetting(
    @CurrentUser() admin: JwtUserPayload,
    @Body() dto: UpsertSystemSettingDto,
  ) {
    return this.admin.upsertSystemSetting(
      admin.sub,
      dto.key,
      dto.valueJson as Prisma.InputJsonValue,
    );
  }
}
