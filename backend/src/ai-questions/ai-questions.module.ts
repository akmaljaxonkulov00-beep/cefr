import { Module } from '@nestjs/common';
import { AiQuestionsController } from './ai-questions.controller';
import { AiQuestionsService } from './ai-questions.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AiQuestionsController],
  providers: [AiQuestionsService, PrismaService],
  exports: [AiQuestionsService],
})
export class AiQuestionsModule {}
