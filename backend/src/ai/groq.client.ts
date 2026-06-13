import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { APIError } from 'openai';

const GROQ_BASE = 'https://api.groq.com/openai/v1';

/** .env da qo'shtirnoq yoki bo'shliq bilan berilgan kalitlarni tozalash */
function normalizeEnvSecret(raw: string | undefined): string {
  let v = (raw ?? '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/^\uFEFF/, '');
}

function normalizeSttModel(raw: string | undefined): string {
  const m = (raw ?? '').trim();
  if (m) return m;
  return 'whisper-large-v3-turbo';
}

function formatGroqError(err: unknown): string {
  if (err instanceof APIError) {
    const body = err.error ? JSON.stringify(err.error) : '';
    return `HTTP ${err.status ?? '?'} ${err.message}${body ? ` | ${body}` : ''}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

@Injectable()
export class GroqClientService {
  private readonly logger = new Logger(GroqClientService.name);
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    const key = normalizeEnvSecret(process.env.GROQ_API_KEY);
    if (!key) {
      throw new ServiceUnavailableException(
        'GROQ_API_KEY is not configured. Set it in backend/.env and restart the server.',
      );
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey: key, baseURL: GROQ_BASE });
      const looksGroq = key.startsWith('gsk_');
      this.logger.log(`Groq client initialized (key length=${key.length}, Groq prefix gsk_: ${looksGroq})`);
    }
    return this.client;
  }

  async chatJson<T>(params: {
    system: string;
    user: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ parsed: T; usage: { input?: number; output?: number }; latencyMs: number; model: string }> {
    const model = params.model ?? process.env.GROQ_CHAT_MODEL ?? 'llama-3.3-70b-versatile';
    const started = Date.now();
    this.logger.log(`Groq chat request: model=${model}, tokens=${params.maxTokens ?? 2048}`);
    
    try {
      const res = await this.getClient().chat.completions.create({
        model: model.trim(),
        temperature: params.temperature ?? 0.35,
        max_tokens: params.maxTokens ?? 2048,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
      });

      const latencyMs = Date.now() - started;
      const text = res.choices[0]?.message?.content ?? '{}';
      let parsed: T;
      try {
        parsed = JSON.parse(text) as T;
      } catch (e) {
        this.logger.error(`Groq JSON parse failed: ${(e as Error).message}, raw response: ${text}`);
        throw new ServiceUnavailableException('AI response was not valid JSON. Please try again.');
      }
      const usage = res.usage;
      this.logger.log(`Groq chat success: latency=${latencyMs}ms, input_tokens=${usage?.prompt_tokens}, output_tokens=${usage?.completion_tokens}`);
      return {
        parsed,
        usage: { input: usage?.prompt_tokens, output: usage?.completion_tokens },
        latencyMs,
        model: model.trim(),
      };
    } catch (err: any) {
      const errorMsg = formatGroqError(err);
      this.logger.error(`Groq chat error: ${errorMsg}`);
      
      // SSL/Certificate errors
      if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'CERT_HAS_EXPIRED' || err.message?.includes('certificate')) {
        throw new ServiceUnavailableException('❌ SSL sertifikat xatosi. Internet ulanishini yoki firewall sozlamalarini tekshiring. Backend/.env da GROQ_API_KEY to\'g\'ri sozlanganligini tasdiqlang.');
      }
      
      // Network/Connection errors
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message?.includes('Connection error')) {
        throw new ServiceUnavailableException('❌ Internet ulanishi yo\'q yoki Groq serveri javob bermayapti. Tarmoq ulanishini tekshiring va qayta urinib ko\'ring.');
      }
      
      // API Key errors
      if (err instanceof APIError && err.status === 401) {
        throw new ServiceUnavailableException('❌ Noto\'g\'ri GROQ_API_KEY. backend/.env faylini tekshiring va backend serverni qayta ishga tushiring.');
      }
      
      // Other API errors
      if (err instanceof APIError) {
        throw new ServiceUnavailableException(`❌ Groq API xatosi (${err.status}): ${errorMsg}. API limitga yetgan bo\'lishi mumkin, bir oz kuting va qayta urinib ko\'ring.`);
      }
      
      throw new ServiceUnavailableException(`❌ AI service xatosi: ${errorMsg}. GROQ_API_KEY va internet ulanishini tekshiring.`);
    }
  }

  async transcribeAudio(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<{
    text: string;
    segments?: { start: number; end: number }[];
    model: string;
    latencyMs: number;
  }> {
    const model = normalizeSttModel(process.env.GROQ_STT_MODEL);
    const started = Date.now();
    
    try {
      const client = this.getClient();
      this.logger.log(`Starting Groq STT with model: ${model}, file: ${params.filename}, size: ${params.buffer.length} bytes`);
      const file = await toFile(params.buffer, params.filename, { type: params.mimeType });

      try {
        const res = await client.audio.transcriptions.create({
          file,
          model,
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
        });
        const latencyMs = Date.now() - started;
        const verbose = res as unknown as { text?: string; segments?: { start: number; end: number }[] };
        this.logger.log(`Groq STT verbose_json success: latency=${latencyMs}ms, text_length=${verbose.text?.length || 0}`);
        return {
          text: verbose.text ?? '',
          segments: verbose.segments,
          model,
          latencyMs,
        };
      } catch (e1: any) {
        this.logger.warn(`Groq STT verbose_json failed, trying fallback: ${formatGroqError(e1)}`);
        
        // SSL/Certificate errors
        if (e1.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || e1.code === 'CERT_HAS_EXPIRED' || e1.message?.includes('certificate')) {
          throw new ServiceUnavailableException('❌ SSL sertifikat xatosi. Internet ulanishini yoki firewall sozlamalarini tekshiring. Backend/.env da GROQ_API_KEY to\'g\'ri sozlanganligini tasdiqlang.');
        }
        
        // Network/Connection errors
        if (e1.code === 'ENOTFOUND' || e1.code === 'ECONNREFUSED' || e1.code === 'ETIMEDOUT' || e1.message?.includes('Connection error')) {
          throw new ServiceUnavailableException('❌ Internet ulanishi yo\'q yoki Groq serveri javob bermayapti. Tarmoq ulanishini tekshiring va qayta urinib ko\'ring.');
        }
        
        try {
          const file2 = await toFile(params.buffer, params.filename, { type: params.mimeType });
          const res = await client.audio.transcriptions.create({
            file: file2,
            model,
            response_format: 'json',
          });
          const latencyMs = Date.now() - started;
          const plain = res as unknown as { text?: string };
          this.logger.log(`Groq STT fallback json success: latency=${latencyMs}ms, text_length=${plain.text?.length || 0}`);
          return { text: plain.text ?? '', segments: undefined, model, latencyMs };
        } catch (e2: any) {
          const errorMsg = formatGroqError(e2);
          this.logger.error(`Groq STT (fallback json) failed: ${errorMsg}`);
          
          // SSL/Certificate errors
          if (e2.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || e2.code === 'CERT_HAS_EXPIRED' || e2.message?.includes('certificate')) {
            throw new ServiceUnavailableException('❌ SSL sertifikat xatosi. Internet ulanishini yoki firewall sozlamalarini tekshiring.');
          }
          
          // Network/Connection errors
          if (e2.code === 'ENOTFOUND' || e2.code === 'ECONNREFUSED' || e2.code === 'ETIMEDOUT' || e2.message?.includes('Connection error')) {
            throw new ServiceUnavailableException('❌ Internet ulanishi yo\'q. Tarmoq ulanishini tekshiring va qayta urinib ko\'ring.');
          }
          
          if (e2 instanceof APIError && e2.status === 401) {
            throw new ServiceUnavailableException('❌ Noto\'g\'ri GROQ_API_KEY. backend/.env faylini tekshiring.');
          }
          throw new ServiceUnavailableException(`❌ Speech-to-text xatosi: ${errorMsg}. GROQ_API_KEY va internet ulanishini tekshiring.`);
        }
      }
    } catch (error: any) {
      const errorMsg = formatGroqError(error);
      this.logger.error(`Groq client initialization or transcription error: ${errorMsg}`);
      
      // SSL/Certificate errors
      if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED' || error.message?.includes('certificate')) {
        throw new ServiceUnavailableException('❌ SSL sertifikat xatosi. Internet yoki firewall sozlamalarini tekshiring.');
      }
      
      // Network/Connection errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('Connection error')) {
        throw new ServiceUnavailableException('❌ Internet ulanishi yo\'q. Tarmoq ulanishini tekshiring.');
      }
      
      if (error instanceof APIError && error.status === 401) {
        throw new ServiceUnavailableException('❌ Noto\'g\'ri GROQ_API_KEY. backend/.env da tekshiring.');
      }
      throw new ServiceUnavailableException(`❌ Audio tahlil xatosi: ${errorMsg}. GROQ_API_KEY va tarmoq sozlamalarini tekshiring.`);
    }
  }
}
