import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { CentersService } from './centers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('centers')
export class CentersController {
  constructor(private centersService: CentersService) {}

  @Get()
  findAll() {
    return this.centersService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.centersService.findOne(id);
  }

  @Get(':id/limit')
  async getCenterLimit(@Param('id') id: string) {
    const center = await this.centersService.getCenterLimit(id);
    return center || { mockLimit: 100 };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('admin')
  findAllAdmin() {
    return this.centersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post()
  create(@Body() dto: { name: string; address?: string; mockLimit?: number; adminEmail?: string; adminPassword?: string }) {
    return this.centersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post(':centerId/users/:userId')
  assign(@Param('centerId') centerId: string, @Param('userId') userId: string) {
    return this.centersService.assignUser(centerId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post(':centerId/admin')
  createCenterAdmin(@Param('centerId') centerId: string, @Body() dto: { email: string; password: string; name: string }) {
    return this.centersService.createCenterAdmin(centerId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.centersService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Patch(':id/limit')
  updateLimit(@Param('id') id: string, @Body() dto: { mockLimit: number }) {
    return this.centersService.updateLimit(id, dto.mockLimit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { name?: string; address?: string; phone?: string; email?: string; mockLimit?: number; adminPassword?: string; paymentInstructions?: string }) {
    return this.centersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/vip')
  toggleVip(@Param('id') id: string, @Body() dto: { isVip: boolean }) {
    return this.centersService.toggleVip(id, dto.isVip);
  }
}
