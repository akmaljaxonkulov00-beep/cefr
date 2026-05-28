import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { ExamSessionsController } from './exam-sessions.controller';
import { ExamSessionsService } from './exam-sessions.service';
import { ManualPaymentsModule } from '../manual-payments/manual-payments.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ManualPaymentsModule, AiModule],
  controllers: [ExamsController, ExamSessionsController],
  providers: [ExamsService, ExamSessionsService],
  exports: [ExamsService],
})
export class ExamsModule {}
