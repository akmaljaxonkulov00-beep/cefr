import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CefrStudentService } from './cefr-student.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('cefr/student')
@UseGuards(JwtAuthGuard)
export class CefrStudentController {
  constructor(private readonly cefrStudentService: CefrStudentService) {}

  @Get('mocks')
  async getActiveMocks(
    @Request() req: any,
    @Query('level') level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  ) {
    return this.cefrStudentService.getActiveMocks(level, req.user.id);
  }

  @Get('mocks/:id')
  async getMockForExam(@Param('id') id: string, @Request() req: any) {
    return this.cefrStudentService.getMockForExam(id, req.user.id);
  }

  @Post('mocks/:id/start')
  async startAttempt(@Param('id') id: string, @Request() req: any) {
    return this.cefrStudentService.startAttempt(id, req.user.id);
  }

  @Post('mocks/:id/save')
  async saveAnswers(@Param('id') id: string, @Body() answers: any, @Request() req: any) {
    return this.cefrStudentService.saveAnswers(id, req.user.id, answers);
  }

  @Post('mocks/:id/submit')
  async submitAttempt(@Param('id') id: string, @Body() answers: any, @Request() req: any) {
    return this.cefrStudentService.submitAttempt(id, req.user.id, answers);
  }

  @Get('mocks/:id/result')
  async getResult(@Param('id') id: string, @Request() req: any) {
    return this.cefrStudentService.getResult(id, req.user.id);
  }
}
