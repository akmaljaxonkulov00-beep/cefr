'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Clock, ArrowRight, ArrowLeft, Play, Pause, Mic, Save, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface IeltsMock {
  id: string;
  title: string;
  type: 'Academic' | 'General';
  listening?: { duration: number; recordings: any[] };
  reading?: { duration: number; passages: any[] };
  writing?: { duration: number; task1: any; task2: any };
  speaking?: { part1: any; part2: any; part3: any };
}

interface Attempt {
  id: string;
  status: string;
  listeningAnswers?: any;
  readingAnswers?: any;
  writingAnswers?: any;
  speakingAnswers?: any;
}

export default function IeltsExamPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;

  const [mock, setMock] = useState<IeltsMock | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentSection, setCurrentSection] = useState<'intro' | 'listening' | 'reading' | 'writing' | 'speaking' | 'results'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const [listeningAnswers, setListeningAnswers] = useState<any>({});
  const [readingAnswers, setReadingAnswers] = useState<any>({});
  const [writingAnswers, setWritingAnswers] = useState<any>({ task1: '', task2: '' });
  const [speakingAnswers, setSpeakingAnswers] = useState<any>({ part1: '', part2: '', part3: '' });

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
      const { data } = await api.get(`/api/ielts/student/mocks/${mockId}`);
      setMock(data.mock);
      setAttempt(data.attempt);

      if (data.attempt) {
        setListeningAnswers(data.attempt.listeningAnswers || {});
        setReadingAnswers(data.attempt.readingAnswers || {});
        setWritingAnswers(data.attempt.writingAnswers || { task1: '', task2: '' });
        setSpeakingAnswers(data.attempt.speakingAnswers || { part1: '', part2: '', part3: '' });

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
      const { data } = await api.post(`/ielts/student/mocks/${mockId}/start`);
      setAttempt(data);
      setCurrentSection('listening');
      setTimeLeft((mock?.listening?.duration || 30) * 60);
    } catch (error) {
      toast.error('Imtihonni boshlashda xatolik');
    }
  };

  const saveProgress = async () => {
    if (!attempt) return;
    try {
      await api.post(`/ielts/student/mocks/${mockId}/save`, {
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
      await api.post(`/ielts/student/mocks/${mockId}/submit`, {
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
        setCurrentQuestion(0);
        break;
      case 'reading':
        setCurrentSection('writing');
        setTimeLeft((mock?.writing?.duration || 60) * 60);
        break;
      case 'writing':
        setCurrentSection('speaking');
        setTimeLeft(15 * 60); // 15 minutes for speaking
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
            <p className="text-gray-400 mb-6">{mock?.type} IELTS Mock Test</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <Clock size={24} className="text-primary-400" />
                <div>
                  <p className="text-white font-medium">Listening</p>
                  <p className="text-gray-400 text-sm">{mock?.listening?.duration || 30} daqiqa</p>
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
                  <p className="text-gray-400 text-sm">{mock?.writing?.duration || 60} daqiqa</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <Clock size={24} className="text-primary-400" />
                <div>
                  <p className="text-white font-medium">Speaking</p>
                  <p className="text-gray-400 text-sm">{mock?.speaking?.part1?.duration + mock?.speaking?.part2?.duration + mock?.speaking?.part3?.duration || 15} daqiqa</p>
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
              IELTS imtihonini muvaffaqiyatli tugatdingiz. Natijalar tez orada tayyor bo'ladi.
            </p>
            <button
              onClick={() => router.push('/ielts')}
              className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              IELTS Mocklarga qaytish
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
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-gray-300 mb-4">Audio yuklanmoqda...</p>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg">
                    <Play size={18} />
                    Play
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {mock?.listening?.recordings?.map((rec, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4">
                    <p className="text-white font-medium mb-2">Recording {idx + 1}</p>
                    <div className="space-y-2">
                      {rec.questions?.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="flex items-center gap-3">
                          <span className="text-gray-400 w-8">{qIdx + 1}.</span>
                          <input
                            type="text"
                            placeholder="Javob..."
                            className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                            value={listeningAnswers[`recording${idx + 1}`]?.[qIdx] || ''}
                            onChange={(e) => {
                              const newAnswers = { ...listeningAnswers };
                              if (!newAnswers[`recording${idx + 1}`]) {
                                newAnswers[`recording${idx + 1}`] = [];
                              }
                              newAnswers[`recording${idx + 1}`][qIdx] = e.target.value;
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
              <div className="space-y-6">
                {mock?.reading?.passages?.map((passage, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4">Passage {idx + 1}</h3>
                    <p className="text-gray-300 mb-6 whitespace-pre-wrap">{passage.text}</p>
                    <div className="space-y-2">
                      {passage.questions?.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="flex items-center gap-3">
                          <span className="text-gray-400 w-8">{qIdx + 1}.</span>
                          <input
                            type="text"
                            placeholder="Javob..."
                            className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                            value={readingAnswers[`passage${idx + 1}`]?.[qIdx] || ''}
                            onChange={(e) => {
                              const newAnswers = { ...readingAnswers };
                              if (!newAnswers[`passage${idx + 1}`]) {
                                newAnswers[`passage${idx + 1}`] = [];
                              }
                              newAnswers[`passage${idx + 1}`][qIdx] = e.target.value;
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
                <h3 className="text-white font-medium mb-2">Task 1</h3>
                <p className="text-gray-400 mb-4">{mock?.writing?.task1?.prompt}</p>
                <textarea
                  value={writingAnswers.task1}
                  onChange={(e) => setWritingAnswers({ ...writingAnswers, task1: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-48"
                  placeholder="Task 1 javobingizni yozing..."
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
                <h3 className="text-white font-medium mb-2">Part 1</h3>
                <div className="space-y-2 mb-4">
                  {mock?.speaking?.part1?.questions?.map((q: string, idx: number) => (
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
                <h3 className="text-white font-medium mb-2">Part 2</h3>
                <p className="text-gray-400 mb-2">Topic: {mock?.speaking?.part2?.topic}</p>
                <ul className="text-gray-300 mb-4 list-disc list-inside">
                  {mock?.speaking?.part2?.bulletPoints?.map((bp: string, idx: number) => (
                    <li key={idx}>{bp}</li>
                  ))}
                </ul>
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
                <h3 className="text-white font-medium mb-2">Part 3</h3>
                <div className="space-y-2 mb-4">
                  {mock?.speaking?.part3?.questions?.map((q: string, idx: number) => (
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
