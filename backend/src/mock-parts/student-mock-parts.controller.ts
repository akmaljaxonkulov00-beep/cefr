import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MockAccessGuard } from '../common/guards/mock-access.guard';
import { StudentMockPartsService } from './student-mock-parts.service';

@Controller('student/mock-parts')
@UseGuards(JwtAuthGuard)
export class StudentMockPartsController {
  constructor(private readonly studentMockPartsService: StudentMockPartsService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return this.studentMockPartsService.findAll(query, req.user.userId);
  }

  @Get(':id')
  @UseGuards(MockAccessGuard)
  async findOne(@Param('id') id: string) {
    return this.studentMockPartsService.findOne(id);
  }

  @Post(':id/start')
  @UseGuards(MockAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async start(@Param('id') id: string, @Request() req: any) {
    return this.studentMockPartsService.start(id, req.user.userId);
  }

  @Post(':id/answer')
  async saveAnswer(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.studentMockPartsService.saveAnswer(id, req.user.userId, dto);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.studentMockPartsService.submit(id, req.user.userId, dto);
  }

  @Get(':id/result')
  async getResult(@Param('id') id: string, @Request() req: any) {
    return this.studentMockPartsService.getResult(id, req.user.userId);
  }
}
