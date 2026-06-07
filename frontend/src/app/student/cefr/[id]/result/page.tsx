'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Trophy, Target, BookOpen, Mic, PenTool, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Attempt {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  speakingScore: number;
  totalScore: number;
  level: string;
  listeningAnswers: any;
  readingAnswers: any;
  writingAnswers: any;
  speakingAnswers: any;
  mock: {
    id: string;
    title: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  };
}

export default function StudentCefrResultPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [mockId]);

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/api/cefr/student/mocks/${mockId}/result`);
      setAttempt(data);
    } catch (error) {
      toast.error('Natijalar yuklab olinmadi');
      router.push(`/student/cefr/${mockId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLevelColor = (level: string) => {
    if (level === 'A1') return 'text-gray-400';
    if (level === 'A2') return 'text-purple-400';
    if (level === 'B1') return 'text-blue-400';
    if (level === 'B2') return 'text-green-400';
    if (level === 'C1') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/student/cefr/${mockId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={20} />
          Orqaga
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{attempt.mock.title}</h1>
          <p className="text-gray-400">
            Imtihon tugatildi: {new Date(attempt.completedAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
      </div>

      {/* Overall Score and Level */}
      <div className="glass-dark rounded-2xl p-8 mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy size={40} className="text-yellow-500" />
          <h2 className="text-2xl font-bold text-white">Umumiy Ball va Daraja</h2>
        </div>
        <div className="text-7xl font-bold text-white mb-2">{attempt.totalScore.toFixed(1)}%</div>
        <div className={`text-4xl font-bold mb-2 ${getLevelColor(attempt.level)}`}>{attempt.level}</div>
        <div className="text-gray-400">
          {attempt.mock.level}
        </div>
      </div>

      {/* Section Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BookOpen size={24} className="text-blue-400" />
            </div>
            <div className="text-white font-semibold">Listening</div>
          </div>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(attempt.listeningScore)}`}>
            {attempt.listeningScore.toFixed(1)}%
          </div>
          <div className="text-gray-400 text-sm">Score</div>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <BookOpen size={24} className="text-green-400" />
            </div>
            <div className="text-white font-semibold">Reading</div>
          </div>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(attempt.readingScore)}`}>
            {attempt.readingScore.toFixed(1)}%
          </div>
          <div className="text-gray-400 text-sm">Score</div>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <PenTool size={24} className="text-purple-400" />
            </div>
            <div className="text-white font-semibold">Writing</div>
          </div>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(attempt.writingScore)}`}>
            {attempt.writingScore.toFixed(1)}%
          </div>
          <div className="text-gray-400 text-sm">Score</div>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Mic size={24} className="text-red-400" />
            </div>
            <div className="text-white font-semibold">Speaking</div>
          </div>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(attempt.speakingScore)}`}>
            {attempt.speakingScore.toFixed(1)}%
          </div>
          <div className="text-gray-400 text-sm">Score</div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="glass-dark rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={24} className="text-primary-500" />
          <h2 className="text-xl font-bold text-white">Ishlash tahlili</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Listening</span>
              <span className="text-white">{attempt.listeningScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${attempt.listeningScore}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Reading</span>
              <span className="text-white">{attempt.readingScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${attempt.readingScore}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Writing</span>
              <span className="text-white">{attempt.writingScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${attempt.writingScore}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Speaking</span>
              <span className="text-white">{attempt.speakingScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${attempt.speakingScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-dark rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Target size={24} className="text-primary-500" />
          <h2 className="text-xl font-bold text-white">Tavsiyalar</h2>
        </div>
        
        <div className="space-y-4">
          {attempt.listeningScore < 60 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="text-blue-400 font-semibold mb-1">Listening</div>
              <div className="text-gray-400 text-sm">
                Ko'proq audio materiallarni tinglash va CEFR listening amaliyotlarini qilish tavsiya etiladi.
              </div>
            </div>
          )}
          
          {attempt.readingScore < 60 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="text-green-400 font-semibold mb-1">Reading</div>
              <div className="text-gray-400 text-sm">
                Har kuni o'qish amaliyatini oshiring va vaqtni boshqarishni yaxshilang.
              </div>
            </div>
          )}
          
          {attempt.writingScore < 60 && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="text-purple-400 font-semibold mb-1">Writing</div>
              <div className="text-gray-400 text-sm">
                Essay strukturasi va grammatikani takomillashtirish uchun ko'proq yozish amaliyotlari qiling.
              </div>
            </div>
          )}
          
          {attempt.speakingScore < 60 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-red-400 font-semibold mb-1">Speaking</div>
              <div className="text-gray-400 text-sm">
                Ingliz tilida ko'proq gapirish va so'z boyligini oshirish tavsiya etiladi.
              </div>
            </div>
          )}
          
          {attempt.listeningScore >= 60 && attempt.readingScore >= 60 && 
           attempt.writingScore >= 60 && attempt.speakingScore >= 60 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="text-green-400 font-semibold mb-1">A'lo!</div>
              <div className="text-gray-400 text-sm">
                Barcha bo'limlarda yaxshi natija ko'rsatdingiz. Davom eting!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to List */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/student/cefr')}
          className="px-8 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
        >
          Boshqa mocklarni ko'rish
        </button>
      </div>
    </div>
  );
}
