import { Module } from '@nestjs/common';
import { IeltsService } from './ielts.service';
import { IeltsController } from './ielts.controller';
import { IeltsStudentService } from './ielts-student.service';
import { IeltsStudentController } from './ielts-student.controller';
import { IeltsPdfParserService } from './pdf-parser.service';
import { PrismaModule } from '../common/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [IeltsController, IeltsStudentController],
  providers: [IeltsService, IeltsStudentService, IeltsPdfParserService],
  exports: [IeltsService, IeltsStudentService],
})
export class IeltsModule {}
