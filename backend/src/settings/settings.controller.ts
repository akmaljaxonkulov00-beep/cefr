import { Controller, Get, Put, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.settingsService.findAll();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  update(@Body() dto: any) {
    return this.settingsService.update(dto);
  }

  @Get('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  getPricing() {
    return this.settingsService.getPricing();
  }

  @Patch('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  updatePricing(@Body() dto: { cefrMockPrice?: number; ieltsMockPrice?: number }) {
    return this.settingsService.updatePricing(dto);
  }

  @Get('payment-cards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  getPaymentCards() {
    return this.settingsService.getPaymentCards();
  }

  @Post('payment-cards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  createPaymentCard(@Body() dto: any) {
    return this.settingsService.createPaymentCard(dto);
  }

  @Patch('payment-cards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  updatePaymentCard(@Param('id') id: string, @Body() dto: any) {
    return this.settingsService.updatePaymentCard(id, dto);
  }

  @Delete('payment-cards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  deletePaymentCard(@Param('id') id: string) {
    return this.settingsService.deletePaymentCard(id);
  }
}

@Controller('settings')
export class PublicSettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  getPricing() {
    return this.settingsService.getPricing();
  }

  @Patch('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  updatePricing(@Body() dto: { cefrMockPrice?: number; ieltsMockPrice?: number }) {
    return this.settingsService.updatePricing(dto);
  }

  @Get('payment-cards/active')
  getActivePaymentCard() {
    return this.settingsService.getActivePaymentCard();
  }
}
