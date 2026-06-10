import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { ManualPaymentsService } from '../manual-payments/manual-payments.service';

@Injectable()
export class CefrStudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly manualPayments: ManualPaymentsService,
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

    if (mock.isPaid) {
      const hasEntitlement = await this.manualPayments.userHasActiveEntitlement(userId, id);
      if (!hasEntitlement) {
        throw new BadRequestException('Bu mockni boshlash uchun to\'lov qilishingiz kerak');
      }
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
      userId,
    );
    const speakingScore = await this.gradeSpeaking(
      answers.speakingAnswers,
      attempt.mock.speaking,
      userId,
      answers.speakingAudioUrls,
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

  private async gradeWriting(answers: any, writing: any, userId: string): Promise<number> {
    if (!answers || !writing) return 0;

    try {
      let totalScore = 0;
      let taskCount = 0;

      // Grade task11
      if (answers.task11 && answers.task11.length > 10) {
        try {
          const result = await this.aiService.analyzeWriting(userId, answers.task11);
          totalScore += (result.grammarScore || 0) + (result.vocabScore || 0) + (result.coherenceScore || 0);
          taskCount++;
        } catch (e) {
          console.error('Task 1.1 grading error:', e);
        }
      }

      // Grade task12
      if (answers.task12 && answers.task12.length > 10) {
        try {
          const result = await this.aiService.analyzeWriting(userId, answers.task12);
          totalScore += (result.grammarScore || 0) + (result.vocabScore || 0) + (result.coherenceScore || 0);
          taskCount++;
        } catch (e) {
          console.error('Task 1.2 grading error:', e);
        }
      }

      // Grade task2
      if (answers.task2 && answers.task2.length > 10) {
        try {
          const result = await this.aiService.analyzeWriting(userId, answers.task2);
          totalScore += (result.grammarScore || 0) + (result.vocabScore || 0) + (result.coherenceScore || 0);
          taskCount++;
        } catch (e) {
          console.error('Task 2 grading error:', e);
        }
      }

      return taskCount > 0 ? (totalScore / (taskCount * 3)) * 100 : 60.0;
    } catch (error) {
      console.error('Writing grading error:', error);
      return 60.0;
    }
  }

  private async gradeSpeaking(answers: any, speaking: any, userId: string, speakingAudioUrls: any): Promise<number> {
    if (!answers || !speaking) return 0;

    try {
      let totalScore = 0;
      let taskCount = 0;

      // If audio URLs are provided, download and evaluate with AI
      if (speakingAudioUrls) {
        for (const [partId, audioUrl] of Object.entries(speakingAudioUrls)) {
          try {
            // Download audio from URL
            const response = await fetch(audioUrl as string);
            const buffer = Buffer.from(await response.arrayBuffer());
            
            const result = await this.aiService.analyzeSpeakingFromAudio(
              userId,
              buffer,
              `${partId}.webm`,
              'audio/webm'
            );
            
            totalScore += result.overallScore || 60;
            taskCount++;
          } catch (e) {
            console.error(`Speaking grading error for ${partId}:`, e);
          }
        }
      }

      // Fallback: if transcript provided, evaluate with transcript-only
      if (taskCount === 0 && answers.task1) {
        try {
          const result = await this.aiService.analyzeSpeakingFromTranscriptOnly(
            userId,
            speakingAudioUrls?.task1,
            answers.task1
          );
          totalScore += result.overallScore || 60;
          taskCount++;
        } catch (e) {
          console.error('Task 1 transcript grading error:', e);
        }
      }

      if (taskCount === 0 && answers.task2) {
        try {
          const result = await this.aiService.analyzeSpeakingFromTranscriptOnly(
            userId,
            speakingAudioUrls?.task2,
            answers.task2
          );
          totalScore += result.overallScore || 60;
          taskCount++;
        } catch (e) {
          console.error('Task 2 transcript grading error:', e);
        }
      }

      if (taskCount === 0 && answers.task3) {
        try {
          const result = await this.aiService.analyzeSpeakingFromTranscriptOnly(
            userId,
            speakingAudioUrls?.task3,
            answers.task3
          );
          totalScore += result.overallScore || 60;
          taskCount++;
        } catch (e) {
          console.error('Task 3 transcript grading error:', e);
        }
      }

      return taskCount > 0 ? totalScore / taskCount : 60.0;
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
