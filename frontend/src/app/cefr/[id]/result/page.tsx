'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Trophy, BookOpen, Clock, Mic, PenLine, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface CefrResult {
  id: string;
  mockId: string;
  status: string;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  totalScore?: number;
  cefrLevel?: string;
  startedAt: string;
  completedAt?: string;
  mock: {
    title: string;
  };
}

export default function CefrResultPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;

  const [result, setResult] = useState<CefrResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [mockId]);

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/cefr/student/mocks/${mockId}/result`);
      setResult(data);
    } catch (error) {
      toast.error('Natijalar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    if (level === 'C2') return 'text-purple-400';
    if (level === 'C1') return 'text-blue-400';
    if (level === 'B2') return 'text-green-400';
    if (level === 'B1') return 'text-yellow-400';
    if (level === 'A2') return 'text-orange-400';
    return 'text-red-400';
  };

  const getLevelDescription = (level: string) => {
    if (level === 'C2') return 'Mukammal daraja — ixtisoslashgan foydalanuvchi';
    if (level === 'C1') return 'Ilg\'or daraja — mustaqil foydalanuvchi';
    if (level === 'B2') return 'Yuqori o\'rta daraja — mustaqil foydalanuvchi';
    if (level === 'B1') return 'O\'rta daraja — mustaqil foydalanuvchi';
    if (level === 'A2') return 'Boshlang\'ich daraja — asosiy foydalanuvchi';
    return 'Eng boshlang\'ich — asosiy foydalanuvchi';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-dark rounded-2xl p-8 text-center">
            <p className="text-gray-400">Natijalar topilmadi</p>
            <button
              onClick={() => router.push('/cefr')}
              className="mt-4 px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
            >
              CEFR Mocklarga qaytish
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (result.status !== 'completed') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-dark rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">Imtihon hali tugatilmagan</p>
            <button
              onClick={() => router.push(`/cefr/${mockId}`)}
              className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
            >
              Imtihonni davom ettirish
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/cefr')}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{result.mock.title}</h1>
            <p className="text-gray-400">CEFR Mock Test Natijalari</p>
          </div>
        </div>

        {/* CEFR Level Card */}
        <div className="glass-dark rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">CEFR Darajangiz</h2>
              <p className="text-gray-400">Umumiy ball: {result.totalScore?.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getLevelColor(result.cefrLevel || '')}`}>
                {result.cefrLevel || '-'}
              </div>
              <p className={`text-lg font-medium ${getLevelColor(result.cefrLevel || '')} mt-2`}>
                {getLevelDescription(result.cefrLevel || '')}
              </p>
            </div>
          </div>
        </div>

        {/* Section Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="glass-dark rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Listening</h3>
                <p className="text-gray-400 text-sm">Tinglash</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-white">
              {result.listeningScore?.toFixed(1)}%
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <BookOpen size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Reading</h3>
                <p className="text-gray-400 text-sm">O'qish</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-white">
              {result.readingScore?.toFixed(1)}%
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <PenLine size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Writing</h3>
                <p className="text-gray-400 text-sm">Yozish</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-white">
              {result.writingScore?.toFixed(1)}%
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Mic size={24} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Speaking</h3>
                <p className="text-gray-400 text-sm">Gapirish</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-white">
              {result.speakingScore?.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Batafsil ma'lumot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
              <Trophy size={20} className="text-primary-400" />
              <div>
                <p className="text-gray-400 text-sm">Boshlangan vaqt</p>
                <p className="text-white font-medium">
                  {new Date(result.startedAt).toLocaleString('uz-UZ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
              <TrendingUp size={20} className="text-primary-400" />
              <div>
                <p className="text-gray-400 text-sm">Tugatilgan vaqt</p>
                <p className="text-white font-medium">
                  {result.completedAt ? new Date(result.completedAt).toLocaleString('uz-UZ') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/cefr')}
            className="flex-1 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition"
          >
            Boshqa CEFR Mock
          </button>
          <button
            onClick={() => router.push('/results')}
            className="flex-1 px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            Barcha Natijalar
          </button>
        </div>
      </main>
    </div>
  );
}
