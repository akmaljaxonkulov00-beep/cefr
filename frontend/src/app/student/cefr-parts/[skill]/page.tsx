'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Headphones, Play, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Part {
  id: string;
  title: string;
  type: 'CEFR';
  skill: 'READING' | 'LISTENING';
  partNumber: number;
  questions: any;
  audioUrl?: string;
  passageText?: string;
  price: number;
  status: string;
  completed?: boolean;
  lastAttempt?: {
    id: string;
    score: number;
    completedAt: string;
  };
}

export default function CefrSkillPartsPage() {
  const params = useParams();
  const router = useRouter();
  const skill = (params.skill as string).toUpperCase() as 'READING' | 'LISTENING';
  
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  const partCount = skill === 'READING' ? 5 : 6;

  useEffect(() => {
    fetchParts();
  }, [skill]);

  const fetchParts = async () => {
    try {
      const { data } = await api.get('/api/student/mock-parts', {
        params: {
          type: 'CEFR',
          skill: skill,
          status: 'ACTIVE'
        }
      });
      setParts(data);
    } catch (error) {
      toast.error('Partlar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPart = (partId: string) => {
    router.push(`/student/cefr-parts/${skill.toLowerCase()}/part/${partId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SkillIcon = skill === 'READING' ? BookOpen : Headphones;
  const skillColor = skill === 'READING' ? 'blue' : 'purple';

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
          <div className="mb-8">
            <button
              onClick={() => router.push('/student/cefr-parts')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft size={20} />
              <span>Orqaga</span>
            </button>
            
            <div className="flex items-center gap-4 mb-2">
              <div className={skill === 'READING' ? 'w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center' : 'w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center'}>
                <SkillIcon size={24} className={skill === 'READING' ? 'text-blue-400' : 'text-purple-400'} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{skill === 'READING' ? 'Reading' : 'Listening'} Partlar</h1>
                <p className="text-gray-400">{parts.length} ta part mavjud</p>
              </div>
            </div>
          </div>

          {/* Parts Grid */}
          {parts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parts.map((part) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="glass-dark rounded-2xl p-6 hover:bg-white/5 transition"
                >
                  {/* Part Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={skill === 'READING' ? 'px-3 py-1 bg-blue-500/20 rounded-lg' : 'px-3 py-1 bg-purple-500/20 rounded-lg'}>
                      <span className={skill === 'READING' ? 'text-blue-400 font-medium text-sm' : 'text-purple-400 font-medium text-sm'}>
                        Part {part.partNumber}
                      </span>
                    </div>
                    {part.lastAttempt && (
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle size={16} />
                        <span>{part.lastAttempt.score}%</span>
                      </div>
                    )}
                  </div>

                  {/* Part Info */}
                  <h3 className="text-xl font-bold text-white mb-2">{part.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock size={16} />
                      <span>
                        {Array.isArray(part.questions) 
                          ? `${part.questions.length} ta savol` 
                          : '10-15 daqiqa'}
                      </span>
                    </div>
                    {skill === 'LISTENING' && part.audioUrl && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Headphones size={16} />
                        <span>Audio mavjud</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartPart(part.id)}
                    className={skill === 'READING' 
                      ? 'w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition hover:opacity-90'
                      : 'w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium transition hover:opacity-90'
                    }
                  >
                    <Play size={18} />
                    {part.lastAttempt ? 'Qayta ishlash' : 'Boshlash'}
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-12 text-center">
              <SkillIcon size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {skill === 'READING' ? 'Reading' : 'Listening'} partlar topilmadi
              </h3>
              <p className="text-gray-400 mb-6">
                Hozircha bu skill uchun partlar qo'shilmagan
              </p>
              <button
                onClick={() => router.push('/student/cefr-parts')}
                className="px-6 py-3 gradient-bg text-white rounded-xl font-medium"
              >
                Orqaga qaytish
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 glass-dark rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {skill === 'READING' ? 'Reading' : 'Listening'} haqida
            </h3>
            <p className="text-gray-400">
              {skill === 'READING' 
                ? 'Reading skillida har bir part turli xil matnlar va savol turlari bilan ishlashni o\'rgatadi. Barcha savollarni diqqat bilan o\'qing va to\'g\'ri javoblarni tanlang.'
                : 'Listening skillida har bir part turli xil audio materiallar bilan ishlashni o\'rgatadi. Audioni diqqat bilan tinglang va savolarga javob bering. Audio faqat 1 marta ijro etiladi.'
              }
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
