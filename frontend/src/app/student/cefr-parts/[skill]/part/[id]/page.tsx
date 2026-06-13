'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Send, Volume2, Pause, Play } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question: string;
  type: 'MCQ' | 'FILL_BLANKS' | 'TRUE_FALSE' | 'MATCHING';
  options?: string[];
  correctAnswer: string;
}

interface PartData {
  id: string;
  title: string;
  skill: 'READING' | 'LISTENING';
  partNumber: number;
  questions: Question[];
  audioUrl?: string;
  passageText?: string;
  audioPlaysOnce: boolean;
}

export default function CefrPartExamPage() {
  const params = useParams();
  const router = useRouter();
  const skill = (params.skill as string).toUpperCase() as 'READING' | 'LISTENING';
  const partId = params.id as string;

  const [partData, setPartData] = useState<PartData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes default
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchPartData();
  }, [partId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchPartData = async () => {
    try {
      const { data } = await api.get(`/api/student/mock-parts/${partId}`);
      setPartData(data);
      
      // Initialize answers
      const initialAnswers: Record<string, string> = {};
      data.questions.forEach((q: Question) => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      toast.error('Part ma\'lumotlari yuklanmadi');
      router.push(`/student/cefr-parts/${skill.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Check if all questions are answered
    const unanswered = Object.values(answers).filter(a => !a).length;
    if (unanswered > 0) {
      const confirm = window.confirm(
        `${unanswered} ta savolga javob bermadingiz. Yakunlashni xohlaysizmi?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/api/student/mock-parts/${partId}/submit`, {
        answers: answers,
      });

      toast.success('Javoblar muvaffaqiyatli yuborildi!');
      router.push(`/student/cefr-parts/${skill.toLowerCase()}/part/${partId}/result?attemptId=${data.attemptId}`);
    } catch (error) {
      toast.error('Javoblarni yuborib bo\'lmadi');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      setAudioPlayed(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!partData) return null;

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
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/student/cefr-parts/${skill.toLowerCase()}`)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{partData.title}</h1>
                <p className="text-gray-400">Part {partData.partNumber} - {partData.questions.length} ta savol</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/20 text-primary-400'
              }`}>
                <Clock size={20} />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Passage/Audio */}
            <div className="lg:col-span-1">
              <div className="glass-dark rounded-2xl p-6 sticky top-6">
                {skill === 'LISTENING' && partData.audioUrl ? (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Audio</h3>
                    <audio
                      ref={audioRef}
                      src={partData.audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <button
                        onClick={toggleAudio}
                        disabled={audioPlayed && partData.audioPlaysOnce}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-purple-400 rounded-xl font-medium transition"
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        <span>{isPlaying ? 'Pauza' : audioPlayed && partData.audioPlaysOnce ? 'Audio tugadi' : 'Audioni boshlash'}</span>
                      </button>
                      {partData.audioPlaysOnce && (
                        <p className="text-sm text-yellow-400 text-center">
                          ⚠️ Audio faqat 1 marta ijro etiladi
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Matn</h3>
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {partData.passageText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Questions */}
            <div className="lg:col-span-2">
              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Savollar</h3>
                
                <div className="space-y-6">
                  {partData.questions.map((question, index) => (
                    <div key={question.id} className="pb-6 border-b border-gray-800 last:border-0">
                      <p className="text-white font-medium mb-4">
                        {index + 1}. {question.question}
                      </p>

                      {question.type === 'MCQ' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <label
                              key={optIndex}
                              className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition"
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={answers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                              />
                              <span className="text-gray-300">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.type === 'TRUE_FALSE' && (
                        <div className="space-y-2">
                          {['True', 'False', 'Not Given'].map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition"
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={answers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                              />
                              <span className="text-gray-300">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.type === 'FILL_BLANKS' && (
                        <input
                          type="text"
                          value={answers[question.id]}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Javobni kiriting..."
                          className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 gradient-bg text-white rounded-xl font-medium transition hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Yuborilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Javoblarni yuborish</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-gray-400 text-sm mt-3">
                    {Object.values(answers).filter(a => a).length} / {partData.questions.length} ta savolga javob berildi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
