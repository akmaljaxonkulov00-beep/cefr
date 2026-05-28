import { Module } from '@nestjs/common';
import { MockPartsController } from './mock-parts.controller';
import { MockPartsService } from './mock-parts.service';
import { StudentMockPartsController } from './student-mock-parts.controller';
import { StudentMockPartsService } from './student-mock-parts.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MockPartsController, StudentMockPartsController],
  providers: [MockPartsService, StudentMockPartsService],
  exports: [MockPartsService, StudentMockPartsService],
})
export class MockPartsModule {}
