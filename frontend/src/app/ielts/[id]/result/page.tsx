'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Trophy, BookOpen, Clock, Mic, PenLine, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface IeltsResult {
  id: string;
  mockId: string;
  status: string;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  totalBand?: number;
  startedAt: string;
  completedAt?: string;
  mock: {
    title: string;
    type: string;
  };
}

export default function IeltsResultPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;

  const [result, setResult] = useState<IeltsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [mockId]);

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/api/ielts/student/mocks/${mockId}/result`);
      setResult(data);
    } catch (error) {
      toast.error('Natijalar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (band: number) => {
    if (band >= 7) return 'text-green-400';
    if (band >= 6) return 'text-blue-400';
    if (band >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBandLabel = (band: number) => {
    if (band >= 8) return 'Expert';
    if (band >= 7) return 'Good';
    if (band >= 6) return 'Competent';
    if (band >= 5) return 'Modest';
    return 'Limited';
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
              onClick={() => router.push('/ielts')}
              className="mt-4 px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
            >
              IELTS Mocklarga qaytish
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
              onClick={() => router.push(`/ielts/${mockId}`)}
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
            onClick={() => router.push('/ielts')}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{result.mock.title}</h1>
            <p className="text-gray-400">{result.mock.type} IELTS Mock Test Natijalari</p>
          </div>
        </div>

        {/* Overall Band */}
        <div className="glass-dark rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Umumiy Band Score</h2>
              <p className="text-gray-400">IELTS ballar tizimi bo'yicha</p>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getBandColor(result.totalBand || 0)}`}>
                {result.totalBand || '-'}
              </div>
              <p className={`text-lg font-medium ${getBandColor(result.totalBand || 0)} mt-2`}>
                {getBandLabel(result.totalBand || 0)}
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
            <div className={`text-4xl font-bold ${getBandColor(result.listeningScore || 0)}`}>
              {result.listeningScore || '-'}
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
            <div className={`text-4xl font-bold ${getBandColor(result.readingScore || 0)}`}>
              {result.readingScore || '-'}
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
            <div className={`text-4xl font-bold ${getBandColor(result.writingScore || 0)}`}>
              {result.writingScore || '-'}
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
            <div className={`text-4xl font-bold ${getBandColor(result.speakingScore || 0)}`}>
              {result.speakingScore || '-'}
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
            onClick={() => router.push('/ielts')}
            className="flex-1 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition"
          >
            Boshqa IELTS Mock
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
