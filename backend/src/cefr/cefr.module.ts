import { Module } from '@nestjs/common';
import { CefrService } from './cefr.service';
import { CefrController } from './cefr.controller';
import { CefrStudentService } from './cefr-student.service';
import { CefrStudentController } from './cefr-student.controller';
import { CefrPdfParserService } from './pdf-parser.service';
import { PrismaModule } from '../common/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [CefrController, CefrStudentController],
  providers: [CefrService, CefrStudentService, CefrPdfParserService],
  exports: [CefrService, CefrStudentService],
})
export class CefrModule {}
