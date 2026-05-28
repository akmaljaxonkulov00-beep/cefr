'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface FileUploadBoxProps {
  accept: string;
  maxSizeMB: number;
  uploadUrl: string;
  label: string;
  onSuccess: (result: any) => void;
  onRemove: () => void;
  currentFile?: { url: string; filename: string } | null;
}

export default function FileUploadBox({
  accept,
  maxSizeMB,
  uploadUrl,
  label,
  onSuccess,
  onRemove,
  currentFile,
}: FileUploadBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Fayl hajmi juda katta (max ${maxSizeMB}MB)`);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data } = await api.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            ((progressEvent.loaded || 0) * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);
      setUploading(false);
      onSuccess(data);
    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
      setError(err.response?.data?.message || 'Yuklashda xatolik yuz berdi');
    }
  };

  const handleRemove = () => {
    onRemove();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>

      {!currentFile && !uploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            error ? 'border-red-500 bg-red-500/5' : 'border-gray-600 bg-white/5 hover:border-gray-500 hover:bg-white/10'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-300 font-medium mb-1">Fayl yuklash yoki tortib tashlang</p>
          <p className="text-gray-500 text-sm">
            {accept.split(',').join(', ')} (max {maxSizeMB}MB)
          </p>
        </div>
      )}

      {uploading && (
        <div className="border-2 border-dashed border-primary-500 bg-primary-500/5 rounded-xl p-8">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-400 animate-spin" />
          <p className="text-gray-300 font-medium mb-2">Yuklanmoqda...</p>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="gradient-bg h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm">{uploadProgress}%</p>
        </div>
      )}

      {currentFile && !uploading && (
        <div className="border-2 border-green-500 bg-green-500/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-white font-medium">{currentFile.filename}</p>
                <p className="text-gray-400 text-sm">{currentFile.url}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 text-gray-400 hover:text-red-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary-400 hover:underline ml-2"
          >
            Qayta urinish
          </button>
        </div>
      )}
    </div>
  );
}
