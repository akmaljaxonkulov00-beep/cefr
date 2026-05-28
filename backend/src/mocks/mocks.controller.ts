import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MocksService } from './mocks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('mocks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MocksController {
  constructor(private mocksService: MocksService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.mocksService.findAll({ type, status, search, page, limit });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.mocksService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.mocksService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.mocksService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  delete(@Param('id') id: string) {
    return this.mocksService.delete(id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN')
  toggleStatus(@Param('id') id: string, @Body() body: { status: 'DRAFT' | 'ACTIVE' }) {
    return this.mocksService.toggleStatus(id, body.status);
  }

  @Post(':id/sections/listening')
  @Roles('SUPER_ADMIN')
  saveListeningSection(@Param('id') id: string, @Body() dto: any) {
    return this.mocksService.saveListeningSection(id, dto);
  }

  @Post(':id/sections/reading')
  @Roles('SUPER_ADMIN')
  saveReadingSection(@Param('id') id: string, @Body() dto: any) {
    return this.mocksService.saveReadingSection(id, dto);
  }

  @Post(':id/sections/writing')
  @Roles('SUPER_ADMIN')
  saveWritingSection(@Param('id') id: string, @Body() dto: any) {
    return this.mocksService.saveWritingSection(id, dto);
  }

  @Post(':id/sections/speaking')
  @Roles('SUPER_ADMIN')
  saveSpeakingSection(@Param('id') id: string, @Body() dto: any) {
    return this.mocksService.saveSpeakingSection(id, dto);
  }

  @Get(':id/results')
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  getResults(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.mocksService.getResults(id, { status, dateFrom, dateTo });
  }

  @Patch(':id/results/:submissionId/score')
  @Roles('SUPER_ADMIN')
  overrideScore(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: { listening?: number; reading?: number; writing?: number; speaking?: number },
  ) {
    return this.mocksService.overrideScore(id, submissionId, dto);
  }

  @Post(':id/results/:submissionId/certificate')
  @Roles('SUPER_ADMIN')
  issueCertificate(@Param('id') id: string, @Param('submissionId') submissionId: string) {
    return this.mocksService.issueCertificate(id, submissionId);
  }
}
