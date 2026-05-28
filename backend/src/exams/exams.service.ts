import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ExamType } from '@prisma/client';
import { ManualPaymentsService } from '../manual-payments/manual-payments.service';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private manualPayments: ManualPaymentsService,
  ) {}

  async create(dto: {
    title: string;
    type: ExamType | string;
    duration: number;
    level?: string;
    createdBy: string;
    centerId?: string;
    requiresPayment?: boolean;
    priceUzs?: number;
    paymentInstructions?: string;
    questions: { question: string; type: string; options?: any; answer?: string; order?: number; passage?: string; skill?: string; part?: string; subPart?: string }[];
  }) {
    // Convert type string to valid ExamType
    let examType: ExamType;
    const typeStr = dto.type.toUpperCase();
    
    if (typeStr === 'CEFR') {
      examType = 'MOCK_CEFR' as ExamType;
    } else if (typeStr === 'IELTS') {
      examType = 'MOCK_IELTS' as ExamType;
    } else if (typeStr === 'IELTS_ACADEMIC') {
      examType = 'IELTS_ACADEMIC' as ExamType;
    } else if (typeStr === 'IELTS_GENERAL') {
      examType = 'IELTS_GENERAL' as ExamType;
    } else if (typeStr === 'CEFR_B1') {
      examType = 'CEFR_B1' as ExamType;
    } else if (typeStr === 'CEFR_B2') {
      examType = 'CEFR_B2' as ExamType;
    } else if (typeStr === 'CEFR_C1') {
      examType = 'CEFR_C1' as ExamType;
    } else {
      examType = dto.type as ExamType;
    }

    const exam = await this.prisma.exam.create({
      data: {
        title: dto.title,
        type: examType,
        duration: dto.duration,
        level: dto.level,
        createdBy: dto.createdBy,
        centerId: dto.centerId,
        requiresPayment: dto.requiresPayment ?? true,
        priceUzs: dto.priceUzs,
        paymentInstructions: dto.paymentInstructions,
        questions: {
          create: dto.questions.map((q, i) => ({
            question: q.question,
            type: q.type as any,
            options: q.options || null,
            answer: q.answer || null,
            order: q.order ?? i + 1,
            passage: q.passage || null,
            skill: q.skill || null,
            part: q.part || null,
            subPart: q.subPart || null,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    return exam;
  }

  async createFromPdf(file: Express.Multer.File, body: { title: string; type: string; duration: number; level?: string }, userId: string, centerId?: string) {
    // For now, just create a placeholder exam with the PDF file info
    // In production, you would use a PDF parsing library to extract questions
    const exam = await this.prisma.exam.create({
      data: {
        title: body.title,
        type: body.type as ExamType,
        duration: body.duration,
        level: body.level,
        createdBy: userId,
        centerId: centerId,
        requiresPayment: true,
        paymentInstructions: `PDF file uploaded: ${file.filename}`,
        questions: {
          create: [
            {
              question: 'PDF savol 1 (PDF parsing required)',
              type: 'MCQ',
              options: ['A', 'B', 'C', 'D'],
              answer: 'A',
              order: 1,
            },
            {
              question: 'PDF savol 2 (PDF parsing required)',
              type: 'MCQ',
              options: ['A', 'B', 'C', 'D'],
              answer: 'B',
              order: 2,
            },
          ],
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    return exam;
  }

  async createMock(dto: {
    title: string;
    duration: number;
    level: string;
    examType: 'CEFR' | 'IELTS';
    reading: { part: string; subPart?: string; passage: string; questions: any[] }[];
    listening: { part: string; subPart?: string; audioUrl?: string; questions: any[] }[];
    writing: { part: string; subPart?: string; task: string; prompt: string }[];
    speaking: { part: string; subPart?: string; questions: string[] }[];
  }, userId: string, centerId?: string) {
    const questions: any[] = [];
    let order = 1;

    // Reading questions with parts
    dto.reading.forEach((section) => {
      questions.push({
        question: `Reading Part ${section.part}${section.subPart ? `.${section.subPart}` : ''}`,
        type: 'PASSAGE',
        passage: section.passage,
        skill: 'READING',
        part: section.part,
        subPart: section.subPart,
        order: order++,
      });
      section.questions.forEach((q) => {
        questions.push({
          question: q.question,
          type: q.type || 'MCQ',
          options: q.options,
          answer: q.answer,
          skill: 'READING',
          part: section.part,
          subPart: section.subPart,
          order: order++,
        });
      });
    });

    // Listening questions with parts
    dto.listening.forEach((section) => {
      questions.push({
        question: `Listening Part ${section.part}${section.subPart ? `.${section.subPart}` : ''}`,
        type: 'AUDIO',
        passage: section.audioUrl,
        skill: 'LISTENING',
        part: section.part,
        subPart: section.subPart,
        order: order++,
      });
      section.questions.forEach((q) => {
        questions.push({
          question: q.question,
          type: q.type || 'MCQ',
          options: q.options,
          answer: q.answer,
          skill: 'LISTENING',
          part: section.part,
          subPart: section.subPart,
          order: order++,
        });
      });
    });

    // Writing tasks with parts
    dto.writing.forEach((task) => {
      questions.push({
        question: task.task,
        type: 'WRITING',
        passage: task.prompt,
        skill: 'WRITING',
        part: task.part,
        subPart: task.subPart,
        order: order++,
      });
    });

    // Speaking parts with parts
    dto.speaking.forEach((part) => {
      questions.push({
        question: `Speaking Part ${part.part}${part.subPart ? `.${part.subPart}` : ''}`,
        type: 'SPEAKING',
        options: part.questions,
        skill: 'SPEAKING',
        part: part.part,
        subPart: part.subPart,
        order: order++,
      });
    });

    const exam = await this.prisma.exam.create({
      data: {
        title: dto.title,
        type: dto.examType === 'CEFR' ? 'MOCK_CEFR' : 'MOCK_IELTS' as ExamType,
        duration: dto.duration,
        level: dto.level,
        createdBy: userId,
        centerId: centerId,
        requiresPayment: true,
        questions: {
          create: questions,
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    return exam;
  }

  async findAll(type?: ExamType, role?: string, centerId?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (role === 'CENTER_ADMIN' && centerId) {
      where.centerId = centerId;
    }
    return this.prisma.exam.findMany({
      where,
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async subscriptionSkipsPayment(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return (
      sub?.status === 'ACTIVE' &&
      (sub.plan === 'PRO' || sub.plan === 'ENTERPRISE')
    );
  }

  async findOneForUser(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    if (!exam.requiresPayment) {
      return {
        exam,
        access: {
          unlocked: true,
          reason: 'NO_PAYMENT_REQUIRED',
          messageUz: 'Bu imtihon bepul ochiq.',
          paymentInstructions: null,
          priceUzs: null,
        },
      };
    }

    if (await this.subscriptionSkipsPayment(userId)) {
      return {
        exam,
        access: {
          unlocked: true,
          reason: 'SUBSCRIPTION',
          messageUz: 'Obuna bo‘yicha imtihon ochiq.',
          paymentInstructions: null,
          priceUzs: null,
        },
      };
    }

    const unlocked = await this.manualPayments.userHasActiveEntitlement(userId, examId);
    const access = {
      unlocked,
      reason: unlocked ? 'MANUAL_PAYMENT' : 'PAYMENT_REQUIRED',
      messageUz: unlocked
        ? 'To‘lov tasdiqlangan. Imtihonni boshlashingiz mumkin.'
        : 'Mock imtihonni boshlash uchun admin tomonidan tasdiqlangan to‘lov talab qilinadi.',
      paymentInstructions: exam.paymentInstructions,
      priceUzs: exam.priceUzs,
    };

    if (!unlocked) {
      const { questions: _removed, ...meta } = exam;
      return {
        exam: { ...meta, questions: [] },
        access,
      };
    }

    return { exam, access };
  }

  async assertCanTakeExam(examId: string, userId: string) {
    const { access } = await this.findOneForUser(examId, userId);
    if (!access.unlocked) {
      throw new ForbiddenException({
        code: 'EXAM_LOCKED',
        messageUz: access.messageUz,
        paymentInstructions: access.paymentInstructions,
        examId,
      });
    }
  }

  async submitResult(dto: {
    userId: string;
    examId: string;
    answers: any;
    score: number;
    cefrLevel?: string;
    integrityScore?: number;
    integrityReport?: Record<string, unknown>;
  }) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    if (exam.requiresPayment && !(await this.subscriptionSkipsPayment(dto.userId))) {
      const ok = await this.manualPayments.userHasActiveEntitlement(dto.userId, dto.examId);
      if (!ok) {
        throw new ForbiddenException('To‘lov yoki ruxsat yo‘q');
      }
    }

    const result = await this.prisma.result.create({
      data: {
        userId: dto.userId,
        examId: dto.examId,
        score: dto.score,
        cefrLevel: dto.cefrLevel,
        answers: dto.answers,
        integrityScore: dto.integrityScore ?? undefined,
        integrityReport: dto.integrityReport === undefined ? undefined : (dto.integrityReport as object),
        completedAt: new Date(),
      },
    });

    if (exam.requiresPayment && !(await this.subscriptionSkipsPayment(dto.userId))) {
      await this.manualPayments.consumeEntitlement(dto.userId, dto.examId);
    }

    await this.updateAnalytics(dto.userId, dto.score);

    await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: 'RESULT_READY',
        title: 'Natija tayyor',
        body: 'Mock imtihon baholandi. "Natijalar" bo‘limidan ko‘ring.',
      },
    });

    return result;
  }

  async logProctorEvent(userId: string, resultId: string, eventType: string, detail?: Record<string, unknown>) {
    return this.prisma.proctorLog.create({
      data: {
        userId,
        resultId,
        eventType,
        detail: detail === undefined ? undefined : (detail as object),
      },
    });
  }

  async getResults(userId: string) {
    return this.prisma.result.findMany({
      where: { userId },
      include: { exam: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCenterResults(centerId: string) {
    return this.prisma.result.findMany({
      where: {
        user: { centerId },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSuspiciousResults(limit = 50) {
    return this.prisma.result.findMany({
      where: { integrityScore: { gte: 40 } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true } },
      },
    });
  }

  async updateExamPrice(examId: string, priceUzs: number, role?: string, centerId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    if (role === 'CENTER_ADMIN' && exam.centerId !== centerId) {
      throw new ForbiddenException('Siz faqat o\'zingizning markazdagi imtihonlarni narxini o\'zgartirishingiz mumkin');
    }

    return this.prisma.exam.update({
      where: { id: examId },
      data: { priceUzs },
    });
  }

  private async updateAnalytics(userId: string, score: number) {
    const analytics = await this.prisma.analytics.findUnique({ where: { userId } });
    if (analytics) {
      const totalExams = analytics.totalExams + 1;
      const avgScore = ((analytics.avgScore * analytics.totalExams) + score) / totalExams;
      await this.prisma.analytics.update({
        where: { userId },
        data: { totalExams, avgScore },
      });
    }
  }

  async deleteExam(examId: string, userId: string, centerId?: string, role?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    if (role === 'CENTER_ADMIN' && exam.centerId !== centerId) {
      throw new ForbiddenException('Siz faqat o\'zingizning markazdagi imtihonlarni o\'chirishingiz mumkin');
    }

    await this.prisma.exam.delete({ where: { id: examId } });
    return { ok: true };
  }

  async createMockFromAI(file: Express.Multer.File, type: 'CEFR' | 'IELTS', userId: string) {
    // Simulate AI processing - in real implementation, this would use AI to analyze the file
    // For now, we'll create a template mock based on the type with proper parts structure
    console.log(`Processing mock file upload: ${file.originalname}, type: ${type}, size: ${file.size} bytes`);
    
    const cefrTemplate = {
      title: `AI Generated ${type} Mock - ${file.originalname}`,
      type: type as ExamType,
      duration: type === 'CEFR' ? 120 : 150,
      level: type === 'CEFR' ? 'B2' : '6.5',
      requiresPayment: true,
      priceUzs: type === 'CEFR' ? 50000 : 70000,
      questions: type === 'CEFR' 
        ? [
            // CEFR Reading Part 1.1
            { question: 'Reading Part 1.1: Matnni o\'qing va savollarga javob bering', type: 'READING', passage: 'CEFR Reading passage matni bu yerda bo\'ladi...', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 1, skill: 'READING', part: '1.1' },
            { question: 'Reading Part 1.1 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 2, skill: 'READING', part: '1.1', subPart: '1' },
            { question: 'Reading Part 1.1 Question 2', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 3, skill: 'READING', part: '1.1', subPart: '2' },
            // CEFR Reading Part 1.2
            { question: 'Reading Part 1.2: Matnni tahlil qiling', type: 'READING', passage: 'CEFR Reading passage matni bu yerda bo\'ladi...', options: ['A', 'B', 'C', 'D'], answer: 'C', order: 4, skill: 'READING', part: '1.2' },
            { question: 'Reading Part 1.2 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'C', order: 5, skill: 'READING', part: '1.2', subPart: '1' },
            // CEFR Reading Part 2
            { question: 'Reading Part 2: Uzun matnni o\'qing', type: 'READING', passage: 'CEFR Reading uzun passage matni bu yerda bo\'ladi...', options: ['A', 'B', 'C', 'D'], answer: 'D', order: 6, skill: 'READING', part: '2' },
            { question: 'Reading Part 2 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'D', order: 7, skill: 'READING', part: '2', subPart: '1' },
            // CEFR Listening Part 1
            { question: 'Listening Part 1: Audio tinglang', type: 'LISTENING', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 8, skill: 'LISTENING', part: '1' },
            { question: 'Listening Part 1 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 9, skill: 'LISTENING', part: '1', subPart: '1' },
            // CEFR Listening Part 2
            { question: 'Listening Part 2: Audio tinglang', type: 'LISTENING', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 10, skill: 'LISTENING', part: '2' },
            { question: 'Listening Part 2 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 11, skill: 'LISTENING', part: '2', subPart: '1' },
            // CEFR Writing Task 1.1
            { question: 'Writing Task 1.1: Rasmdagi ma\'lumotni tasvirlang', type: 'WRITING', answer: 'Writing task 1.1 javobi', order: 12, skill: 'WRITING', part: '1.1' },
            // CEFR Writing Task 1.2
            { question: 'Writing Task 1.2: Xat yozish', type: 'WRITING', answer: 'Writing task 1.2 javobi', order: 13, skill: 'WRITING', part: '1.2' },
            // CEFR Writing Task 2
            { question: 'Writing Task 2: Essay yozish', type: 'WRITING', answer: 'Writing task 2 javobi', order: 14, skill: 'WRITING', part: '2' },
            // CEFR Speaking Part 1
            { question: 'Speaking Part 1: O\'zingiz haqingizda gapiring', type: 'SPEAKING', answer: 'Speaking part 1 javobi', order: 15, skill: 'SPEAKING', part: '1' },
            // CEFR Speaking Part 2
            { question: 'Speaking Part 2: Rasmni tasvirlang', type: 'SPEAKING', answer: 'Speaking part 2 javobi', order: 16, skill: 'SPEAKING', part: '2' },
          ]
        : [
            // IELTS Reading Passage 1
            { question: 'IELTS Reading Passage 1', type: 'READING', passage: 'IELTS Reading passage 1 matni bu yerda bo\'ladi...', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 1, skill: 'READING', part: '1' },
            { question: 'IELTS Reading Passage 1 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 2, skill: 'READING', part: '1', subPart: '1' },
            // IELTS Reading Passage 2
            { question: 'IELTS Reading Passage 2', type: 'READING', passage: 'IELTS Reading passage 2 matni bu yerda bo\'ladi...', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 3, skill: 'READING', part: '2' },
            { question: 'IELTS Reading Passage 2 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 4, skill: 'READING', part: '2', subPart: '1' },
            // IELTS Reading Passage 3
            { question: 'IELTS Reading Passage 3', type: 'READING', passage: 'IELTS Reading passage 3 matni bu yerda bo\'ladi...', options: ['A', 'B', 'C', 'D'], answer: 'C', order: 5, skill: 'READING', part: '3' },
            { question: 'IELTS Reading Passage 3 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'C', order: 6, skill: 'READING', part: '3', subPart: '1' },
            // IELTS Listening Section 1
            { question: 'IELTS Listening Section 1', type: 'LISTENING', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 7, skill: 'LISTENING', part: '1' },
            { question: 'IELTS Listening Section 1 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 8, skill: 'LISTENING', part: '1', subPart: '1' },
            // IELTS Listening Section 2
            { question: 'IELTS Listening Section 2', type: 'LISTENING', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 9, skill: 'LISTENING', part: '2' },
            { question: 'IELTS Listening Section 2 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 10, skill: 'LISTENING', part: '2', subPart: '1' },
            // IELTS Listening Section 3
            { question: 'IELTS Listening Section 3', type: 'LISTENING', options: ['A', 'B', 'C', 'D'], answer: 'C', order: 11, skill: 'LISTENING', part: '3' },
            { question: 'IELTS Listening Section 3 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'C', order: 12, skill: 'LISTENING', part: '3', subPart: '1' },
            // IELTS Listening Section 4
            { question: 'IELTS Listening Section 4', type: 'LISTENING', options: ['A', 'B', 'C', 'D'], answer: 'D', order: 13, skill: 'LISTENING', part: '4' },
            { question: 'IELTS Listening Section 4 Question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'D', order: 14, skill: 'LISTENING', part: '4', subPart: '1' },
            // IELTS Writing Task 1
            { question: 'IELTS Writing Task 1: Graph/Table tasvirlash', type: 'WRITING', answer: 'IELTS Writing Task 1 javobi', order: 15, skill: 'WRITING', part: '1' },
            // IELTS Writing Task 2
            { question: 'IELTS Writing Task 2: Essay yozish', type: 'WRITING', answer: 'IELTS Writing Task 2 javobi', order: 16, skill: 'WRITING', part: '2' },
            // IELTS Speaking Part 1
            { question: 'IELTS Speaking Part 1: Introduction', type: 'SPEAKING', answer: 'IELTS Speaking Part 1 javobi', order: 17, skill: 'SPEAKING', part: '1' },
            // IELTS Speaking Part 2
            { question: 'IELTS Speaking Part 2: Cue card', type: 'SPEAKING', answer: 'IELTS Speaking Part 2 javobi', order: 18, skill: 'SPEAKING', part: '2' },
            // IELTS Speaking Part 3
            { question: 'IELTS Speaking Part 3: Discussion', type: 'SPEAKING', answer: 'IELTS Speaking Part 3 javobi', order: 19, skill: 'SPEAKING', part: '3' },
          ],
    };

    return this.create({
      ...cefrTemplate,
      createdBy: userId,
    });
  }

  async getExamParts(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    // Group questions by skill and part
    const parts: Record<string, any> = {};
    
    exam.questions.forEach((q) => {
      if (!q.skill) return;
      
      if (!parts[q.skill]) {
        parts[q.skill] = {};
      }
      
      if (q.part) {
        if (!parts[q.skill][q.part]) {
          parts[q.skill][q.part] = {
            part: q.part,
            questions: [],
          };
        }
        parts[q.skill][q.part].questions.push(q);
      }
    });

    return {
      examId: exam.id,
      title: exam.title,
      type: exam.type,
      parts,
    };
  }

  async getQuestionsByPart(examId: string, skill: string, part: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { 
        questions: { 
          where: { 
            skill,
            part,
          },
          orderBy: { order: 'asc' } 
        } 
      },
    });
    
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    return {
      examId: exam.id,
      title: exam.title,
      skill,
      part,
      questions: exam.questions,
    };
  }
}
