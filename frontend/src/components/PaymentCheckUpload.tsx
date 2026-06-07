'use client';

import { useState } from 'react';
import { Upload, CheckCircle, Clock, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import FileUploadBox from './admin/FileUploadBox';

interface PaymentCheckUploadProps {
  mockPartId: string;
  amount: number;
  mockTitle: string;
  onSuccess?: () => void;
}

export default function PaymentCheckUpload({ mockPartId, amount, mockTitle, onSuccess }: PaymentCheckUploadProps) {
  const [checkImageUrl, setCheckImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'verifying' | 'approved' | 'pending_manual' | 'rejected'>('idle');

  const handleFileUploadSuccess = (result: any) => {
    setCheckImageUrl(result.url);
  };

  const handleSubmit = async () => {
    if (!checkImageUrl) {
      toast.error('Chek rasmini yuklang');
      return;
    }

    setUploading(true);
    setStatus('uploading');

    try {
      await api.post('/api/mock-payments/submit-check', {
        mockPartId,
        checkImageUrl,
      });

      setStatus('verifying');
      setSubmitted(true);

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const { data } = await api.get('/api/mock-payments/check-access', {
            params: { mockPartId },
          });

          if (data.hasAccess) {
            clearInterval(pollInterval);
            setStatus('approved');
            toast.success('✅ To\'lovingiz tasdiqlandi! Mock ochildi.');
            if (onSuccess) onSuccess();
          }
        } catch (error) {
          // Continue polling
        }
      }, 5000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (status === 'verifying') {
          setStatus('pending_manual');
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      toast.error('Yuborishda xatolik yuz berdi');
      setStatus('idle');
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-dark rounded-2xl p-8 text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <Clock className="w-16 h-16 text-primary-400 mx-auto animate-pulse" />
            <h3 className="text-xl font-semibold text-white">⏳ To'lovingiz tekshirilmoqda...</h3>
            <p className="text-gray-400">Odatda 1-5 daqiqa ichida tasdiqlanadi</p>
          </div>
        )}

        {status === 'pending_manual' && (
          <div className="space-y-4">
            <Clock className="w-16 h-16 text-yellow-400 mx-auto" />
            <h3 className="text-xl font-semibold text-white">⏳ Qo'lda tekshirilmoqda</h3>
            <p className="text-gray-400">Tez orada javob beriladi</p>
          </div>
        )}

        {status === 'approved' && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <h3 className="text-xl font-semibold text-white">✅ To'lovingiz tasdiqlandi!</h3>
            <p className="text-gray-400">Mock endi ochiq</p>
            {onSuccess && (
              <button
                onClick={onSuccess}
                className="mt-4 px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
              >
                Davom etish
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-2xl p-8">
      <h3 className="text-xl font-semibold text-white mb-6">To'lovni tasdiqlash</h3>

      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl">💳</span>
          </div>
          <div>
            <p className="text-white font-medium">To'lov ma'lumotlari</p>
            <p className="text-gray-400 text-sm">Admin tomonidan belgilangan karta</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Narxi:</span>
            <span className="text-white font-medium">{amount.toLocaleString()} UZS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mock:</span>
            <span className="text-white font-medium">{mockTitle}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <FileUploadBox
          accept=".jpg,.jpeg,.png"
          maxSizeMB={5}
          uploadUrl="/uploads/payment-proof"
          label="Chek rasmini yuklang"
          onSuccess={handleFileUploadSuccess}
          onRemove={() => setCheckImageUrl(null)}
          currentFile={checkImageUrl ? { url: checkImageUrl, filename: 'check.jpg' } : null}
        />

        {checkImageUrl && (
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? 'Yuborilmoqda...' : 'Tasdiqlash uchun yuborish'}
          </button>
        )}
      </div>
    </div>
  );
}
