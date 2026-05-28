'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface MockTestSubmitHandlerProps {
  readingScore: number;
  listeningScore: number;
  writingText: string;
  speakingAudioBlob: Blob | null;
  testType: 'IELTS' | 'CEFR';
  testId?: string;
  onComplete: (reportId: string) => void;
}

export default function MockTestSubmitHandler({
  readingScore,
  listeningScore,
  writingText,
  speakingAudioBlob,
  testType,
  testId,
  onComplete,
}: MockTestSubmitHandlerProps) {
  const [step, setStep] = useState<'idle' | 'transcribing' | 'analyzing' | 'saving' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async () => {
    try {
      setStep('transcribing');
      setProgress(10);

      // Step 1: Transcribe audio if present
      let speakingTranscript = '';
      if (speakingAudioBlob) {
        const formData = new FormData();
        formData.append('audio', speakingAudioBlob, 'recording.webm');

        const transcribeResponse = await api.post('/ai/transcribe', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
            setProgress(10 + (percentCompleted * 0.3));
          },
        });

        speakingTranscript = transcribeResponse.data.text;
      }

      setStep('analyzing');
      setProgress(50);

      // Step 2: Generate diagnostic report
      const diagnosticResponse = await api.post('/ai/diagnostic-report', {
        testType,
        readingScore,
        listeningScore,
        writingText,
        speakingTranscript,
      });

      setStep('saving');
      setProgress(80);

      // Step 3: Save report to database (this is done in the backend)
      // The report is already saved in the generateDiagnosticReport method

      setStep('complete');
      setProgress(100);

      toast.success('Report muvaffaqiyatli yaratildi!');

      // Redirect to dashboard with report data
      setTimeout(() => {
        onComplete(JSON.stringify(diagnosticResponse.data));
      }, 500);
    } catch (error: any) {
      setStep('error');
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
      toast.error('Report yaratib bo\'lmadi');
    }
  };

  if (step === 'idle') {
    return (
      <div className="glass-dark rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Testni tugatish</h3>
        <p className="text-gray-400 mb-6">
          Barcha javoblaringizni tekshiring va AI report yaratish uchun tugatish tugmasini bosing.
        </p>
        <button
          onClick={handleSubmit}
          className="w-full gradient-bg text-white py-3 rounded-xl font-semibold"
        >
          Tugatish va Report Yaratish
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="glass-dark rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} className="text-red-400" />
          <h3 className="text-xl font-semibold text-white">Xatolik</h3>
        </div>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => {
            setStep('idle');
            setError(null);
            setProgress(0);
          }}
          className="w-full bg-gray-700 text-white py-3 rounded-xl"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <Loader2 size={32} className="text-primary-400 animate-spin" />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            {step === 'transcribing' && 'Audio transcribe qilinmoqda...'}
            {step === 'analyzing' && 'AI tahlil qilinmoqda...'}
            {step === 'saving' && 'Report saqlanmoqda...'}
            {step === 'complete' && 'Muvaffaqiyatli tugatildi!'}
          </h3>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-bg"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">{progress}%</p>
        </div>
      </div>

      {step === 'transcribing' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-400">
            <Upload size={20} />
            <span>Audio yuklanmoqda...</span>
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-400">
            <CheckCircle size={20} className="text-emerald-400" />
            <span>Audio transcribe qilindi</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-primary-400" />
            <span>AI tahlil qilinmoqda...</span>
          </div>
        </div>
      )}

      {step === 'saving' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-400">
            <CheckCircle size={20} className="text-emerald-400" />
            <span>AI tahlil tugatildi</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <CheckCircle size={20} className="text-emerald-400" />
            <span>Report saqlanmoqda...</span>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-400">
            <CheckCircle size={20} className="text-emerald-400" />
            <span>Audio transcribe qilindi</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <CheckCircle size={20} className="text-emerald-400" />
            <span>AI tahlil tugatildi</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <CheckCircle size={20} className="text-emerald-400" />
            <span>Report saqlandi</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle size={20} />
            <span className="font-semibold">Hammasi tayyor!</span>
          </div>
        </div>
      )}
    </div>
  );
}
