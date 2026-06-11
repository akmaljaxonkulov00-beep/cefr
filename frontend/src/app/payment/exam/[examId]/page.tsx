'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function ExamPaymentPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : params.examId?.[0] ?? '';
  const router = useRouter();
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [amountNote, setAmountNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const [centerName, setCenterName] = useState<string>('');
  const [activeCard, setActiveCard] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchPaymentInstructions();
  }, []);

  const fetchPaymentInstructions = async () => {
    try {
      if (user?.centerId) {
        const { data: center } = await api.get(`/api/centers/${user.centerId}`);
        setPaymentInstructions(center.paymentInstructions || '');
        setCenterName(center.name);
      } else {
        // For non-center users, get exam payment instructions
        const { data: exam } = await api.get(`/api/exams/${examId}`);
        setPaymentInstructions(exam.paymentInstructions || 'To\'lov qilish uchun quyidagi karta raqamiga pul o\'tkazing va chek rasmini yuklang.');
      }
      const { data: card } = await api.get('/api/settings/payment-cards/active');
      setActiveCard(card);
    } catch (error) {
      console.error('Failed to fetch payment instructions');
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      toast.error('Fayl hajmi 5MB dan oshmasligi kerak');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const submit = async () => {
    if (!file) {
      toast.error('Chek skrinshotini tanlang');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      
      const up = await api.post('/api/uploads/payment-proof', fd, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
          setUploadProgress(progress);
        },
      });
      
      const key = up.data.storageKey as string;
      await api.post('/api/manual-payments', { examId, screenshotKey: key, amountNote: amountNote || undefined });
      setDone(true);
      toast.success('So‘rov yuborildi. Admin tasdiqlashini kuting.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-2">To‘lov (qo‘lda)</h1>
          <p className="text-gray-400 text-sm mb-6">
            Bank yoki boshqa usulda to‘lov qiling, chekni yuklang. Admin tasdiqlagach, imtihon ochiladi.
          </p>

          {paymentInstructions && (
            <div className="glass-dark rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={20} className="text-primary-400" />
                <h3 className="text-lg font-semibold text-white">
                  {centerName ? `${centerName} To'lov Ma'lumotlari` : 'To\'lov Ma\'lumotlari'}
                </h3>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{paymentInstructions}</p>
            </div>
          )}

          {activeCard && (
            <div className="glass-dark rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={20} className="text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Aktiv Karta</h3>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-medium text-lg">{activeCard.cardNumber}</p>
                <p className="text-gray-400">{activeCard.cardHolderName}</p>
                <p className="text-gray-500 text-sm">{activeCard.bankName} • {activeCard.cardType}</p>
              </div>
            </div>
          )}

          {done ? (
            <div className="glass-dark rounded-2xl p-8 text-center">
              <CheckCircle className="text-emerald-400 mx-auto mb-4" size={48} />
              <p className="text-white mb-4">So‘rov qabul qilindi.</p>
              <Link href="/exams" className="text-primary-400 hover:text-primary-300">
                Imtihonlar ro‘yxatiga qaytish
              </Link>
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-8 space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Chek rasmi (JPEG/PNG/WEBP, max 5MB)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="w-full text-sm text-gray-300"
                />
              </div>

              {previewUrl && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-300 mb-2">Preview</label>
                  <img
                    src={previewUrl}
                    alt="Chek preview"
                    className="max-w-full h-auto rounded-lg border border-gray-700"
                  />
                </div>
              )}

              {loading && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Yuklanmoqda...</span>
                    <span className="text-sm text-gray-300">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="gradient-bg h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Izoh (ixtiyoriy, masalan summa)</label>
                <input
                  value={amountNote}
                  onChange={(e) => setAmountNote(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="50000 so‘m, invoys raqami..."
                />
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 gradient-bg py-3 rounded-xl text-white font-semibold disabled:opacity-50"
              >
                <Upload size={18} />
                {loading ? 'Yuborilmoqda…' : 'Yuborish'}
              </button>
              <Link href={`/exams/${examId}`} className="block text-center text-sm text-gray-400 hover:text-white">
                Imtihon sahifasiga qaytish
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
