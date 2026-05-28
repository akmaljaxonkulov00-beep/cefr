import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MockPaymentsService } from './mock-payments.service';

@Controller('mock-payments')
export class MockPaymentsController {
  constructor(private readonly mockPaymentsService: MockPaymentsService) {}

  @Post('submit-check')
  @UseGuards(JwtAuthGuard)
  async submitCheck(@Request() req: any, @Body() dto: { mockPartId: string; checkImageUrl: string }) {
    return this.mockPaymentsService.submitCheck(req.user.userId, dto.mockPartId, dto.checkImageUrl);
  }

  @Get('check-access')
  @UseGuards(JwtAuthGuard)
  async checkAccess(@Query() query: { mockPartId: string }, @Request() req: any) {
    return this.mockPaymentsService.checkAccess(req.user.userId, query.mockPartId);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  async getPendingPayments() {
    return this.mockPaymentsService.getPendingPayments();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  async updateStatus(@Param('id') id: string, @Body() dto: { status: string; reason?: string }, @Request() req: any) {
    return this.mockPaymentsService.updateStatus(id, dto.status, dto.reason, req.user.userId);
  }

  @Get('student/history')
  @UseGuards(JwtAuthGuard)
  async getStudentPaymentHistory(@Request() req: any) {
    return this.mockPaymentsService.getStudentPaymentHistory(req.user.userId);
  }
}
