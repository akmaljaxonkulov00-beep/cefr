'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, ArrowRight, Upload, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { saveAdminDraft, loadAdminDraft, clearAdminDraft } from '@/lib/exam-persistence';

export default function CreateCefrPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mockId, setMockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listening' | 'reading' | 'writing' | 'speaking'>('listening');
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    title: '',
    level: 'B1' as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
    description: '',
    duration: 180,
    price: 0,
    isPaid: false,
  });

  const [listening, setListening] = useState({
    duration: 40,
    sections: [] as any[],
  });

  const [reading, setReading] = useState({
    duration: 60,
    passages: [] as any[],
  });

  const [writing, setWriting] = useState({
    duration: 80,
    task11: { type: 'message', context: '', instruction: '', minWords: 40, maxWords: 60 },
    task12: { type: 'email', context: '', instruction: '', points: ['', '', ''], minWords: 100, maxWords: 150 },
    task2: { type: 'essay', prompt: '', minWords: 200, maxWords: 250 },
    aiWeights: { taskResponse: 25, coherence: 25, lexical: 25, grammar: 25 },
  });

  const [speaking, setSpeaking] = useState({
    task1: { questions: [] as string[], duration: 4 },
    task2: { images: [] as string[], guidingQuestions: [] as string[], prepTime: 30, speakTime: 180 },
    task3: { topic: '', followUpQuestions: [] as string[], duration: 6 },
  });

  // Auto-save form state every 60 seconds
  useEffect(() => {
    const autoSave = setInterval(() => {
      const draftId = mockId || 'new';
      saveAdminDraft(draftId, {
        basicInfo,
        listening,
        reading,
        writing,
        speaking,
        step,
      });
    }, 60000);

    return () => clearInterval(autoSave);
  }, [basicInfo, listening, reading, writing, speaking, step, mockId]);

  // Load draft on mount
  useEffect(() => {
    const draftId = 'new';
    const draft = loadAdminDraft(draftId);
    if (draft && !mockId) {
      setShowDraftBanner(true);
    }
  }, [mockId]);

  const loadDraft = () => {
    const draft = loadAdminDraft('new');
    if (draft) {
      setBasicInfo(draft.basicInfo || basicInfo);
      setListening(draft.listening || listening);
      setReading(draft.reading || reading);
      setWriting(draft.writing || writing);
      setSpeaking(draft.speaking || speaking);
      setStep(draft.step || 1);
      setShowDraftBanner(false);
      toast.success('Qoralama yuklandi');
    }
  };

  const discardDraft = () => {
    clearAdminDraft('new');
    setShowDraftBanner(false);
  };

  const handleFileUpload = async (file: File, type: 'audio' | 'file' | 'image' | 'pdf') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'audio' ? '/api/cefr/upload/audio' : type === 'file' ? '/api/cefr/upload/file' : type === 'pdf' ? '/api/cefr/upload/pdf' : '/api/cefr/upload/image';
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error) {
      toast.error('Fayl yuklanmadi');
      return null;
    }
  };

  const createMock = async () => {
    try {
      const { data } = await api.post('/api/cefr/mocks', basicInfo);
      setMockId(data.id);
      return data.id;
    } catch (error) {
      toast.error('Mock yaratilmadi');
      return null;
    }
  };

  const saveListening = async () => {
    if (!mockId) return;
    try {
      await api.post(`/api/cefr/mocks/${mockId}/listening`, listening);
      toast.success('Listening saqlandi');
    } catch (error) {
      toast.error('Listening saqlanmadi');
    }
  };

  const saveReading = async () => {
    if (!mockId) return;
    try {
      await api.post(`/api/cefr/mocks/${mockId}/reading`, reading);
      toast.success('Reading saqlandi');
    } catch (error) {
      toast.error('Reading saqlanmadi');
    }
  };

  const saveWriting = async () => {
    if (!mockId) return;
    try {
      await api.post(`/api/cefr/mocks/${mockId}/writing`, writing);
      toast.success('Writing saqlandi');
    } catch (error) {
      toast.error('Writing saqlanmadi');
    }
  };

  const saveSpeaking = async () => {
    if (!mockId) return;
    try {
      await api.post(`/api/cefr/mocks/${mockId}/speaking`, speaking);
      toast.success('Speaking saqlandi');
    } catch (error) {
      toast.error('Speaking saqlanmadi');
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!basicInfo.title) {
        toast.error('Nomini kiriting');
        return;
      }
      setLoading(true);
      const id = await createMock();
      setLoading(false);
      if (!id) return;
    } else if (step === 2) {
      setLoading(true);
      await saveListening();
      await saveReading();
      await saveWriting();
      await saveSpeaking();
      setLoading(false);
    } else if (step === 3) {
      // Price and certificate settings
    } else if (step === 4) {
      // Publish
      clearAdminDraft(mockId || 'new');
      toast.success('CEFR mock muvaffaqiyatli yaratildi');
      router.push('/admin/cefr');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push('/admin/cefr');
  };

  const addListeningPart = () => {
    setListening({
      ...listening,
      sections: [...listening.sections, { audioUrl: '', audioPlaysTwice: true, questions: [] }],
    });
  };

  const addReadingPart = () => {
    setReading({
      ...reading,
      passages: [...reading.passages, { type: 'matching', content: '', questions: [] }],
    });
  };

  const addSpeakingQuestion = (task: 'task1' | 'task3') => {
    if (task === 'task1') {
      setSpeaking({
        ...speaking,
        task1: { ...speaking.task1, questions: [...speaking.task1.questions, ''] },
      });
    } else {
      setSpeaking({
        ...speaking,
        task3: { ...speaking.task3, followUpQuestions: [...speaking.task3.followUpQuestions, ''] },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Draft Banner */}
          {showDraftBanner && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-yellow-400 font-medium">Saqlangan qoralama topildi</p>
                <p className="text-gray-400 text-sm">Oxinchi saqlangan ma'lumotlar yuklanishi mumkin</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadDraft}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  Davomini yuklash
                </button>
                <button
                  onClick={discardDraft}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
                >
                  Yangi boshlash
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Yangi CEFR Mock</h1>
              <p className="text-gray-400">4 qadamda CEFR mock yaratish</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    step >= s
                      ? 'gradient-bg text-white'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      step > s ? 'gradient-bg' : 'bg-white/5'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="glass-dark rounded-2xl p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Asosiy ma'lumotlar</h2>
                <div>
                  <label className="block text-gray-300 mb-2">Mock nomi</label>
                  <input
                    type="text"
                    value={basicInfo.title}
                    onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                    placeholder="CEFR Mock Test 1"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Daraja</label>
                  <select
                    value={basicInfo.level}
                    onChange={(e) => setBasicInfo({ ...basicInfo, level: e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Davomiylik (daqiqa)</label>
                  <input
                    type="number"
                    value={basicInfo.duration}
                    onChange={(e) => setBasicInfo({ ...basicInfo, duration: parseInt(e.target.value) || 180 })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                    placeholder="180"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Tavsif</label>
                  <textarea
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                    placeholder="Mock haqida qisqacha ma'lumot..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Narxi (UZS)</label>
                  <input
                    type="number"
                    value={basicInfo.price}
                    onChange={(e) => setBasicInfo({ ...basicInfo, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Pullami?</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={basicInfo.isPaid}
                      onChange={(e) => setBasicInfo({ ...basicInfo, isPaid: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-gray-300">Ha, bu mock pullik</span>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Bo'limlar</h2>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab('listening')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      activeTab === 'listening'
                        ? 'gradient-bg text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    🎧 Listening
                  </button>
                  <button
                    onClick={() => setActiveTab('reading')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      activeTab === 'reading'
                        ? 'gradient-bg text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    📖 Reading
                  </button>
                  <button
                    onClick={() => setActiveTab('writing')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      activeTab === 'writing'
                        ? 'gradient-bg text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    ✍️ Writing
                  </button>
                  <button
                    onClick={() => setActiveTab('speaking')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      activeTab === 'speaking'
                        ? 'gradient-bg text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    🗣️ Speaking
                  </button>
                </div>

                {activeTab === 'listening' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Davomiylik (daqiqa)</label>
                      <input
                        type="number"
                        value={listening.duration}
                        onChange={(e) => setListening({ ...listening, duration: parseInt(e.target.value) || 40 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                    <button
                      onClick={addListeningPart}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <Plus size={16} />
                      Qism qo'shish
                    </button>
                    {listening.sections.map((part, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Qism {idx + 1}</span>
                          <button
                            onClick={() => {
                              const newSections = [...listening.sections];
                              newSections.splice(idx, 1);
                              setListening({ ...listening, sections: newSections });
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Audio URL"
                          value={part.audioUrl}
                          onChange={(e) => {
                            const newSections = [...listening.sections];
                            newSections[idx].audioUrl = e.target.value;
                            setListening({ ...listening, sections: newSections });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                        <label className="flex items-center gap-2 text-gray-300 text-sm">
                          <input
                            type="checkbox"
                            checked={part.audioPlaysTwice}
                            onChange={(e) => {
                              const newSections = [...listening.sections];
                              newSections[idx].audioPlaysTwice = e.target.checked;
                              setListening({ ...listening, sections: newSections });
                            }}
                          />
                          Audio 2 marta ijro etiladi
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reading' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Davomiylik (daqiqa)</label>
                      <input
                        type="number"
                        value={reading.duration}
                        onChange={(e) => setReading({ ...reading, duration: parseInt(e.target.value) || 60 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                    <button
                      onClick={addReadingPart}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <Plus size={16} />
                      Qism qo'shish
                    </button>
                    {reading.passages.map((part, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Qism {idx + 1}</span>
                          <button
                            onClick={() => {
                              const newPassages = [...reading.passages];
                              newPassages.splice(idx, 1);
                              setReading({ ...reading, passages: newPassages });
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          placeholder="Matn..."
                          value={part.content}
                          onChange={(e) => {
                            const newPassages = [...reading.passages];
                            newPassages[idx].content = e.target.value;
                            setReading({ ...reading, passages: newPassages });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-24"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'writing' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-2">Davomiylik (daqiqa)</label>
                      <input
                        type="number"
                        value={writing.duration}
                        onChange={(e) => setWriting({ ...writing, duration: parseInt(e.target.value) || 80 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Task 1.1</h3>
                      <div>
                        <label className="block text-gray-300 mb-2">Topshiriq turi</label>
                        <select
                          value={writing.task11.type}
                          onChange={(e) => setWriting({ ...writing, task11: { ...writing.task11, type: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        >
                          <option value="message">Xabar</option>
                          <option value="note">Eslatma</option>
                          <option value="proposal">Taklif</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Kontekst</label>
                        <textarea
                          value={writing.task11.context}
                          onChange={(e) => setWriting({ ...writing, task11: { ...writing.task11, context: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-24"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Ko'rsatma</label>
                        <textarea
                          value={writing.task11.instruction}
                          onChange={(e) => setWriting({ ...writing, task11: { ...writing.task11, instruction: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-24"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Task 1.2</h3>
                      <div>
                        <label className="block text-gray-300 mb-2">Topshiriq turi</label>
                        <select
                          value={writing.task12.type}
                          onChange={(e) => setWriting({ ...writing, task12: { ...writing.task12, type: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        >
                          <option value="email">Rasmiy email</option>
                          <option value="letter">Norasmiy xat</option>
                          <option value="application">Ariza</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Kontekst</label>
                        <textarea
                          value={writing.task12.context}
                          onChange={(e) => setWriting({ ...writing, task12: { ...writing.task12, context: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-24"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Nuqtalar</label>
                        {writing.task12.points.map((point, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Nuqta ${idx + 1}`}
                            value={point}
                            onChange={(e) => {
                              const newPoints = [...writing.task12.points];
                              newPoints[idx] = e.target.value;
                              setWriting({ ...writing, task12: { ...writing.task12, points: newPoints } });
                            }}
                            className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Task 2</h3>
                      <div>
                        <label className="block text-gray-300 mb-2">Topshiriq turi</label>
                        <select
                          value={writing.task2.type}
                          onChange={(e) => setWriting({ ...writing, task2: { ...writing.task2, type: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        >
                          <option value="essay">Esse</option>
                          <option value="article">Maqola</option>
                          <option value="report">Hisobot</option>
                          <option value="review">Sharh</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Mavzu</label>
                        <textarea
                          value={writing.task2.prompt}
                          onChange={(e) => setWriting({ ...writing, task2: { ...writing.task2, prompt: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-32"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'speaking' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Task 1 - Shaxsiy savollar</h3>
                      <div>
                        <label className="block text-gray-300 mb-2">Davomiylik (daqiqa)</label>
                        <input
                          type="number"
                          value={speaking.task1.duration}
                          onChange={(e) => setSpeaking({ ...speaking, task1: { ...speaking.task1, duration: parseInt(e.target.value) || 4 } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        />
                      </div>
                      <button
                        onClick={() => addSpeakingQuestion('task1')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                      >
                        <Plus size={16} />
                        Savol qo'shish
                      </button>
                      {speaking.task1.questions.map((q, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Savol ${idx + 1}`}
                          value={q}
                          onChange={(e) => {
                            const newQuestions = [...speaking.task1.questions];
                            newQuestions[idx] = e.target.value;
                            setSpeaking({ ...speaking, task1: { ...speaking.task1, questions: newQuestions } });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Task 2 - Rasm tavsifi</h3>
                      <div>
                        <label className="block text-gray-300 mb-2">Tayyorlanish vaqti (sekund)</label>
                        <input
                          type="number"
                          value={speaking.task2.prepTime}
                          onChange={(e) => setSpeaking({ ...speaking, task2: { ...speaking.task2, prepTime: parseInt(e.target.value) || 30 } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Gapirish vaqti (sekund)</label>
                        <input
                          type="number"
                          value={speaking.task2.speakTime}
                          onChange={(e) => setSpeaking({ ...speaking, task2: { ...speaking.task2, speakTime: parseInt(e.target.value) || 180 } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Yo'naltiruvchi savollar</label>
                        {speaking.task2.guidingQuestions.map((q, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Savol ${idx + 1}`}
                            value={q}
                            onChange={(e) => {
                              const newQuestions = [...speaking.task2.guidingQuestions];
                              newQuestions[idx] = e.target.value;
                              setSpeaking({ ...speaking, task2: { ...speaking.task2, guidingQuestions: newQuestions } });
                            }}
                            className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Task 3 - Muhokama</h3>
                      <div>
                        <label className="block text-gray-300 mb-2">Davomiylik (daqiqa)</label>
                        <input
                          type="number"
                          value={speaking.task3.duration}
                          onChange={(e) => setSpeaking({ ...speaking, task3: { ...speaking.task3, duration: parseInt(e.target.value) || 6 } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Mavzu</label>
                        <textarea
                          value={speaking.task3.topic}
                          onChange={(e) => setSpeaking({ ...speaking, task3: { ...speaking.task3, topic: e.target.value } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition h-24"
                        />
                      </div>
                      <button
                        onClick={() => addSpeakingQuestion('task3')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                      >
                        <Plus size={16} />
                        Qo'shimcha savol qo'shish
                      </button>
                      {speaking.task3.followUpQuestions.map((q, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Savol ${idx + 1}`}
                          value={q}
                          onChange={(e) => {
                            const newQuestions = [...speaking.task3.followUpQuestions];
                            newQuestions[idx] = e.target.value;
                            setSpeaking({ ...speaking, task3: { ...speaking.task3, followUpQuestions: newQuestions } });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Narx va Sertifikat</h2>
                <div>
                  <label className="block text-gray-300 mb-2">Narxi (UZS)</label>
                  <input
                    type="number"
                    value={basicInfo.price}
                    onChange={(e) => setBasicInfo({ ...basicInfo, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                    placeholder="0 = bepul"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">O'tish bali (%)</label>
                  <input
                    type="number"
                    value={60}
                    disabled
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 focus:outline-none transition"
                  />
                  <p className="text-gray-500 text-sm mt-1">CEFR darajasi avtomatik hisoblanadi</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Ko'rish va Nashr</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Listening</h3>
                    <p className="text-gray-400">{listening.sections.length} qism</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Reading</h3>
                    <p className="text-gray-400">{reading.passages.length} qism</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Writing</h3>
                    <p className="text-gray-400">3 topshiriq</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Speaking</h3>
                    <p className="text-gray-400">3 topshiriq</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition"
              >
                <ArrowLeft size={20} />
                Orqaga
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Saqlanmoqda...' : step === 4 ? 'Nashr qilish' : 'Keyingi'}
                {step < 4 && <ArrowRight size={20} />}
                {step === 4 && <Save size={20} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
