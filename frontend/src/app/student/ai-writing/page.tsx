'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Edit3, Send, RotateCcw, ChevronLeft, Check, Clock, Play, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface WritingQuestion {
  id: string;
  task: number;
  cefrLevel: string;
  promptText: string;
  minWords: number;
  maxWords: number;
}

type Phase = 'select' | 'writing' | 'result' | 'final';

export default function AiWritingPage() {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<number | 'all' | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<WritingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('select');
  const [loading, setLoading] = useState(false);
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);

  const currentQuestion = currentQuestions[currentIndex];

  // Word count
  useEffect(() => {
    const words = essay.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [essay]);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && timerStarted && phase === 'writing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // ✅ Vaqt tugaganda MAJBURIY yuborish
            toast.info('⏰ Vaqt tugadi! Avtomatik yuborilmoqda...');
            setTimeout(() => {
              handleSubmit();
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, timerStarted, phase]);

  const getFallbackQuestion = (task: number): WritingQuestion => {
    const fallbacks: Record<number, { prompt: string; min: number; max: number }> = {
      1: {
        prompt: 'You recently moved to a new city. Write an email to your friend telling them about your new home and your first impressions.\n\nWrite at least 100 words.',
        min: 100,
        max: 150
      },
      2: {
        prompt: 'Some people believe that studying abroad is beneficial for students, while others think it is better to study in their home country.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.',
        min: 250,
        max: 350
      }
    };

    return {
      id: `fallback-task${task}`,
      task,
      cefrLevel: 'B2',
      promptText: fallbacks[task].prompt,
      minWords: fallbacks[task].min,
      maxWords: fallbacks[task].max,
    };
  };

  const startMock = async () => {
    if (!selectedTask) {
      toast.error('Task tanlang!');
      return;
    }

    setLoading(true);
    try {
      let questions: WritingQuestion[] = [];

      if (selectedTask === 'all') {
        for (let task = 1; task <= 2; task++) {
          try {
            const { data } = await api.get(`/api/ai-questions/writing/random?task=${task}`);
            questions.push(data);
          } catch {
            questions.push(getFallbackQuestion(task));
          }
        }
        toast('2 ta task yuklandi', { icon: '✅' });
      } else {
        try {
          const { data } = await api.get(`/api/ai-questions/writing/random?task=${selectedTask}`);
          questions.push(data);
        } catch {
          questions.push(getFallbackQuestion(selectedTask as number));
        }
        toast(`Task ${selectedTask} yuklandi`, { icon: '✅' });
      }

      setCurrentQuestions(questions);
      setCurrentIndex(0);
      setAllResults([]);
      startWriting(questions[0]);
      
    } finally {
      setLoading(false);
    }
  };

  const startWriting = (question: WritingQuestion) => {
    setPhase('writing');
    setEssay('');
    setWordCount(0);
    setTimeLeft(question.task === 1 ? 20 * 60 : 40 * 60);
    setTimerStarted(false);
    setAiFeedback(null);
  };

  const handleEssayChange = (text: string) => {
    setEssay(text);
    if (!timerStarted && text.length > 0) {
      setTimerStarted(true);
    }
  };

  const handleSubmit = async () => {
    if (wordCount < currentQuestion.minWords) {
      toast.error(`Minimum ${currentQuestion.minWords} so'z kerak`);
      return;
    }

    setAnalyzing(true);

    try {
      // REAL AI ANALYSIS - Send essay to backend
      const { data } = await api.post('/api/ai/writing/analyze', {
        essay,
        questionText: currentQuestion.promptText,
        task: currentQuestion.task,
        minWords: currentQuestion.minWords,
        maxWords: currentQuestion.maxWords,
      });

      const feedback = {
        taskResponse: data.taskResponse || 0,
        coherence: data.coherence || 0,
        lexical: data.lexical || 0,
        grammar: data.grammar || 0,
        overallScore: data.overallScore || 0,
        detectedLevel: data.detectedLevel || 'A1',
        feedback: data.feedback || '',
        grammarErrors: data.grammarErrors || [],
        suggestions: data.suggestions || [],
        strengths: data.strengths || [],
        improvements: data.improvements || [],
      };

      setAiFeedback(feedback);
      setAllResults([...allResults, { question: currentQuestion, essay, feedback }]);
      setAnalyzing(false);
      setPhase('result');
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('AI tahlil xatosi! Backend ishlamayapti yoki Groq API key yo\'q.');
      setAnalyzing(false);
      setPhase('writing'); // Stay on writing phase for retry
      return; // Don't proceed to result phase
    }
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      startWriting(currentQuestions[currentIndex + 1]);
    } else {
      setPhase('final');
    }
  };

  const handleRetry = () => {
    startWriting(currentQuestion);
  };

  const handleRestart = () => {
    setPhase('select');
    setSelectedTask(null);
    setCurrentQuestions([]);
    setCurrentIndex(0);
    setAllResults([]);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  
  const getAvgScore = () => {
    if (allResults.length === 0) return 0;
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
        <div className="max-w-5xl mx-auto">
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
                  Task {currentQuestion?.task}
                </span>
                {aiFeedback?.detectedLevel && (
                  <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-semibold">
                    Level: {aiFeedback.detectedLevel}
                  </span>
                )}
                {selectedTask === 'all' && (
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-sm">
                    {currentIndex + 1}/2
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SELECT PHASE */}
          {phase === 'select' && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">✍️ AI Writing Practice</h1>
              <p className="text-gray-400 mb-8">Task tanlang va yozishni boshlang. AI sizning essayingizga qarab darajangizni aniqlaydi.</p>

              {/* Task Selection */}
              <div className="mb-8">
                <label className="text-sm text-gray-400 mb-3 block">Task tanlang</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedTask(1)}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedTask === 1
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">Task 1</div>
                    <div className="text-xs text-gray-400">Letter/Email</div>
                    <div className="text-xs text-gray-500 mt-1">100-150 so'z</div>
                    <div className="text-xs text-gray-500">20 daqiqa</div>
                  </button>
                  <button
                    onClick={() => setSelectedTask(2)}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedTask === 2
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">Task 2</div>
                    <div className="text-xs text-gray-400">Essay</div>
                    <div className="text-xs text-gray-500 mt-1">250-350 so'z</div>
                    <div className="text-xs text-gray-500">40 daqiqa</div>
                  </button>
                  <button
                    onClick={() => setSelectedTask('all')}
                    className={`p-5 rounded-xl border-2 transition ${
                      selectedTask === 'all'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/10 bg-white/5 hover:border-green-500/50'
                    }`}
                  >
                    <div className="text-white font-semibold text-lg mb-1">🎯 Full Mock</div>
                    <div className="text-xs text-gray-400">Ikkala task</div>
                    <div className="text-xs text-gray-500 mt-1">Task 1 + Task 2</div>
                    <div className="text-xs text-gray-500">~60 daqiqa</div>
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-blue-300 text-sm">
                  💡 <strong>AI avtomatik baholaydi:</strong> Sizning essayingizga qarab (A1-C2) daraja aniqlanadi va ball beriladi.
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={startMock}
                disabled={!selectedTask}
                className="w-full py-4 gradient-bg text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
              >
                <Play size={24} />
                Boshlash
              </button>
            </div>
          )}

          {/* WRITING PHASE */}
          {phase === 'writing' && currentQuestion && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Task {currentQuestion.task}</h2>
                {timerStarted && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    timeLeft < 300 ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    <Clock size={18} className={timeLeft < 300 ? 'text-red-400' : 'text-blue-400'} />
                    <span className={`font-mono font-semibold ${timeLeft < 300 ? 'text-red-400' : 'text-blue-400'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-4">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentQuestion.promptText}
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">Sizning javobingiz:</label>
                  <div className="flex gap-4 text-sm">
                    <span className={`font-semibold ${
                      wordCount < currentQuestion.minWords ? 'text-red-400' :
                      wordCount > currentQuestion.maxWords ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {wordCount} so'z
                    </span>
                    <span className="text-gray-500">
                      Min: {currentQuestion.minWords} | Max: {currentQuestion.maxWords}
                    </span>
                  </div>
                </div>
                <textarea
                  value={essay}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  placeholder="Yozishni boshlang... (Timer avtomatik boshlanadi)"
                  className="w-full h-96 p-4 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10"
                >
                  <RotateCcw className="inline mr-2" size={20} />
                  Tozalash
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={wordCount < currentQuestion.minWords || analyzing}
                  className="flex-1 px-6 py-3 gradient-bg text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? 'Tahlil qilinmoqda...' : (
                    <>
                      <Send className="inline mr-2" size={20} />
                      Yuborish
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* RESULT PHASE */}
          {phase === 'result' && aiFeedback && (
            <div className="glass-dark rounded-2xl p-6 lg:p-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Check className="text-green-400" /> AI Baholash - Task {currentQuestion.task}
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
                  <p className="text-xs text-gray-400">Task Response</p>
                  <p className="text-2xl font-bold text-blue-400">{aiFeedback.taskResponse.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Coherence</p>
                  <p className="text-2xl font-bold text-green-400">{aiFeedback.coherence.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Lexical Resource</p>
                  <p className="text-2xl font-bold text-yellow-400">{aiFeedback.lexical.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Grammar</p>
                  <p className="text-2xl font-bold text-purple-400">{aiFeedback.grammar.toFixed(1)}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 mb-6">
                <p className="text-sm text-gray-400 mb-2">📝 Sizning essayingiz:</p>
                <div className="max-h-64 overflow-y-auto p-4 bg-white/5 rounded-lg">
                  <p className="text-white whitespace-pre-wrap leading-relaxed">{allResults[allResults.length - 1]?.essay}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">{wordCount} so'z</p>
              </div>

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

              {/* Strengths */}
              {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-4">
                  <p className="text-sm text-green-400 mb-3 font-semibold">✅ Kuchli tomonlar:</p>
                  <ul className="space-y-2">
                    {aiFeedback.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-white text-sm">
                        <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {aiFeedback.improvements && aiFeedback.improvements.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-4">
                  <p className="text-sm text-yellow-400 mb-3 font-semibold">📈 Yaxshilash kerak:</p>
                  <ul className="space-y-2">
                    {aiFeedback.improvements.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-white text-sm">
                        <span className="text-yellow-400">→</span>
                        <span>{s}</span>
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
                    Keyingi Task
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
                      <span className="text-white font-semibold">Task {result.question.task}</span>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold">
                          {result.feedback.detectedLevel}
                        </span>
                        <span className="text-2xl font-bold text-primary-400">{result.feedback.overallScore}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{result.essay.split(/\s+/).length} so'z</p>
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
