'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Mic, MicOff, Play, Pause, RotateCcw, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface SpeakingQuestion {
  id: string;
  part: number;
  cefrLevel: string;
  questionText: string;
  topicCard?: string;
  timeLimitSeconds: number;
  isActive: boolean;
}

export default function AiSpeakingPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<'prep' | 'speaking' | 'result'>('prep');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0 && phase !== 'result') {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && phase === 'prep') {
      startSpeaking();
    } else if (timeLeft === 0 && phase === 'speaking') {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [timeLeft, phase]);

  const fetchQuestions = async () => {
    try {
      const { data } = await api.get('/api/ai-questions/speaking', { params: { isActive: true } });
      setQuestions(data);
      if (data.length > 0) {
        setCurrentQuestionIndex(0);
        setTimeLeft(30); // default 30s prep time
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Savollar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const startPrep = () => {
    setPhase('prep');
    setTimeLeft(30);
    setAudioUrl(null);
    setAiFeedback(null);
  };

  const startSpeaking = () => {
    setPhase('speaking');
    setTimeLeft(questions[currentQuestionIndex].timeLimitSeconds || 60);
    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        analyzeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      // Store mediaRecorder to stop it later
      (window as any).mediaRecorder = mediaRecorder;
    } catch (error) {
      toast.error('Mikrofon ruxsat berilmagan');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if ((window as any).mediaRecorder) {
      (window as any).mediaRecorder.stop();
      (window as any).mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
    }
  };

  const analyzeAudio = async (audioBlob: Blob) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('examType', 'CEFR');

      const { data } = await api.post('/api/ai/speaking', formData);
      setAiFeedback({
        fluency: data.fluencyScore,
        vocabulary: data.grammarScore,
        grammar: data.grammarScore,
        pronunciation: data.pronunciationScore,
        overallScore: data.overallScore,
        feedback: data.feedback,
        suggestions: [],
      });
      setPhase('result');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tahlil qilishda xatolik');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      startPrep();
    } else {
      toast.success('Barcha savollar tugadi!');
      router.push('/student/dashboard');
    }
  };

  const handleRetry = () => {
    startPrep();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="text-center py-16">
            <Mic size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI Speaking savollari topilmadi</h3>
            <p className="text-gray-400">Hozircha savollar mavjud emas</p>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ChevronLeft size={20} />
              Orqaga
            </button>
            <div className="text-gray-400">
              Savol {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-dark rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium">
                Part {currentQuestion.part}
              </span>
              <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium">
                {currentQuestion.cefrLevel}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-white mb-4">{currentQuestion.questionText}</h2>

            {currentQuestion.topicCard && (
              <div className="mb-4 p-4 bg-white/5 rounded-lg">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{currentQuestion.topicCard}</p>
              </div>
            )}

            {/* Timer */}
            {phase !== 'result' && (
              <div className="flex items-center justify-center my-6">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  phase === 'prep' ? 'border-4 border-yellow-500' : 'border-4 border-red-500'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{formatTime(timeLeft)}</div>
                    <div className="text-sm text-gray-400">
                      {phase === 'prep' ? 'Tayyorlanish' : 'Gapirish'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Controls */}
            {phase === 'prep' && (
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  {timeLeft} soniyadan keyin yozish boshlanadi. Tayyor bo'ling!
                </p>
                <button
                  onClick={startSpeaking}
                  className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
                >
                  <Mic size={20} />
                  Hozir yozishni boshlash
                </button>
              </div>
            )}

            {phase === 'speaking' && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={stopRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-700'
                    }`}
                  >
                    {isRecording ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                  </button>
                </div>
                <p className="text-gray-400">
                  {isRecording ? 'Yozilmoqda...' : 'Yozish to\'xtatildi'}
                </p>
              </div>
            )}

            {/* Result */}
            {phase === 'result' && (
              <div className="space-y-6">
                {analyzing ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">AI tahlil qilmoqda...</p>
                  </div>
                ) : (
                  <>
                    {/* Audio Playback */}
                    {audioUrl && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <audio controls src={audioUrl} className="w-full" />
                      </div>
                    )}

                    {/* AI Feedback */}
                    {aiFeedback && (
                      <div className="bg-white/5 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">AI Baholash</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-1">Fluency</div>
                            <div className="text-2xl font-bold text-white">{aiFeedback.fluency}/10</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-1">Vocabulary</div>
                            <div className="text-2xl font-bold text-white">{aiFeedback.vocabulary}/10</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-1">Grammar</div>
                            <div className="text-2xl font-bold text-white">{aiFeedback.grammar}/10</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-1">Pronunciation</div>
                            <div className="text-2xl font-bold text-white">{aiFeedback.pronunciation}/10</div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">Umumiy ball</div>
                          <div className="text-3xl font-bold text-primary-400">{aiFeedback.overallScore}/10</div>
                        </div>

                        {aiFeedback.feedback && (
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-2">Izoh</div>
                            <p className="text-white">{aiFeedback.feedback}</p>
                          </div>
                        )}

                        {aiFeedback.suggestions && aiFeedback.suggestions.length > 0 && (
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-2">Tavsiyalar</div>
                            <ul className="space-y-2">
                              {aiFeedback.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx} className="text-white flex items-start gap-2">
                                  <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleRetry}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold"
                      >
                        <RotateCcw size={20} />
                        Qayta urinish
                      </button>
                      <button
                        onClick={handleNext}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
                      >
                        Keyingi savol
                        <ChevronLeft size={20} className="rotate-180" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
