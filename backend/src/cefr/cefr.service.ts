import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCefrMockDto } from './dto/create-cefr-mock.dto';
import {
  UpdateListeningSectionDto,
  UpdateReadingSectionDto,
  UpdateWritingSectionDto,
  UpdateSpeakingSectionDto,
} from './dto/update-cefr-section.dto';

@Injectable()
export class CefrService {
  constructor(private readonly prisma: PrismaService) {}

  async createMock(dto: any, userId: string) {
    // Extract sections from dto
    const { sections, ...mockData } = dto;
    
    // Create mock with basic data
    const mock = await this.prisma.cefrMock.create({
      data: {
        title: mockData.title,
        level: mockData.level,
        description: mockData.description,
        duration: mockData.duration || 120,
        price: mockData.price || 0,
        isPaid: mockData.isPaid || false,
        status: 'published', // Auto-publish uploaded mocks
      },
    });

    // Create sections if provided
    if (sections) {
      // Listening section
      if (sections.listening) {
        await this.prisma.cefrListening.create({
          data: {
            mockId: mock.id,
            title: sections.listening.title || 'Listening Section',
            audioKey: sections.listening.audioKey,
            audioUrl: sections.listening.audioUrl,
            duration: sections.listening.duration || 40,
          },
        });
      }

      // Reading section
      if (sections.reading) {
        await this.prisma.cefrReading.create({
          data: {
            mockId: mock.id,
            title: sections.reading.title || 'Reading Section',
            pdfKey: sections.reading.pdfKey,
            pdfUrl: sections.reading.pdfUrl,
            duration: sections.reading.duration || 60,
          },
        });
      }

      // Writing section
      if (sections.writing) {
        await this.prisma.cefrWriting.create({
          data: {
            mockId: mock.id,
            title: sections.writing.title || 'Writing Section',
            duration: sections.writing.duration || 40,
            tasks: sections.writing.tasks || [],
          },
        });
      }

      // Speaking section
      if (sections.speaking) {
        await this.prisma.cefrSpeaking.create({
          data: {
            mockId: mock.id,
            title: sections.speaking.title || 'Speaking Section',
            duration: sections.speaking.duration || 40,
            parts: sections.speaking.parts || [],
          },
        });
      }
    }

    return mock;
  }

  async getAllMocks(level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2', status?: 'draft' | 'published') {
    const where: any = {};
    if (level) where.level = level;
    if (status) where.status = status;

    return (this.prisma as any).cefrMock.findMany({
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
    const mock = await this.prisma.cefrMock.findUnique({
      where: { id },
      include: {
        listening: true,
        reading: true,
        writing: true,
        speaking: true,
      },
    });

    if (!mock) {
      throw new NotFoundException('Mock not found');
    }

    return mock;
  }

  async updateMock(id: string, dto: Partial<CreateCefrMockDto>) {
    return (this.prisma as any).cefrMock.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMock(id: string) {
    await this.getMockById(id);
    return (this.prisma as any).cefrMock.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string) {
    const mock = await this.getMockById(id);
    const newStatus = mock.status === 'draft' ? 'published' : 'draft';
    return (this.prisma as any).cefrMock.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });
  }

  async updateListening(id: string, dto: UpdateListeningSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).cefrListening.upsert({
      where: { mockId: id },
      update: {
        duration: dto.duration,
        sections: dto.sections,
      },
      create: {
        mockId: id,
        duration: dto.duration || 40,
        sections: dto.sections || [],
      },
    });
  }

  async updateReading(id: string, dto: UpdateReadingSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).cefrReading.upsert({
      where: { mockId: id },
      update: {
        duration: dto.duration,
        passages: dto.passages,
      },
      create: {
        mockId: id,
        duration: dto.duration || 60,
        passages: dto.passages || [],
      },
    });
  }

  async updateWriting(id: string, dto: UpdateWritingSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).cefrWriting.upsert({
      where: { mockId: id },
      update: {
        duration: dto.duration,
        task11: dto.task11,
        task12: dto.task12,
        task2: dto.task2,
        aiWeights: dto.aiWeights,
      },
      create: {
        mockId: id,
        duration: dto.duration || 80,
        task11: dto.task11 || {},
        task12: dto.task12 || {},
        task2: dto.task2 || {},
        aiWeights: dto.aiWeights || { taskResponse: 25, coherence: 25, lexical: 25, grammar: 25 },
      },
    });
  }

  async updateSpeaking(id: string, dto: UpdateSpeakingSectionDto) {
    await this.getMockById(id);
    return (this.prisma as any).cefrSpeaking.upsert({
      where: { mockId: id },
      update: {
        task1: dto.task1,
        task2: dto.task2,
        task3: dto.task3,
      },
      create: {
        mockId: id,
        task1: dto.task1 || {},
        task2: dto.task2 || {},
        task3: dto.task3 || {},
      },
    });
  }

  async getMockResults(id: string) {
    await this.getMockById(id);
    return (this.prisma as any).cefrAttempt.findMany({
      where: { mockId: id },
      include: {
        mock: {
          select: {
            title: true,
            level: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async overrideScore(mockId: string, attemptId: string, scores: any) {
    const attempt = await (this.prisma as any).cefrAttempt.findFirst({
      where: {
        id: attemptId,
        mockId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const updated = await (this.prisma as any).cefrAttempt.update({
      where: { id: attemptId },
      data: {
        listeningScore: scores.listeningScore,
        readingScore: scores.readingScore,
        writingScore: scores.writingScore,
        speakingScore: scores.speakingScore,
        totalScore: scores.totalScore,
        cefrLevel: this.calculateCefrLevel(scores.totalScore),
      },
    });

    return updated;
  }

  private calculateCefrLevel(totalScore: number): string {
    if (totalScore >= 90) return 'C2';
    if (totalScore >= 75) return 'C1';
    if (totalScore >= 60) return 'B2';
    if (totalScore >= 45) return 'B1';
    if (totalScore >= 30) return 'A2';
    return 'A1';
  }

  async parsePdfMock(filePath: string): Promise<any> {
    try {
      const pdfParse = require('pdf-parse');
      const fs = require('fs');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      const text = data.text;
      
      return {
        raw: text.substring(0, 500),
        listening: this.parseCefrListening(text),
        reading: this.parseCefrReading(text),
        writing: this.parseCefrWriting(text),
      };
    } catch (error) {
      return this.getDefaultStructure();
    }
  }

  getDefaultStructure() {
    return {
      listening: {
        parts: [1,2,3,4,5,6].map(i => ({
          partNumber: i,
          title: `Part ${i}`,
          instructions: '',
          questionType: 'fill_blank',
          audioUrl: null,
          recordings: [],
          questions: Array.from({length: i <= 2 ? 8 : (i <= 4 ? 5 : 6)}, (_, j) => ({
            id: `cefr-p${i}-q${j+1}`,
            number: j + 1,
            type: 'fill_blank',
            text: '',
            options: [],
            correctAnswer: ''
          }))
        }))
      },
      reading: {
        parts: [1,2,3,4,5].map(i => ({
          partNumber: i,
          title: `Part ${i}`,
          instructions: '',
          type: 'multiple_choice',
          text: '',
          questions: []
        }))
      },
      writing: {
        task1: { instructions: '', minWords: 150, timeRecommended: 40 },
        task2: { instructions: '', minWords: 250, timeRecommended: 60 }
      }
    };
  }

  private parseCefrListening(text: string) {
    const parts = [];
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(
        `Part\\s+${i}[\\s\\S]*?(?=Part\\s+${i+1}|READING|PAPER 2|$)`, 'i'
      );
      const match = text.match(regex);
      const partText = match?.[0] || '';
      
      parts.push({
        partNumber: i,
        title: `Part ${i}`,
        instructions: this.extractFirstSentence(partText),
        questionType: this.detectType(partText),
        audioUrl: null,
        recordings: [],
        questions: this.extractNumberedItems(partText, i)
      });
    }
    return { parts };
  }

  private parseCefrReading(text: string) {
    const readingSection = text.match(/PAPER\s*2[\s\S]*?(?=PAPER\s*3|WRITING|$)/i)?.[0] || '';
    const parts = [];
    for (let i = 1; i <= 5; i++) {
      const regex = new RegExp(`PART\\s+${i}[\\s\\S]*?(?=PART\\s+${i+1}|PAPER|$)`, 'i');
      const match = readingSection.match(regex);
      parts.push({
        partNumber: i,
        title: `Part ${i}`,
        instructions: '',
        type: 'multiple_choice',
        text: match?.[0]?.substring(0, 1000) || '',
        questions: []
      });
    }
    return { parts };
  }

  private parseCefrWriting(text: string) {
    const writingSection = text.match(/PAPER\s*3[\s\S]*/i)?.[0] || '';
    const task1 = writingSection.match(/TASK\s*1[\s\S]*?(?=TASK\s*2|$)/i);
    const task2 = writingSection.match(/TASK\s*2[\s\S]*/i);
    return {
      task1: { 
        instructions: task1?.[0]?.replace(/TASK\s*1/i, '').trim().substring(0, 400) || '',
        minWords: 150,
        timeRecommended: 40
      },
      task2: { 
        instructions: task2?.[0]?.replace(/TASK\s*2/i, '').trim().substring(0, 400) || '',
        minWords: 250,
        timeRecommended: 60
      }
    };
  }

  private extractFirstSentence(text: string): string {
    const match = text.match(/(?:You will|Choose|Complete|Write|Match)[^.!?]+[.!?]/);
    return match?.[0] || '';
  }

  private detectType(text: string): string {
    if (text.match(/A\)|B\)|C\)/)) return 'multiple_choice';
    if (text.match(/True|False/i)) return 'true_false';
    if (text.match(/Speaker\s+\d|Match/i)) return 'matching';
    return 'fill_blank';
  }

  private extractNumberedItems(text: string, partNum: number): any[] {
    const lines = text.split('\n');
    const questions: any[] = [];
    lines.forEach(line => {
      const m = line.match(/^(\d+)[.)]\s+(.{3,})/);
      if (m) {
        questions.push({
          id: `cefr-p${partNum}-q${m[1]}`,
          number: parseInt(m[1]),
          type: 'fill_blank',
          text: m[2].trim(),
          options: [],
          correctAnswer: ''
        });
      }
    });
    return questions.slice(0, 15);
  }
}
