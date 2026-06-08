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
import { diskStorage } from 'multer';
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
    storage: diskStorage({
      destination: './uploads/audio',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `audio-${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB
  }))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Fayl yuklanmadi');
    }
    return {
      url: `http://localhost:4000/uploads/audio/${file.filename}`,
      filename: file.filename
    };
  }

  @Post('upload/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
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
    storage: diskStorage({
      destination: './uploads/images',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `img-${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Fayl yuklanmadi');
    }
    return {
      url: `http://localhost:4000/uploads/images/${file.filename}`,
      filename: file.filename
    };
  }

  @Post('upload/pdf')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/pdf',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `ielts-${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
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
    if (!file) {
      throw new Error('Fayl yuklanmadi');
    }
    
    try {
      const fs = require('fs');
      const dataBuffer = fs.readFileSync(file.path);
      const parsedData = await this.pdfParserService.parseIeltsMock(dataBuffer);
      
      return {
        success: true,
        data: parsedData,
        fileName: file.filename,
      };
    } catch (error: any) {
      console.error('PDF upload error:', error);
      throw new Error(`PDF parse xatosi: ${error.message || 'Noma\'lum xato'}`);
    }
  }
}
