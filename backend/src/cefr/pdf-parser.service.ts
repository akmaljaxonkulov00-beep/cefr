import { Injectable } from '@nestjs/common';
// @ts-ignore
const pdfParse = require('pdf-parse');

export interface ParsedCefrPart {
  partNumber: number;
  questions: any[];
  type: string;
}

export interface ParsedCefrPassage {
  passageNumber: number;
  title: string;
  text: string;
  parts: any[];
}

export interface ParsedCefrMock {
  listening: { parts: ParsedCefrPart[] };
  reading: { parts: ParsedCefrPart[] };
  writing: { task11: any; task12: any; task2: any };
}

@Injectable()
export class CefrPdfParserService {
  async parseCefrMock(buffer: Buffer): Promise<ParsedCefrMock> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text;

      return {
        listening: this.parseCefrListening(text),
        reading: this.parseCefrReading(text),
        writing: this.parseCefrWriting(text),
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  private parseCefrListening(text: string): { parts: ParsedCefrPart[] } {
    const parts: ParsedCefrPart[] = [];
    
    // Find PAPER 1: LISTENING section
    const listeningSection = text.match(/PAPER\s*1[\s\S]*?(?=PAPER\s*2|$)/i);
    
    if (listeningSection) {
      // Extract Part 1-6
      const partRegex = /Part\s+(\d+)[\s\S]*?(?=Part\s+\d+|PAPER|$)/gi;
      const matches = listeningSection[0].match(partRegex);

      if (matches) {
        matches.forEach((partText, index) => {
          const partNumber = index + 1;
          const questions = this.extractCefrQuestions(partText);
          
          parts.push({
            partNumber,
            questions,
            type: this.detectCefrType(partText),
          });
        });
      }
    }

    // If no parts found, create default structure
    if (parts.length === 0) {
      for (let i = 1; i <= 6; i++) {
        parts.push({
          partNumber: i,
          questions: [],
          type: 'multiple_choice',
        });
      }
    }

    return { parts };
  }

  private parseCefrReading(text: string): { parts: ParsedCefrPart[] } {
    const parts: ParsedCefrPart[] = [];
    
    // Find PAPER 2: READING section
    const readingSection = text.match(/PAPER\s*2[\s\S]*?(?=PAPER\s*3|$)/i);
    
    if (readingSection) {
      // Extract Part 1-5
      const partRegex = /Part\s+(\d+)[\s\S]*?(?=Part\s+\d+|PAPER|$)/gi;
      const matches = readingSection[0].match(partRegex);

      if (matches) {
        matches.forEach((partText, index) => {
          const partNumber = index + 1;
          const questions = this.extractCefrQuestions(partText);
          
          parts.push({
            partNumber,
            questions,
            type: this.detectCefrType(partText),
          });
        });
      }
    }

    // If no parts found, create default structure
    if (parts.length === 0) {
      for (let i = 1; i <= 5; i++) {
        parts.push({
          partNumber: i,
          questions: [],
          type: 'multiple_choice',
        });
      }
    }

    return { parts };
  }

  private parseCefrWriting(text: string): { task11: any; task12: any; task2: any } {
    // Find PAPER 3: WRITING section
    const writingSection = text.match(/PAPER\s*3[\s\S]*/i);
    
    const task11 = {
      instructions: 'Write a short email to your friend about your holiday plans.',
      minWords: 50,
      timeRecommended: 15,
    };

    const task12 = {
      instructions: 'Write a story about a memorable day.',
      minWords: 100,
      timeRecommended: 25,
    };

    const task2 = {
      instructions: 'Write an essay about the importance of learning foreign languages.',
      minWords: 180,
      timeRecommended: 40,
    };

    if (writingSection) {
      // Try to extract actual tasks from the text
      const task11Match = writingSection[0].match(/Task\s*1\.1[\s\S]*?(?=Task\s*1\.2|Task\s*2|$)/i);
      const task12Match = writingSection[0].match(/Task\s*1\.2[\s\S]*?(?=Task\s*2|$)/i);
      const task2Match = writingSection[0].match(/Task\s*2[\s\S]*/i);

      if (task11Match) {
        task11.instructions = task11Match[0].trim();
      }
      if (task12Match) {
        task12.instructions = task12Match[0].trim();
      }
      if (task2Match) {
        task2.instructions = task2Match[0].trim();
      }
    }

    return { task11, task12, task2 };
  }

  private extractCefrQuestions(text: string): any[] {
    const questions: any[] = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(\d+)[.)]\s*(.+)/);
      if (match) {
        const qNum = parseInt(match[1]);
        questions.push({
          id: `q${qNum}`,
          number: qNum,
          text: match[2],
          type: 'multiple_choice',
          correctAnswer: '',
        });
      }
    });

    return questions;
  }

  private detectCefrType(text: string): string {
    if (text.match(/A\)|B\)|C\)/)) return 'multiple_choice';
    if (text.match(/True|False/i)) return 'true_false';
    if (text.match(/Match/i)) return 'matching';
    if (text.match(/Fill/i)) return 'fill_blank';
    return 'multiple_choice';
  }
}
