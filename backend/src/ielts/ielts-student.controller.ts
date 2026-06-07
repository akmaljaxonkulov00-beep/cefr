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
import { IeltsStudentService } from './ielts-student.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('ielts/student')
@UseGuards(JwtAuthGuard)
export class IeltsStudentController {
  constructor(private readonly ieltsStudentService: IeltsStudentService) {}

  @Get('mocks')
  async getActiveMocks(
    @Request() req: any,
    @Query('type') type?: 'Academic' | 'General',
    @Query('level') level?: 'B1' | 'B2' | 'C1' | 'C2',
  ) {
    return this.ieltsStudentService.getActiveMocks(type, level, req.user.id);
  }

  @Get('mocks/:id')
  async getMockForExam(@Param('id') id: string, @Request() req: any) {
    return this.ieltsStudentService.getMockForExam(id, req.user.id);
  }

  @Post('mocks/:id/start')
  async startAttempt(@Param('id') id: string, @Request() req: any) {
    return this.ieltsStudentService.startAttempt(id, req.user.id);
  }

  @Post('mocks/:id/save')
  async saveAnswers(@Param('id') id: string, @Body() answers: any, @Request() req: any) {
    return this.ieltsStudentService.saveAnswers(id, req.user.id, answers);
  }

  @Post('mocks/:id/submit')
  async submitAttempt(@Param('id') id: string, @Body() answers: any, @Request() req: any) {
    return this.ieltsStudentService.submitAttempt(id, req.user.id, answers);
  }

  @Get('mocks/:id/result')
  async getResult(@Param('id') id: string, @Request() req: any) {
    return this.ieltsStudentService.getResult(id, req.user.id);
  }
}
