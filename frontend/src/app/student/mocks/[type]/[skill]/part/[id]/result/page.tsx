'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, RotateCcw, BookOpen, Home, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionResult {
  questionId: string;
  questionNumber: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface Attempt {
  id: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  answers: any;
}

interface Part {
  id: string;
  title: string;
  type: 'IELTS' | 'CEFR';
  skill: 'reading' | 'listening';
  partNumber: number;
  questions: any[];
}

export default function StudentPartResultPage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as 'IELTS' | 'CEFR';
  const skill = params.skill as 'reading' | 'listening';
  const partId = params.id as string;
  
  const [result, setResult] = useState<{ attempt: Attempt; part: Part; questionResults: QuestionResult[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [partId]);

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/student/mock-parts/${partId}/result`);
      setResult(data);
    } catch (error) {
      toast.error('Natija yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { text: '✅ Ajoyib natija! Zo\'r!', color: 'text-green-400' };
    if (score >= 70) return { text: '👍 Yaxshi natija!', color: 'text-blue-400' };
    if (score >= 50) return { text: '📚 O\'rtacha. Ko\'proq mashq qiling', color: 'text-yellow-400' };
    return { text: '💪 Kuchaytirishingiz kerak', color: 'text-red-400' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins} daqiqa ${secs} soniya`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white">Natija topilmadi</div>
      </div>
    );
  }

  const { attempt, part, questionResults } = result;
  const score = Math.round(attempt.score);
  const scoreMessage = getScoreMessage(score);
  const correctCount = questionResults.filter((q) => q.isCorrect).length;
  const avgTimePerQuestion = questionResults.length > 0 
    ? Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.completedAt).getTime() + (questionResults.length * 90)) / questionResults.length / 60)
    : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={20} />
          Orqaga
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">
          {type} {skill === 'reading' ? '📖 Reading' : '🎧 Listening'} — Part {part.partNumber}
        </h1>
        <p className="text-gray-400">{part.title}</p>
      </div>

      {/* Score Card */}
      <div className="glass-dark rounded-2xl p-8 max-w-2xl mx-auto mb-8 text-center">
        <h2 className="text-xl text-gray-400 mb-4">
          {type} {skill === 'reading' ? '📖 Reading' : '🎧 Listening'} — Part {part.partNumber}
        </h2>
        
        <div className="text-5xl font-bold text-white mb-2">
          {correctCount} / {attempt.totalQuestions}
        </div>
        
        <div className="text-3xl font-bold gradient-bg bg-clip-text text-transparent mb-4">
          {score}%
        </div>
        
        <div className={`text-xl font-semibold mb-6 ${scoreMessage.color}`}>
          {scoreMessage.text}
        </div>

        {/* Time Stats */}
        <div className="flex justify-center gap-8 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Sarflangan vaqt: {formatTime(attempt.completedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>O\'rtacha savol vaqti: ~1 daqiqa</span>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      <div className="glass-dark rounded-2xl p-6 lg:p-8 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-6">Javoblarni ko'rish</h3>
        
        <div className="space-y-4">
          {questionResults.map((qr, index) => {
            const question = part.questions[index];
            return (
              <div
                key={qr.questionId || index}
                className={`p-6 rounded-xl border-2 ${
                  qr.isCorrect
                    ? 'border-green-500/50 bg-green-500/5'
                    : qr.userAnswer
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-gray-700 bg-white/5'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    qr.isCorrect
                      ? 'bg-green-500 text-white'
                      : qr.userAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {qr.isCorrect ? <CheckCircle size={16} /> : qr.userAnswer ? <XCircle size={16} /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-2">
                      Savol {qr.questionNumber}: {question?.question || 'Savol matni'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Sizning javobingiz:</span>
                    <p className={`font-semibold ${qr.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {qr.userAnswer || 'Javob berilmagan'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">To\'g\'ri javob:</span>
                    <p className="font-semibold text-green-400">{qr.correctAnswer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/student/mocks/${type}/${skill}/part/${partId}`)}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold transition hover:bg-white/20"
        >
          <RotateCcw size={20} />
          Qayta urinish
        </button>
        <button
          onClick={() => router.push(`/student/mocks/${type}/${skill}`)}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold transition hover:bg-white/20"
        >
          <BookOpen size={20} />
          Boshqa partlar
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
        >
          <Home size={20} />
          Bosh sahifa
        </button>
      </div>
    </div>
  );
}
