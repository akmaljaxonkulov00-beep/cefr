'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Clock, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface CefrMock {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  duration: number;
  listening?: {
    duration: number;
    sections: any[];
  };
  reading?: {
    duration: number;
    passages: any[];
  };
  writing?: {
    duration: number;
    task11?: any;
    task12?: any;
    task2?: any;
  };
  speaking?: {
    task1?: any;
    task2?: any;
    task3?: any;
  };
}

export default function StudentCefrExamPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;
  
  const [mock, setMock] = useState<CefrMock | null>(null);
  const [currentSection, setCurrentSection] = useState<'listening' | 'reading' | 'writing' | 'speaking'>('listening');
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState({
    listeningAnswers: {} as any,
    readingAnswers: {} as any,
    writingAnswers: {} as any,
    speakingAnswers: {} as any,
  });

  useEffect(() => {
    fetchMockData();
  }, [mockId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && currentSection !== 'speaking') {
      handleNextSection();
    }
  }, [timeLeft]);

  const fetchMockData = async () => {
    try {
      const { data } = await api.get(`/api/cefr/student/mocks/${mockId}`);
      setMock(data.mock);
      setTimeLeft(data.mock.listening?.duration || 40 * 60);
    } catch (error) {
      toast.error('Mock ma\'lumotlari yuklab olinmadi');
      router.push(`/student/cefr/${mockId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/api/cefr/student/mocks/${mockId}/save`, answers);
      toast.success('Javoblar saqlandi');
    } catch (error) {
      toast.error('Javoblarni saqlab bo\'lmadi');
    } finally {
      setSaving(false);
    }
  };

  const handleNextSection = () => {
    if (currentSection === 'listening') {
      setCurrentSection('reading');
      setTimeLeft(mock?.reading?.duration || 60 * 60);
    } else if (currentSection === 'reading') {
      setCurrentSection('writing');
      setTimeLeft(mock?.writing?.duration || 80 * 60);
    } else if (currentSection === 'writing') {
      setCurrentSection('speaking');
      setTimeLeft(15 * 60);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/cefr/student/mocks/${mockId}/submit`, answers);
      toast.success('Imtihon tugatildi');
      router.push(`/student/cefr/${mockId}/result`);
    } catch (error) {
      toast.error('Imtihonni tugatib bo\'lmadi');
    } finally {
      setSubmitting(false);
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

  if (!mock) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/student/cefr/${mockId}`)}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{mock.title}</h1>
            <p className="text-gray-400 capitalize">{currentSection}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
            <Clock size={20} className="text-primary-500" />
            <span className="text-white font-mono text-xl">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCurrentSection('listening')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            currentSection === 'listening'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Listening
        </button>
        <button
          onClick={() => setCurrentSection('reading')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            currentSection === 'reading'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Reading
        </button>
        <button
          onClick={() => setCurrentSection('writing')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            currentSection === 'writing'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Writing
        </button>
        <button
          onClick={() => setCurrentSection('speaking')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            currentSection === 'speaking'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Speaking
        </button>
      </div>

      {/* Section Content */}
      <div className="glass-dark rounded-2xl p-8">
        {currentSection === 'listening' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Listening Section</h2>
            {mock.listening?.sections?.map((section: any, idx: number) => (
              <div key={idx} className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Section {idx + 1}</h3>
                {section.audioUrl && (
                  <audio controls className="w-full mb-4">
                    <source src={section.audioUrl} type="audio/mpeg" />
                  </audio>
                )}
                <p className="text-gray-400">
                  Audio faylni tinglang va savollarga javob bering.
                </p>
              </div>
            ))}
          </div>
        )}

        {currentSection === 'reading' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Reading Section</h2>
            {mock.reading?.passages?.map((passage: any, idx: number) => (
              <div key={idx} className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Passage {idx + 1}</h3>
                <div className="text-gray-300 mb-4 whitespace-pre-wrap">
                  {passage.text || 'Matn yuklanmagan...'}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentSection === 'writing' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Writing Section</h2>
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task 1.1</h3>
              <p className="text-gray-400 mb-4">
                {mock.writing?.task11?.instruction || 'Task 1.1 instruction yuklanmagan...'}
              </p>
              <textarea
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                placeholder="Javobingizni yozing..."
                value={answers.writingAnswers.task11 || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  writingAnswers: { ...answers.writingAnswers, task11: e.target.value }
                })}
              />
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task 1.2</h3>
              <p className="text-gray-400 mb-4">
                {mock.writing?.task12?.instruction || 'Task 1.2 instruction yuklanmagan...'}
              </p>
              <textarea
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                placeholder="Javobingizni yozing..."
                value={answers.writingAnswers.task12 || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  writingAnswers: { ...answers.writingAnswers, task12: e.target.value }
                })}
              />
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task 2</h3>
              <p className="text-gray-400 mb-4">
                {mock.writing?.task2?.prompt || 'Task 2 prompt yuklanmagan...'}
              </p>
              <textarea
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-48"
                placeholder="Javobingizni yozing..."
                value={answers.writingAnswers.task2 || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  writingAnswers: { ...answers.writingAnswers, task2: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {currentSection === 'speaking' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Speaking Section</h2>
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task 1</h3>
              <p className="text-gray-400 mb-4">
                {mock.speaking?.task1?.questions?.[0] || 'Savol yuklanmagan...'}
              </p>
              <textarea
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                placeholder="Javobingizni yozing..."
                value={answers.speakingAnswers.task1 || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  speakingAnswers: { ...answers.speakingAnswers, task1: e.target.value }
                })}
              />
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task 2</h3>
              <p className="text-gray-400 mb-4">
                {mock.speaking?.task2?.topic || 'Mavzu yuklanmagan...'}
              </p>
              <textarea
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                placeholder="Javobingizni yozing..."
                value={answers.speakingAnswers.task2 || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  speakingAnswers: { ...answers.speakingAnswers, task2: e.target.value }
                })}
              />
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task 3</h3>
              <p className="text-gray-400 mb-4">
                {mock.speaking?.task3?.topic || 'Mavzu yuklanmagan...'}
              </p>
              <textarea
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                placeholder="Javobingizni yozing..."
                value={answers.speakingAnswers.task3 || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  speakingAnswers: { ...answers.speakingAnswers, task3: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={() => {
              if (currentSection === 'reading') setCurrentSection('listening');
              else if (currentSection === 'writing') setCurrentSection('reading');
              else if (currentSection === 'speaking') setCurrentSection('writing');
            }}
            disabled={currentSection === 'listening'}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition disabled:opacity-50"
          >
            Orqaga
          </button>
          {currentSection === 'speaking' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Tugatilmoqda...' : 'Imtihonni tugatish'}
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={handleNextSection}
              className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
            >
              Keyingi qism
              <ArrowLeft size={20} className="rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
