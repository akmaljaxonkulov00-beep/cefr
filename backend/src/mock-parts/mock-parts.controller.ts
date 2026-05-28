import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MockPartsService } from './mock-parts.service';

@Controller('mock-parts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CENTER_ADMIN')
export class MockPartsController {
  constructor(private readonly mockPartsService: MockPartsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.mockPartsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mockPartsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: any) {
    return this.mockPartsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.mockPartsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.mockPartsService.delete(id);
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.mockPartsService.toggleStatus(id, dto.status);
  }
}
