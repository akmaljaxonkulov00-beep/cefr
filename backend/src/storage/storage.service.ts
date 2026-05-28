import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const ALLOWED_IMAGE = new Map<number[], string>([
  [[0xff, 0xd8, 0xff], 'image/jpeg'],
  [[0x89, 0x50, 0x4e, 0x47], 'image/png'],
  [[0x52, 0x49, 0x46, 0x46], 'image/webp'], // RIFF....WEBP checked loosely below
]);

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const ALLOWED_AUDIO = new Set(['audio/webm', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a']);
const ALLOWED_READING_FILES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly root = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads');

  async onModuleInit() {
    await fs.mkdir(path.join(this.root, 'payments'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'speaking'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'writing'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'listening'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'reading'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'mocks'), { recursive: true });
  }

  /** Public URL path (served by Nest static). */
  toPublicUrl(storageKey: string) {
    const base = process.env.PUBLIC_UPLOAD_URL_PREFIX || '/uploads';
    return `${base.replace(/\/$/, '')}/${storageKey.replace(/^\//, '')}`;
  }

  async savePaymentProof(buffer: Buffer, declaredMime: string): Promise<{ storageKey: string; publicUrl: string }> {
    const max = Number(process.env.MAX_PAYMENT_IMAGE_BYTES) || 5 * 1024 * 1024;
    if (buffer.length > max) throw new BadRequestException('Rasm juda katta');
    const mime = sniffImageMime(buffer);
    if (!mime) throw new BadRequestException('Faqat JPEG, PNG yoki WEBP yuklash mumkin');
    if (declaredMime && !declaredMime.startsWith('image/')) {
      throw new BadRequestException('Noto‘g‘ri fayl turi');
    }
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
    const storageKey = `payments/${randomUUID()}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey) };
  }

  async saveSpeakingAudio(buffer: Buffer, mimeType: string, originalName: string): Promise<{ storageKey: string; publicUrl: string }> {
    const max = Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024;
    if (buffer.length > max) throw new BadRequestException('Audio juda katta');
    if (!ALLOWED_AUDIO.has(mimeType)) throw new BadRequestException('Qo‘llab-quvvatlanadigan audio: webm, wav, mp3');
    const ext =
      mimeType.includes('webm') ? 'webm' : mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3' : 'wav';
    const safe = (originalName || 'rec').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storageKey = `speaking/${randomUUID()}-${safe}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey) };
  }

  getAbsolutePath(storageKey: string) {
    return path.join(this.root, storageKey);
  }

  async saveListeningAudio(buffer: Buffer, mimeType: string, originalName: string): Promise<{ storageKey: string; publicUrl: string; filename: string }> {
    const max = 50 * 1024 * 1024; // 50MB
    if (buffer.length > max) throw new BadRequestException('Audio juda katta (max 50MB)');
    if (!ALLOWED_AUDIO.has(mimeType)) throw new BadRequestException('Qo‘llab-quvvatlanadigan audio: mp3, wav, m4a');
    const ext =
      mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 
      mimeType.includes('m4a') ? 'm4a' : 'wav';
    const safe = (originalName || 'audio').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storageKey = `listening/${randomUUID()}-${safe}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey), filename: safe + '.' + ext };
  }

  async saveReadingFile(buffer: Buffer, mimeType: string, originalName: string): Promise<{ storageKey: string; publicUrl: string; filename: string; extractedText: string }> {
    const max = 20 * 1024 * 1024; // 20MB
    if (buffer.length > max) throw new BadRequestException('Fayl juda katta (max 20MB)');
    if (!ALLOWED_READING_FILES.has(mimeType)) throw new BadRequestException('Qo‘llab-quvvatlanadigan fayllar: pdf, doc, docx, txt');
    
    let extractedText = '';
    
    try {
      if (mimeType === 'application/pdf') {
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } else if (mimeType.includes('wordprocessingml')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (mimeType === 'application/msword') {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (mimeType === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      }
    } catch (error) {
      throw new BadRequestException('Matnni ajratib bo\'lmadi: ' + (error as Error).message);
    }

    const ext =
      mimeType === 'application/pdf' ? 'pdf' :
      mimeType.includes('wordprocessingml') ? 'docx' :
      mimeType === 'application/msword' ? 'doc' : 'txt';
    const safe = (originalName || 'reading').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storageKey = `reading/${randomUUID()}-${safe}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey), filename: safe + '.' + ext, extractedText };
  }

  async saveMockImage(buffer: Buffer, declaredMime: string, originalName: string): Promise<{ storageKey: string; publicUrl: string; filename: string }> {
    const max = 10 * 1024 * 1024; // 10MB
    if (buffer.length > max) throw new BadRequestException('Rasm juda katta (max 10MB)');
    const mime = sniffImageMime(buffer);
    if (!mime) throw new BadRequestException('Faqat JPEG, PNG yoki WEBP yuklash mumkin');
    if (declaredMime && !declaredMime.startsWith('image/')) {
      throw new BadRequestException('Noto‘g‘ri fayl turi');
    }
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
    const safe = (originalName || 'image').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storageKey = `mocks/${randomUUID()}-${safe}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey), filename: safe + '.' + ext };
  }
}
