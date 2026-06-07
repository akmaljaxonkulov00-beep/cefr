import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class IeltsStudentService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getActiveMocks(type?: 'Academic' | 'General', level?: 'B1' | 'B2' | 'C1' | 'C2', userId?: string) {
    const where: any = { status: 'published' };
    if (type) where.type = type;
    if (level) where.level = level;

    const mocks = await (this.prisma as any).ieltsMock.findMany({
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
      const attempts = await (this.prisma as any).ieltsAttempt.findMany({
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

    if (mock.status !== 'published') {
      throw new BadRequestException('Mock is not published');
    }

    const existingAttempt = await (this.prisma as any).ieltsAttempt.findFirst({
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
    const mock = await (this.prisma as any).ieltsMock.findUnique({
      where: { id },
    });

    if (!mock) {
      throw new NotFoundException('IELTS mock not found');
    }

    const existingAttempt = await (this.prisma as any).ieltsAttempt.findFirst({
      where: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    return (this.prisma as any).ieltsAttempt.create({
      data: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });
  }

  async saveAnswers(id: string, userId: string, answers: any) {
    const attempt = await (this.prisma as any).ieltsAttempt.findFirst({
      where: {
        mockId: id,
        userId,
        status: 'in_progress',
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found');
    }

    return (this.prisma as any).ieltsAttempt.update({
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
    const attempt = await (this.prisma as any).ieltsAttempt.findFirst({
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

    const updatedAttempt = await (this.prisma as any).ieltsAttempt.update({
      where: { id: attempt.id },
      data: {
        listeningAnswers: answers.listeningAnswers,
        readingAnswers: answers.readingAnswers,
        writingAnswers: answers.writingAnswers,
        speakingAnswers: answers.speakingAnswers,
        answers: answers,
        listeningScore,
        readingScore,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    const writingScore = await this.gradeWriting(
      answers.writingAnswers,
      attempt.mock.writing,
    );
    const speakingScore = await this.gradeSpeaking(
      answers.speakingAnswers,
      attempt.mock.speaking,
    );

    const totalBand = this.calculateTotalBand(
      listeningScore,
      readingScore,
      writingScore,
      speakingScore,
    );

    return (this.prisma as any).ieltsAttempt.update({
      where: { id: attempt.id },
      data: {
        writingScore,
        speakingScore,
        totalBand: this.formatBand(totalBand),
      },
    });
  }

  async getResult(id: string, userId: string) {
    const attempt = await (this.prisma as any).ieltsAttempt.findFirst({
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
    sectionsArray.forEach((section: any, index: number) => {
      const sectionAnswers = answers[`section${index + 1}`] || [];
      sectionAnswers.forEach((answer: any) => {
        total++;
        if (answer.isCorrect) correct++;
      });
    });

    return this.rawToBand(correct, total);
  }

  private calculateReadingScore(answers: any, passages: any): number {
    if (!answers || !passages) return 0;
    let correct = 0;
    let total = 0;

    const passagesArray = Array.isArray(passages) ? passages : [];
    passagesArray.forEach((passage: any, index: number) => {
      const passageAnswers = answers[`passage${index + 1}`] || [];
      passageAnswers.forEach((answer: any) => {
        total++;
        if (answer.isCorrect) correct++;
      });
    });

    return this.rawToBand(correct, total);
  }

  private rawToBand(correct: number, total: number): number {
    const percentage = (correct / total) * 40;
    const bandTable: { [key: number]: number } = {
      40: 9.0,
      39: 9.0,
      38: 8.5,
      37: 8.5,
      36: 8.0,
      35: 8.0,
      34: 7.5,
      33: 7.5,
      32: 7.0,
      31: 7.0,
      30: 7.0,
      29: 6.5,
      28: 6.5,
      27: 6.5,
      26: 6.0,
      25: 6.0,
      24: 6.0,
      23: 6.0,
      22: 5.5,
      21: 5.5,
      20: 5.5,
      19: 5.0,
      18: 5.0,
      17: 5.0,
      16: 5.0,
      15: 4.5,
      14: 4.5,
      13: 4.5,
      12: 4.0,
      11: 4.0,
      10: 4.0,
    };

    return bandTable[Math.round(percentage)] || 4.0;
  }

  private async gradeWriting(answers: any, writing: any): Promise<number> {
    if (!answers || !writing) return 0;

    const task1Text = answers.task1 || '';
    const task2Text = answers.task2 || '';

    try {
      const task1Result = task1Text
        ? await this.aiService.gradeIELTSWriting('system', {
            taskType: 'TASK_1',
            prompt: writing.task1?.prompt || '',
            response: task1Text,
            wordCount: task1Text.split(/\s+/).length,
          })
        : null;

      const task2Result = task2Text
        ? await this.aiService.gradeIELTSWriting('system', {
            taskType: 'TASK_2',
            prompt: writing.task2?.prompt || '',
            response: task2Text,
            wordCount: task2Text.split(/\s+/).length,
          })
        : null;

      const task1Band = (task1Result as any)?.overallBand || 6.0;
      const task2Band = (task2Result as any)?.overallBand || 6.0;

      return (task1Band + task2Band) / 2;
    } catch (error) {
      console.error('Writing grading error:', error);
      return 6.0;
    }
  }

  private async gradeSpeaking(answers: any, speaking: any): Promise<number> {
    if (!answers || !speaking) return 0;

    const part1Audio = answers.part1?.audioBuffer;
    const part2Audio = answers.part2?.audioBuffer;
    const part3Audio = answers.part3?.audioBuffer;

    try {
      const part1Result = part1Audio
        ? await this.aiService.gradeIELTSSpeaking(
            'system',
            part1Audio,
            'part1.mp3',
            'audio/mpeg',
            speaking.part1?.questions?.[0] || '',
          )
        : null;

      const part2Result = part2Audio
        ? await this.aiService.gradeIELTSSpeaking(
            'system',
            part2Audio,
            'part2.mp3',
            'audio/mpeg',
            speaking.part2?.topic || '',
          )
        : null;

      const part3Result = part3Audio
        ? await this.aiService.gradeIELTSSpeaking(
            'system',
            part3Audio,
            'part3.mp3',
            'audio/mpeg',
            speaking.part3?.questions?.[0] || '',
          )
        : null;

      const part1Band = (part1Result as any)?.analysis?.overallBand || 6.0;
      const part2Band = (part2Result as any)?.analysis?.overallBand || 6.0;
      const part3Band = (part3Result as any)?.analysis?.overallBand || 6.0;

      return (part1Band + part2Band + part3Band) / 3;
    } catch (error) {
      console.error('Speaking grading error:', error);
      return 6.0;
    }
  }

  private calculateTotalBand(
    listening: number,
    reading: number,
    writing: number,
    speaking: number,
  ): number {
    const average = (listening + reading + writing + speaking) / 4;
    return Math.round(average * 2) / 2;
  }

  private formatBand(band: number): string {
    return band.toFixed(1);
  }
}
