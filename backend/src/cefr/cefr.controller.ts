import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { CefrService } from './cefr.service';
import { CefrPdfParserService } from './pdf-parser.service';
import { CreateCefrMockDto } from './dto/create-cefr-mock.dto';
import {
  UpdateListeningSectionDto,
  UpdateReadingSectionDto,
  UpdateWritingSectionDto,
  UpdateSpeakingSectionDto,
} from './dto/update-cefr-section.dto';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('cefr')
@UseGuards(JwtAuthGuard)
export class CefrController {
  constructor(
    private readonly cefrService: CefrService,
    private readonly storageService: StorageService,
    private readonly pdfParserService: CefrPdfParserService,
  ) {}

  @Get('mocks')
  async getAllMocks(
    @Query('level') level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
    @Query('status') status?: 'draft' | 'published',
  ) {
    return this.cefrService.getAllMocks(level, status);
  }

  @Post('mocks')
  async createMock(@Body() dto: CreateCefrMockDto, @Request() req: any) {
    return this.cefrService.createMock(dto, req.user.id);
  }

  @Get('mocks/:id')
  async getMockById(@Param('id') id: string) {
    return this.cefrService.getMockById(id);
  }

  @Patch('mocks/:id')
  async updateMock(@Param('id') id: string, @Body() dto: Partial<CreateCefrMockDto>) {
    return this.cefrService.updateMock(id, dto);
  }

  @Delete('mocks/:id')
  async deleteMock(@Param('id') id: string) {
    return this.cefrService.deleteMock(id);
  }

  @Patch('mocks/:id/status')
  async toggleStatus(@Param('id') id: string) {
    return this.cefrService.toggleStatus(id);
  }

  @Post('mocks/:id/listening')
  async updateListening(@Param('id') id: string, @Body() dto: UpdateListeningSectionDto) {
    return this.cefrService.updateListening(id, dto);
  }

  @Post('mocks/:id/reading')
  async updateReading(@Param('id') id: string, @Body() dto: UpdateReadingSectionDto) {
    return this.cefrService.updateReading(id, dto);
  }

  @Post('mocks/:id/writing')
  async updateWriting(@Param('id') id: string, @Body() dto: UpdateWritingSectionDto) {
    return this.cefrService.updateWriting(id, dto);
  }

  @Post('mocks/:id/speaking')
  async updateSpeaking(@Param('id') id: string, @Body() dto: UpdateSpeakingSectionDto) {
    return this.cefrService.updateSpeaking(id, dto);
  }

  @Get('mocks/:id/results')
  async getMockResults(@Param('id') id: string) {
    return this.cefrService.getMockResults(id);
  }

  @Patch('mocks/:id/results/:attemptId')
  async overrideScore(
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
    @Body() scores: any,
  ) {
    return this.cefrService.overrideScore(id, attemptId, scores);
  }

  @Post('upload/audio')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB
  }))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('Fayl yuklanmadi');
    }
    const saved = await this.storageService.saveListeningAudio(file.buffer, file.mimetype, file.originalname);
    return {
      success: true,
      key: saved.storageKey,
      url: saved.publicUrl,
      filename: saved.filename
    };
  }

  @Post('upload/file')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('No file uploaded');
    }
    const { storageKey, publicUrl, extractedText } = await this.storageService.saveReadingFile(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    return { url: publicUrl, storageKey, text: extractedText };
  }

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('Fayl yuklanmadi');
    }
    const saved = await this.storageService.saveMockImage(file.buffer, file.mimetype, file.originalname);
    return {
      url: saved.publicUrl,
      filename: saved.filename
    };
  }

  @Post('upload/pdf')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Faqat PDF fayl qabul qilinadi'), false);
      }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  }))
  async uploadCefrPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Fayl yuklanmadi');
    }
    try {
      // Simple file save without parsing PDF
      const fileName = `cefr-pdf-${Date.now()}-${file.originalname}`;
      const storageKey = `reading/${fileName}`;
      const publicUrl = `/uploads/${storageKey}`;
      
      // Save file to disk
      const fs = require('fs/promises');
      const path = require('path');
      const uploadRoot = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads');
      const fullPath = path.join(uploadRoot, storageKey);
      
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.buffer);

      return {
        success: true,
        key: storageKey,
        url: publicUrl,
        fileName: file.originalname,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        parsed: this.cefrService.getDefaultStructure()
      };
    }
  }
}
