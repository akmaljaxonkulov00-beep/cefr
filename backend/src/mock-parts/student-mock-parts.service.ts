import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StudentMockPartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any, studentId: string) {
    const { type, skill } = query;
    const where: any = {
      status: 'active',
    };

    if (type) where.type = type;
    if (skill) where.skill = skill;

    const parts = await this.prisma.mockPart.findMany({
      where,
      orderBy: { partNumber: 'asc' },
    });

    // Get user's attempts to show completion status
    const attempts = await this.prisma.mockPartAttempt.findMany({
      where: {
        studentId,
        status: 'COMPLETED',
      },
    });

    const completedPartIds = new Set(attempts.map((a: any) => a.mockPartId));

    return parts.map((part: any) => ({
      ...part,
      isCompleted: completedPartIds.has(part.id),
      questionCount: Array.isArray(part.questions) ? part.questions.length : 0,
      estimatedTime: Array.isArray(part.questions) ? part.questions.length * 1.5 : 0,
    }));
  }

  async findOne(id: string) {
    const part = await this.prisma.mockPart.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('Mock part topilmadi');
    }

    if (part.status !== 'ACTIVE') {
      throw new BadRequestException('Bu mock part hali nashr qilinmagan');
    }

    return part;
  }

  async start(partId: string, studentId: string) {
    const part = await this.findOne(partId);

    // Check if there's an in-progress attempt
    const existingAttempt = await this.prisma.mockPartAttempt.findFirst({
      where: {
        studentId,
        mockPartId: partId,
        status: 'IN_PROGRESS',
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    return this.prisma.mockPartAttempt.create({
      data: {
        studentId,
        mockPartId: partId,
        answers: {},
        score: 0,
        totalQuestions: Array.isArray(part.questions) ? part.questions.length : 0,
        status: 'IN_PROGRESS',
      },
    });
  }

  async saveAnswer(partId: string, studentId: string, dto: any) {
    const { questionId, answer } = dto;

    const attempt = await this.prisma.mockPartAttempt.findFirst({
      where: {
        studentId,
        mockPartId: partId,
        status: 'IN_PROGRESS',
      },
    });

    if (!attempt) {
      throw new NotFoundException('Jarayondagi urinish topilmadi');
    }

    const answers = attempt.answers as any || {};
    answers[questionId] = answer;

    return this.prisma.mockPartAttempt.update({
      where: { id: attempt.id },
      data: { answers },
    });
  }

  async submit(partId: string, studentId: string, dto: any) {
    const { answers } = dto;

    const attempt = await this.prisma.mockPartAttempt.findFirst({
      where: {
        studentId,
        mockPartId: partId,
        status: 'IN_PROGRESS',
      },
    });

    if (!attempt) {
      throw new NotFoundException('Jarayondagi urinish topilmadi');
    }

    const part = await this.findOne(partId);
    const questions = part.questions as any[] || [];

    // Calculate score
    let correctCount = 0;
    const questionResults: any[] = [];

    questions.forEach((q: any, index: number) => {
      const userAnswer = answers?.[q.id] || answers?.[index];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) correctCount++;

      questionResults.push({
        questionId: q.id,
        questionNumber: index + 1,
        userAnswer,
        correctAnswer: q.answer,
        isCorrect,
      });
    });

    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    return this.prisma.mockPartAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: { ...answers, questionResults },
        score,
        totalQuestions: questions.length,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async getResult(partId: string, studentId: string) {
    const attempt = await this.prisma.mockPartAttempt.findFirst({
      where: {
        studentId,
        mockPartId: partId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
    });

    if (!attempt) {
      throw new NotFoundException('Natija topilmadi');
    }

    const part = await this.findOne(partId);

    return {
      attempt,
      part,
      questionResults: (attempt.answers as any)?.questionResults || [],
    };
  }
}
