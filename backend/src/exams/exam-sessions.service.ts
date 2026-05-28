import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ExamSessionsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async startExamSession(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!exam) {
      throw new NotFoundException('Imtihon topilmadi');
    }

    // Check if user has an active session
    const activeSession = await this.prisma.result.findFirst({
      where: {
        userId,
        examId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeSession) {
      return activeSession;
    }

    // Create new result/session
    const result = await this.prisma.result.create({
      data: {
        userId,
        examId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        exam: {
          include: { questions: { orderBy: { order: 'asc' } } },
        },
      },
    });

    return result;
  }

  async getSessionState(resultId: string, userId: string) {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        exam: {
          include: { questions: { orderBy: { order: 'asc' } } },
        },
        userAnswers: {
          include: { question: true },
        },
      },
    });

    if (!result || result.userId !== userId) {
      throw new NotFoundException('Sessiya topilmadi');
    }

    return result;
  }

  async submitAnswer(
    resultId: string,
    userId: string,
    questionId: string,
    answer: string,
    timeSpent?: number,
  ) {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
    });

    if (!result || result.userId !== userId) {
      throw new NotFoundException('Sessiya topilmadi');
    }

    if (result.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Sessiya allaqachon yakunlangan');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Savol topilmadi');
    }

    // Check if answer already exists
    const existingAnswer = await this.prisma.userAnswer.findFirst({
      where: {
        resultId,
        questionId,
      },
    });

    let isCorrect = false;
    let points = 0;

    // Auto-grade objective questions
    if (['MCQ', 'TRUE_FALSE', 'FILL_BLANKS', 'MATCHING'].includes(question.type)) {
      isCorrect = this.checkAnswer(answer, question.answer || '');
      points = isCorrect ? question.points : 0;
    }

    if (existingAnswer) {
      // Update existing answer
      await this.prisma.userAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          answer,
          isCorrect,
          points,
          timeSpent,
        },
      });
    } else {
      // Create new answer
      await this.prisma.userAnswer.create({
        data: {
          resultId,
          questionId,
          userId,
          answer,
          isCorrect,
          points,
          timeSpent,
        },
      });
    }

    return { success: true, isCorrect, points };
  }

  async submitExam(
    resultId: string,
    userId: string,
    answers: Record<string, string>,
    timeSpent: number,
  ) {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        exam: {
          include: { questions: true },
        },
      },
    });

    if (!result || result.userId !== userId) {
      throw new NotFoundException('Sessiya topilmadi');
    }

    if (result.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Sessiya allaqachon yakunlangan');
    }

    // Save all answers
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = result.exam.questions.find((q) => q.id === questionId);
      if (question) {
        await this.submitAnswer(resultId, userId, questionId, answer);
      }
    }

    // Calculate objective scores
    const userAnswers = await this.prisma.userAnswer.findMany({
      where: { resultId },
      include: { question: true },
    });

    let totalPoints = 0;
    let totalPossible = 0;
    const skillScores: Record<string, number> = {};

    for (const userAnswer of userAnswers) {
      const question = userAnswer.question;
      totalPossible += question.points;
      totalPoints += userAnswer.points || 0;

      if (question.skill) {
        skillScores[question.skill] = (skillScores[question.skill] || 0) + (userAnswer.points || 0);
      }
    }

    const objectiveScore = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;

    // Update result with objective scores
    const updatedResult = await this.prisma.result.update({
      where: { id: resultId },
      data: {
        score: objectiveScore,
        answers: answers as any,
        timeSpent,
        status: 'SUBMITTED',
        completedAt: new Date(),
        skillScores: skillScores as any,
      },
    });

    // Queue AI grading for writing and speaking tasks
    this.queueAIGrading(resultId, userId, result.exam.type).catch((err) => {
      console.error('AI grading failed:', err);
    });

    return updatedResult;
  }

  async logProctorEvent(
    userId: string,
    resultId: string,
    eventType: string,
    details?: any,
    screenshot?: string,
  ) {
    await this.prisma.proctorLog.create({
      data: {
        userId,
        resultId,
        eventType,
        detail: details as any,
        screenshot,
        timestamp: new Date(),
      },
    });

    // Calculate integrity score
    const events = await this.prisma.proctorLog.findMany({
      where: { resultId },
    });

    const criticalEvents = events.filter((e) =>
      ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'MULTIPLE_WINDOWS', 'NO_FACE'].includes(e.eventType),
    );
    const warningEvents = events.filter((e) =>
      ['SUSPICIOUS_OBJECT', 'LOOKING_AWAY'].includes(e.eventType),
    );

    let integrityScore = 100;
    integrityScore -= criticalEvents.length * 20;
    integrityScore -= warningEvents.length * 5;
    integrityScore = Math.max(0, integrityScore);

    // Update result integrity score
    await this.prisma.result.update({
      where: { id: resultId },
      data: {
        integrityScore,
        integrityReport: {
          totalEvents: events.length,
          criticalEvents: criticalEvents.length,
          warningEvents: warningEvents.length,
        } as any,
      },
    });

    return { success: true, integrityScore };
  }

  private async queueAIGrading(resultId: string, userId: string, examType: string) {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        exam: { include: { questions: true } },
        userAnswers: { include: { question: true } },
      },
    });

    if (!result) return;

    const writingQuestions = result.exam.questions.filter(
      (q) => q.skill === 'WRITING' && q.type === 'ESSAY',
    );
    const speakingQuestions = result.exam.questions.filter(
      (q) => q.skill === 'SPEAKING' && q.type === 'SPEAKING',
    );

    const aiFeedback: any = {};

    // Grade writing tasks
    for (const question of writingQuestions) {
      const userAnswer = result.userAnswers.find((a) => a.questionId === question.id);
      if (userAnswer?.answer) {
        try {
          const grading = await this.aiService.gradeIELTSWriting(userId, {
            taskType: question.part === '1' ? 'TASK_1' : 'TASK_2',
            prompt: question.question,
            response: userAnswer.answer,
            wordCount: userAnswer.answer.split(/\s+/).length,
          });
          aiFeedback[`writing_${question.id}`] = grading;
        } catch (err) {
          console.error('Writing grading failed:', err);
        }
      }
    }

    // Grade speaking tasks (if audio files are uploaded separately)
    for (const question of speakingQuestions) {
      const speakingRecord = await this.prisma.speakingRecord.findFirst({
        where: { userId, questionId: question.id },
        orderBy: { createdAt: 'desc' },
      });
      if (speakingRecord?.transcript) {
        try {
          const grading = await this.aiService.gradeIELTSSpeaking(
            userId,
            Buffer.from(''), // Audio buffer would come from storage
            'speaking.webm',
            'audio/webm',
            question.question,
          );
          aiFeedback[`speaking_${question.id}`] = grading;
        } catch (err) {
          console.error('Speaking grading failed:', err);
        }
      }
    }

    // Update result with AI feedback
    await this.prisma.result.update({
      where: { id: resultId },
      data: {
        aiFeedback: aiFeedback as any,
        status: 'GRADED',
      },
    });
  }

  private checkAnswer(userAnswer: string, correctAnswer: string): boolean {
    const normalize = (str: string) => str.trim().toLowerCase();
    return normalize(userAnswer) === normalize(correctAnswer);
  }
}
