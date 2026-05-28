import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Ensure upload directories exist
const uploadDirs = ['./uploads/mocks', './uploads/listening', './uploads/reading', './uploads/writing', './uploads/speaking', './uploads/pdfs'];
uploadDirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'CENTER_ADMIN', 'SUPER_ADMIN')
  @Post()
  create(
    @Body()
    dto: {
      title: string;
      type: string;
      duration: number;
      level?: string;
      requiresPayment?: boolean;
      priceUzs?: number;
      paymentInstructions?: string;
      questions: any[];
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('centerId') centerId?: string,
  ) {
    return this.examsService.create({ ...dto, type: dto.type as any, createdBy: userId, centerId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/pdfs',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; type: string; duration: number; level?: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('centerId') centerId?: string,
  ) {
    return this.examsService.createFromPdf(file, body, userId, centerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('create-mock')
  createMock(
    @Body()
    dto: {
      title: string;
      duration: number;
      level: string;
      examType: 'CEFR' | 'IELTS';
      reading: { part: string; subPart?: string; passage: string; questions: any[] }[];
      listening: { part: string; subPart?: string; audioUrl?: string; questions: any[] }[];
      writing: { part: string; subPart?: string; task: string; prompt: string }[];
      speaking: { part: string; subPart?: string; questions: string[] }[];
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('centerId') centerId?: string,
  ) {
    return this.examsService.createMock(dto, userId, centerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('create-mock-with-files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/mocks',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createMockWithFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @CurrentUser('id') userId: string,
    @CurrentUser('centerId') centerId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Fayllar yuklanmadi');
    }

    // Parse the body data
    const dto = JSON.parse(body.data);
    
    // Process files and add URLs to the DTO
    const readingFiles = files.filter(f => f.fieldname === 'readingFiles');
    const listeningFiles = files.filter(f => f.fieldname === 'listeningFiles');
    const writingFiles = files.filter(f => f.fieldname === 'writingFiles');
    const speakingFiles = files.filter(f => f.fieldname === 'speakingFiles');

    // Add file URLs to the DTO
    if (listeningFiles.length > 0) {
      dto.listening = dto.listening || [];
      listeningFiles.forEach((file, index) => {
        if (dto.listening[index]) {
          dto.listening[index].audioUrl = `/uploads/mocks/${file.filename}`;
        }
      });
    }

    // For reading/writing/speaking, you might want to extract text from files
    // For now, we'll just store the file paths
    if (readingFiles.length > 0) {
      dto.readingFiles = readingFiles.map(f => `/uploads/mocks/${f.filename}`);
    }
    if (writingFiles.length > 0) {
      dto.writingFiles = writingFiles.map(f => `/uploads/mocks/${f.filename}`);
    }
    if (speakingFiles.length > 0) {
      dto.speakingFiles = speakingFiles.map(f => `/uploads/mocks/${f.filename}`);
    }

    return this.examsService.createMock(dto, userId, centerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('upload-mock-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Determine destination based on file type
          const ext = extname(file.originalname).toLowerCase();
          if (['.mp3', '.wav'].includes(ext)) {
            cb(null, './uploads/listening');
          } else if (['.pdf', '.docx'].includes(ext)) {
            cb(null, './uploads/pdfs');
          } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            cb(null, './uploads/pdfs');
          } else {
            cb(null, './uploads/mocks');
          }
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowedExts = ['.mp3', '.wav', '.pdf', '.docx', '.jpg', '.jpeg', '.png'];
        if (allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Faqat MP3, WAV, PDF, DOCX, JPG, PNG fayllar ruxsat etiladi'), false);
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async uploadMockFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type: 'CEFR' | 'IELTS'; section?: 'listening' | 'reading' | 'writing' | 'speaking' },
    @CurrentUser('id') userId: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fayl yuklanmadi');
      }

      // Determine file path based on where it was saved
      const filePath = file.path || file.filename;
      const ext = extname(file.originalname).toLowerCase();
      let fileUrl: string;
      
      if (['.mp3', '.wav'].includes(ext)) {
        fileUrl = `/uploads/listening/${file.filename}`;
      } else if (['.pdf', '.docx', '.jpg', '.jpeg', '.png'].includes(ext)) {
        fileUrl = `/uploads/pdfs/${file.filename}`;
      } else {
        fileUrl = `/uploads/mocks/${file.filename}`;
      }

      // Return file info - the service will handle saving to database
      return {
        success: true,
        fileUrl,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        section: body.section || 'general',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Mock faylni yuklashda xatolik: ${(error as Error).message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('upload-listening-audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads/listening',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a'];
        if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Faqat audio fayllar (MP3, WAV, M4A) ruxsat etiladi'), false);
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async uploadListeningAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { part: string; subPart?: string },
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Audio fayl yuklanmadi');
    }
    return {
      success: true,
      audioUrl: `/uploads/listening/${file.filename}`,
      part: body.part,
      subPart: body.subPart,
      originalName: file.originalname,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('upload-reading-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/pdfs',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allowedExts = ['.pdf', '.docx'];
        if (allowedMimes.includes(file.mimetype) || allowedExts.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Faqat PDF va DOCX fayllar ruxsat etiladi'), false);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    }),
  )
  async uploadReadingFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { part: string; subPart?: string },
    @CurrentUser('id') userId: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fayl yuklanmadi');
      }
      return {
        success: true,
        fileUrl: `/uploads/pdfs/${file.filename}`,
        part: body.part,
        subPart: body.subPart,
        originalName: file.originalname,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Reading faylni yuklashda xatolik: ${(error as Error).message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('upload-writing-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/pdfs',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allowedExts = ['.pdf', '.docx'];
        if (allowedMimes.includes(file.mimetype) || allowedExts.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Faqat PDF va DOCX fayllar ruxsat etiladi'), false);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    }),
  )
  async uploadWritingFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { part: string; subPart?: string },
    @CurrentUser('id') userId: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fayl yuklanmadi');
      }
      return {
        success: true,
        fileUrl: `/uploads/pdfs/${file.filename}`,
        part: body.part,
        subPart: body.subPart,
        originalName: file.originalname,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Writing faylni yuklashda xatolik: ${(error as Error).message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Post('upload-speaking-audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads/pdfs',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
        if (allowedMimes.includes(file.mimetype) || allowedExts.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Faqat PDF va JPG fayllar ruxsat etiladi'), false);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    }),
  )
  async uploadSpeakingAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { part: string; subPart?: string },
    @CurrentUser('id') userId: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fayl yuklanmadi');
      }
      return {
        success: true,
        fileUrl: `/uploads/pdfs/${file.filename}`,
        part: body.part,
        subPart: body.subPart,
        originalName: file.originalname,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Speaking faylni yuklashda xatolik: ${(error as Error).message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('type') type?: string, @CurrentUser('role') role?: string, @CurrentUser('centerId') centerId?: string) {
    return this.examsService.findAll(type as any, role, centerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('results/mine')
  getMyResults(@CurrentUser('id') userId: string) {
    return this.examsService.getResults(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Get('results/center')
  getCenterResults(@CurrentUser('centerId') centerId: string) {
    return this.examsService.getCenterResults(centerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'CENTER_ADMIN')
  @Get('admin/suspicious-results')
  suspiciousResults() {
    return this.examsService.listSuspiciousResults(80);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('admin/all-results')
  getAllResults() {
    return this.examsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Patch(':id/price')
  updateExamPrice(
    @Param('id') examId: string,
    @Body() body: { priceUzs: number },
    @CurrentUser('centerId') centerId?: string,
    @CurrentUser('role') role?: string,
  ) {
    return this.examsService.updateExamPrice(examId, body.priceUzs, role, centerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.examsService.findOneForUser(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  submitResult(
    @Param('id') examId: string,
    @Body()
    dto: {
      answers: any;
      score: number;
      cefrLevel?: string;
      integrityScore?: number;
      integrityReport?: Record<string, unknown>;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.submitResult({
      userId,
      examId,
      answers: dto.answers,
      score: dto.score,
      cefrLevel: dto.cefrLevel,
      integrityScore: dto.integrityScore,
      integrityReport: dto.integrityReport,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTER_ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  deleteExam(
    @Param('id') examId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('centerId') centerId?: string,
    @CurrentUser('role') role?: string,
  ) {
    return this.examsService.deleteExam(examId, userId, centerId, role);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/parts')
  getExamParts(@Param('id') examId: string) {
    return this.examsService.getExamParts(examId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/questions')
  getQuestionsByPart(
    @Param('id') examId: string,
    @Query('skill') skill: string,
    @Query('part') part: string,
  ) {
    return this.examsService.getQuestionsByPart(examId, skill, part);
  }
}
