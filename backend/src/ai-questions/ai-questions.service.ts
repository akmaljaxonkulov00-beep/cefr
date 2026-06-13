import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AiQuestionsService {
  constructor(private prisma: PrismaService) {}

  // AI Speaking Questions
  async getSpeakingQuestions(filters?: { part?: number; cefrLevel?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.part) where.part = filters.part;
    if (filters?.cefrLevel) where.cefrLevel = filters.cefrLevel;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.aiSpeakingQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRandomSpeakingQuestion(part?: number, cefrLevel?: string) {
    const where: any = { isActive: true };
    if (part) where.part = part;
    if (cefrLevel) where.cefrLevel = cefrLevel;

    // Count total questions
    const count = await this.prisma.aiSpeakingQuestion.count({ where });
    
    if (count === 0) {
      throw new NotFoundException('Faol savollar topilmadi');
    }

    // Random index using Prisma
    const skip = Math.floor(Math.random() * count);
    const question = await this.prisma.aiSpeakingQuestion.findFirst({
      where,
      skip,
      take: 1,
    });

    if (!question) {
      throw new NotFoundException('Savol topilmadi');
    }

    return question;
  }

  async getSpeakingQuestionById(id: string) {
    const question = await this.prisma.aiSpeakingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');
    return question;
  }

  async createSpeakingQuestion(data: {
    part: number;
    cefrLevel: string;
    questionText: string;
    topicCard?: string;
    timeLimitSeconds?: number;
    isActive?: boolean;
  }) {
    return this.prisma.aiSpeakingQuestion.create({
      data,
    });
  }

  async updateSpeakingQuestion(id: string, data: Partial<{
    part: number;
    cefrLevel: string;
    questionText: string;
    topicCard: string;
    timeLimitSeconds: number;
    isActive: boolean;
  }>) {
    const question = await this.prisma.aiSpeakingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');

    return this.prisma.aiSpeakingQuestion.update({
      where: { id },
      data,
    });
  }

  async deleteSpeakingQuestion(id: string) {
    const question = await this.prisma.aiSpeakingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');

    await this.prisma.aiSpeakingQuestion.delete({ where: { id } });
    return { message: 'Savol o\'chirildi' };
  }

  async toggleSpeakingQuestionActive(id: string) {
    const question = await this.prisma.aiSpeakingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');

    return this.prisma.aiSpeakingQuestion.update({
      where: { id },
      data: { isActive: !question.isActive },
    });
  }

  async bulkDeleteSpeakingQuestions(ids: string[]) {
    await this.prisma.aiSpeakingQuestion.deleteMany({
      where: { id: { in: ids } },
    });
    return { message: `${ids.length} ta savol o\'chirildi` };
  }

  // AI Writing Questions
  async getWritingQuestions(filters?: { task?: number; cefrLevel?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.task) where.task = filters.task;
    if (filters?.cefrLevel) where.cefrLevel = filters.cefrLevel;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.aiWritingQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRandomWritingQuestion(task?: number, cefrLevel?: string) {
    const where: any = { isActive: true };
    if (task) where.task = task;
    if (cefrLevel) where.cefrLevel = cefrLevel;

    const questions = await this.prisma.aiWritingQuestion.findMany({ where });
    
    if (questions.length === 0) {
      throw new NotFoundException('Faol savollar topilmadi');
    }

    // Random question tanlash
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  async getWritingQuestionById(id: string) {
    const question = await this.prisma.aiWritingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');
    return question;
  }

  async createWritingQuestion(data: {
    task: number;
    cefrLevel: string;
    promptText: string;
    minWords?: number;
    maxWords?: number;
    sampleAnswer?: string;
    isActive?: boolean;
  }) {
    return this.prisma.aiWritingQuestion.create({
      data,
    });
  }

  async updateWritingQuestion(id: string, data: Partial<{
    task: number;
    cefrLevel: string;
    promptText: string;
    minWords: number;
    maxWords: number;
    sampleAnswer: string;
    isActive: boolean;
  }>) {
    const question = await this.prisma.aiWritingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');

    return this.prisma.aiWritingQuestion.update({
      where: { id },
      data,
    });
  }

  async deleteWritingQuestion(id: string) {
    const question = await this.prisma.aiWritingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');

    await this.prisma.aiWritingQuestion.delete({ where: { id } });
    return { message: 'Savol o\'chirildi' };
  }

  async toggleWritingQuestionActive(id: string) {
    const question = await this.prisma.aiWritingQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Savol topilmadi');

    return this.prisma.aiWritingQuestion.update({
      where: { id },
      data: { isActive: !question.isActive },
    });
  }

  async bulkDeleteWritingQuestions(ids: string[]) {
    await this.prisma.aiWritingQuestion.deleteMany({
      where: { id: { in: ids } },
    });
    return { message: `${ids.length} ta savol o\'chirildi` };
  }
}
