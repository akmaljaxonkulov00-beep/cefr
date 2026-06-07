import { Module } from '@nestjs/common';
import { MockPartsController } from './mock-parts.controller';
import { MockPartsService } from './mock-parts.service';
import { StudentMockPartsController } from './student-mock-parts.controller';
import { StudentMockPartsService } from './student-mock-parts.service';
import { PrismaModule } from '../common/prisma.module';
import { MockPaymentsModule } from '../mock-payments/mock-payments.module';

@Module({
  imports: [PrismaModule, MockPaymentsModule],
  controllers: [MockPartsController, StudentMockPartsController],
  providers: [MockPartsService, StudentMockPartsService],
  exports: [MockPartsService, StudentMockPartsService],
})
export class MockPartsModule {}
