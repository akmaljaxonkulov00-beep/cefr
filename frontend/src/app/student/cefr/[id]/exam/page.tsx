'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Clock, Save, Send, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import CefrSpeakingModule from '@/components/CefrSpeakingModule';
import CefrWritingModule from '@/components/CefrWritingModule';
import CefrReadingModule from '@/components/CefrReadingModule';
import CefrListeningModule from '@/components/CefrListeningModule';

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

  const [speakingAudioBlobs, setSpeakingAudioBlobs] = useState<Record<string, Blob>>({});
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const handleRecordingComplete = (partId: string, audioBlob: Blob) => {
    setSpeakingAudioBlobs(prev => ({ ...prev, [partId]: audioBlob }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Upload speaking audio blobs and get URLs
      const speakingAudioUrls: Record<string, string> = {};
      for (const [partId, blob] of Object.entries(speakingAudioBlobs)) {
        try {
          const formData = new FormData();
          formData.append('file', blob, `speaking-${partId}.webm`);
          const { data } = await api.post('/api/cefr/upload/audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          speakingAudioUrls[partId] = data.url;
        } catch (error) {
          console.error('Failed to upload audio:', error);
        }
      }

      const submitData = {
        ...answers,
        speakingAudioUrls,
      };

      await api.post(`/api/cefr/student/mocks/${mockId}/submit`, submitData);
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
    <div className="min-h-screen bg-[#0f172a] p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/student/cefr/${mockId}`)}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">{mock.title}</h1>
            <p className="text-gray-400 capitalize text-sm lg:text-base">{currentSection}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 rounded-xl flex-1 sm:flex-none">
            <Clock size={18} className="text-primary-500" />
            <span className="text-white font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition disabled:opacity-50 text-sm sm:text-base"
          >
            <Save size={18} />
            <span className="hidden sm:inline">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 sm:pb-0">
        <button
          onClick={() => setCurrentSection('listening')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
            currentSection === 'listening'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Listening
        </button>
        <button
          onClick={() => setCurrentSection('reading')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
            currentSection === 'reading'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Reading
        </button>
        <button
          onClick={() => setCurrentSection('writing')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
            currentSection === 'writing'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Writing
        </button>
        <button
          onClick={() => setCurrentSection('speaking')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
            currentSection === 'speaking'
              ? 'gradient-bg text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Speaking
        </button>
      </div>

      {/* Section Content */}
      <div className="glass-dark rounded-2xl p-4 sm:p-6 lg:p-8">
        {currentSection === 'listening' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Listening Section</h2>
            {mock.listening?.sections?.map((section: any, idx: number) => (
              <CefrListeningModule
                key={idx}
                audioUrl={section.audioUrl || ''}
                transcript={section.transcript}
                questions={section.questions || []}
                onAnswerChange={(questionId, answer) => {
                  setAnswers({
                    ...answers,
                    listeningAnswers: {
                      ...answers.listeningAnswers,
                      [`section${idx + 1}`]: {
                        ...answers.listeningAnswers[`section${idx + 1}`],
                    [questionId]: answer
                      }
                    }
                  });
                }}
                answers={answers.listeningAnswers[`section${idx + 1}`] || {}}
              />
            ))}
          </div>
        )}

        {currentSection === 'reading' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Reading Section</h2>
            {mock.reading?.passages?.map((passage: any, idx: number) => (
              <CefrReadingModule
                key={idx}
                passage={passage.text || 'Matn yuklanmagan...'}
                questions={passage.questions || []}
                onAnswerChange={(questionId, gapId, answer) => {
                  setAnswers({
                    ...answers,
                    readingAnswers: {
                      ...answers.readingAnswers,
                      [`passage${idx + 1}`]: {
                        ...answers.readingAnswers[`passage${idx + 1}`],
                        [questionId]: {
                          ...answers.readingAnswers[`passage${idx + 1}`]?.[questionId],
                          [gapId]: answer
                        }
                      }
                    }
                  });
                }}
                answers={answers.readingAnswers[`passage${idx + 1}`] || {}}
              />
            ))}
          </div>
        )}

        {currentSection === 'writing' && (
          <CefrWritingModule
            tasks={[
              {
                id: 'task11',
                taskNumber: 1,
                taskType: (mock.writing?.task11?.type || 'LETTER') as any,
                prompt: mock.writing?.task11?.instruction || '',
                bulletPoints: mock.writing?.task11?.bulletPoints || [],
                minWords: mock.writing?.task11?.minWords || 50,
                maxWords: mock.writing?.task11?.maxWords || 150,
                timeLimit: mock.writing?.duration || 20,
              },
              {
                id: 'task12',
                taskNumber: 1,
                taskType: (mock.writing?.task12?.type || 'EMAIL') as any,
                prompt: mock.writing?.task12?.instruction || '',
                bulletPoints: mock.writing?.task12?.bulletPoints || [],
                minWords: mock.writing?.task12?.minWords || 50,
                maxWords: mock.writing?.task12?.maxWords || 150,
                timeLimit: mock.writing?.duration || 20,
              },
              {
                id: 'task2',
                taskNumber: 2,
                taskType: (mock.writing?.task2?.type || 'ESSAY') as any,
                prompt: mock.writing?.task2?.prompt || '',
                bulletPoints: mock.writing?.task2?.bulletPoints || [],
                minWords: mock.writing?.task2?.minWords || 150,
                maxWords: mock.writing?.task2?.maxWords || 250,
                timeLimit: mock.writing?.duration || 40,
              },
            ]}
            onAnswerChange={(taskId, answer) => {
              setAnswers({
                ...answers,
                writingAnswers: { ...answers.writingAnswers, [taskId]: answer }
              });
            }}
            answers={answers.writingAnswers}
            level={mock.level}
          />
        )}

        {currentSection === 'speaking' && (
          <CefrSpeakingModule
            parts={[
              {
                id: 'task1',
                partNumber: 1,
                title: 'Task 1 - Shaxsiy savollar',
                description: mock.speaking?.task1?.description || 'Shaxsiy savollarga javob bering',
                questions: mock.speaking?.task1?.questions || [],
                preparationTime: mock.speaking?.task1?.prepTime || 30,
                responseTime: mock.speaking?.task1?.speakTime || 120,
              },
              {
                id: 'task2',
                partNumber: 2,
                title: 'Task 2 - Rasm tavsifi',
                description: mock.speaking?.task2?.description || 'Rasmni tasviring',
                questions: mock.speaking?.task2?.guidingQuestions || [],
                imageUrls: mock.speaking?.task2?.images || [],
                bulletPoints: mock.speaking?.task2?.bulletPoints || [],
                preparationTime: mock.speaking?.task2?.prepTime || 30,
                responseTime: mock.speaking?.task2?.speakTime || 180,
              },
              {
                id: 'task3',
                partNumber: 3,
                title: 'Task 3 - Muhokama',
                description: mock.speaking?.task3?.description || 'Muhokama qiling',
                questions: mock.speaking?.task3?.followUpQuestions || [],
                preparationTime: mock.speaking?.task3?.prepTime || 30,
                responseTime: mock.speaking?.task3?.speakTime || 360,
              },
            ]}
            onRecordingComplete={handleRecordingComplete}
            level={mock.level}
          />
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={() => {
              if (currentSection === 'reading') setCurrentSection('listening');
              else if (currentSection === 'writing') setCurrentSection('reading');
              else if (currentSection === 'speaking') setCurrentSection('writing');
            }}
            disabled={currentSection === 'listening'}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition disabled:opacity-50 min-h-[44px]"
          >
            Orqaga
          </button>
          {currentSection === 'speaking' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Tugatilmoqda...' : 'Imtihonni tugatish'}
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={handleNextSection}
              className="flex items-center justify-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 min-h-[44px]"
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
