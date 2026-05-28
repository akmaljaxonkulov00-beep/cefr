// Mock Test Data Structure

export type QuestionType = 'MCQ' | 'FILL_BLANKS' | 'MATCHING' | 'ESSAY' | 'SPEAKING';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer?: string;
  paragraphRef?: string; // For reading - which paragraph this question relates to
  order: number;
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  paragraphs: string[]; // Split into paragraphs for reference
  questions: Question[];
}

export interface ListeningSection {
  id: string;
  title: string;
  audioUrl: string;
  transcript?: string;
  questions: Question[];
}

export interface WritingTask {
  id: string;
  taskNumber: 1 | 2 | 1.1 | 1.2;
  prompt: string;
  wordLimit?: number;
  timeLimit?: number; // in minutes
}

export interface SpeakingPart {
  id: string;
  partNumber: 1 | 2 | 3;
  questions: string[];
  cueCard?: {
    topic: string;
    points: string[];
  };
  timeLimit?: number; // in minutes
}

export interface MockTestMetadata {
  id: string;
  title: string;
  type: 'IELTS' | 'CEFR';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  duration: number; // in minutes
  createdAt: string;
  createdBy: string;
  centerId?: string;
}

export interface MockTest {
  metadata: MockTestMetadata;
  reading: {
    passages: ReadingPassage[];
    timeLimit: number; // in minutes
  };
  listening: {
    sections: ListeningSection[];
    timeLimit: number; // in minutes
  };
  writing: {
    tasks: WritingTask[];
    timeLimit: number; // in minutes
  };
  speaking: {
    parts: SpeakingPart[];
    timeLimit: number; // in minutes
  };
}

export interface UserAnswers {
  reading: {
    [passageId: string]: {
      [questionId: string]: string | string[];
    };
  };
  listening: {
    [sectionId: string]: {
      [questionId: string]: string | string[];
    };
  };
  writing: {
    [taskId: string]: string;
  };
  speaking: {
    [partId: string]: {
      [questionId: string]: string;
    };
  };
}
