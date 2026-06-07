import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Get('revenue')
  getRevenue(
    @CurrentUser('id') userId: string, 
    @CurrentUser('role') role: string, 
    @CurrentUser('centerId') centerId: string,
    @Query('period') period: string = 'monthly'
  ) {
    return this.reportsService.getRevenue(userId, role, centerId, period);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Get('participation')
  getParticipation(@CurrentUser('id') userId: string, @CurrentUser('role') role: string, @CurrentUser('centerId') centerId: string) {
    return this.reportsService.getParticipation(userId, role, centerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('centers')
  getCentersReport() {
    return this.reportsService.getCentersReport();
  }
}
