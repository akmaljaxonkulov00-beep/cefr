import { Injectable } from '@nestjs/common';

export interface ParsedSection {
  sectionNumber: number;
  audioUrl?: string;
  audioStart?: number;
  audioEnd?: number;
  title: string;
  instructions: string;
  questionType: string;
  maxWords?: number;
  questions: any[];
}

export interface ParsedPassage {
  passageNumber: number;
  title: string;
  text: string;
  sections: string[];
  parts: any[];
}

export interface ParsedMock {
  listening: { sections: ParsedSection[] };
  reading: { passages: ParsedPassage[] };
  writing: { task1: any; task2: any };
  speaking: { part1: any; part2: any; part3: any };
}

@Injectable()
export class IeltsPdfParserService {
  async parseIeltsMock(buffer: Buffer): Promise<ParsedMock> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      const text = data.text;

      return {
        listening: this.parseListening(text),
        reading: this.parseReading(text),
        writing: this.parseWriting(text),
        speaking: this.parseSpeaking(text),
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  private parseListening(text: string): { sections: ParsedSection[] } {
    const sections: ParsedSection[] = [];
    
    // Find Section 1-4 blocks
    const sectionRegex = /SECTION\s+(\d+)[\s\S]*?(?=SECTION\s+\d+|READING|$)/gi;
    const matches = text.match(sectionRegex);

    if (matches) {
      matches.forEach((sectionText, index) => {
        const sectionNumber = index + 1;
        const questions = this.extractQuestions(sectionText, sectionNumber);
        
        sections.push({
          sectionNumber,
          title: `Section ${sectionNumber}`,
          instructions: this.extractInstructions(sectionText),
          questionType: this.detectQuestionType(sectionText),
          maxWords: this.detectMaxWords(sectionText),
          questions,
        });
      });
    }

    // If no sections found, create default structure
    if (sections.length === 0) {
      for (let i = 1; i <= 4; i++) {
        sections.push({
          sectionNumber: i,
          title: `Section ${i}`,
          instructions: 'Complete the questions below',
          questionType: 'fill_blank',
          maxWords: 2,
          questions: [],
        });
      }
    }

    return { sections };
  }

  private parseReading(text: string): { passages: ParsedPassage[] } {
    const passages: ParsedPassage[] = [];
    
    // Find Passage 1-3 blocks
    const passageRegex = /Passage\s+(\d+)[\s\S]*?(?=Passage\s+\d+|WRITING|$)/gi;
    const matches = text.match(passageRegex);

    if (matches) {
      matches.forEach((passageText, index) => {
        const passageNumber = index + 1;
        const title = this.extractPassageTitle(passageText);
        const passageContent = this.extractPassageContent(passageText);
        const sections = this.extractSections(passageContent);
        const parts = this.extractReadingParts(passageText);

        passages.push({
          passageNumber,
          title: title || `Passage ${passageNumber}`,
          text: passageContent,
          sections,
          parts,
        });
      });
    }

    // If no passages found, create default structure
    if (passages.length === 0) {
      for (let i = 1; i <= 3; i++) {
        passages.push({
          passageNumber: i,
          title: `Passage ${i}`,
          text: '',
          sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          parts: [],
        });
      }
    }

    return { passages };
  }

  private parseWriting(text: string): { task1: any; task2: any } {
    const task1Match = text.match(/Task\s*1[\s\S]*?(?=Task\s*2|SPEAKING|$)/i);
    const task2Match = text.match(/Task\s*2[\s\S]*?(?=SPEAKING|Speaking|$)/i);

    return {
      task1: {
        instructions: task1Match?.[0]?.trim() || 'The table below compares actual and predicted figures for populations in three different cities.',
        imageUrl: null,
        minWords: 150,
        timeRecommended: 20,
      },
      task2: {
        instructions: task2Match?.[0]?.trim() || 'Student learn far more with their teachers than other sources (the Internet or television). To what extent do you agree or disagree?',
        type: 'agree_disagree',
        minWords: 250,
        timeRecommended: 40,
      },
    };
  }

  private parseSpeaking(text: string): { part1: any; part2: any; part3: any } {
    const part1Match = text.match(/Part\s*1[\s\S]*?(?=Part\s*2|$)/i);
    const part2Match = text.match(/Part\s*2[\s\S]*?(?=Part\s*3|$)/i);
    const part3Match = text.match(/Part\s*3[\s\S]*/i);

    return {
      part1: {
        topic: this.extractSpeakingTopic(part1Match?.[0] || ''),
        questions: this.extractSpeakingQuestions(part1Match?.[0] || ''),
      },
      part2: {
        cueCard: this.extractCueCard(part2Match?.[0] || ''),
        bulletPoints: this.extractBulletPoints(part2Match?.[0] || ''),
        prepTime: 60,
        speakTime: 120,
      },
      part3: {
        topic: this.extractSpeakingTopic(part3Match?.[0] || ''),
        questions: this.extractSpeakingQuestions(part3Match?.[0] || ''),
      },
    };
  }

  private extractQuestions(sectionText: string, sectionNumber: number): any[] {
    const questions: any[] = [];
    const lines = sectionText.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(\d+)[.)]\s*(.+)/);
      if (match) {
        const qNum = parseInt(match[1]);
        questions.push({
          id: `q${sectionNumber}_${qNum}`,
          number: qNum,
          text: match[2],
          type: 'fill_blank',
          correctAnswer: '',
        });
      }
    });

    return questions;
  }

  private extractInstructions(text: string): string {
    const match = text.match(/(?:Complete|Choose|Write|Select)[^.]*\./i);
    return match?.[0] || 'Complete the questions below';
  }

  private detectQuestionType(text: string): string {
    if (text.match(/A\)|B\)|C\)/)) return 'multiple_choice';
    if (text.match(/True|False/i)) return 'true_false';
    if (text.match(/Match/i)) return 'matching';
    if (text.match(/Table/i)) return 'table';
    return 'fill_blank';
  }

  private detectMaxWords(text: string): number {
    if (text.match(/ONE WORD/i)) return 1;
    if (text.match(/TWO WORDS/i)) return 2;
    if (text.match(/ONE WORD OR A NUMBER/i)) return 1;
    if (text.match(/TWO WORDS OR A NUMBER/i)) return 2;
    return 2;
  }

  private extractPassageTitle(text: string): string {
    const match = text.match(/^(.+?)(?:\n|$)/);
    return match?.[1]?.trim() || '';
  }

  private extractPassageContent(text: string): string {
    // Remove title and questions, keep only passage text
    const lines = text.split('\n');
    let content = '';
    let inPassage = true;
    
    lines.forEach(line => {
      if (line.match(/Questions|question/i)) {
        inPassage = false;
      }
      if (inPassage && line.trim()) {
        content += line + '\n';
      }
    });

    return content.trim();
  }

  private extractSections(text: string): string[] {
    // Extract section labels like A, B, C, etc.
    const sections: string[] = [];
    const regex = /\b([A-G])\b/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (!sections.includes(match[1])) {
        sections.push(match[1]);
      }
    }

    return sections.length > 0 ? sections : ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  }

  private extractReadingParts(text: string): any[] {
    const parts: any[] = [];
    const partRegex = /Questions\s+(\d+)-(\d+)[\s\S]*?(?=Questions\s+\d+-\d+|$)/gi;
    const matches = text.match(partRegex);

    if (matches) {
      matches.forEach((partText) => {
        const rangeMatch = partText.match(/Questions\s+(\d+)-(\d+)/);
        if (rangeMatch) {
          parts.push({
            partTitle: `Questions ${rangeMatch[1]}-${rangeMatch[2]}`,
            type: this.detectQuestionType(partText),
            instructions: this.extractInstructions(partText),
            questions: this.extractQuestions(partText, 0),
          });
        }
      });
    }

    return parts;
  }

  private extractSpeakingTopic(text: string): string {
    const match = text.match(/(?:Topic|Discuss)[^.]*\./i);
    return match?.[0] || 'General topic';
  }

  private extractSpeakingQuestions(text: string): string[] {
    const questions: string[] = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.match(/\?/)) {
        questions.push(line.trim());
      }
    });

    return questions.length > 0 ? questions : ['Question 1?', 'Question 2?'];
  }

  private extractCueCard(text: string): string {
    const match = text.match(/Describe[\s\S]*?\?/);
    return match?.[0] || 'Describe an experience...';
  }

  private extractBulletPoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.match(/^[•\-\*]/)) {
        points.push(line.replace(/^[•\-\*]\s*/, '').trim());
      }
    });

    return points.length > 0 ? points : ['Point 1', 'Point 2', 'Point 3', 'Point 4'];
  }
}
