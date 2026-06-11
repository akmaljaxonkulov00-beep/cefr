'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { MicOff, Check, RotateCcw, ChevronLeft, Play, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface SpeakingQuestion {
  id: string;
  part: number;
  cefrLevel: string;
  questionText: string;
  topicCard?: string;
  timeLimitSeconds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type Phase = 'select' | 'prep' | 'speaking' | 'result' | 'final';

export default function AiSpeakingPage() {
  const router = useRouter();
  const [selectedPart, setSelectedPart] = useState<number | 'all' | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<SpeakingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('select');
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);

  const currentQuestion = currentQuestions[currentIndex];

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && phase !== 'select' && phase !== 'result' && phase !== 'final') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (phase === 'prep') startSpeaking();
            else if (phase === 'speaking' && isRecording) {
              // ✅ Vaqt tugaganda MAJBURIY to'xtatish
              stopRecording();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, phase, isRecording]);

  const getFallbackQuestion = (part: number): SpeakingQuestion => {
    const fallbacks: Record<number, string> = {
      1: 'Tell me about your hometown. What do you like most about living there?',
      2: 'Describe a memorable event in your life. You should say:\n- When it happened\n- Where it was\n- Who was with you\n- Why it was memorable',
      3: 'Do you think technology has improved communication between people? Why or why not?'
    };

    return {
      id: `fallback-part${part}`,
      part,
      cefrLevel: 'B2', // Default, but AI will determine actual level
      questionText: fallbacks[part],
      timeLimitSeconds: part === 2 ? 120 : 60,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const startMock = async () => {
    if (!selectedPart) {
      toast.error('Part tanlang!');
      return;
    }

    setLoading(true);
    try {
      let questions: SpeakingQuestion[] = [];

      if (selectedPart === 'all') {
        for (let part = 1; part <= 3; part++) {
          try {
            const { data } = await api.get(`/api/ai-questions/speaking/random?part=${part}`);
            questions.push(data);
          } catch {
            questions.push(getFallbackQuestion(part));
          }
        }
        toast('3 ta part yuklandi', { icon: '✅' });
      } else {
        try {
          const { data } = await api.get(`/api/ai-questions/speaking/random?part=${selectedPart}`);
          questions.push(data);
        } catch {
          questions.push(getFallbackQuestion(selectedPart as number));
        }
        toast(`Part ${selectedPart} yuklandi`, { icon: '✅' });
      }

      setCurrentQuestions(questions);
      setCurrentIndex(0);
      setAllResults([]);
      startPrep(questions[0]);
      
    } finally {
      setLoading(false);
    }
  };

  const startPrep = (question: SpeakingQuestion) => {
    setPhase('prep');
    setTimeLeft(question.part === 2 ? 60 : 10);
    setAudioUrl(null);
    setAiFeedback(null);
    setIsRecording(false);
  };

  const startSpeaking = () => {
    setPhase('speaking');
    setTimeLeft(currentQuestion.timeLimitSeconds || 60);
    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Blob yaratish
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stream'ni to'xtatish
        stream.getTracks().forEach(t => t.stop());
        
        // AI tahlil yuborish
        await submitAnswer(url, blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Mikrofon ruxsatini bering!');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      // MediaRecorder'ni to'xtatish
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setPhase('result'); // Result phase'ga o'tish
      setLoading(true); // Loading ko'rsatish
    }
  };

  const submitAnswer = async (audioUrlParam?: string, audioBlob?: Blob) => {
    try {
      // Blob olish - parameter yoki state'dan
      const blob = audioBlob || (audioUrlParam ? await fetch(audioUrlParam).then(r => r.blob()) : null);
      
      if (!blob) {
        toast.error('Audio yuklanmadi, qayta urinib ko\'ring');
        setLoading(false);
        setPhase('speaking');
        return;
      }

      // REAL AI ANALYSIS - Send audio to backend
      const formData = new FormData();
      formData.append('audio', blob, 'speaking.webm');
      formData.append('questionText', currentQuestion.questionText);
      formData.append('part', currentQuestion.part.toString());
      
      // Call AI analysis endpoint
      const { data } = await api.post('/api/ai/speaking/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Real AI feedback
      const feedback = {
        fluency: data.fluency || 0,
        vocabulary: data.vocabulary || 0,
        grammar: data.grammar || 0,
        pronunciation: data.pronunciation || 0,
        overallScore: data.overallScore || 0,
        detectedLevel: data.detectedLevel || 'A1',
        feedback: data.feedback || '',
        grammarErrors: data.grammarErrors || [],
        suggestions: data.suggestions || [],
        transcription: data.transcription || '',
      };
      
      setAiFeedback(feedback);
      setAllResults([...allResults, { question: currentQuestion, feedback }]);
      setPhase('result');
      
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`AI tahlil xatosi: ${errorMsg}`);
      setPhase('speaking');
      setIsRecording(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      startPrep(currentQuestions[currentIndex + 1]);
    } else {
      setPhase('final');
    }
  };

  const handleRetry = () => {
    startPrep(currentQuestion);
  };

  const handleRestart = () => {
    setPhase('select');
    setSelectedPart(null);
    setCurrentQuestions([]);
    setCurrentIndex(0);
    setAllResults([]);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const getAvgScore = (): string => {
    if (allResults.length === 0) return '0';
    const sum = allResults.reduce((acc, r) => acc + r.feedback.overallScore, 0);
    return (sum / allResults.length).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Yuklanmoqda...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ChevronLeft size={20} />
              Orqaga
            </button>
            {phase !== 'select' && (
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm">
                  Part {currentQuestion?.part}
                </span>
                {aiFeedback?.detectedLevel && (
                  <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-semibold">
                    Level: {aiFeedback.detectedLevel}
                  </span>
                )}
                {selectedPart === 'all' && (
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-sm">
                    {currentIndex + 1}/3
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SELECT PHASE */}
          {phase === 'select' && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">🎤 AI Speaking Practice</h1>
              <p className="text-gray-400 mb-8">Part tanlang va mashq boshlang. AI sizning javobingizga qarab darajangizni aniqlaydi.</p>

              {/* Part Selection */}
              <div className="mb-8">
                <label className="text-sm text-gray-400 mb-3 block">Part tanlang</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSelectedPart(1)}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedPart === 1
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">Part 1</div>
                    <div className="text-xs text-gray-400">Shaxsiy savollar</div>
                    <div className="text-xs text-gray-500 mt-1">~1 daqiqa</div>
                  </button>
                  <button
                    onClick={() => setSelectedPart(2)}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedPart === 2
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">Part 2</div>
                    <div className="text-xs text-gray-400">Monolog (60s prep)</div>
                    <div className="text-xs text-gray-500 mt-1">~2 daqiqa</div>
                  </button>
                  <button
                    onClick={() => setSelectedPart(3)}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedPart === 3
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">Part 3</div>
                    <div className="text-xs text-gray-400">Muhokama</div>
                    <div className="text-xs text-gray-500 mt-1">~1.5 daqiqa</div>
                  </button>
                  <button
                    onClick={() => setSelectedPart('all')}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedPart === 'all'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/10 bg-white/5 hover:border-green-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">🎯 Full Mock</div>
                    <div className="text-xs text-gray-400">Barcha partlar</div>
                    <div className="text-xs text-gray-500 mt-1">~4.5 daqiqa</div>
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-blue-300 text-sm">
                  💡 <strong>AI avtomatik baholaydi:</strong> Sizning javobingizga qarab (A1-C2) daraja aniqlanadi va ball beriladi.
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={startMock}
                disabled={!selectedPart}
                className="w-full py-4 gradient-bg text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
              >
                <Play size={24} />
                Boshlash
              </button>
            </div>
          )}

          {/* PREP PHASE */}
          {phase === 'prep' && currentQuestion && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-xl mb-4">
                  <Clock size={20} className="text-blue-400" />
                  <span className="text-blue-400 font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
                </div>
                <h2 className="text-xl font-bold text-white">⏱️ Tayyorlanish vaqti</h2>
                <p className="text-gray-400 text-sm">Savolni o'qib chiqing</p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Part {currentQuestion.part} - Savol:</h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                  {currentQuestion.questionText}
                </p>
              </div>

              <div className="text-center text-gray-400 text-sm">
                Tayyorlanish tugagach avtomatik yozib olish boshlanadi
              </div>
            </div>
          )}

          {/* SPEAKING PHASE */}
          {phase === 'speaking' && currentQuestion && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl mb-4">
                  <Clock size={20} className="text-red-400" />
                  <span className="text-red-400 font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
                </div>
                <h2 className="text-xl font-bold text-white">🎤 Gapiring!</h2>
                {isRecording && <p className="text-red-400 text-sm animate-pulse">● Yozib olinmoqda...</p>}
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                  {currentQuestion.questionText}
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MicOff size={20} />
                  To'xtatish
                </button>
              </div>

              <div className="text-center mt-4 text-gray-400 text-sm">
                Istalgan vaqtda to'xtatishingiz mumkin. Vaqt tugagach avtomatik to'xtaydi.
              </div>
            </div>
          )}

          {/* RESULT PHASE */}
          {phase === 'result' && !aiFeedback && loading && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">🤖 AI Tahlil Qilinmoqda...</h3>
                <p className="text-gray-400">Iltimos kuting, bu 10-20 soniya davom etishi mumkin</p>
              </div>
            </div>
          )}

          {/* RESULT PHASE */}
          {phase === 'result' && aiFeedback && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Check className="text-green-400" /> AI Baholash - Part {currentQuestion.part}
              </h3>

              <div className="bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl p-6 text-center border-2 border-primary-500/50 mb-4">
                <p className="text-sm text-gray-300 mb-2">Umumiy Ball</p>
                <p className="text-5xl font-bold text-white">{aiFeedback.overallScore}</p>
                <p className="text-sm text-gray-400 mt-1">/ 10.0</p>
              </div>

              {/* Detected Level Badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl">
                  <span className="text-gray-300 text-sm">AI aniqlangan daraja:</span>
                  <span className="text-2xl font-bold text-white">{aiFeedback.detectedLevel}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Fluency</p>
                  <p className="text-2xl font-bold text-blue-400">{aiFeedback.fluency.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Vocabulary</p>
                  <p className="text-2xl font-bold text-green-400">{aiFeedback.vocabulary.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Grammar</p>
                  <p className="text-2xl font-bold text-yellow-400">{aiFeedback.grammar.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Pronunciation</p>
                  <p className="text-2xl font-bold text-purple-400">{aiFeedback.pronunciation.toFixed(1)}</p>
                </div>
              </div>

              {/* Transcription */}
              {aiFeedback.transcription && (
                <div className="bg-white/5 rounded-xl p-5 mb-4">
                  <p className="text-sm text-gray-400 mb-2">🎙️ Transkripsiya:</p>
                  <p className="text-white leading-relaxed">{aiFeedback.transcription}</p>
                </div>
              )}

              {/* Grammar Errors */}
              {aiFeedback.grammarErrors && aiFeedback.grammarErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-4">
                  <p className="text-sm text-red-400 mb-3 font-semibold">❌ Grammatik xatolar:</p>
                  <ul className="space-y-2">
                    {aiFeedback.grammarErrors.map((error: string, i: number) => (
                      <li key={i} className="text-white text-sm flex gap-2">
                        <span className="text-red-400">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback */}
              {aiFeedback.feedback && (
                <div className="bg-white/5 rounded-xl p-5 mb-4">
                  <p className="text-sm text-gray-400 mb-2">💬 AI Izohi:</p>
                  <p className="text-white leading-relaxed">{aiFeedback.feedback}</p>
                </div>
              )}

              {/* Suggestions */}
              {aiFeedback.suggestions && aiFeedback.suggestions.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-6">
                  <p className="text-sm text-blue-400 mb-3 font-semibold">💡 Tavsiyalar:</p>
                  <ul className="space-y-2">
                    {aiFeedback.suggestions.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-white text-sm">
                        <Check size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10"
                >
                  <RotateCcw className="inline mr-2" size={20} />
                  Qayta
                </button>
                {currentIndex < currentQuestions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-4 gradient-bg text-white rounded-xl font-semibold"
                  >
                    Keyingi Part
                    <ArrowRight className="inline ml-2" size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => setPhase('final')}
                    className="flex-1 px-6 py-4 gradient-bg text-white rounded-xl font-semibold"
                  >
                    Yakunlash
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FINAL PHASE */}
          {phase === 'final' && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🎉 Mock Tugatildi!</h2>
              
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl p-6 text-center border-2 border-green-500/50 mb-4">
                <p className="text-sm text-gray-300 mb-2">O'rtacha Ball</p>
                <p className="text-5xl font-bold text-white">{getAvgScore()}</p>
                <p className="text-sm text-gray-400 mt-1">/ 10.0</p>
              </div>

              {/* Average Level */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl">
                  <span className="text-gray-300">O'rtacha daraja:</span>
                  <span className="text-2xl font-bold text-white">
                    {(() => {
                      const avg = parseFloat(getAvgScore());
                      if (avg >= 8.5) return 'C2';
                      if (avg >= 8) return 'C1';
                      if (avg >= 7) return 'B2';
                      if (avg >= 6) return 'B1';
                      if (avg >= 5) return 'A2';
                      return 'A1';
                    })()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {allResults.map((result, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-semibold">Part {result.question.part}</span>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold">
                          {result.feedback.detectedLevel}
                        </span>
                        <span className="text-2xl font-bold text-primary-400">{result.feedback.overallScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleRestart}
                className="w-full px-6 py-4 gradient-bg text-white rounded-xl font-semibold text-lg hover:opacity-90 transition"
              >
                Yangi Mock Boshlash
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
