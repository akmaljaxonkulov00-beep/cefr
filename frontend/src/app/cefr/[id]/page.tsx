'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Clock, ArrowRight, ArrowLeft, Play, Pause, Mic, Save, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface CefrMock {
  id: string;
  title: string;
  listening?: { duration: number; parts: any[] };
  reading?: { duration: number; parts: any[] };
  writing?: { duration: number; task11: any; task12: any; task2: any };
  speaking?: { task1: any; task2: any; task3: any };
}

interface Attempt {
  id: string;
  status: string;
  listeningAnswers?: any;
  readingAnswers?: any;
  writingAnswers?: any;
  speakingAnswers?: any;
}

export default function CefrExamPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;

  const [mock, setMock] = useState<CefrMock | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentSection, setCurrentSection] = useState<'intro' | 'listening' | 'reading' | 'writing' | 'speaking' | 'results'>('intro');
  const [currentPart, setCurrentPart] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const [listeningAnswers, setListeningAnswers] = useState<any>({});
  const [readingAnswers, setReadingAnswers] = useState<any>({});
  const [writingAnswers, setWritingAnswers] = useState<any>({ task11: '', task12: '', task2: '' });
  const [speakingAnswers, setSpeakingAnswers] = useState<any>({ task1: '', task2: '', task3: '' });

  useEffect(() => {
    fetchMockAndAttempt();
  }, [mockId]);

  useEffect(() => {
    if (timeLeft > 0 && currentSection !== 'intro' && currentSection !== 'results') {
      const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && currentSection !== 'intro' && currentSection !== 'results') {
      handleNextSection();
    }
  }, [timeLeft, currentSection]);

  const fetchMockAndAttempt = async () => {
    try {
      const { data } = await api.get(`/cefr/student/mocks/${mockId}`);
      setMock(data.mock);
      setAttempt(data.attempt);

      if (data.attempt) {
        setListeningAnswers(data.attempt.listeningAnswers || {});
        setReadingAnswers(data.attempt.readingAnswers || {});
        setWritingAnswers(data.attempt.writingAnswers || { task11: '', task12: '', task2: '' });
        setSpeakingAnswers(data.attempt.speakingAnswers || { task1: '', task2: '', task3: '' });

        if (data.attempt.status === 'completed') {
          setCurrentSection('results');
        }
      }
    } catch (error) {
      toast.error('Mock yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const startAttempt = async () => {
    try {
      const { data } = await api.post(`/cefr/student/mocks/${mockId}/start`);
      setAttempt(data);
      setCurrentSection('listening');
      setTimeLeft((mock?.listening?.duration || 40) * 60);
    } catch (error) {
      toast.error('Imtihonni boshlashda xatolik');
    }
  };

  const saveProgress = async () => {
    if (!attempt) return;
    try {
      await api.post(`/cefr/student/mocks/${mockId}/save`, {
        listeningAnswers,
        readingAnswers,
        writingAnswers,
        speakingAnswers,
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const submitExam = async () => {
    if (!attempt) return;
    try {
      setLoading(true);
      await api.post(`/cefr/student/mocks/${mockId}/submit`, {
        listeningAnswers,
        readingAnswers,
        writingAnswers,
        speakingAnswers,
      });
      setCurrentSection('results');
      toast.success('Imtihon tugatildi');
    } catch (error) {
      toast.error('Imtihonni topshirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleNextSection = () => {
    saveProgress();

    switch (currentSection) {
      case 'listening':
        setCurrentSection('reading');
        setTimeLeft((mock?.reading?.duration || 60) * 60);
        setCurrentPart(0);
        break;
      case 'reading':
        setCurrentSection('writing');
        setTimeLeft((mock?.writing?.duration || 80) * 60);
        break;
      case 'writing':
        setCurrentSection('speaking');
        setTimeLeft(15 * 60);
        break;
      case 'speaking':
        submitExam();
        break;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  if (currentSection === 'intro') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-dark rounded-2xl p-8 max-w-2xl w-full">
            <h1 className="text-3xl font-bold text-white mb-4">{mock?.title}</h1>
            <p className="text-gray-400 mb-6">CEFR Mock Test</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <Clock size={24} className="text-primary-400" />
                <div>
                  <p className="text-white font-medium">Listening</p>
                  <p className="text-gray-400 text-sm">{mock?.listening?.duration || 40} daqiqa</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <Clock size={24} className="text-primary-400" />
                <div>
                  <p className="text-white font-medium">Reading</p>
                  <p className="text-gray-400 text-sm">{mock?.reading?.duration || 60} daqiqa</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <Clock size={24} className="text-primary-400" />
                <div>
                  <p className="text-white font-medium">Writing</p>
                  <p className="text-gray-400 text-sm">{mock?.writing?.duration || 80} daqiqa</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <Clock size={24} className="text-primary-400" />
                <div>
                  <p className="text-white font-medium">Speaking</p>
                  <p className="text-gray-400 text-sm">~15 daqiqa</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium mb-1">Diqqat!</p>
                  <p className="text-gray-300 text-sm">
                    Imtihonni boshlagandan so'ng vaqt cheklanadi. Har bir bo'lim uchun vaqt alohida hisoblanadi.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={startAttempt}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 gradient-bg text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              <Play size={20} />
              Imtihonni boshlash
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (currentSection === 'results') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="glass-dark rounded-2xl p-8 max-w-2xl w-full text-center">
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Tabriklaymiz!</h1>
            <p className="text-gray-400 mb-8">
              CEFR imtihonini muvaffaqiyatli tugatdingiz. Natijalar tez orada tayyor bo'ladi.
            </p>
            <button
              onClick={() => router.push(`/cefr/${mockId}/result`)}
              className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              Natijalarni Ko'rish
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{mock?.title}</h1>
            <p className="text-gray-400 capitalize">{currentSection}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Clock size={18} className="text-primary-400" />
              <span className="text-white font-mono text-xl">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={saveProgress}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition"
            >
              <Save size={18} />
              Saqlash
            </button>
          </div>
        </div>

        {/* Section Content */}
        <div className="glass-dark rounded-2xl p-6">
          {currentSection === 'listening' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Listening Section</h2>
              <p className="text-gray-400 mb-6">
                Audio tinglang va savollarga javob bering.
              </p>
              <div className="space-y-4">
                {mock?.listening?.parts?.map((part, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-medium">Qism {idx + 1}</h3>
                      {part.audioPlaysTwice && (
                        <span className="text-gray-400 text-sm">2 marta ijro</span>
                      )}
                    </div>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Audio URL"
                        value={part.audioUrl}
                        disabled
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      {part.questions?.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="flex items-center gap-3">
                          <span className="text-gray-400 w-8">{qIdx + 1}.</span>
                          <input
                            type="text"
                            placeholder="Javob..."
                            className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                            value={listeningAnswers[`part${idx + 1}`]?.[qIdx] || ''}
                            onChange={(e) => {
                              const newAnswers = { ...listeningAnswers };
                              if (!newAnswers[`part${idx + 1}`]) {
                                newAnswers[`part${idx + 1}`] = [];
                              }
                              newAnswers[`part${idx + 1}`][qIdx] = e.target.value;
                              setListeningAnswers(newAnswers);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'reading' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Reading Section</h2>
              <p className="text-gray-400 mb-6">
                Matnlarni o'qing va savollarga javob bering.
              </p>
              <div className="space-y-4">
                {mock?.reading?.parts?.map((part, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-4">Qism {idx + 1}</h3>
                    <p className="text-gray-300 mb-6 whitespace-pre-wrap">{part.content}</p>
                    <div className="space-y-2">
                      {part.questions?.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="flex items-center gap-3">
                          <span className="text-gray-400 w-8">{qIdx + 1}.</span>
                          <input
                            type="text"
                            placeholder="Javob..."
                            className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                            value={readingAnswers[`part${idx + 1}`]?.[qIdx] || ''}
                            onChange={(e) => {
                              const newAnswers = { ...readingAnswers };
                              if (!newAnswers[`part${idx + 1}`]) {
                                newAnswers[`part${idx + 1}`] = [];
                              }
                              newAnswers[`part${idx + 1}`][qIdx] = e.target.value;
                              setReadingAnswers(newAnswers);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'writing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Writing Section</h2>
              
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">Task 1.1</h3>
                <p className="text-gray-400 mb-4">{mock?.writing?.task11?.context}</p>
                <textarea
                  value={writingAnswers.task11}
                  onChange={(e) => setWritingAnswers({ ...writingAnswers, task11: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                  placeholder="Task 1.1 javobingizni yozing..."
                />
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">Task 1.2</h3>
                <p className="text-gray-400 mb-4">{mock?.writing?.task12?.context}</p>
                <textarea
                  value={writingAnswers.task12}
                  onChange={(e) => setWritingAnswers({ ...writingAnswers, task12: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-48"
                  placeholder="Task 1.2 javobingizni yozing..."
                />
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">Task 2</h3>
                <p className="text-gray-400 mb-4">{mock?.writing?.task2?.prompt}</p>
                <textarea
                  value={writingAnswers.task2}
                  onChange={(e) => setWritingAnswers({ ...writingAnswers, task2: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-64"
                  placeholder="Task 2 javobingizni yozing..."
                />
              </div>
            </div>
          )}

          {currentSection === 'speaking' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Speaking Section</h2>
              
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">Task 1</h3>
                <div className="space-y-2 mb-4">
                  {mock?.speaking?.task1?.questions?.map((q: string, idx: number) => (
                    <p key={idx} className="text-gray-300">{idx + 1}. {q}</p>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isRecording ? 'bg-red-600 text-white' : 'gradient-bg text-white'
                    }`}
                  >
                    {isRecording ? <Pause size={18} /> : <Mic size={18} />}
                    {isRecording ? 'To\'xtatish' : 'Yozish'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">Task 2</h3>
                <p className="text-gray-400 mb-2">Rasm tavsifi</p>
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isRecording ? 'bg-red-600 text-white' : 'gradient-bg text-white'
                    }`}
                  >
                    {isRecording ? <Pause size={18} /> : <Mic size={18} />}
                    {isRecording ? 'To\'xtatish' : 'Yozish'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">Task 3</h3>
                <p className="text-gray-400 mb-2">Muhokama</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isRecording ? 'bg-red-600 text-white' : 'gradient-bg text-white'
                    }`}
                  >
                    {isRecording ? <Pause size={18} /> : <Mic size={18} />}
                    {isRecording ? 'To\'xtatish' : 'Yozish'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={() => {
                if (currentSection === 'listening') setCurrentSection('intro');
                else if (currentSection === 'reading') setCurrentSection('listening');
                else if (currentSection === 'writing') setCurrentSection('reading');
                else if (currentSection === 'speaking') setCurrentSection('writing');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition"
            >
              <ArrowLeft size={20} />
              Orqaga
            </button>
            <button
              onClick={handleNextSection}
              className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
            >
              {currentSection === 'speaking' ? (
                <>
                  <Send size={20} />
                  Tugatish
                </>
              ) : (
                <>
                  Keyingi
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
