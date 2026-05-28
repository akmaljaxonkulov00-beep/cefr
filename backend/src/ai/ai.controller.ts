import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('writing')
  analyzeWriting(@CurrentUser('id') userId: string, @Body() dto: { essay: string }) {
    return this.aiService.analyzeWriting(userId, dto.essay);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('speaking')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024 },
    }),
  )
  analyzeSpeakingUpload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Audio fayl (audio) yuklang');
    }
    return this.aiService.analyzeSpeakingFromAudio(
      userId,
      file.buffer,
      file.originalname || 'recording.webm',
      file.mimetype,
    );
  }

  /** @deprecated Prefer multipart /ai/speaking */
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('speaking-text')
  analyzeSpeakingJson(
    @CurrentUser('id') userId: string,
    @Body() dto: { audioUrl?: string; transcript: string },
  ) {
    return this.aiService.analyzeSpeakingFromTranscriptOnly(userId, dto.audioUrl, dto.transcript);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get('roadmap')
  generateRoadmap(@CurrentUser('id') userId: string) {
    return this.aiService.generateRoadmap(userId);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('cefr-predict')
  ceFrPrediction(@CurrentUser('id') userId: string, @Body() dto: { text: string }) {
    return this.aiService.ceFrPrediction(userId, dto.text);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('diagnostic-report')
  generateDiagnosticReport(@CurrentUser('id') userId: string, @Body() dto: {
    testType: 'IELTS' | 'CEFR';
    readingScore: number;
    listeningScore: number;
    writingText: string;
    speakingTranscript: string;
  }) {
    return this.aiService.generateDiagnosticReport(
      userId,
      dto.testType,
      dto.readingScore,
      dto.listeningScore,
      dto.writingText,
      dto.speakingTranscript,
    );
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024 },
    }),
  )
  async transcribeAudio(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Audio fayl (audio) yuklang');
    }
    return this.aiService.transcribeAudio(
      userId,
      file.buffer,
      file.originalname || 'recording.webm',
      file.mimetype,
    );
  }

  // IELTS Grading Endpoints
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('ielts-writing')
  gradeIELTSWriting(@CurrentUser('id') userId: string, @Body() dto: {
    taskType: 'TASK_1' | 'TASK_2';
    prompt: string;
    response: string;
    wordCount: number;
  }) {
    return this.aiService.gradeIELTSWriting(userId, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('ielts-speaking')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024 },
    }),
  )
  async gradeIELTSSpeaking(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { question: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Audio fayl (audio) yuklang');
    }
    return this.aiService.gradeIELTSSpeaking(
      userId,
      file.buffer,
      file.originalname || 'speaking.webm',
      file.mimetype,
      body.question,
    );
  }
}
