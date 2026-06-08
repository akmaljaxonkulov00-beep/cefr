'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, ArrowRight, Upload, Save, X, FileText, Music, BookOpen, PenTool, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

export default function CreateIeltsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mockId, setMockId] = useState<string | null>(null);
  const [usePdfUpload, setUsePdfUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsedPdfData, setParsedPdfData] = useState<any>(null);

  const [basicInfo, setBasicInfo] = useState({
    title: '',
    type: 'Academic' as 'Academic' | 'General',
    level: 'B2' as 'B1' | 'B2' | 'C1' | 'C2',
    description: '',
    duration: 175,
    price: 0,
    isPaid: false,
    uploadMode: 'manual' as 'manual' | 'pdf', // manual entry or PDF upload
  });

  const [listening, setListening] = useState({
    duration: 40,
    audioUrl: '',
    useSingleAudio: true,
    audioUploadMode: 'single' as 'single' | 'separate', // single audio for all sections or separate per section
    sections: [
      { sectionNumber: 1, audioUrl: '', audioStart: 0, audioEnd: 0, title: 'Section 1', instructions: '', questionType: 'fill_blank', maxWords: 2, questions: [] as any[] },
      { sectionNumber: 2, audioUrl: '', audioStart: 0, audioEnd: 0, title: 'Section 2', instructions: '', questionType: 'multiple_choice', maxWords: 0, questions: [] as any[] },
      { sectionNumber: 3, audioUrl: '', audioStart: 0, audioEnd: 0, title: 'Section 3', instructions: '', questionType: 'multiple_choice', maxWords: 0, questions: [] as any[] },
      { sectionNumber: 4, audioUrl: '', audioStart: 0, audioEnd: 0, title: 'Section 4', instructions: '', questionType: 'fill_blank', maxWords: 1, questions: [] as any[] },
    ] as any[],
  });

  const [reading, setReading] = useState({
    duration: 60,
    passages: [
      { passageNumber: 1, title: '', text: '', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], parts: [] as any[] },
      { passageNumber: 2, title: '', text: '', sections: [], parts: [] as any[] },
      { passageNumber: 3, title: '', text: '', sections: [], parts: [] as any[] },
    ] as any[],
  });

  const [writing, setWriting] = useState({
    duration: 60,
    uploadMode: 'manual' as 'manual' | 'file',
    task1: { instructions: '', imageUrl: '', tableData: null, minWords: 150, timeRecommended: 20 },
    task2: { instructions: '', type: 'agree_disagree', minWords: 250, timeRecommended: 40 },
  });

  const [speaking, setSpeaking] = useState({
    duration: 15,
    uploadMode: 'manual' as 'manual' | 'file',
    part1: { topic: '', questions: [] as string[] },
    part2: { cueCard: '', bulletPoints: [] as string[], prepTime: 60, speakTime: 120 },
    part3: { topic: '', questions: [] as string[] },
  });

  const handleFileUpload = async (file: File, type: 'audio' | 'file' | 'image' | 'pdf') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'audio' ? '/ielts/upload/audio' : 
                       type === 'file' ? '/ielts/upload/file' : 
                       type === 'image' ? '/ielts/upload/image' : 
                       '/ielts/upload/pdf';
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error) {
      toast.error('Fayl yuklanmadi');
      return null;
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setLoading(true);
    const result = await handleFileUpload(pdfFile, 'pdf');
    setLoading(false);
    if (result?.success) {
      setParsedPdfData(result.data);
      toast.success('PDF muvaffaqiyatli parse qilindi');
    }
  };

  const createMock = async () => {
    try {
      const { data } = await api.post('/ielts/mocks', basicInfo);
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
      await api.post(`/ielts/mocks/${mockId}/listening`, listening);
      toast.success('Listening saqlandi');
    } catch (error) {
      toast.error('Listening saqlanmadi');
    }
  };

  const saveReading = async () => {
    if (!mockId) return;
    try {
      await api.post(`/ielts/mocks/${mockId}/reading`, reading);
      toast.success('Reading saqlandi');
    } catch (error) {
      toast.error('Reading saqlanmadi');
    }
  };

  const saveWriting = async () => {
    if (!mockId) return;
    try {
      await api.post(`/ielts/mocks/${mockId}/writing`, writing);
      toast.success('Writing saqlandi');
    } catch (error) {
      toast.error('Writing saqlanmadi');
    }
  };

  const saveSpeaking = async () => {
    if (!mockId) return;
    try {
      await api.post(`/ielts/mocks/${mockId}/speaking`, speaking);
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
      setLoading(false);
    } else if (step === 3) {
      setLoading(true);
      await saveReading();
      setLoading(false);
    } else if (step === 4) {
      setLoading(true);
      await saveWriting();
      setLoading(false);
    } else if (step === 5) {
      setLoading(true);
      await saveSpeaking();
      setLoading(false);
      toast.success('IELTS mock muvaffaqiyatli yaratildi');
      router.push('/admin/ielts');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push('/admin/ielts');
  };

  const addListeningQuestion = (sectionIndex: number) => {
    const newSections = [...listening.sections];
    const section = newSections[sectionIndex];
    const nextQuestionNum = section.questions.length + 1;
    section.questions.push({
      id: `q${section.sectionNumber}_${nextQuestionNum}`,
      number: nextQuestionNum,
      text: '',
      type: section.questionType,
      correctAnswer: '',
      options: section.questionType === 'multiple_choice' ? ['A', 'B', 'C'] : [],
    });
    setListening({ ...listening, sections: newSections });
  };

  const addReadingPart = (passageIndex: number) => {
    const newPassages = [...reading.passages];
    const passage = newPassages[passageIndex];
    const nextPartNum = passage.parts.length + 1;
    passage.parts.push({
      partTitle: `Questions ${nextPartNum}`,
      type: 'heading_match',
      instructions: '',
      headings: [],
      categories: [],
      questions: [],
    });
    setReading({ ...reading, passages: newPassages });
  };

  const addSpeakingQuestion = (part: 'part1' | 'part3') => {
    if (part === 'part1') {
      setSpeaking({
        ...speaking,
        part1: { ...speaking.part1, questions: [...speaking.part1.questions, ''] },
      });
    } else {
      setSpeaking({
        ...speaking,
        part3: { ...speaking.part3, questions: [...speaking.part3.questions, ''] },
      });
    }
  };

  const addSpeakingBulletPoint = () => {
    setSpeaking({
      ...speaking,
      part2: { ...speaking.part2, bulletPoints: [...speaking.part2.bulletPoints, ''] },
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Yangi IELTS Mock</h1>
              <p className="text-gray-400">5 qadamda IELTS mock yaratish</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
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
                {s < 5 && (
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
                
                <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                  <label className="text-gray-300 font-medium">Mock yaratish usuli:</label>
                  <button
                    onClick={() => setBasicInfo({ ...basicInfo, uploadMode: 'manual' })}
                    className={`px-4 py-2 rounded-lg transition ${basicInfo.uploadMode === 'manual' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    ✍️ Qo'lda kiritish
                  </button>
                  <button
                    onClick={() => setBasicInfo({ ...basicInfo, uploadMode: 'pdf' })}
                    className={`px-4 py-2 rounded-lg transition ${basicInfo.uploadMode === 'pdf' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    📄 PDF yuklash
                  </button>
                </div>

                {basicInfo.uploadMode === 'pdf' && (
                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                    <label className="block text-gray-300 mb-2">PDF fayl yuklash</label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPdfFile(file);
                              const result = await handleFileUpload(file, 'pdf');
                              if (result?.success) {
                                setParsedPdfData(result.data);
                                toast.success('PDF muvaffaqiyatli parse qilindi');
                              }
                            }
                          }}
                          className="w-full bg-white/10 border border-gray-700 rounded-xl px-4 py-3 text-white"
                        />
                      </div>
                      {parsedPdfData && (
                        <button
                          onClick={() => {
                            if (parsedPdfData) {
                              setBasicInfo({ ...basicInfo, title: parsedPdfData.title || basicInfo.title });
                              toast.success('PDF ma\'lumotlari qo\'llandi');
                            }
                          }}
                          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                        >
                          Ma'lumotlarni qo'llash
                        </button>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">PDF faylini yuklang, tizim avtomatik ravishda ma'lumotlarni ajratib oladi.</p>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-2">Mock nomi</label>
                  <input
                    type="text"
                    value={basicInfo.title}
                    onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                    placeholder="IELTS Academic Mock Test 1"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Turi</label>
                  <select
                    value={basicInfo.type}
                    onChange={(e) => setBasicInfo({ ...basicInfo, type: e.target.value as 'Academic' | 'General' })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                  >
                    <option value="Academic">Academic</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Daraja</label>
                  <select
                    value={basicInfo.level}
                    onChange={(e) => setBasicInfo({ ...basicInfo, level: e.target.value as 'B1' | 'B2' | 'C1' | 'C2' })}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                  >
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
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Music size={24} />
                  Listening (40 daqiqa)
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4 p-4 bg-white/5 rounded-xl">
                    <label className="text-gray-300 font-medium">Audio yuklash usuli:</label>
                    <button
                      onClick={() => setListening({ ...listening, audioUploadMode: 'single' })}
                      className={`px-4 py-2 rounded-lg transition ${listening.audioUploadMode === 'single' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                      📁 Bitta audio (barcha sectionlar uchun)
                    </button>
                    <button
                      onClick={() => setListening({ ...listening, audioUploadMode: 'separate' })}
                      className={`px-4 py-2 rounded-lg transition ${listening.audioUploadMode === 'separate' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                      🎵 Har section uchun alohida audio
                    </button>
                  </div>

                  {listening.audioUploadMode === 'single' && (
                    <div className="bg-white/5 rounded-xl p-6 space-y-4">
                      <label className="block text-gray-300 mb-2">Umumiy audio fayli yuklash</label>
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={listening.audioUrl}
                          onChange={(e) => setListening({ ...listening, audioUrl: e.target.value })}
                          className="flex-1 bg-white/10 border border-gray-700 rounded-xl px-4 py-3 text-white"
                          placeholder="Audio URL yoki fayl yuklang..."
                        />
                        <label className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 transition">
                          <Upload size={18} />
                          <span>Yuklash</span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const result = await handleFileUpload(file, 'audio');
                                if (result?.url) {
                                  setListening({ ...listening, audioUrl: result.url });
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-gray-400 text-sm">Bu audio barcha 4 section uchun ishlatiladi. Har section uchun boshlang'ich va tugash vaqtini belgilang.</p>
                    </div>
                  )}

                  {listening.sections.map((section, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Section {section.sectionNumber}</h3>
                        <select
                          value={section.questionType}
                          onChange={(e) => {
                            const newSections = [...listening.sections];
                            newSections[idx].questionType = e.target.value;
                            setListening({ ...listening, sections: newSections });
                          }}
                          className="bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="fill_blank">Fill Blank</option>
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                          <option value="matching">Matching</option>
                          <option value="table">Table</option>
                        </select>
                      </div>

                      {listening.audioUploadMode === 'separate' && (
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm">Section audio fayli yuklash</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={section.audioUrl}
                              onChange={(e) => {
                                const newSections = [...listening.sections];
                                newSections[idx].audioUrl = e.target.value;
                                setListening({ ...listening, sections: newSections });
                              }}
                              className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Audio URL yoki fayl yuklang..."
                            />
                            <label className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition text-sm">
                              <Upload size={14} />
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const result = await handleFileUpload(file, 'audio');
                                    if (result?.url) {
                                      const newSections = [...listening.sections];
                                      newSections[idx].audioUrl = result.url;
                                      setListening({ ...listening, sections: newSections });
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-gray-300 mb-2 text-sm">Yo'riqnoma</label>
                        <textarea
                          value={section.instructions}
                          onChange={(e) => {
                            const newSections = [...listening.sections];
                            newSections[idx].instructions = e.target.value;
                            setListening({ ...listening, sections: newSections });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-20"
                          placeholder="Complete the flow chart below..."
                        />
                      </div>

                      {section.questionType === 'fill_blank' && (
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm">Max so'z</label>
                          <select
                            value={section.maxWords}
                            onChange={(e) => {
                              const newSections = [...listening.sections];
                              newSections[idx].maxWords = parseInt(e.target.value);
                              setListening({ ...listening, sections: newSections });
                            }}
                            className="bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value={1}>ONE WORD</option>
                            <option value={2}>TWO WORDS</option>
                            <option value={3}>ONE WORD OR NUMBER</option>
                            <option value={4}>TWO WORDS OR NUMBER</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-gray-300 text-sm">Savollar ({section.questions.length})</label>
                          <button
                            onClick={() => addListeningQuestion(idx)}
                            className="text-primary-400 text-sm hover:text-primary-300"
                          >
                            + Savol qo'shish
                          </button>
                        </div>
                        {section.questions.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="bg-white/5 rounded-lg p-3 mb-2">
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => {
                                const newSections = [...listening.sections];
                                newSections[idx].questions[qIdx].text = e.target.value;
                                setListening({ ...listening, sections: newSections });
                              }}
                              className="w-full bg-white/10 border border-gray-700 rounded px-3 py-2 text-white text-sm mb-2"
                              placeholder={`Savol ${q.number}`}
                            />
                            <input
                              type="text"
                              value={q.correctAnswer}
                              onChange={(e) => {
                                const newSections = [...listening.sections];
                                newSections[idx].questions[qIdx].correctAnswer = e.target.value;
                                setListening({ ...listening, sections: newSections });
                              }}
                              className="w-full bg-white/10 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                              placeholder="To'g'ri javob"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen size={24} />
                  Reading (60 daqiqa)
                </h2>
                
                {reading.passages.map((passage, pIdx) => (
                  <div key={pIdx} className="bg-white/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Passage {passage.passageNumber}</h3>
                    
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Sarlavha</label>
                      <input
                        type="text"
                        value={passage.title}
                        onChange={(e) => {
                          const newPassages = [...reading.passages];
                          newPassages[pIdx].title = e.target.value;
                          setReading({ ...reading, passages: newPassages });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Passage sarlavhasi..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Matn</label>
                      <textarea
                        value={passage.text}
                        onChange={(e) => {
                          const newPassages = [...reading.passages];
                          newPassages[pIdx].text = e.target.value;
                          setReading({ ...reading, passages: newPassages });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-40"
                        placeholder="Passage matni..."
                      />
                    </div>

                    {passage.passageNumber === 1 && (
                      <div>
                        <label className="block text-gray-300 mb-2 text-sm">Sections (heading match uchun)</label>
                        <input
                          type="text"
                          value={passage.sections.join(', ')}
                          onChange={(e) => {
                            const newPassages = [...reading.passages];
                            newPassages[pIdx].sections = e.target.value.split(',').map(s => s.trim());
                            setReading({ ...reading, passages: newPassages });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                          placeholder="A, B, C, D, E, F, G"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 text-sm">Partlar ({passage.parts.length})</label>
                        <button
                          onClick={() => addReadingPart(pIdx)}
                          className="text-primary-400 text-sm hover:text-primary-300"
                        >
                          + Part qo'shish
                        </button>
                      </div>
                      {passage.parts.map((part: any, partIdx: number) => (
                        <div key={partIdx} className="bg-white/5 rounded-lg p-3 mb-2">
                          <input
                            type="text"
                            value={part.partTitle}
                            onChange={(e) => {
                              const newPassages = [...reading.passages];
                              newPassages[pIdx].parts[partIdx].partTitle = e.target.value;
                              setReading({ ...reading, passages: newPassages });
                            }}
                            className="w-full bg-white/10 border border-gray-700 rounded px-3 py-2 text-white text-sm mb-2"
                            placeholder="Part nomi"
                          />
                          <select
                            value={part.type}
                            onChange={(e) => {
                              const newPassages = [...reading.passages];
                              newPassages[pIdx].parts[partIdx].type = e.target.value;
                              setReading({ ...reading, passages: newPassages });
                            }}
                            className="w-full bg-white/10 border border-gray-700 rounded px-3 py-2 text-white text-sm mb-2"
                          >
                            <option value="heading_match">Heading Match</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="matching">Matching</option>
                            <option value="true_false_ng">True/False/Not Given</option>
                            <option value="fill_blank">Fill Blank</option>
                            <option value="sentence_completion">Sentence Completion</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <PenTool size={24} />
                  Writing (60 daqiqa)
                </h2>
                
                <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                  <label className="text-gray-300 font-medium">Writing yuklash usuli:</label>
                  <button
                    onClick={() => setWriting({ ...writing, uploadMode: 'manual' })}
                    className={`px-4 py-2 rounded-lg transition ${writing.uploadMode === 'manual' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    ✍️ Qo'lda kiritish
                  </button>
                  <button
                    onClick={() => toast('Fayl yuklash tez orada qo\'shiladi')}
                    className={`px-4 py-2 rounded-lg transition ${writing.uploadMode === 'file' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    📄 Fayl yuklash (Tez orada)
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Task 1 (20 daqiqa, min 150 so'z)</h3>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Yo'riqnoma</label>
                      <textarea
                        value={writing.task1.instructions}
                        onChange={(e) => setWriting({ ...writing, task1: { ...writing.task1, instructions: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-24"
                        placeholder="The table below compares actual and predicted figures..."
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Rasm URL</label>
                      <input
                        type="text"
                        value={writing.task1.imageUrl}
                        onChange={(e) => setWriting({ ...writing, task1: { ...writing.task1, imageUrl: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Task 2 (40 daqiqa, min 250 so'z)</h3>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Essay turi</label>
                      <select
                        value={writing.task2.type}
                        onChange={(e) => setWriting({ ...writing, task2: { ...writing.task2, type: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="agree_disagree">Agree/Disagree</option>
                        <option value="discuss_views">Discuss Both Views</option>
                        <option value="problem_solution">Problem/Solution</option>
                        <option value="advantage_disadvantage">Advantage/Disadvantage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Topshiriq</label>
                      <textarea
                        value={writing.task2.instructions}
                        onChange={(e) => setWriting({ ...writing, task2: { ...writing.task2, instructions: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-24"
                        placeholder="Student learn far more with their teachers than other sources..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Mic size={24} />
                  Speaking (15 daqiqa)
                </h2>
                
                <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                  <label className="text-gray-300 font-medium">Speaking yuklash usuli:</label>
                  <button
                    onClick={() => setSpeaking({ ...speaking, uploadMode: 'manual' })}
                    className={`px-4 py-2 rounded-lg transition ${speaking.uploadMode === 'manual' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    ✍️ Qo'lda kiritish
                  </button>
                  <button
                    onClick={() => toast('Fayl yuklash tez orada qo\'shiladi')}
                    className={`px-4 py-2 rounded-lg transition ${speaking.uploadMode === 'file' ? 'gradient-bg text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    📄 Fayl yuklash (Tez orada)
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Part 1 - Introduction & Interview</h3>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Mavzu</label>
                      <input
                        type="text"
                        value={speaking.part1.topic}
                        onChange={(e) => setSpeaking({ ...speaking, part1: { ...speaking.part1, topic: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Celebrity"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 text-sm">Savollar ({speaking.part1.questions.length})</label>
                        <button
                          onClick={() => addSpeakingQuestion('part1')}
                          className="text-primary-400 text-sm hover:text-primary-300"
                        >
                          + Savol qo'shish
                        </button>
                      </div>
                      {speaking.part1.questions.map((q, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Savol ${idx + 1}`}
                          value={q}
                          onChange={(e) => {
                            const newQuestions = [...speaking.part1.questions];
                            newQuestions[idx] = e.target.value;
                            setSpeaking({ ...speaking, part1: { ...speaking.part1, questions: newQuestions } });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Part 2 - Long Turn (Cue Card)</h3>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Cue Card</label>
                      <textarea
                        value={speaking.part2.cueCard}
                        onChange={(e) => setSpeaking({ ...speaking, part2: { ...speaking.part2, cueCard: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-24"
                        placeholder="Describe an experience when you played an indoor game..."
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 text-sm">Bullet points ({speaking.part2.bulletPoints.length})</label>
                        <button
                          onClick={addSpeakingBulletPoint}
                          className="text-primary-400 text-sm hover:text-primary-300"
                        >
                          + Point qo'shish
                        </button>
                      </div>
                      {speaking.part2.bulletPoints.map((bp, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Point ${idx + 1}`}
                          value={bp}
                          onChange={(e) => {
                            const newPoints = [...speaking.part2.bulletPoints];
                            newPoints[idx] = e.target.value;
                            setSpeaking({ ...speaking, part2: { ...speaking.part2, bulletPoints: newPoints } });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2 text-sm">Tayyorlash (sekund)</label>
                        <input
                          type="number"
                          value={speaking.part2.prepTime}
                          onChange={(e) => setSpeaking({ ...speaking, part2: { ...speaking.part2, prepTime: parseInt(e.target.value) || 60 } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2 text-sm">Gapirish (sekund)</label>
                        <input
                          type="number"
                          value={speaking.part2.speakTime}
                          onChange={(e) => setSpeaking({ ...speaking, part2: { ...speaking.part2, speakTime: parseInt(e.target.value) || 120 } })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Part 3 - Discussion</h3>
                    <div>
                      <label className="block text-gray-300 mb-2 text-sm">Mavzu</label>
                      <input
                        type="text"
                        value={speaking.part3.topic}
                        onChange={(e) => setSpeaking({ ...speaking, part3: { ...speaking.part3, topic: e.target.value } })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Indoor games discussion"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 text-sm">Savollar ({speaking.part3.questions.length})</label>
                        <button
                          onClick={() => addSpeakingQuestion('part3')}
                          className="text-primary-400 text-sm hover:text-primary-300"
                        >
                          + Savol qo'shish
                        </button>
                      </div>
                      {speaking.part3.questions.map((q, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Savol ${idx + 1}`}
                          value={q}
                          onChange={(e) => {
                            const newQuestions = [...speaking.part3.questions];
                            newQuestions[idx] = e.target.value;
                            setSpeaking({ ...speaking, part3: { ...speaking.part3, questions: newQuestions } });
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              <ArrowLeft size={18} />
              {step === 1 ? 'Bekor qilish' : 'Orqaga'}
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : step === 5 ? 'Tugatish' : 'Davom etish'}
              <ArrowRight size={18} />
            </button>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
