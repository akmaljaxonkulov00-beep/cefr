import { Module } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { QuestionBankController } from './question-bank.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [QuestionBankController],
  providers: [QuestionBankService, PrismaService],
  exports: [QuestionBankService],
})
export class QuestionBankModule {}
