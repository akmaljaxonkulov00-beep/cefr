import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GroqClientService } from './groq.client';
import { StorageService } from '../storage/storage.service';

type WritingAiJson = {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  estimatedCEFR: string;
  feedbackUz: string;
  grammarAnalysis?: Record<string, unknown>;
  vocabularyAnalysis?: Record<string, unknown>;
  coherenceAnalysis?: Record<string, unknown>;
};

type IELTSWritingJson = {
  overallBand: number;
  criteriaScores: {
    taskAchievement: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalAccuracy: number;
  };
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  grammarErrors: { error: string; correction: string; type: string }[];
  vocabularyAnalysis: {
    score: number;
    advancedWords: string[];
    repeatedWords: string[];
  };
};

type PronunciationAnalysisUz = {
  strengthsUz: string;
  issuesUz: string;
  stressAndLinkingUz: string;
};

type FluencyAnalysisUz = {
  paceAndRhythmUz: string;
  hesitationUz: string;
  coherenceSpokenUz: string;
};

type SpeakingAiJson = {
  fluencyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  overallScore: number;
  estimatedSpeakingCEFR: string;
  feedbackUz: string;
  pronunciationAnalysis: PronunciationAnalysisUz;
  fluencyAnalysis: FluencyAnalysisUz;
};

type IELTSSpeakingJson = {
  overallBand: number;
  criteriaScores: {
    fluencyAndCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    pronunciation: number;
  };
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  vocabularyAnalysis: {
    variety: string;
    advancedWords: string[];
    repetitions: string[];
  };
  grammarAnalysis: {
    accuracy: string;
    complexity: string;
    errors: { error: string; correction: string }[];
  };
  fluencyAnalysis: {
    pace: string;
    hesitations: number;
    fillerWords: string[];
  };
};

type RoadmapAiJson = {
  currentLevel: string;
  targetLevel: string;
  weakSkills: string[];
  studyPlan: { day: number; task: string; duration: string }[];
};

type CefrPredictJson = {
  estimatedLevel: string;
  confidence: number;
  rationaleUz: string;
};

type DiagnosticReportJson = {
  overall_score: string;
  skills: {
    reading: { score: string; feedback: string };
    listening: { score: string; feedback: string };
    writing: { score: string; feedback: string };
    speaking: { score: string; feedback: string };
  };
  diagnostics: {
    strengths: string;
    weaknesses: string;
    action_plan: string;
  };
};

const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

function clampScore(n: unknown, fallback = 50): number {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(100, Math.max(0, Math.round(x)));
}

function normalizeCefr(raw: unknown): string {
  const s = String(raw ?? '').trim().toUpperCase();
  if (CEFR_LEVELS.has(s)) return s;
  return 'B1';
}

function normalizeSpeakingAiJson(raw: Record<string, unknown>): SpeakingAiJson {
  const pr = (raw.pronunciationAnalysis ?? {}) as Record<string, unknown>;
  const fl = (raw.fluencyAnalysis ?? {}) as Record<string, unknown>;
  return {
    fluencyScore: clampScore(raw.fluencyScore),
    grammarScore: clampScore(raw.grammarScore),
    pronunciationScore: clampScore(raw.pronunciationScore),
    overallScore: clampScore(raw.overallScore),
    estimatedSpeakingCEFR: normalizeCefr(raw.estimatedSpeakingCEFR),
    feedbackUz: String(raw.feedbackUz ?? raw.feedback ?? '').trim() || 'Javob qisqa keldi.',
    pronunciationAnalysis: {
      strengthsUz: String(pr.strengthsUz ?? '').trim() || '—',
      issuesUz: String(pr.issuesUz ?? '').trim() || '—',
      stressAndLinkingUz: String(pr.stressAndLinkingUz ?? '').trim() || '—',
    },
    fluencyAnalysis: {
      paceAndRhythmUz: String(fl.paceAndRhythmUz ?? '').trim() || '—',
      hesitationUz: String(fl.hesitationUz ?? '').trim() || '—',
      coherenceSpokenUz: String(fl.coherenceSpokenUz ?? '').trim() || '—',
    },
  };
}

/** Pause / timing stats from Whisper segment timestamps (seconds). */
function pauseMetricsFromSegments(
  segments: { start: number; end: number }[] | undefined,
  transcript: string,
): Record<string, unknown> {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (!segments?.length) {
    return {
      source: 'groq_whisper',
      segmentCount: 0,
      wordCount: words,
      longPausesOver1_5s: 0,
      pausesOver0_5s: 0,
      maxGapSec: 0,
      totalSpeechSec: 0,
      audioDurationSec: null,
      totalPauseSec: null,
      speechRatioApprox: null,
      wordsPerMinuteApprox: null,
    };
  }

  let totalSpeech = 0;
  for (const s of segments) {
    totalSpeech += Math.max(0, s.end - s.start);
  }

  let longPauses = 0;
  let pausesHalf = 0;
  let maxGap = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = Math.max(0, segments[i + 1].start - segments[i].end);
    if (gap > maxGap) maxGap = gap;
    if (gap >= 1.5) longPauses++;
    if (gap >= 0.5) pausesHalf++;
  }

  const audioDurationSec = Math.max(...segments.map((s) => s.end));
  const totalPauseSec = Math.max(0, audioDurationSec - totalSpeech);
  const speechRatioApprox = audioDurationSec > 0 ? totalSpeech / audioDurationSec : null;
  const wordsPerMinuteApprox =
    audioDurationSec > 0 && words > 0 ? Math.round((words / audioDurationSec) * 60) : null;

  return {
    source: 'groq_whisper',
    segmentCount: segments.length,
    wordCount: words,
    longPausesOver1_5s: longPauses,
    pausesOver0_5s: pausesHalf,
    maxGapSec: maxGap,
    totalSpeechSec: totalSpeech,
    audioDurationSec,
    totalPauseSec,
    speechRatioApprox,
    wordsPerMinuteApprox,
  };
}

const SPEAKING_JSON_SYSTEM = `Sen CEFR og‘zaki nutq (speaking) bo‘yicha senior ekspertsan.
Faqat bitta JSON obyekt qaytaring (boshqa matn yo‘q). Barcha tahlil matnlari o‘zbek tilida bo‘lsin.

Maydonlar (butun sonlar 0–100):
- fluencyScore: ravonlik, tezlik, to‘xtashlar muvozanati
- grammarScore: og‘zaki grammatika
- pronunciationScore: talaffuz va tushunarliqlik (audio transkripti asosida taxminiy)
- overallScore: umumiy nutq sifati
- estimatedSpeakingCEFR: faqat bittasi: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"
- feedbackUz: batafsil mulohaza (kamida 5 jumla), aniq tavsiyalar
- pronunciationAnalysis: {
    "strengthsUz": "talaffuzdagi kuchli tomonlar",
    "issuesUz": "aniqlangan muammolar va tuzatish",
    "stressAndLinkingUz": "urg‘u va bog‘lovchi tovushlar"
  }
- fluencyAnalysis: {
    "paceAndRhythmUz": "sur’at va ritm",
    "hesitationUz": "to‘xtash, uh/um kabi to‘ldiruvchilar, pauzalar ta’siri",
    "coherenceSpokenUz": "fikr izchiligi va bog‘lanish"
  }

Transkript va pauza statistikasi beriladi. Transkript juda qisqa bo‘lsa, ballarni pastroq qo‘ying va feedbackda "uzoqroq gapiring" deb yozing.`;

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private groq: GroqClientService,
    private storage: StorageService,
  ) {}

  private async logUsage(input: {
    userId?: string | null;
    endpoint: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs: number;
    success?: boolean;
  }) {
    await this.prisma.aiUsageLog.create({
      data: {
        userId: input.userId ?? undefined,
        endpoint: input.endpoint,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        latencyMs: input.latencyMs,
        success: input.success ?? true,
      },
    });
  }

  async analyzeWriting(userId: string, essay: string) {
    const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      throw new BadRequestException('Kamida 10 ta so‘z yozing');
    }

    const system = `Sen professional CEFR yozma baholash mutaxissisan. Javobni FAQAT JSON qilib qaytara olasan.
Maydonlar (0-100 oralig‘ida ballar, CEFR: A1|A2|B1|B2|C1|C2):
- overallScore, grammarScore, vocabularyScore, coherenceScore
- estimatedCEFR
- feedbackUz: o‘zbek tilida batafsil fikr-mulohaza (kamida 4 jumla)
- grammarAnalysis: { "issues": [ {"quote": "...", "fixUz": "..."} ] }
- vocabularyAnalysis: { "rangeUz": "...", "strongUz": "...", "improveUz": "..." }
- coherenceAnalysis: { "structureUz": "...", "cohesionUz": "..." }`;

    const user = `Quyidagi inshoni baholang (matn o‘zbek/ingliz aralash bo‘lishi mumkin, lekin fikrlar o‘zbekcha bo‘lsin):\n\n${essay}`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<WritingAiJson>({
      system,
      user,
      maxTokens: 2500,
      temperature: 0.25,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.writing',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    const submission = await this.prisma.writingSubmission.create({
      data: {
        userId,
        essay,
        wordCount,
        grammarScore: Math.round(parsed.grammarScore),
        vocabScore: Math.round(parsed.vocabularyScore),
        coherenceScore: Math.round(parsed.coherenceScore),
        aiFeedback: parsed.feedbackUz,
        estimatedLevel: parsed.estimatedCEFR,
        grammarAnalysis: (parsed.grammarAnalysis ?? {}) as object,
        vocabularyAnalysis: (parsed.vocabularyAnalysis ?? {}) as object,
        coherenceAnalysis: (parsed.coherenceAnalysis ?? {}) as object,
      },
    });

    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'WRITING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: {
          submissionId: submission.id,
          overallScore: parsed.overallScore,
          grammarScore: submission.grammarScore,
          vocabScore: submission.vocabScore,
          coherenceScore: submission.coherenceScore,
          estimatedLevel: submission.estimatedLevel,
        },
      },
    });

    return submission;
  }

  async analyzeSpeakingFromAudio(userId: string, buffer: Buffer, filename: string, mimeType: string) {
    if (!buffer?.length) {
      throw new BadRequestException('Audio bo‘sh');
    }

    const { storageKey: audioStorageKey } = await this.storage.saveSpeakingAudio(buffer, mimeType, filename);

    const stt = await this.groq.transcribeAudio({ buffer, filename, mimeType });
    await this.logUsage({
      userId,
      endpoint: 'ai.speaking.stt',
      model: stt.model,
      latencyMs: stt.latencyMs,
    });

    const pauseMetrics = pauseMetricsFromSegments(stt.segments, stt.text || '');
    const segmentMetadata = {
      segments: stt.segments ?? [],
      sttModel: stt.model,
      sttLatencyMs: stt.latencyMs,
    };

    const userPrompt = `Transkript (Groq STT):\n${stt.text || '(bo‘sh yoki aniqlanmadi)'}\n\nPauza va vaqt statistikasi (JSON):\n${JSON.stringify(pauseMetrics, null, 2)}`;

    const { parsed: rawParsed, usage, latencyMs, model } = await this.groq.chatJson<Record<string, unknown>>({
      system: SPEAKING_JSON_SYSTEM,
      user: userPrompt,
      maxTokens: 2200,
      temperature: 0.28,
    });

    const parsed = normalizeSpeakingAiJson(rawParsed);

    await this.logUsage({
      userId,
      endpoint: 'ai.speaking.llm',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    const record = await this.prisma.speakingRecord.create({
      data: {
        userId,
        audioStorageKey,
        transcript: stt.text || '',
        sttProvider: 'groq-whisper',
        pauseMetrics: pauseMetrics as object,
        segmentMetadata: segmentMetadata as object,
        fluencyScore: parsed.fluencyScore,
        grammarScore: parsed.grammarScore,
        pronunciationScore: parsed.pronunciationScore,
        overallScore: parsed.overallScore,
        estimatedSpeakingCefr: parsed.estimatedSpeakingCEFR,
        pronunciationAnalysis: parsed.pronunciationAnalysis as object,
        fluencyAnalysis: parsed.fluencyAnalysis as object,
        feedback: parsed.feedbackUz,
      },
    });

    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'SPEAKING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: {
          recordId: record.id,
          sttModel: stt.model,
          llmModel: model,
          overallScore: record.overallScore,
          estimatedSpeakingCefr: record.estimatedSpeakingCefr,
          pauseMetrics: JSON.parse(JSON.stringify(pauseMetrics)),
        },
      },
    });

    return record;
  }

  /**
   * Transkript bilan tahlil (STT yo‘q). Pauza metrikalari STT bo‘lmagani uchun
   * transkript-rejimida saqlanadi — bu soxta ball emas, cheklov aniq.
   */
  async analyzeSpeakingFromTranscriptOnly(userId: string, audioUrl: string | undefined, transcript: string) {
    const trimmed = transcript.trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    if (words < 8) {
      throw new BadRequestException('Transkript kamida 8 so‘z bo‘lsin');
    }

    const pauseMetrics = {
      source: 'transcript_only',
      noteUz:
        'Audio segmentlari yo‘q: pauza va WPM Whisper STT orqali aniqlanmaydi. Talaffuz va intonatsiya transkript asosida taxminiy baholanadi.',
      wordCount: words,
      longPausesOver1_5s: null,
      pausesOver0_5s: null,
      maxGapSec: null,
      totalSpeechSec: null,
      audioDurationSec: null,
      totalPauseSec: null,
      speechRatioApprox: null,
      wordsPerMinuteApprox: null,
    };

    const userPrompt = `Transkript (faqat matn, audio yo‘q):\n${trimmed}\n\nKontekst (JSON):\n${JSON.stringify(pauseMetrics, null, 2)}`;

    const { parsed: rawParsed, usage, latencyMs, model } = await this.groq.chatJson<Record<string, unknown>>({
      system: SPEAKING_JSON_SYSTEM,
      user: userPrompt,
      maxTokens: 2000,
      temperature: 0.28,
    });

    const parsed = normalizeSpeakingAiJson(rawParsed);

    await this.logUsage({
      userId,
      endpoint: 'ai.speaking.transcript_only',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    const record = await this.prisma.speakingRecord.create({
      data: {
        userId,
        audioUrl: audioUrl || null,
        transcript: trimmed,
        sttProvider: 'client_transcript',
        pauseMetrics: pauseMetrics as object,
        segmentMetadata: { mode: 'transcript_only' } as object,
        fluencyScore: parsed.fluencyScore,
        grammarScore: parsed.grammarScore,
        pronunciationScore: parsed.pronunciationScore,
        overallScore: parsed.overallScore,
        estimatedSpeakingCefr: parsed.estimatedSpeakingCEFR,
        pronunciationAnalysis: parsed.pronunciationAnalysis as object,
        fluencyAnalysis: parsed.fluencyAnalysis as object,
        feedback: parsed.feedbackUz,
      },
    });

    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'SPEAKING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: { recordId: record.id, mode: 'transcript_only' },
      },
    });

    return record;
  }

  async generateRoadmap(userId: string) {
    const analytics = await this.prisma.analytics.findUnique({ where: { userId } });
    const results = await this.prisma.result.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { exam: { select: { title: true, type: true } } },
    });

    const summary = {
      totalExams: analytics?.totalExams ?? 0,
      avgScore: analytics?.avgScore ?? 0,
      weakSkills: (analytics?.weakSkills as string[]) ?? [],
      recent: results.map((r) => ({ score: r.score, title: r.exam.title, type: r.exam.type })),
    };

    const system = `Foydalanuvchi ingliz tili mock natijalari asosida 7 kunlik reja tuz.
Faqat JSON: currentLevel (CEFR), targetLevel, weakSkills (string[]), studyPlan: [{day, task, duration}] — task matnlari o‘zbekcha bo‘lsin.`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<RoadmapAiJson>({
      system,
      user: `Ma'lumotlar:\n${JSON.stringify(summary, null, 2)}`,
      maxTokens: 2000,
      temperature: 0.35,
    });

    await this.logUsage({ userId, endpoint: 'ai.roadmap', model, inputTokens: usage.input, outputTokens: usage.output, latencyMs });

    return {
      ...parsed,
      totalExams: analytics?.totalExams || 0,
      avgScore: analytics?.avgScore || 0,
    };
  }

  async ceFrPrediction(userId: string | undefined, text: string) {
    const system = `Berilgan matn asosida taxminiy CEFR darajasini aniqla. Faqat JSON: estimatedLevel (A1-C2), confidence (0-100), rationaleUz (o‘zbekcha, 2-3 jumla)`;
    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<CefrPredictJson>({
      system,
      user: text.slice(0, 12000),
      maxTokens: 400,
      temperature: 0.2,
    });
    await this.logUsage({
      userId: userId ?? null,
      endpoint: 'ai.cefr-predict',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });
    return parsed;
  }

  async generateDiagnosticReport(
    userId: string,
    testType: 'IELTS' | 'CEFR',
    readingScore: number,
    listeningScore: number,
    writingText: string,
    speakingTranscript: string,
  ) {
    const systemPrompt = `You are a certified IELTS and CEFR senior examiner. Your task is to analyze the student's mock test performance metrics and generate a detailed diagnostic assessment report.
You must output your assessment strictly as a valid JSON object matching the requested schema. Do not include any extra introductory or concluding markdown text.`;

    const userPrompt = `Analyze this student mock exam session:
- Exam Type: ${testType} (Either IELTS or CEFR)
- Reading Score: ${readingScore}
- Listening Score: ${listeningScore}
- Writing Essay Input: "${writingText}"
- Speaking Audio Transcript: "${speakingTranscript}"

Return the JSON following this structure:
{
  "overall_score": "Overall band/level (e.g., '7.0' or 'B2')",
  "skills": {
    "reading": { "score": "X", "feedback": "Short analytical feedback" },
    "listening": { "score": "X", "feedback": "Short analytical feedback" },
    "writing": { "score": "X", "feedback": "Detailed feedback focusing on grammar and vocabulary criteria" },
    "speaking": { "score": "X", "feedback": "Detailed feedback focusing on fluency and pronunciation based on transcript" }
  },
  "diagnostics": {
    "strengths": "Summary of overall cross-skill strengths",
    "weaknesses": "Critical weak points holding the student back",
    "action_plan": "3 concrete, actionable learning steps tailored to their ${testType} goals"
  }
}`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<DiagnosticReportJson>({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 2048,
      temperature: 0.35,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.diagnostic-report',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    // Save to database
    await this.prisma.mockReport.create({
      data: {
        userId,
        testType,
        readingScore,
        listeningScore,
        writingText,
        speakingTranscript,
        aiResponse: parsed as any,
      },
    });

    return parsed;
  }

  async transcribeAudio(
    userId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ) {
    const result = await this.groq.transcribeAudio({
      buffer,
      filename,
      mimeType,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.transcribe',
      model: result.model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: result.latencyMs,
    });

    return {
      text: result.text,
      model: result.model,
      latencyMs: result.latencyMs,
    };
  }

  // IELTS Writing Grading with llama-3.3-70b-versatile
  async gradeIELTSWriting(userId: string, submission: {
    taskType: 'TASK_1' | 'TASK_2';
    prompt: string;
    response: string;
    wordCount: number;
  }) {
    const criteria = submission.taskType === 'TASK_1'
      ? ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy']
      : ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'];

    const system = `You are an IELTS examiner. Grade the following ${submission.taskType} response.
Evaluate based on IELTS criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return a JSON response with:
{
  "overallBand": number (0-9),
  "criteriaScores": {
    "${criteria[0]}": number (0-9),
    "${criteria[1]}": number (0-9),
    "${criteria[2]}": number (0-9),
    "${criteria[3]}": number (0-9)
  },
  "strengths": string[],
  "weaknesses": string[],
  "detailedFeedback": string,
  "grammarErrors": [{ "error": string, "correction": string, "type": string }],
  "vocabularyAnalysis": {
    "score": number,
    "advancedWords": string[],
    "repeatedWords": string[]
  }
}`;

    const user = `Task: ${submission.prompt}
Student Response: ${submission.response}
Word Count: ${submission.wordCount}`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<IELTSWritingJson>({
      system,
      user,
      model: 'llama-3.3-70b-versatile',
      maxTokens: 2500,
      temperature: 0.3,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.ielts-writing',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    return parsed;
  }

  // IELTS Speaking Grading with whisper-large-v3 + llama-3.3-70b-versatile
  async gradeIELTSSpeaking(userId: string, audioBuffer: Buffer, filename: string, mimeType: string, question: string) {
    // Step 1: Transcribe audio with whisper-large-v3
    const stt = await this.groq.transcribeAudio({
      buffer: audioBuffer,
      filename,
      mimeType,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.ielts-speaking.stt',
      model: stt.model,
      latencyMs: stt.latencyMs,
    });

    const pauseMetrics = pauseMetricsFromSegments(stt.segments, stt.text || '');

    // Step 2: Analyze speaking with llama-3.3-70b-versatile
    const system = `You are an IELTS examiner. Evaluate the following speaking response.
Evaluate based on IELTS Speaking criteria:
1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

Return a JSON response with:
{
  "overallBand": number (0-9),
  "criteriaScores": {
    "fluencyAndCoherence": number (0-9),
    "lexicalResource": number (0-9),
    "grammaticalRange": number (0-9),
    "pronunciation": number (0-9)
  },
  "strengths": string[],
  "weaknesses": string[],
  "detailedFeedback": string,
  "vocabularyAnalysis": {
    "variety": string,
    "advancedWords": string[],
    "repetitions": string[]
  },
  "grammarAnalysis": {
    "accuracy": string,
    "complexity": string,
    "errors": [{ "error": string, "correction": string }]
  },
  "fluencyAnalysis": {
    "pace": string,
    "hesitations": number,
    "fillerWords": string[]
  }
}`;

    const user = `Question: ${question}
Student Response Transcript: ${stt.text || ''}
Pause Metrics: ${JSON.stringify(pauseMetrics, null, 2)}`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<IELTSSpeakingJson>({
      system,
      user,
      model: 'llama-3.3-70b-versatile',
      maxTokens: 2500,
      temperature: 0.3,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.ielts-speaking.analysis',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    // Save to database
    const { storageKey: audioStorageKey } = await this.storage.saveSpeakingAudio(audioBuffer, mimeType, filename);

    const record = await this.prisma.speakingRecord.create({
      data: {
        userId,
        audioStorageKey,
        transcript: stt.text || '',
        sttProvider: 'groq-whisper-large-v3',
        pauseMetrics: pauseMetrics as object,
        segmentMetadata: {
          segments: stt.segments ?? [],
          sttModel: stt.model,
          sttLatencyMs: stt.latencyMs,
        } as object,
        fluencyScore: parsed.criteriaScores.fluencyAndCoherence,
        grammarScore: parsed.criteriaScores.grammaticalRange,
        pronunciationScore: parsed.criteriaScores.pronunciation,
        overallScore: parsed.overallBand,
        pronunciationAnalysis: {
          strengthsUz: parsed.strengths.join(', '),
          issuesUz: parsed.weaknesses.join(', '),
          stressAndLinkingUz: parsed.vocabularyAnalysis.variety,
        } as object,
        fluencyAnalysis: {
          paceAndRhythmUz: parsed.fluencyAnalysis.pace,
          hesitationUz: `${parsed.fluencyAnalysis.hesitations} hesitations`,
          coherenceSpokenUz: parsed.detailedFeedback,
        } as object,
        feedback: parsed.detailedFeedback,
      },
    });

    return {
      transcript: stt.text,
      analysis: parsed,
      record,
    };
  }

  // AI Practice Speaking Analysis (for /api/ai/speaking/analyze)
  async analyzeSpeakingPractice(
    userId: string,
    audioBuffer: Buffer,
    filename: string,
    mimeType: string,
    questionText: string,
    part: number,
  ) {
    // Step 1: Transcribe audio
    const stt = await this.groq.transcribeAudio({
      buffer: audioBuffer,
      filename,
      mimeType,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.speaking-practice.stt',
      model: stt.model,
      latencyMs: stt.latencyMs,
    });

    const pauseMetrics = pauseMetricsFromSegments(stt.segments, stt.text || '');
    const transcriptWordCount = (stt.text || '').trim().split(/\s+/).filter(Boolean).length;

    // ⚠️ CRITICAL CHECK: Faqat mutlaqo bo'sh javob = 0 BALL
    if (transcriptWordCount < 3) {
      return {
        fluency: 0,
        vocabulary: 0,
        grammar: 0,
        pronunciation: 0,
        overallScore: 0,
        detectedLevel: 'A1',
        transcription: stt.text || '(bo\'sh)',
        grammarErrors: ['⚠️ Javob bo\'sh. Audio yozilmadi.'],
        feedback: '⚠️ XATO: Audio bo\'sh. Mikrofon ruxsatini tekshiring va qayta urinib ko\'ring.',
        suggestions: [
          'Mikrofon ruxsatini bering va audio yozilishini tekshiring',
          'Savolga javob bering',
          'Audio sifatini tekshiring - ovoz aniq eshitilishi kerak'
        ],
      };
    }

    // PROFESSIONAL CEFR SPEAKING EXAMINER PROMPT
    const system = `Sen professional CEFR Speaking Examiner san. Sen ANIQ, TO'G'RI va JUDA QATTIQ baholash qilasan.

⚠️ MUHIM QOIDA: Faqat bo'sh javoblar uchun 0 ball ber!

Bu Speaking Part ${part}:
- Part 1: Shaxsiy savollar (qisqa javoblar)
- Part 2: Monolog (uzoq javob) 
- Part 3: Muhokama (tahliliy javoblar)

Transkripsiya: ${transcriptWordCount} so'z

⚠️ SO'Z SONI BO'YICHA BAHOLASH (HECH QANDAY MINIMAL TALAB YO'Q):
- Qisqa javoblar ham baholanadi
- Faqat sifat va mazmunni baholay
- So'z soni minimal shartiga bog'liq emas

4 ta kriteriya bo'yicha baho ber (0-10):

1. **Fluency & Coherence**
   - Ko'p pauza (>1.5s) = KATTA minus
   - Hesitation (um, uh) = minus
   - 0-2: Bo'sh yoki juda ko'p pauza
   - 3-4: Ko'p pauza
   - 5-6: O'rtacha
   - 7-8: Yaxshi
   - 9-10: A'lo

2. **Vocabulary**
   - Bir xil so'z qayta-qayta = PAST
   - 0-2: Juda cheklangan
   - 3-4: Cheklangan
   - 5-6: O'rtacha
   - 7-8: Yaxshi
   - 9-10: Keng

3. **Grammar**
   - Har jumlada xato = KATTA minus
   - 0-2: Juda ko'p xato
   - 3-4: Ko'p xato
   - 5-6: Ba'zi xato
   - 7-8: Oz xato
   - 9-10: Deyarli xatosiz

4. **Pronunciation**
   - 0-2: Qiyin tushunish
   - 3-4: Qiyin tushunarli
   - 5-6: Tushunarli
   - 7-8: Aniq
   - 9-10: Native darajada

JSON format (PROFESSIONAL BAHOLASH):
{
  "fluency": number (0-10),
  "vocabulary": number (0-10),
  "grammar": number (0-10),
  "pronunciation": number (0-10),
  "overallScore": number (o'rtacha),
  "detectedLevel": string (A1|A2|B1|B2|C1|C2),
  "transcription": string,
  "grammarErrors": ["Xato → To'g'ri (Sabab)", ...],
  "feedback": "...",
  "suggestions": ["...", ...]
}

CEFR DARAJA:
- 8.5-10: C2
- 8.0-8.4: C1
- 7.0-7.9: B2
- 6.0-6.9: B1
- 5.0-5.9: A2
- 0-4.9: A1

PROFESSIONAL BAHOLASH! Faqat sifat va mazmunni baholang!`;

    const user = `Part ${part} SAVOL:
${questionText}

STUDENT JAVOBI (${transcriptWordCount} so'z):
${stt.text || '(bo\'sh)'}

PROFESSIONAL BAHOLASH! Faqat sifat va mazmunni baholang!`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<any>({
      system,
      user,
      model: 'llama-3.3-70b-versatile',
      maxTokens: 2500,
      temperature: 0.1,  // Very low for strict, consistent grading
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.speaking-practice.analysis',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    // Save to database
    const { storageKey: audioStorageKey } = await this.storage.saveSpeakingAudio(audioBuffer, mimeType, filename);

    const record = await this.prisma.speakingRecord.create({
      data: {
        userId,
        audioStorageKey,
        transcript: stt.text || '',
        sttProvider: 'groq-whisper-large-v3',
        pauseMetrics: pauseMetrics as object,
        segmentMetadata: {
          segments: stt.segments ?? [],
          sttModel: stt.model,
          sttLatencyMs: stt.latencyMs,
          wordCount: transcriptWordCount,
        } as object,
        fluencyScore: Math.round(parsed.fluency || 0),
        grammarScore: Math.round(parsed.grammar || 0),
        pronunciationScore: Math.round(parsed.pronunciation || 0),
        overallScore: parsed.overallScore || 0,
        estimatedSpeakingCefr: parsed.detectedLevel || 'A1',
        pronunciationAnalysis: {
          score: parsed.pronunciation || 0,
          note: 'Based on transcript analysis',
        } as object,
        fluencyAnalysis: {
          score: parsed.fluency || 0,
          pauseMetrics: pauseMetrics,
          wordCount: transcriptWordCount,
        } as object,
        feedback: parsed.feedback || 'Tahlil tugallanmadi.',
      },
    });

    // Log AI report
    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'SPEAKING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: {
          recordId: record.id,
          part,
          wordCount: transcriptWordCount,
          overallScore: parsed.overallScore || 0,
          detectedLevel: parsed.detectedLevel || 'A1',
          scores: {
            fluency: parsed.fluency || 0,
            vocabulary: parsed.vocabulary || 0,
            grammar: parsed.grammar || 0,
            pronunciation: parsed.pronunciation || 0,
          },
        },
      },
    });

    // Format response for frontend
    return {
      fluency: parsed.fluency || 0,
      vocabulary: parsed.vocabulary || 0,
      grammar: parsed.grammar || 0,
      pronunciation: parsed.pronunciation || 0,
      overallScore: parsed.overallScore || 0,
      detectedLevel: parsed.detectedLevel || 'A1',
      transcription: stt.text || '',
      grammarErrors: parsed.grammarErrors || [],
      feedback: parsed.feedback || 'Tahlil muvaffaqiyatsiz tugadi.',
      suggestions: parsed.suggestions || [],
    };
  }

  // AI Practice Writing Analysis (for /api/ai/writing/analyze)
  async analyzeWritingPractice(userId: string, dto: {
    essay: string;
    questionText: string;
    task: number;
    minWords: number;
    maxWords: number;
  }) {
    const wordCount = dto.essay.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
      throw new BadRequestException('Kamida 10 ta so\'z yozing');
    }

    // PROFESSIONAL CEFR WRITING EXAMINER PROMPT
    const system = `Sen professional CEFR Writing Examiner san. Sen ANIQ, TO'G'RI va QATTIQ baholash qilasan.

Bu Writing ${dto.task} (${dto.task === 1 ? 'Letter/Email (100-150 so\'z)' : 'Essay (250-350 so\'z)'}).
Talab: ${dto.minWords}-${dto.maxWords} so'z
Haqiqiy: ${wordCount} so'z

${wordCount < dto.minWords ? `⚠️ JUDA QISQA! Minimum ${dto.minWords} so'z kerak edi. Bu KATTA minus.` : ''}

4 ta kriteriya bo'yicha baho ber (0-10):

1. **Task Achievement / Task Response**
   - Writing 1: Maqsad to'liq erishldi mi? Barcha punktlar yoritildi mi?
   - Writing 2: Savolga to'liq javob berildimi? Ikkala fikr ham muhokama qilindimi? O'z fikr aytildimi?
   - Off-topic yoki yarim-yaralla = 3-4 ball
   - Partial answer = 5-6 ball
   - Complete answer = 7-8 ball
   - Excellent coverage = 9-10 ball

2. **Coherence & Cohesion**
   - Kirish-Asosiy-Xulosa bor mi?
   - Paragraflar mantiqiy tartibda mi?
   - Linking words (however, moreover, furthermore) ishlatildimi?
   - Fikrlar bir-biriga bog'langan mi?
   - No structure = 3-4 ball
   - Basic structure = 5-6 ball
   - Good structure = 7-8 ball
   - Perfect flow = 9-10 ball

3. **Lexical Resource (So'z boyligi)**
   - Har bir so'z qayta-qayta ishlatilgan = PAST
   - Faqat basic words (good, bad, important) = 4-5 ball
   - Mixed vocabulary = 6-7 ball
   - Academic words, synonyms = 8-9 ball
   - Sophisticated, precise words = 10 ball

4. **Grammatical Range & Accuracy**
   - Har bir jumlada xato = 3-4 ball
   - Ko'p xatolar = 5-6 ball
   - Ba'zi xatolar = 7-8 ball
   - Juda oz xato = 9-10 ball
   - Complex structures (relative clauses, conditionals) = bonus

JSON FORMATDA javob ber:
{
  "taskResponse": number (0-10, ANIQ ball),
  "coherence": number (0-10, ANIQ ball),
  "lexical": number (0-10, ANIQ ball),
  "grammar": number (0-10, ANIQ ball),
  "overallScore": number (0-10, 4 ta ball ning o'rtachasi),
  "detectedLevel": string (A1|A2|B1|B2|C1|C2),
  "grammarErrors": [
    "Xato: \"people is\" → To'g'ri: \"people are\" (Sabab: people ko'plik)",
    "Xato: \"more better\" → To'g'ri: \"better\" (Sabab: better allaqachon comparative)",
    "Xato: \"In the conclusion\" → To'g'ri: \"In conclusion\" (Sabab: bu fixed phrase)",
    "... (5-10 ta aniq xato)"
  ],
  "strengths": [
    "Aniq kirish va xulosa bor",
    "Paragraf tuzilishi to'g'ri",
    "Linking words yaxshi ishlatilgan",
    "... (3-5 ta kuchli tomon)"
  ],
  "improvements": [
    "Ko'proq sinonim ishlating (good → excellent, beneficial, advantageous)",
    "Akademik so'zlar qo'shing (enhance, facilitate, demonstrate)",
    "Complex sentence structures qo'llang",
    "... (3-5 ta yaxshilash kerak)"
  ],
  "feedback": "Essay strukturasi yaxshi, lekin so'z boyligi cheklangan. Grammatikada artikl va preposition xatolari ko'p. Task ga to'liq javob berilgan, lekin ko'proq detallar kerak edi. Umumiy daraja B1, C1 ga yetish uchun akademik so'zlar va complex grammar kerak.",
  "suggestions": [
    "Academic Word List (AWL) ning 100 ta eng ko'p ishlatiladigan so'zini yod oling",
    "Relative clauses (who, which, that) bilan jumlalar tuzing",
    "Cause-effect structures (because, therefore, consequently) qo'llang",
    "Har kuni 1 ta academic essay o'qing va yangi so'zlar yozing",
    "... (4-6 ta aniq tavsiya)"
  ]
}

CEFR DARAJA (O'rtacha ball asosida):
- 8.5-10: C2 (Mastery)
- 8.0-8.4: C1 (Effective Operational Proficiency)
- 7.0-7.9: B2 (Vantage)
- 6.0-6.9: B1 (Threshold)
- 5.0-5.9: A2 (Waystage)
- 0-4.9: A1 (Breakthrough)

MUHIM QOIDALAR:
1. REAL examiner kabi QATTIQ baho ber
2. Har bir xatoni ANIQ ko'rsat va TO'G'RISINI yoz
3. Feedback KONKRET bo'lsin (umumiy "good job" emas!)
4. Suggestions AMALIY bo'lsin (nima qilish kerak?)
5. Barcha matnlar O'ZBEKCHA bo'lsin

Hozir tahlil boshlang:`;

    const user = `PROMPT (Topic/Question):
${dto.questionText}

STUDENT ESSAY (${wordCount} so'z):
${dto.essay}

ANIQ TAHLIL BERING (JSON format):`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<any>({
      system,
      user,
      model: 'llama-3.3-70b-versatile',
      maxTokens: 3000,
      temperature: 0.2,  // Lower temperature for more consistent, strict grading
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.writing-practice.analysis',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    // Save to database
    const submission = await this.prisma.writingSubmission.create({
      data: {
        userId,
        essay: dto.essay,
        wordCount,
        grammarScore: Math.round(parsed.grammar || 0),
        vocabScore: Math.round(parsed.lexical || 0),
        coherenceScore: Math.round(parsed.coherence || 0),
        aiFeedback: parsed.feedback || 'Tahlil tugallanmadi.',
        estimatedLevel: parsed.detectedLevel || 'A1',
        grammarAnalysis: {
          errors: parsed.grammarErrors || [],
          improvements: parsed.improvements || [],
        },
        vocabularyAnalysis: {
          strengths: parsed.strengths || [],
          suggestions: parsed.suggestions || [],
        },
        coherenceAnalysis: {
          taskResponse: parsed.taskResponse || 0,
          coherence: parsed.coherence || 0,
        },
      },
    });

    // Log AI report
    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'WRITING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: {
          submissionId: submission.id,
          task: dto.task,
          wordCount,
          overallScore: parsed.overallScore || 0,
          detectedLevel: parsed.detectedLevel || 'A1',
          scores: {
            taskResponse: parsed.taskResponse || 0,
            coherence: parsed.coherence || 0,
            lexical: parsed.lexical || 0,
            grammar: parsed.grammar || 0,
          },
        },
      },
    });

    // Format response for frontend
    return {
      taskResponse: parsed.taskResponse || 0,
      coherence: parsed.coherence || 0,
      lexical: parsed.lexical || 0,
      grammar: parsed.grammar || 0,
      overallScore: parsed.overallScore || 0,
      detectedLevel: parsed.detectedLevel || 'A1',
      grammarErrors: parsed.grammarErrors || [],
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      feedback: parsed.feedback || 'Tahlil muvaffaqiyatsiz tugadi.',
      suggestions: parsed.suggestions || [],
    };
  }
}
