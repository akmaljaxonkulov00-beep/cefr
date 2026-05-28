import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async uploadAudio(
    buffer: Buffer, 
    filename: string
  ): Promise<string> {
    const path = `audio/${Date.now()}-${filename}`;
    const { error } = await this.supabase.storage
      .from('mock-files')
      .upload(path, buffer, { contentType: 'audio/mpeg' });
    if (error) throw new Error('Audio upload failed: ' + error.message);
    const { data } = this.supabase.storage
      .from('mock-files')
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    const path = `files/${Date.now()}-${filename}`;
    const { error } = await this.supabase.storage
      .from('mock-files')
      .upload(path, buffer, { contentType: mimeType });
    if (error) throw new Error('File upload failed: ' + error.message);
    const { data } = this.supabase.storage
      .from('mock-files')
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async uploadImage(
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    const path = `images/${Date.now()}-${filename}`;
    const { error } = await this.supabase.storage
      .from('mock-files')
      .upload(path, buffer, { contentType: 'image/jpeg' });
    if (error) throw new Error('Image upload failed: ' + error.message);
    const { data } = this.supabase.storage
      .from('mock-files')
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(url: string): Promise<void> {
    const path = url.split('/mock-files/')[1];
    if (path) {
      await this.supabase.storage
        .from('mock-files')
        .remove([path]);
    }
  }
}
