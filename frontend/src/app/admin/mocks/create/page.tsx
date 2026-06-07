'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Save, Eye, Upload, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateMockPage() {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Step 1: Basic Info
  const [formData, setFormData] = useState({
    title: '',
    type: 'IELTS' as 'IELTS' | 'CEFR',
    priceUzs: '',
    discountPrice: '',
    description: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE',
  });

  // Step 2: Sections
  const [activeTab, setActiveTab] = useState<'listening' | 'reading' | 'writing' | 'speaking'>('listening');
  const [listeningData, setListeningData] = useState({ recordings: [] });
  const [readingData, setReadingData] = useState({ passages: [] });
  const [writingData, setWritingData] = useState({ tasks: [] });
  const [speakingData, setSpeakingData] = useState({ parts: [] });

  // Step 3: Certificate
  const [certificate, setCertificate] = useState({
    enabled: false,
    passingScore: 60,
    useDefaultTemplate: true,
    templateUrl: '',
  });

  useEffect(() => {
    if (isEditing && params.id) {
      fetchMock(params.id as string);
    }
  }, [params.id]);

  const fetchMock = async (id: string) => {
    try {
      const { data } = await api.get(`/mocks/${id}`);
      setFormData({
        title: data.title,
        type: data.type.includes('IELTS') ? 'IELTS' : 'CEFR',
        priceUzs: data.priceUzs?.toString() || '',
        discountPrice: data.paymentInstructions?.match(/Chegirma narxi: (\d+)/)?.[1] || '',
        description: data.description || '',
        status: data.isPublished ? 'ACTIVE' : 'DRAFT',
      });
    } catch (error) {
      toast.error('Mock yuklab olinmadi');
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: 'DRAFT',
      };
      
      if (isEditing && params.id) {
        await api.patch(`/api/mocks/${params.id}`, payload);
        toast.success('Qoralama saqlandi');
      } else {
        const { data } = await api.post('/api/mocks', payload);
        toast.success('Mock yaratildi');
        router.push(`/admin/mocks/${data.id}/edit`);
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: 'ACTIVE',
      };
      
      if (isEditing && params.id) {
        await api.patch(`/api/mocks/${params.id}`, payload);
        toast.success('Mock nashr qilindi');
      } else {
        const { data } = await api.post('/api/mocks', payload);
        toast.success('Mock yaratildi va nashr qilindi');
        router.push(`/admin/mocks/${data.id}/edit`);
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Mockni Tahrirlash' : 'Yangi Mock Yaratish'}
            </h1>
            <p className="text-gray-400 text-sm">
              {formData.type} • {isEditing ? 'Tahrirlash' : 'Yaratish'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  step >= s
                    ? 'gradient-bg text-white'
                    : 'bg-white/10 text-gray-500'
                }`}
              >
                {s}
              </div>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    step > s ? 'w-full gradient-bg' : step === s ? 'w-1/2 gradient-bg' : 'w-0'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-dark rounded-2xl p-6 lg:p-8">
          {step === 1 && (
            <Step1
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}

          {step === 2 && (
            <Step2
              type={formData.type}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              listeningData={listeningData}
              setListeningData={setListeningData}
              readingData={readingData}
              setReadingData={setReadingData}
              writingData={writingData}
              setWritingData={setWritingData}
              speakingData={speakingData}
              setSpeakingData={setSpeakingData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <Step3
              certificate={certificate}
              setCertificate={setCertificate}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 4 && (
            <Step4
              formData={formData}
              certificate={certificate}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              onBack={handleBack}
              saving={saving}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Step1({ formData, setFormData, onNext }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">1. Asosiy ma'lumot</h2>

      <div>
        <label className="block text-gray-400 mb-2">Nomi *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
          placeholder="Mock nomi"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Turi *</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'IELTS' })}
            className={`p-4 rounded-xl border-2 transition ${
              formData.type === 'IELTS'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-white/5 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-blue-400 mb-1">IELTS</div>
            <div className="text-sm text-gray-400">Academic & General</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'CEFR' })}
            className={`p-4 rounded-xl border-2 transition ${
              formData.type === 'CEFR'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-gray-700 bg-white/5 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-emerald-400 mb-1">CEFR</div>
            <div className="text-sm text-gray-400">B1, B2, C1</div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Narxi (UZS) *</label>
        <input
          type="number"
          value={formData.priceUzs}
          onChange={(e) => setFormData({ ...formData, priceUzs: e.target.value })}
          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
          placeholder="50000"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Chegirma narxi (ixtiyoriy)</label>
        <input
          type="number"
          value={formData.discountPrice}
          onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
          placeholder="40000"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Tavsif</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition min-h-[100px]"
          placeholder="Mock haqida qisqacha ma'lumot..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!formData.title || !formData.priceUzs}
          className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50"
        >
          Davom etish
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
}

function Step2({ type, activeTab, setActiveTab, onNext, onBack, listeningData, setListeningData, readingData, setReadingData, writingData, setWritingData, speakingData, setSpeakingData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">2. Bo'limlar</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-4">
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

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'listening' && <ListeningSection type={type} listeningData={listeningData} setListeningData={setListeningData} />}
        {activeTab === 'reading' && <ReadingSection type={type} readingData={readingData} setReadingData={setReadingData} />}
        {activeTab === 'writing' && (
          <WritingSection type={type} writingData={writingData} setWritingData={setWritingData} />
        )}
        {activeTab === 'speaking' && (
          <SpeakingSection type={type} speakingData={speakingData} setSpeakingData={setSpeakingData} />
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold transition hover:bg-white/10"
        >
          <ChevronUp size={20} />
          Orqaga
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
        >
          Davom etish
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
}

function ListeningSection({ type, listeningData, setListeningData }: any) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/api/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setListeningData({
        ...listeningData,
        recordings: [...(listeningData?.recordings || []), { url: data.url, name: file.name }]
      });
      toast.success('Audio yuklandi');
    } catch (error) {
      toast.error('Audio yuklanmadi');
    }
  };

  const removeRecording = (index: number) => {
    setListeningData({
      ...listeningData,
      recordings: (listeningData?.recordings || []).filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-4">
        {type === 'IELTS' 
          ? 'IELTS Listening: 4 recordings, 40 questions, 30 minutes'
          : 'CEFR Listening: 6 parts, multiple question types'
        }
      </p>

      <div className="bg-white/5 rounded-xl p-6">
        <label className="block text-gray-300 mb-4">Audio fayllar yuklash</label>
        
        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary-500 transition cursor-pointer">
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="cursor-pointer">
            <Upload size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Audio fayllarni bu yerga torting yoki yuklang</p>
            <p className="text-gray-500 text-sm mt-2">MP3, WAV, M4A (max 50MB)</p>
          </label>
        </div>

        {(listeningData?.recordings || []).length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-white font-medium">Yuklangan audio fayllar:</h4>
            {(listeningData?.recordings || []).map((rec: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎵</span>
                  <span className="text-gray-300">{rec.name}</span>
                </div>
                <button
                  onClick={() => removeRecording(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReadingSection({ type, readingData, setReadingData }: any) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/api/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReadingData({
        ...readingData,
        passages: [...(readingData?.passages || []), { url: data.url, name: file.name }]
      });
      toast.success('Fayl yuklandi');
    } catch (error) {
      toast.error('Fayl yuklanmadi');
    }
  };

  const removePassage = (index: number) => {
    setReadingData({
      ...readingData,
      passages: (readingData?.passages || []).filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-4">
        {type === 'IELTS' 
          ? 'IELTS Reading: 3 passages, 40 questions, 60 minutes'
          : 'CEFR Reading: 6 parts, multiple question types'
        }
      </p>

      <div className="bg-white/5 rounded-xl p-6">
        <label className="block text-gray-300 mb-4">Reading matnlari yuklash</label>
        
        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary-500 transition cursor-pointer">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="reading-upload"
          />
          <label htmlFor="reading-upload" className="cursor-pointer">
            <Upload size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Reading matnlarini bu yerga torting yoki yuklang</p>
            <p className="text-gray-500 text-sm mt-2">PDF, DOC, DOCX, TXT (max 20MB)</p>
          </label>
        </div>

        {(readingData?.passages || []).length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-white font-medium">Yuklangan matnlar:</h4>
            {(readingData?.passages || []).map((passage: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <span className="text-gray-300">{passage.name}</span>
                </div>
                <button
                  onClick={() => removePassage(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WritingSection({ type, writingData, setWritingData }: { type: string; writingData: any; setWritingData: any }) {
  return (
    <div className="text-gray-400">
      <p className="mb-4">
        {type === 'IELTS' 
          ? 'IELTS Writing: Task 1 (150 words) + Task 2 (250 words), 60 minutes'
          : 'CEFR Writing: Task 1.1, Task 1.2, Task 2, 80 minutes'
        }
      </p>
      <div className="bg-white/5 rounded-xl p-6 text-center">
        <Upload size={48} className="mx-auto mb-4 text-gray-600" />
        <p>Bo'lim tarkibi hozircha ishlab chiqilmagan</p>
        <p className="text-sm mt-2">Tez orada qo\'shiladi</p>
      </div>
    </div>
  );
}

function SpeakingSection({ type, speakingData, setSpeakingData }: { type: string; speakingData: any; setSpeakingData: any }) {
  return (
    <div className="text-gray-400">
      <p className="mb-4">
        {type === 'IELTS' 
          ? 'IELTS Speaking: 3 parts, 11-14 minutes'
          : 'CEFR Speaking: 3 tasks, ~15 minutes'
        }
      </p>
      <div className="bg-white/5 rounded-xl p-6 text-center">
        <Upload size={48} className="mx-auto mb-4 text-gray-600" />
        <p>Bo'lim tarkibi hozircha ishlab chiqilmagan</p>
        <p className="text-sm mt-2">Tez orada qo\'shiladi</p>
      </div>
    </div>
  );
}

function Step3({ certificate, setCertificate, onNext, onBack }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">3. Sertifikat</h2>

      <div className="flex items-center gap-4">
        <label className="text-gray-400">Sertifikat berilsinmi?</label>
        <button
          onClick={() => setCertificate({ ...certificate, enabled: !certificate.enabled })}
          className={`w-14 h-8 rounded-full transition ${
            certificate.enabled ? 'bg-primary-600' : 'bg-gray-700'
          }`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full transition ${
              certificate.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {certificate.enabled && (
        <>
          <div>
            <label className="block text-gray-400 mb-2">O'tish bali (%)</label>
            <input
              type="number"
              value={certificate.passingScore}
              onChange={(e) => setCertificate({ ...certificate, passingScore: parseInt(e.target.value) || 60 })}
              className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
              min="0"
              max="100"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-gray-400">Default shablon ishlatish</label>
            <button
              onClick={() => setCertificate({ ...certificate, useDefaultTemplate: !certificate.useDefaultTemplate })}
              className={`w-14 h-8 rounded-full transition ${
                certificate.useDefaultTemplate ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition ${
                  certificate.useDefaultTemplate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!certificate.useDefaultTemplate && (
            <div>
              <label className="block text-gray-400 mb-2">Sertifikat shabloni</label>
              <div className="bg-white/5 border border-gray-700 rounded-xl p-4 text-center text-gray-400">
                <Upload size={32} className="mx-auto mb-2" />
                <p>Shablon yuklash</p>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold transition hover:bg-white/10"
        >
          <ChevronUp size={20} />
          Orqaga
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
        >
          Davom etish
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
}

function Step4({ formData, certificate, onSaveDraft, onPublish, onBack, saving }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">4. Ko'rish va Nashr</h2>

      {/* Summary */}
      <div className="bg-white/5 rounded-xl p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Nomi:</span>
          <span className="text-white font-medium">{formData.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Turi:</span>
          <span className="text-white font-medium">{formData.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Narxi:</span>
          <span className="text-white font-medium">{formData.priceUzs} UZS</span>
        </div>
        {formData.discountPrice && (
          <div className="flex justify-between">
            <span className="text-gray-400">Chegirma:</span>
            <span className="text-emerald-400 font-medium">{formData.discountPrice} UZS</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Sertifikat:</span>
          <span className="text-white font-medium">{certificate.enabled ? 'Ha' : 'Yo\'q'}</span>
        </div>
      </div>

      {/* Preview Button */}
      <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold transition hover:bg-white/10">
        <Eye size={20} />
        Student ko'rishi
      </button>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold transition hover:bg-white/10"
        >
          <ChevronUp size={20} />
          Orqaga
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold transition hover:bg-gray-600 disabled:opacity-50"
          >
            <Save size={20} />
            Draft saqlash
          </button>
          <button
            onClick={onPublish}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            Nashr qilish
          </button>
        </div>
      </div>
    </div>
  );
}
