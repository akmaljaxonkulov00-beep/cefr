'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Save, Eye, Plus, Trash2, ChevronDown, ChevronUp, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUploadBox from '@/components/admin/FileUploadBox';
import QuestionBuilder, { Question } from '@/components/admin/QuestionBuilder';

export default function CreateMockPartPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // Step 1: Basic Info
  const [formData, setFormData] = useState({
    title: '',
    type: 'IELTS' as 'IELTS' | 'CEFR',
    skill: 'reading' as 'reading' | 'listening',
    partNumber: 1,
    price: 0,
    status: 'draft' as 'active' | 'draft',
  });

  // Step 2: Part Content
  const [contentType, setContentType] = useState<'file' | 'text'>('file');
  const [passageText, setPassageText] = useState('');
  const [passageFile, setPassageFile] = useState<{ url: string; filename: string } | null>(null);
  const [audioFile, setAudioFile] = useState<{ url: string; filename: string } | null>(null);
  const [audioPlaysOnce, setAudioPlaysOnce] = useState(true);
  const [hasPrepTime, setHasPrepTime] = useState(true);
  const [sectionDuration, setSectionDuration] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);

  const getPartNumbers = () => {
    if (formData.type === 'IELTS' && formData.skill === 'reading') return [1, 2, 3];
    if (formData.type === 'IELTS' && formData.skill === 'listening') return [1, 2, 3, 4];
    if (formData.type === 'CEFR') return [1, 2, 3, 4, 5, 6];
    return [1, 2, 3];
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: 'draft',
        questions,
        passageText: formData.skill === 'reading' ? passageText : null,
        passageFile: formData.skill === 'reading' ? passageFile?.url : null,
        audioUrl: formData.skill === 'listening' ? audioFile?.url : null,
        audioPlaysOnce: formData.skill === 'listening' ? audioPlaysOnce : undefined,
        hasPrepTime,
        sectionDuration,
      };
      
      const { data } = await api.post('/mock-parts', payload);
      toast.success('Part qoralama saqlandi');
      router.push('/admin/mocks/parts');
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
        status: 'active',
        questions,
        passageText: formData.skill === 'reading' ? passageText : null,
        passageFile: formData.skill === 'reading' ? passageFile?.url : null,
        audioUrl: formData.skill === 'listening' ? audioFile?.url : null,
        audioPlaysOnce: formData.skill === 'listening' ? audioPlaysOnce : undefined,
        hasPrepTime,
        sectionDuration,
      };
      
      const { data } = await api.post('/mock-parts', payload);
      toast.success('Part nashr qilindi');
      router.push('/admin/mocks/parts');
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save draft every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (step === 2 && (passageText || audioFile?.url || questions.length > 0)) {
        // Auto-save logic could be added here
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [step, passageText, audioFile, questions]);

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
            <h1 className="text-2xl font-bold text-white">Yangi Part Yaratish</h1>
            <p className="text-gray-400 text-sm">
              {formData.type} • {formData.skill} • Part {formData.partNumber}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
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
              getPartNumbers={getPartNumbers}
            />
          )}

          {step === 2 && (
            <Step2
              formData={formData}
              contentType={contentType}
              setContentType={setContentType}
              passageText={passageText}
              setPassageText={setPassageText}
              passageFile={passageFile}
              setPassageFile={setPassageFile}
              audioFile={audioFile}
              setAudioFile={setAudioFile}
              audioPlaysOnce={audioPlaysOnce}
              setAudioPlaysOnce={setAudioPlaysOnce}
              hasPrepTime={hasPrepTime}
              setHasPrepTime={setHasPrepTime}
              sectionDuration={sectionDuration}
              setSectionDuration={setSectionDuration}
              questions={questions}
              setQuestions={setQuestions}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <Step3
              formData={formData}
              questions={questions}
              passageText={passageText}
              passageFile={passageFile}
              audioFile={audioFile}
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

function Step1({ formData, setFormData, onNext, getPartNumbers }: any) {
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
          placeholder="IELTS Reading Part 1 — Practice"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Turi *</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'IELTS', partNumber: 1 })}
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
            onClick={() => setFormData({ ...formData, type: 'CEFR', partNumber: 1 })}
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
        <label className="block text-gray-400 mb-2">Skill *</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, skill: 'reading', partNumber: 1 })}
            className={`p-4 rounded-xl border-2 transition ${
              formData.skill === 'reading'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 bg-white/5 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">📖</div>
            <div className="text-sm text-gray-400">Reading</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, skill: 'listening', partNumber: 1 })}
            className={`p-4 rounded-xl border-2 transition ${
              formData.skill === 'listening'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 bg-white/5 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">🎧</div>
            <div className="text-sm text-gray-400">Listening</div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Part raqami *</label>
        <div className="flex gap-2 flex-wrap">
          {getPartNumbers().map((num: number) => (
            <button
              key={num}
              type="button"
              onClick={() => setFormData({ ...formData, partNumber: num })}
              className={`px-6 py-3 rounded-xl font-medium transition ${
                formData.partNumber === num
                  ? 'gradient-bg text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Part {num}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Narxi (UZS, 0 for bepul)</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
          placeholder="0"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!formData.title}
          className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-50"
        >
          Davom etish
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
}

function Step2({ formData, contentType, setContentType, passageText, setPassageText, passageFile, setPassageFile, audioFile, setAudioFile, audioPlaysOnce, setAudioPlaysOnce, hasPrepTime, setHasPrepTime, sectionDuration, setSectionDuration, questions, setQuestions, onNext, onBack }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getPartType = () => {
    if (formData.type === 'IELTS' && formData.skill === 'reading') return 'ielts-reading';
    if (formData.type === 'CEFR' && formData.skill === 'reading') return 'cefr-reading';
    if (formData.type === 'IELTS' && formData.skill === 'listening') return 'ielts-listening';
    if (formData.type === 'CEFR' && formData.skill === 'listening') return 'cefr-listening';
    return 'ielts-reading';
  };

  const handleFileUploadSuccess = (result: any, type: 'audio' | 'reading') => {
    if (type === 'audio') {
      setAudioFile({ url: result.url, filename: result.filename });
    } else {
      setPassageFile({ url: result.url, filename: result.filename });
      if (result.extractedText) {
        setPassageText(result.extractedText);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">2. Part Content</h2>

      {formData.skill === 'reading' ? (
        <div className="space-y-6">
          {/* IELTS READING */}
          {formData.type === 'IELTS' && (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setContentType('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${contentType === 'file' ? 'gradient-bg text-white' : 'bg-white/5 text-gray-300'}`}
                >
                  📄 Fayl yuklash
                </button>
                <button
                  onClick={() => setContentType('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${contentType === 'text' ? 'gradient-bg text-white' : 'bg-white/5 text-gray-300'}`}
                >
                  ✏️ Matn kiritish
                </button>
              </div>

              {contentType === 'file' ? (
                <FileUploadBox
                  accept=".pdf,.doc,.docx,.txt"
                  maxSizeMB={20}
                  uploadUrl="/uploads/reading-file"
                  label="Matn faylini yuklash"
                  onSuccess={(result) => handleFileUploadSuccess(result, 'reading')}
                  onRemove={() => setPassageFile(null)}
                  currentFile={passageFile}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Matn
                  </label>
                  <textarea
                    value={passageText}
                    onChange={(e) => setPassageText(e.target.value)}
                    className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition min-h-[300px] resize-none"
                    placeholder="Matnni shu yerga yozing..."
                  />
                </div>
              )}

              {passageText && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-gray-300 text-sm">Belgilar soni: {passageText.length}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CEFR READING */}
          {formData.type === 'CEFR' && (
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">CEFR Reading Part {formData.partNumber}</h3>
              <p className="text-gray-400 mb-4">
                {formData.partNumber === 1 && 'Multiple matching: 5-8 qisqa matn + savollar'}
                {formData.partNumber === 2 && 'Gapped text: asosiy matn + olib tashlangan jumlalar'}
                {formData.partNumber === 3 && 'Multiple choice comprehension'}
                {formData.partNumber === 4 && 'Vocabulary cloze: raqamlangan bo\'sh joylar'}
                {formData.partNumber === 5 && 'Open cloze: bo\'sh joylar'}
                {formData.partNumber === 6 && 'Word formation: so\'z shakllantirish'}
              </p>
              <FileUploadBox
                accept=".pdf,.doc,.docx,.txt"
                maxSizeMB={20}
                uploadUrl="/uploads/reading-file"
                label="Matn faylini yuklash"
                onSuccess={(result) => handleFileUploadSuccess(result, 'reading')}
                onRemove={() => setPassageFile(null)}
                currentFile={passageFile}
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yoki matnni to\'g\'ridan-to\'g\'ri kiritish
                </label>
                <textarea
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition min-h-[200px] resize-none"
                  placeholder="Matnni shu yerga yozing..."
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* LISTENING - Both IELTS and CEFR */}
          <FileUploadBox
            accept=".mp3,.wav,.m4a"
            maxSizeMB={50}
            uploadUrl="/uploads/audio"
            label="Audio faylini yuklash"
            onSuccess={(result) => handleFileUploadSuccess(result, 'audio')}
            onRemove={() => setAudioFile(null)}
            currentFile={audioFile}
          />

          {audioFile && (
            <div className="bg-white/5 rounded-xl p-4">
              <audio ref={audioRef} src={audioFile.url} onEnded={() => setIsPlaying(false)} />
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        audioRef.current.play();
                        setIsPlaying(true);
                      }
                    }
                  }}
                  className="w-12 h-12 rounded-full gradient-bg text-white flex items-center justify-center transition hover:opacity-90"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <div className="flex-1">
                  <p className="text-white font-medium">{audioFile.filename}</p>
                  <p className="text-gray-400 text-sm">{audioFile.url}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <label className="text-gray-300">
                {formData.type === 'IELTS' ? 'Audio faqat 1 marta o\'ynaydi' : 'Audio 2 marta o\'ynaydi'}
              </label>
              <button
                onClick={() => setAudioPlaysOnce(!audioPlaysOnce)}
                className={`w-14 h-8 rounded-full transition ${audioPlaysOnce ? 'bg-primary-600' : 'bg-gray-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition ${audioPlaysOnce ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <label className="text-gray-300">30 soniya savollarni o\'qish vaqti</label>
              <button
                onClick={() => setHasPrepTime(!hasPrepTime)}
                className={`w-14 h-8 rounded-full transition ${hasPrepTime ? 'bg-primary-600' : 'bg-gray-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition ${hasPrepTime ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <label className="block text-gray-300 mb-2">Bo'lim davomiyligi (daqiqa)</label>
              <input
                type="number"
                value={sectionDuration}
                onChange={(e) => setSectionDuration(parseInt(e.target.value) || 30)}
                className="w-24 bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition"
                min="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="border-t border-gray-800 pt-6">
        <QuestionBuilder
          questions={questions}
          onChange={setQuestions}
          partType={getPartType()}
          partNumber={formData.partNumber}
        />
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

function Step3({ formData, questions, passageText, passageFile, audioFile, onSaveDraft, onPublish, onBack, saving }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">3. Ko'rish va Nashr</h2>

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
          <span className="text-gray-400">Skill:</span>
          <span className="text-white font-medium">{formData.skill}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Part raqami:</span>
          <span className="text-white font-medium">Part {formData.partNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Savollar soni:</span>
          <span className="text-white font-medium">{questions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Narxi:</span>
          <span className="text-white font-medium">{formData.price === 0 ? 'Bepul' : `${formData.price.toLocaleString()} UZS`}</span>
        </div>
        {passageFile && (
          <div className="flex justify-between">
            <span className="text-gray-400">Matn fayli:</span>
            <span className="text-white font-medium">{passageFile.filename}</span>
          </div>
        )}
        {audioFile && (
          <div className="flex justify-between">
            <span className="text-gray-400">Audio fayli:</span>
            <span className="text-white font-medium">{audioFile.filename}</span>
          </div>
        )}
        {passageText && (
          <div className="flex justify-between">
            <span className="text-gray-400">Matn belgilari:</span>
            <span className="text-white font-medium">{passageText.length}</span>
          </div>
        )}
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
