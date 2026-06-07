import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CefrStudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getActiveMocks(level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2', userId?: string) {
    const where: any = { status: 'published' };
    if (level) where.level = level;

    const mocks = await (this.prisma as any).cefrMock.findMany({
      where,
      include: {
        listening: true,
        reading: true,
        writing: true,
        speaking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (userId) {
      const attempts = await (this.prisma as any).cefrAttempt.findMany({
        where: { userId },
        select: { mockId: true, status: true, startedAt: true },
      });

      return mocks.map((mock: any) => ({
        ...mock,
        attempts: attempts.filter((a: any) => a.mockId === mock.id),
        latestAttempt: attempts
          .filter((a: any) => a.mockId === mock.id)
          .sort((a: any, b: any) => b.startedAt.getTime() - a.startedAt.getTime())[0],
      }));
    }

    return mocks;
  }

  async getMockForExam(id: string, userId: string) {
    const mock = await (this.prisma as any).cefrMock.findUnique({
      where: { id },
      include: {
        listening: true,
        reading: true,
        writing: true,
        speaking: true,
      },
    });

    if (!mock) {
      throw new NotFoundException('CEFR mock not found');
    }

    if (mock.status !== 'published') {
      throw new BadRequestException('Mock is not published');
    }

    const existingAttempt = await (this.prisma as any).cefrAttempt.findFirst({
      where: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });

    if (existingAttempt) {
      return {
        mock,
        attempt: existingAttempt,
      };
    }

    return {
      mock,
      attempt: null,
    };
  }

  async startAttempt(id: string, userId: string) {
    const mock = await (this.prisma as any).cefrMock.findUnique({
      where: { id },
    });

    if (!mock) {
      throw new NotFoundException('CEFR mock not found');
    }

    const existingAttempt = await (this.prisma as any).cefrAttempt.findFirst({
      where: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    return (this.prisma as any).cefrAttempt.create({
      data: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });
  }

  async saveAnswers(id: string, userId: string, answers: any) {
    const attempt = await (this.prisma as any).cefrAttempt.findFirst({
      where: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found');
    }

    return (this.prisma as any).cefrAttempt.update({
      where: { id: attempt.id },
      data: {
        listeningAnswers: answers.listeningAnswers,
        readingAnswers: answers.readingAnswers,
        writingAnswers: answers.writingAnswers,
        speakingAnswers: answers.speakingAnswers,
        answers: answers,
      },
    });
  }

  async submitAttempt(id: string, userId: string, answers: any) {
    const attempt = await (this.prisma as any).cefrAttempt.findFirst({
      where: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
      include: {
        mock: {
          include: {
            listening: true,
            reading: true,
            writing: true,
            speaking: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found');
    }

    const listeningScore = this.calculateListeningScore(
      answers.listeningAnswers,
      attempt.mock.listening?.sections,
    );
    const readingScore = this.calculateReadingScore(
      answers.readingAnswers,
      attempt.mock.reading?.passages,
    );
    const writingScore = await this.gradeWriting(
      answers.writingAnswers,
      attempt.mock.writing,
    );
    const speakingScore = await this.gradeSpeaking(
      answers.speakingAnswers,
      attempt.mock.speaking,
    );

    const totalScore = (listeningScore + readingScore + writingScore + speakingScore) / 4;
    const cefrLevel = this.calculateCefrLevel(totalScore);

    return (this.prisma as any).cefrAttempt.update({
      where: { id: attempt.id },
      data: {
        listeningAnswers: answers.listeningAnswers,
        readingAnswers: answers.readingAnswers,
        writingAnswers: answers.writingAnswers,
        speakingAnswers: answers.speakingAnswers,
        answers: answers,
        listeningScore,
        readingScore,
        writingScore,
        speakingScore,
        totalScore,
        cefrLevel,
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  async getResult(id: string, userId: string) {
    const attempt = await (this.prisma as any).cefrAttempt.findFirst({
      where: {
        mockId: id,
        userId,
      },
      include: {
        mock: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      throw new NotFoundException('No attempt found');
    }

    return attempt;
  }

  private calculateListeningScore(answers: any, sections: any): number {
    if (!answers || !sections) return 0;
    let correct = 0;
    let total = 0;

    const sectionsArray = Array.isArray(sections) ? sections : [];
    sectionsArray.forEach((section: any, sectionIndex: number) => {
      if (section.questions) {
        section.questions.forEach((q: any, qIndex: number) => {
          total += q.points || 1;
          const userAnswer = answers[`section${sectionIndex + 1}`]?.[qIndex];
          if (userAnswer === q.correctAnswer) {
            correct += q.points || 1;
          }
        });
      }
    });

    return total > 0 ? (correct / total) * 100 : 0;
  }

  private calculateReadingScore(answers: any, passages: any): number {
    if (!answers || !passages) return 0;
    let correct = 0;
    let total = 0;

    const passagesArray = Array.isArray(passages) ? passages : [];
    passagesArray.forEach((passage: any, passageIndex: number) => {
      if (passage.questions) {
        passage.questions.forEach((q: any, qIndex: number) => {
          total += q.points || 1;
          const userAnswer = answers[`passage${passageIndex + 1}`]?.[qIndex];
          if (userAnswer === q.correctAnswer) {
            correct += q.points || 1;
          }
        });
      }
    });

    return total > 0 ? (correct / total) * 100 : 0;
  }

  private async gradeWriting(answers: any, writing: any): Promise<number> {
    if (!answers || !writing) return 0;

    try {
      const task11Result = answers.task11
        ? await this.aiService.gradeIELTSWriting('system', {
            taskType: 'TASK_1',
            prompt: writing.task11?.context || '',
            response: answers.task11,
            wordCount: answers.task11.split(/\s+/).length,
          })
        : null;

      const task12Result = answers.task12
        ? await this.aiService.gradeIELTSWriting('system', {
            taskType: 'TASK_1',
            prompt: writing.task12?.context || '',
            response: answers.task12,
            wordCount: answers.task12.split(/\s+/).length,
          })
        : null;

      const task2Result = answers.task2
        ? await this.aiService.gradeIELTSWriting('system', {
            taskType: 'TASK_2',
            prompt: writing.task2?.prompt || '',
            response: answers.task2,
            wordCount: answers.task2.split(/\s+/).length,
          })
        : null;

      const task11Score = (task11Result as any)?.overallBand || 6.0;
      const task12Score = (task12Result as any)?.overallBand || 6.0;
      const task2Score = (task2Result as any)?.overallBand || 6.0;

      return ((task11Score + task12Score + task2Score) / 3) * 10;
    } catch (error) {
      console.error('Writing grading error:', error);
      return 60.0;
    }
  }

  private async gradeSpeaking(answers: any, speaking: any): Promise<number> {
    if (!answers || !speaking) return 0;

    try {
      const task1Result = answers.task1
        ? await this.aiService.gradeIELTSSpeaking('system', Buffer.from(''), 'task1.mp3', 'audio/mpeg', speaking.task1?.questions?.[0] || '')
        : null;

      const task2Result = answers.task2
        ? await this.aiService.gradeIELTSSpeaking('system', Buffer.from(''), 'task2.mp3', 'audio/mpeg', speaking.task2?.topic || '')
        : null;

      const task3Result = answers.task3
        ? await this.aiService.gradeIELTSSpeaking('system', Buffer.from(''), 'task3.mp3', 'audio/mpeg', speaking.task3?.topic || '')
        : null;

      const task1Score = task1Result?.record?.overallScore || 6.0;
      const task2Score = task2Result?.record?.overallScore || 6.0;
      const task3Score = task3Result?.record?.overallScore || 6.0;

      return ((task1Score + task2Score + task3Score) / 3) * 10;
    } catch (error) {
      console.error('Speaking grading error:', error);
      return 60.0;
    }
  }

  private calculateCefrLevel(totalScore: number): string {
    if (totalScore >= 90) return 'C2';
    if (totalScore >= 75) return 'C1';
    if (totalScore >= 60) return 'B2';
    if (totalScore >= 45) return 'B1';
    if (totalScore >= 30) return 'A2';
    return 'A1';
  }
}
