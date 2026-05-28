import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ExamSessionsService } from './exam-sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
export class ExamSessionsController {
  constructor(private examSessionsService: ExamSessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  startExam(
    @Param('id') examId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examSessionsService.startExamSession(userId, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session/:resultId')
  getSession(
    @Param('resultId') resultId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examSessionsService.getSessionState(resultId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('session/:resultId/answer')
  submitAnswer(
    @Param('resultId') resultId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: {
      questionId: string;
      answer: string;
      timeSpent?: number;
    },
  ) {
    return this.examSessionsService.submitAnswer(
      resultId,
      userId,
      dto.questionId,
      dto.answer,
      dto.timeSpent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('session/:resultId/submit')
  submitExam(
    @Param('resultId') resultId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: {
      answers: Record<string, string>;
      timeSpent: number;
    },
  ) {
    return this.examSessionsService.submitExam(
      resultId,
      userId,
      dto.answers,
      dto.timeSpent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('session/:resultId/proctor')
  logProctorEvent(
    @Param('resultId') resultId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: {
      eventType: string;
      details?: any;
      screenshot?: string;
    },
  ) {
    return this.examSessionsService.logProctorEvent(
      userId,
      resultId,
      dto.eventType,
      dto.details,
      dto.screenshot,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('session/:resultId/timer')
  getTimer(
    @Param('resultId') resultId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examSessionsService.getSessionState(resultId, userId);
  }
}
