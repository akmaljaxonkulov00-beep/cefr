import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MocksService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, status, search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type.toUpperCase();
    if (status === 'ACTIVE') where.isPublished = true;
    if (status === 'DRAFT') where.isPublished = false;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [mocks, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { results: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      mocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const mock = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    // Group questions by skill and part
    const sections = {
      listening: mock.questions.filter((q: any) => q.skill === 'LISTENING'),
      reading: mock.questions.filter((q: any) => q.skill === 'READING'),
      writing: mock.questions.filter((q: any) => q.skill === 'WRITING'),
      speaking: mock.questions.filter((q: any) => q.skill === 'SPEAKING'),
    };

    return {
      ...mock,
      sections,
      totalAttempts: mock._count.results,
    };
  }

  async create(dto: any, userId: string) {
    const { type, title, priceUzs, discountPrice, description, status } = dto;

    const mock = await this.prisma.exam.create({
      data: {
        title,
        type: type.toUpperCase() === 'IELTS' ? 'MOCK_IELTS' : 'MOCK_CEFR',
        duration: type.toUpperCase() === 'IELTS' ? 170 : 150,
        level: type.toUpperCase() === 'IELTS' ? '6.5' : 'B2',
        requiresPayment: true,
        priceUzs: Number(priceUzs),
        paymentInstructions: discountPrice ? `Chegirma narxi: ${discountPrice} UZS` : undefined,
        isPublished: status?.toUpperCase() === 'ACTIVE',
        createdBy: userId,
      },
    });

    return mock;
  }

  async update(id: string, dto: any) {
    const mock = await this.prisma.exam.findUnique({ where: { id } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.priceUzs) updateData.priceUzs = Number(dto.priceUzs);
    if (dto.discountPrice !== undefined) {
      updateData.paymentInstructions = dto.discountPrice ? `Chegirma narxi: ${dto.discountPrice} UZS` : null;
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.isPublished = dto.status.toUpperCase() === 'ACTIVE';

    return this.prisma.exam.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const mock = await this.prisma.exam.findUnique({ where: { id } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    await this.prisma.exam.delete({ where: { id } });
    return { success: true };
  }

  async toggleStatus(id: string, status: 'DRAFT' | 'ACTIVE') {
    const mock = await this.prisma.exam.findUnique({ where: { id } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    return this.prisma.exam.update({
      where: { id },
      data: { isPublished: status === 'ACTIVE' },
    });
  }

  async saveListeningSection(mockId: string, dto: any) {
    const mock = await this.prisma.exam.findUnique({ where: { id: mockId } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    // Delete existing listening questions
    await this.prisma.question.deleteMany({
      where: { examId: mockId, skill: 'LISTENING' },
    });

    // Create new listening questions
    const questions = [];
    let order = 1;

    for (const recording of dto.recordings || []) {
      // Add recording as a question
      questions.push({
        examId: mockId,
        question: `Listening Recording ${recording.part}: ${recording.title}`,
        type: 'MCQ' as any,
        passage: recording.audioUrl,
        skill: 'LISTENING',
        part: recording.part,
        order: order++,
      });

      // Add questions for this recording
      for (const q of recording.questions || []) {
        questions.push({
          examId: mockId,
          question: q.text,
          type: q.type as any,
          options: q.options,
          answer: q.answer,
          skill: 'LISTENING',
          part: recording.part,
          order: order++,
        });
      }
    }

    await this.prisma.question.createMany({ data: questions });
    return { success: true, questionsCount: questions.length };
  }

  async saveReadingSection(mockId: string, dto: any) {
    const mock = await this.prisma.exam.findUnique({ where: { id: mockId } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    // Delete existing reading questions
    await this.prisma.question.deleteMany({
      where: { examId: mockId, skill: 'READING' },
    });

    // Create new reading questions
    const questions = [];
    let order = 1;

    for (const passage of dto.passages || []) {
      // Add passage as a question
      questions.push({
        examId: mockId,
        question: `Reading Passage ${passage.part}: ${passage.title}`,
        type: 'MCQ' as any,
        passage: passage.content,
        skill: 'READING',
        part: passage.part,
        order: order++,
      });

      // Add questions for this passage
      for (const q of passage.questions || []) {
        questions.push({
          examId: mockId,
          question: q.text,
          type: q.type as any,
          options: q.options,
          answer: q.answer,
          skill: 'READING',
          part: passage.part,
          order: order++,
        });
      }
    }

    await this.prisma.question.createMany({ data: questions });
    return { success: true, questionsCount: questions.length };
  }

  async saveWritingSection(mockId: string, dto: any) {
    const mock = await this.prisma.exam.findUnique({ where: { id: mockId } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    // Delete existing writing questions
    await this.prisma.question.deleteMany({
      where: { examId: mockId, skill: 'WRITING' },
    });

    // Create new writing questions
    const questions = [];
    let order = 1;

    for (const task of dto.tasks || []) {
      questions.push({
        examId: mockId,
        question: task.prompt,
        type: 'ESSAY' as any,
        passage: task.instruction,
        skill: 'WRITING',
        part: task.part,
        order: order++,
      });
    }

    await this.prisma.question.createMany({ data: questions });
    return { success: true, questionsCount: questions.length };
  }

  async saveSpeakingSection(mockId: string, dto: any) {
    const mock = await this.prisma.exam.findUnique({ where: { id: mockId } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    // Delete existing speaking questions
    await this.prisma.question.deleteMany({
      where: { examId: mockId, skill: 'SPEAKING' },
    });

    // Create new speaking questions
    const questions = [];
    let order = 1;

    for (const part of dto.parts || []) {
      for (const q of part.questions || []) {
        questions.push({
          examId: mockId,
          question: q.text,
          type: 'SPEAKING' as any,
          options: part.imageUrl ? [part.imageUrl] : undefined,
          skill: 'SPEAKING',
          part: part.part,
          order: order++,
        });
      }
    }

    await this.prisma.question.createMany({ data: questions });
    return { success: true, questionsCount: questions.length };
  }

  async getResults(mockId: string, filters: any) {
    const mock = await this.prisma.exam.findUnique({ where: { id: mockId } });
    if (!mock) {
      throw new NotFoundException('Mock topilmadi');
    }

    const where: any = { examId: mockId };
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.startedAt = {};
      if (filters.dateFrom) where.startedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.startedAt.lte = new Date(filters.dateTo);
    }

    const sessions = await this.prisma.result.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return sessions;
  }

  async overrideScore(mockId: string, submissionId: string, dto: any) {
    const session = await this.prisma.result.findFirst({
      where: { id: submissionId, examId: mockId },
    });

    if (!session) {
      throw new NotFoundException('Natija topilmadi');
    }

    const skillScores = (session.skillScores as any) || {};
    if (dto.listening !== undefined) skillScores.listening = dto.listening;
    if (dto.reading !== undefined) skillScores.reading = dto.reading;
    if (dto.writing !== undefined) skillScores.writing = dto.writing;
    if (dto.speaking !== undefined) skillScores.speaking = dto.speaking;

    // Recalculate total score
    const scores = Object.values(skillScores).filter((s) => s !== null && s !== undefined) as number[];
    const totalScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

    return this.prisma.result.update({
      where: { id: submissionId },
      data: {
        skillScores,
        score: totalScore,
      },
    });
  }

  async issueCertificate(mockId: string, submissionId: string) {
    const session = await this.prisma.result.findFirst({
      where: { id: submissionId, examId: mockId },
    });

    if (!session) {
      throw new NotFoundException('Natija topilmadi');
    }

    // Store certificate info in skillScores since there's no dedicated field
    const skillScores = (session.skillScores as any) || {};
    skillScores.certificateIssued = true;

    return this.prisma.result.update({
      where: { id: submissionId },
      data: { skillScores },
    });
  }
}
