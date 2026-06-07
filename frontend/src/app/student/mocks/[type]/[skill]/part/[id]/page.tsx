'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Clock, Play, Pause, RotateCcw, CheckCircle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

interface MockPart {
  id: string;
  title: string;
  type: 'IELTS' | 'CEFR';
  skill: 'reading' | 'listening';
  partNumber: number;
  questions: any[];
  audioUrl?: string;
  audioPlaysOnce: boolean;
  passageText?: string;
}

interface Attempt {
  id: string;
  answers: any;
  status: string;
  startedAt: string;
}

export default function StudentPartExamPage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as 'IELTS' | 'CEFR';
  const skill = params.skill as 'reading' | 'listening';
  const partId = params.id as string;
  
  const [part, setPart] = useState<MockPart | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [isExamLocked, setIsExamLocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const endTimeRef = useRef<number>(0);

  useEffect(() => {
    fetchPart();
    startAttempt();
  }, [partId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          handleSubmit();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  // Full lock mode: beforeunload warning
  useEffect(() => {
    if (attempt?.status === 'in_progress') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Imtihondan chiqsangiz natijangiz saqlanmaydi. Chiqishni xohlaysizmi?';
        return 'Imtihondan chiqsangiz natijangiz saqlanmaydi. Chiqishni xohlaysizmi?';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [attempt?.status]);

  // Auto-enable lock mode when exam starts
  useEffect(() => {
    if (attempt?.status === 'in_progress' && !isExamLocked) {
      setIsExamLocked(true);
    }
  }, [attempt?.status, isExamLocked]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (attempt?.status === 'in_progress') {
        saveAnswer();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [answers, attempt]);

  const fetchPart = async () => {
    try {
      const { data } = await api.get(`/api/student/mock-parts/${partId}`);
      setPart(data);
    } catch (error) {
      toast.error('Part yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const startAttempt = async () => {
    try {
      const { data } = await api.post(`/student/mock-parts/${partId}/start`);
      setAttempt(data);
      
      // Check if this is a resume
      if (data.status === 'in_progress' && data.startedAt) {
        const startedAt = new Date(data.startedAt).getTime();
        const questions = part?.questions?.length || 10;
        const duration = questions * 90; // 1.5 min per question
        const elapsed = (Date.now() - startedAt) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        
        if (remaining < duration * 0.9) {
          setShowResumeModal(true);
          setTimeRemaining(remaining);
          endTimeRef.current = Date.now() + remaining * 1000;
          return;
        }
      }
      
      const questions = part?.questions?.length || 10;
      const duration = questions * 90;
      setTimeRemaining(duration);
      endTimeRef.current = Date.now() + duration * 1000;
    } catch (error) {
      toast.error('Urinishni boshlab bo\'lmadi');
    }
  };

  const saveAnswer = async () => {
    try {
      localStorage.setItem(`mock-part-${partId}-answers`, JSON.stringify(answers));
      await api.post(`/student/mock-parts/${partId}/answer`, { answers });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handlePlayAudio = () => {
    if (part?.audioPlaysOnce && audioPlayCount >= 1) {
      toast.error('Audio faqat 1 marta o\'ynaydi');
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        setAudioPlayCount(audioPlayCount + 1);
      }
    }
  };

  const toggleFlag = (questionIndex: number) => {
    const newFlags = new Set(flaggedQuestions);
    if (newFlags.has(questionIndex)) {
      newFlags.delete(questionIndex);
    } else {
      newFlags.add(questionIndex);
    }
    setFlaggedQuestions(newFlags);
  };

  const handleResume = () => {
    setShowResumeModal(false);
  };

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const handleLeaveConfirm = () => {
    setShowLeaveWarning(false);
    setIsExamLocked(false);
    router.back();
  };

  const handleSubmit = async () => {
    const unansweredCount = Object.keys(answers).length;
    if (unansweredCount < (part?.questions?.length || 0) && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }
    
    try {
      await api.post(`/student/mock-parts/${partId}/submit`, { answers });
      localStorage.removeItem(`mock-part-${partId}-answers`);
      setIsExamLocked(false);
      router.push(`/student/mocks/${type}/${skill}/part/${partId}/result`);
    } catch (error) {
      toast.error('Topshirib bo\'lmadi');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!part) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white">Part topilmadi</div>
      </div>
    );
  }

  const questions = part.questions || [];
  const currentQ = questions[currentQuestion];
  const unansweredCount = questions.length - Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="bg-white/5 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {!isExamLocked && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLeaveWarning(true)}
                className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {type} {skill === 'reading' ? '📖 Reading' : '🎧 Listening'} — Part {part.partNumber}
                </h1>
                <p className="text-gray-400 text-sm">{part.title}</p>
              </div>
            </div>
          )}
          {isExamLocked && (
            <div>
              <h1 className="text-lg font-bold text-white">
                {type} {skill === 'reading' ? '📖 Reading' : '🎧 Listening'} — Part {part.partNumber}
              </h1>
              <p className="text-gray-400 text-sm">{part.title}</p>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-white ${timeRemaining < 120 ? 'text-red-400' : ''}`}>
              <Clock size={20} />
              <span className="font-mono text-xl">{formatTime(timeRemaining)}</span>
            </div>
            {isExamLocked && (
              <button
                onClick={handleFullscreen}
                className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium transition hover:bg-white/20"
              >
                To'liq ekran
              </button>
            )}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-2 gradient-bg text-white rounded-lg font-semibold transition hover:opacity-90"
            >
              Topshirish
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Panel - Passage/Audio */}
        {skill === 'reading' ? (
          <div className="w-[55%] p-6 overflow-y-auto bg-white/5 border-r border-gray-800">
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
              {part.passageText || 'Matn yuklanmoqda...'}
            </div>
          </div>
        ) : (
          <div className="w-full p-6 bg-white/5 border-b border-gray-800 flex flex-col items-center justify-center">
            {part.audioUrl ? (
              <>
                <audio ref={audioRef} src={part.audioUrl} onEnded={() => setIsPlaying(false)} />
                <button
                  onClick={handlePlayAudio}
                  disabled={part.audioPlaysOnce && audioPlayCount >= 1}
                  className="w-32 h-32 rounded-full gradient-bg text-white flex items-center justify-center transition hover:opacity-90 disabled:opacity-50 mb-4"
                >
                  {isPlaying ? <Pause size={48} /> : <Play size={48} />}
                </button>
                {part.audioPlaysOnce ? (
                  <p className="text-gray-400 text-sm">⚠️ Bu audio faqat 1 marta ijro etiladi ({audioPlayCount}/1)</p>
                ) : (
                  <p className="text-gray-400 text-sm">Bu audio 2 marta ijro etiladi ({audioPlayCount + 1}/2)</p>
                )}
              </>
            ) : (
              <p className="text-gray-400">Audio yuklanmoqda...</p>
            )}
          </div>
        )}

        {/* Right Panel - Questions */}
        {skill === 'reading' && (
          <div className="w-[45%] flex flex-col">
            {/* Question Navigator */}
            <div className="p-4 bg-white/5 border-b border-gray-800">
              <div className="flex gap-2 flex-wrap">
                {questions.map((q: any, index: number) => (
                  <button
                    key={q.id || index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      currentQuestion === index
                        ? 'gradient-bg text-white'
                        : answers[q.id || index]
                        ? 'bg-green-600 text-white'
                        : flaggedQuestions.has(index)
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Question */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentQ && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium">
                      Savol {currentQuestion + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-lg">{currentQ.text || currentQ.question}</p>
                    </div>
                  </div>

                  {currentQ.type === 'multiple_choice' && currentQ.options && currentQ.options.length > 0 && (
                    <div className="space-y-3">
                      {currentQ.options.map((option: string, optIndex: number) => (
                        <label
                          key={optIndex}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                            answers[currentQ.id || currentQuestion] === String.fromCharCode(65 + optIndex)
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-gray-700 bg-white/5 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${currentQ.id || currentQuestion}`}
                            value={String.fromCharCode(65 + optIndex)}
                            checked={answers[currentQ.id || currentQuestion] === String.fromCharCode(65 + optIndex)}
                            onChange={(e) => handleAnswerChange(currentQ.id || currentQuestion, e.target.value)}
                            className="w-5 h-5"
                          />
                          <span className="text-white">
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'true_false_ng' && (
                    <div className="space-y-3">
                      {['TRUE', 'FALSE', 'NOT_GIVEN'].map((value) => (
                        <label
                          key={value}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                            answers[currentQ.id || currentQuestion] === value
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-gray-700 bg-white/5 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${currentQ.id || currentQuestion}`}
                            value={value}
                            checked={answers[currentQ.id || currentQuestion] === value}
                            onChange={(e) => handleAnswerChange(currentQ.id || currentQuestion, e.target.value)}
                            className="w-5 h-5"
                          />
                          <span className="text-white">
                            {value === 'TRUE' ? 'To\'g\'ri' : value === 'FALSE' ? 'Noto\'g\'ri' : 'Berilmagan'}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'matching' && currentQ.options && currentQ.options.length >= 2 && (
                    <div className="space-y-3">
                      <p className="text-gray-400 text-sm mb-2">Chap tomon: {currentQ.options[0]}</p>
                      <p className="text-gray-400 text-sm mb-2">O'ng tomon variantlari: {currentQ.options[1]}</p>
                      <input
                        type="text"
                        value={answers[currentQ.id || currentQuestion] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id || currentQuestion, e.target.value)}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        placeholder="Mos keladigan harfni kiriting (A, B, C...)"
                      />
                    </div>
                  )}

                  {currentQ.type === 'word_formation' && currentQ.options && currentQ.options.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-gray-400 text-sm mb-2">Asosiy so'z: {currentQ.options[0]}</p>
                      <input
                        type="text"
                        value={answers[currentQ.id || currentQuestion] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id || currentQuestion, e.target.value)}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        placeholder="To'g'ri shaklni kiriting"
                      />
                    </div>
                  )}

                  {(currentQ.type === 'fill_blank' || currentQ.type === 'short_answer' || currentQ.type === 'open_cloze' || !currentQ.type) && (
                    <input
                      type="text"
                      value={answers[currentQ.id || currentQuestion] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id || currentQuestion, e.target.value)}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      placeholder="Javobingizni yozing..."
                    />
                  )}

                  {!currentQ.options || currentQ.options.length === 0 ? (
                    <input
                      type="text"
                      value={answers[currentQ.id || currentQuestion] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id || currentQuestion, e.target.value)}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      placeholder="Javobingizni yozing..."
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="p-4 bg-white/5 border-t border-gray-800 flex justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-2 bg-white/10 text-white rounded-lg font-medium transition hover:bg-white/20 disabled:opacity-50"
              >
                Oldingi
              </button>
              <button
                onClick={() => toggleFlag(currentQuestion)}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  flaggedQuestions.has(currentQuestion)
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Flag size={16} className="inline mr-2" />
                Belgilash
              </button>
              <button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === questions.length - 1}
                className="px-6 py-2 gradient-bg text-white rounded-lg font-medium transition hover:opacity-90 disabled:opacity-50"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Davom ettirish</h2>
            <p className="text-gray-400 mb-6">
              Sizning urinishingiz davom etmoqda. Qolgan vaqt: {formatTime(timeRemaining)}
            </p>
            <button
              onClick={handleResume}
              className="w-full px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
            >
              Davom ettirish
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Topshirishni tasdiqlash</h2>
            <p className="text-gray-400 mb-6">
              {unansweredCount} ta savol javobsiz qoldi. Baribir topshirasizmi?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold transition hover:bg-white/20"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
              >
                Ha, topshirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Warning Modal */}
      {showLeaveWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Imtihondan chiqmoqchimisiz?</h2>
            <p className="text-gray-400 mb-6">
              Imtihondan chiqsangiz natijangiz saqlanmaydi. Chiqishni xohlaysizmi?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLeaveWarning(false)}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold transition hover:bg-white/20"
              >
                Qolish
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold transition hover:bg-red-700"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
