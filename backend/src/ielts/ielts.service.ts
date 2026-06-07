import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateIeltsMockDto } from './dto/create-ielts-mock.dto';
import {
  UpdateListeningSectionDto,
  UpdateReadingSectionDto,
  UpdateWritingSectionDto,
  UpdateSpeakingSectionDto,
} from './dto/update-ielts-section.dto';

@Injectable()
export class IeltsService {
  constructor(private prisma: PrismaService) {}

  async getAllMocks(type?: 'Academic' | 'General', level?: 'B1' | 'B2' | 'C1' | 'C2', status?: 'draft' | 'published') {
    const where: any = {};
    if (type) where.type = type;
    if (level) where.level = level;
    if (status) where.status = status;

    return (this.prisma as any).ieltsMock.findMany({
      where,
      include: {
        listening: true,
        reading: true,
        writing: true,
        speaking: true,
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMockById(id: string) {
    const mock = await (this.prisma as any).ieltsMock.findUnique({
      where: { id },
      include: {
        listening: true,
        reading: true,
        writing: true,
        speaking: true,
      },
    });

    if (!mock) {
      throw new NotFoundException('IELTS mock not found');
    }

    return mock;
  }

  async createMock(dto: CreateIeltsMockDto, userId: string) {
    return (this.prisma as any).ieltsMock.create({
      data: {
        title: dto.title,
        type: dto.type,
        level: dto.level,
        description: dto.description,
        duration: dto.duration,
        price: dto.price || 0,
        isPaid: dto.isPaid || false,
        status: 'draft',
      },
    });
  }

  async updateMock(id: string, dto: Partial<CreateIeltsMockDto>) {
    const mock = await this.getMockById(id);
    return (this.prisma as any).ieltsMock.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMock(id: string) {
    await this.getMockById(id);
    return (this.prisma as any).ieltsMock.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string) {
    const mock = await this.getMockById(id);
    const newStatus = mock.status === 'draft' ? 'published' : 'draft';
    return (this.prisma as any).ieltsMock.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async updateListeningSection(id: string, dto: UpdateListeningSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).ieltsListening.upsert({
      where: { mockId: id },
      create: {
        mockId: id,
        duration: dto.duration || 40,
        sections: dto.sections || [],
      },
      update: {
        duration: dto.duration,
        sections: dto.sections,
      },
    });
  }

  async updateReadingSection(id: string, dto: UpdateReadingSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).ieltsReading.upsert({
      where: { mockId: id },
      create: {
        mockId: id,
        duration: dto.duration || 60,
        passages: dto.passages || [],
      },
      update: {
        duration: dto.duration,
        passages: dto.passages,
      },
    });
  }

  async updateWritingSection(id: string, dto: UpdateWritingSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).ieltsWriting.upsert({
      where: { mockId: id },
      create: {
        mockId: id,
        duration: dto.duration || 60,
        task1: dto.task1 || {},
        task2: dto.task2 || {},
        aiWeights: dto.aiWeights || {
          taskAchievement: 25,
          coherence: 25,
          lexical: 25,
          grammar: 25,
        },
      },
      update: {
        duration: dto.duration,
        task1: dto.task1,
        task2: dto.task2,
        aiWeights: dto.aiWeights,
      },
    });
  }

  async updateSpeakingSection(id: string, dto: UpdateSpeakingSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).ieltsSpeaking.upsert({
      where: { mockId: id },
      create: {
        mockId: id,
        part1: dto.part1 || { questions: [] },
        part2: dto.part2 || { topic: '', prepTime: 60, speakTime: 120 },
        part3: dto.part3 || { questions: [] },
      },
      update: {
        part1: dto.part1,
        part2: dto.part2,
        part3: dto.part3,
      },
    });
  }

  async getMockResults(id: string) {
    await this.getMockById(id);
    return (this.prisma as any).ieltsAttempt.findMany({
      where: { mockId: id },
      include: {
        mock: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async overrideScore(mockId: string, attemptId: string, scores: any) {
    const attempt = await (this.prisma as any).ieltsAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.mockId !== mockId) {
      throw new NotFoundException('Attempt not found');
    }

    const totalBand = (
      (scores.listeningScore || 0) +
      (scores.readingScore || 0) +
      (scores.writingScore || 0) +
      (scores.speakingScore || 0)
    ) / 4;

    return (this.prisma as any).ieltsAttempt.update({
      where: { id: attemptId },
      data: {
        ...scores,
        totalBand: Math.round(totalBand * 2) / 2,
      },
    });
  }
}
