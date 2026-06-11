import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { QuestionBankService } from './question-bank.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('question-bank')
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filters: {
    type?: 'speaking' | 'writing' | 'reading' | 'listening';
    examType?: 'CEFR' | 'IELTS';
    level?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    isActive?: boolean;
  }) {
    return this.questionBankService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.questionBankService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  async create(@Body() dto: any, @Request() req: any) {
    return this.questionBankService.create({
      ...dto,
      createdBy: req.user.id,
    });
  }

  @Post('upload-media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new Error('File not uploaded');
    }
    // This would integrate with StorageService - for now return placeholder
    return {
      url: `https://placeholder.com/${file.originalname}`,
      key: `uploads/${file.originalname}`,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.questionBankService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  async toggleStatus(@Param('id') id: string) {
    return this.questionBankService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  async delete(@Param('id') id: string) {
    return this.questionBankService.delete(id);
  }
}
