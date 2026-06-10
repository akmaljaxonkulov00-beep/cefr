import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class QuestionBankService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    type?: 'speaking' | 'writing' | 'reading' | 'listening';
    examType?: 'CEFR' | 'IELTS';
    level?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    isActive?: boolean;
  }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.examType) where.examType = filters.examType;
    if (filters.level) where.level = filters.level;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.questionBank.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.questionBank.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async create(dto: {
    type: 'speaking' | 'writing' | 'reading' | 'listening';
    examType: 'CEFR' | 'IELTS';
    level?: string;
    title: string;
    content: any;
    mediaUrl?: string;
    mediaKey?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    createdBy: string;
  }) {
    return this.prisma.questionBank.create({
      data: {
        type: dto.type,
        examType: dto.examType,
        level: dto.level,
        title: dto.title,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        mediaKey: dto.mediaKey,
        difficulty: dto.difficulty,
        tags: dto.tags || [],
        isActive: true,
        createdBy: dto.createdBy,
      },
    });
  }

  async update(id: string, dto: {
    type?: 'speaking' | 'writing' | 'reading' | 'listening';
    examType?: 'CEFR' | 'IELTS';
    level?: string;
    title?: string;
    content?: any;
    mediaUrl?: string;
    mediaKey?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    isActive?: boolean;
  }) {
    await this.findOne(id);

    return this.prisma.questionBank.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.questionBank.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string) {
    const question = await this.findOne(id);
    const newStatus = !question.isActive;

    return this.prisma.questionBank.update({
      where: { id },
      data: { isActive: newStatus },
    });
  }
}
