'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Home, RotateCcw } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  questionType: string;
}

interface AttemptResult {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completedAt: string;
  questions: QuestionResult[];
  partTitle: string;
  partNumber: number;
}

export default function CefrPartResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const skill = (params.skill as string).toUpperCase() as 'READING' | 'LISTENING';
  const partId = params.id as string;
  const attemptId = searchParams.get('attemptId');

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState<'ALL' | 'CORRECT' | 'INCORRECT'>('ALL');

  useEffect(() => {
    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/api/mock-parts/${partId}/attempts/${attemptId}`);
      setResult(data);
    } catch (error) {
      toast.error('Natijalarni yuklab bo\'lmadi');
      router.push(`/student/cefr-parts/${skill.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    router.push(`/student/cefr-parts/${skill.toLowerCase()}/part/${partId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const filteredQuestions = result.questions.filter((q) => {
    if (showAnswers === 'ALL') return true;
    if (showAnswers === 'CORRECT') return q.isCorrect;
    if (showAnswers === 'INCORRECT') return !q.isCorrect;
    return true;
  });

  const scorePercentage = (result.correctAnswers / result.totalQuestions) * 100;
  
  // Determine score color classes
  const scoreColorClass = scorePercentage >= 80 
    ? 'text-green-400' 
    : scorePercentage >= 60 
    ? 'text-yellow-400' 
    : 'text-red-400';
    
  const progressBarClass = scorePercentage >= 80
    ? 'bg-gradient-to-r from-green-400 to-green-600'
    : scorePercentage >= 60
    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    : 'bg-gradient-to-r from-red-400 to-red-600';

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/student/cefr-parts/${skill.toLowerCase()}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft size={20} />
              <span>Partlar ro'yxatiga qaytish</span>
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Test natijalari</h1>
            <p className="text-gray-400">{result.partTitle} - Part {result.partNumber}</p>
          </div>

          {/* Score Card */}
          <div className="glass-dark rounded-2xl p-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Score */}
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 ${scoreColorClass}`}>
                  {scorePercentage.toFixed(0)}%
                </div>
                <p className="text-gray-400">Umumiy ball</p>
              </div>

              {/* Correct Answers */}
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
                  <CheckCircle size={32} />
                  {result.correctAnswers}
                </div>
                <p className="text-gray-400">To'g'ri javoblar</p>
              </div>

              {/* Incorrect Answers */}
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2 flex items-center justify-center gap-2">
                  <XCircle size={32} />
                  {result.incorrectAnswers}
                </div>
                <p className="text-gray-400">Noto'g'ri javoblar</p>
              </div>

              {/* Total Questions */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-400 mb-2">
                  {result.totalQuestions}
                </div>
                <p className="text-gray-400">Jami savollar</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${progressBarClass}`}
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition"
              >
                <RotateCcw size={20} />
                Qayta ishlash
              </button>
              <button
                onClick={() => router.push('/student/cefr-parts')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition"
              >
                <Home size={20} />
                Bosh sahifa
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowAnswers('ALL')}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                showAnswers === 'ALL'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Barcha javoblar ({result.questions.length})
            </button>
            <button
              onClick={() => setShowAnswers('CORRECT')}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                showAnswers === 'CORRECT'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              To'g'ri ({result.correctAnswers})
            </button>
            <button
              onClick={() => setShowAnswers('INCORRECT')}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                showAnswers === 'INCORRECT'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Noto'g'ri ({result.incorrectAnswers})
            </button>
          </div>

          {/* Questions Review */}
          <div className="glass-dark rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Javoblarni ko'rib chiqish
            </h3>

            <div className="space-y-6">
              {filteredQuestions.map((question, index) => (
                <motion.div
                  key={question.questionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-5 rounded-xl border-2 ${
                    question.isCorrect
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-white font-medium flex-1">
                      {result.questions.indexOf(question) + 1}. {question.questionText}
                    </p>
                    <div className={`flex items-center gap-1 ${
                      question.isCorrect ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {question.isCorrect ? (
                        <CheckCircle size={24} />
                      ) : (
                        <XCircle size={24} />
                      )}
                    </div>
                  </div>

                  {/* Answer Details */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-gray-400 min-w-[120px]">Sizning javob:</span>
                      <span className={`font-medium ${
                        question.isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {question.userAnswer || '(Javob berilmagan)'}
                      </span>
                    </div>
                    
                    {!question.isCorrect && (
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 min-w-[120px]">To'g'ri javob:</span>
                        <span className="text-green-400 font-medium">
                          {question.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {showAnswers === 'CORRECT' && 'To\'g\'ri javoblar yo\'q'}
                  {showAnswers === 'INCORRECT' && 'Noto\'g\'ri javoblar yo\'q'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
