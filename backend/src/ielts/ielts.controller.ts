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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { IeltsService } from './ielts.service';
import { IeltsPdfParserService, ParsedMock } from './pdf-parser.service';
import { CreateIeltsMockDto } from './dto/create-ielts-mock.dto';
import {
  UpdateListeningSectionDto,
  UpdateReadingSectionDto,
  UpdateWritingSectionDto,
  UpdateSpeakingSectionDto,
} from './dto/update-ielts-section.dto';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('ielts')
@UseGuards(JwtAuthGuard)
export class IeltsController {
  constructor(
    private readonly ieltsService: IeltsService,
    private readonly storageService: StorageService,
    private readonly pdfParserService: IeltsPdfParserService,
  ) {}

  @Get('mocks')
  async getAllMocks(
    @Query('type') type?: 'Academic' | 'General',
    @Query('level') level?: 'B1' | 'B2' | 'C1' | 'C2',
    @Query('status') status?: 'draft' | 'published',
  ) {
    return this.ieltsService.getAllMocks(type, level, status);
  }

  @Post('mocks')
  async createMock(@Body() dto: CreateIeltsMockDto, @Request() req: any) {
    return this.ieltsService.createMock(dto, req.user.id);
  }

  @Get('mocks/:id')
  async getMockById(@Param('id') id: string) {
    return this.ieltsService.getMockById(id);
  }

  @Patch('mocks/:id')
  async updateMock(@Param('id') id: string, @Body() dto: Partial<CreateIeltsMockDto>) {
    return this.ieltsService.updateMock(id, dto);
  }

  @Delete('mocks/:id')
  async deleteMock(@Param('id') id: string) {
    return this.ieltsService.deleteMock(id);
  }

  @Patch('mocks/:id/status')
  async toggleStatus(@Param('id') id: string) {
    return this.ieltsService.toggleStatus(id);
  }

  @Post('mocks/:id/listening')
  async updateListeningSection(@Param('id') id: string, @Body() dto: UpdateListeningSectionDto) {
    return this.ieltsService.updateListeningSection(id, dto);
  }

  @Post('mocks/:id/reading')
  async updateReadingSection(@Param('id') id: string, @Body() dto: UpdateReadingSectionDto) {
    return this.ieltsService.updateReadingSection(id, dto);
  }

  @Post('mocks/:id/writing')
  async updateWritingSection(@Param('id') id: string, @Body() dto: UpdateWritingSectionDto) {
    return this.ieltsService.updateWritingSection(id, dto);
  }

  @Post('mocks/:id/speaking')
  async updateSpeakingSection(@Param('id') id: string, @Body() dto: UpdateSpeakingSectionDto) {
    return this.ieltsService.updateSpeakingSection(id, dto);
  }

  @Get('mocks/:id/results')
  async getMockResults(@Param('id') id: string) {
    return this.ieltsService.getMockResults(id);
  }

  @Patch('mocks/:id/results/:attemptId')
  async overrideScore(
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
    @Body() scores: any,
  ) {
    return this.ieltsService.overrideScore(id, attemptId, scores);
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
  async uploadPdf(@UploadedFile() file: Express.Multer.File): Promise<{ success: boolean; data: ParsedMock; fileName: string }> {
    if (!file || !file.buffer) {
      throw new Error('Fayl yuklanmadi');
    }

    try {
      const parsedData = await this.pdfParserService.parseIeltsMock(file.buffer);

      return {
        success: true,
        data: parsedData,
        fileName: file.originalname,
      };
    } catch (error: any) {
      console.error('PDF upload error:', error);
      throw new Error(`PDF parse xatosi: ${error.message || 'Noma\'lum xato'}`);
    }
  }
}
