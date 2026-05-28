import { Module } from '@nestjs/common';
import { MockPaymentsController } from './mock-payments.controller';
import { MockPaymentsService } from './mock-payments.service';
import { PrismaModule } from '../common/prisma.module';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, AiModule, StorageModule],
  controllers: [MockPaymentsController],
  providers: [MockPaymentsService],
  exports: [MockPaymentsService],
})
export class MockPaymentsModule {}
