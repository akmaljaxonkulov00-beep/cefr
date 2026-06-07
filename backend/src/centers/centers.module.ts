import { Module } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CentersController } from './centers.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CentersController],
  providers: [CentersService],
  exports: [CentersService],
})
export class CentersModule {}
