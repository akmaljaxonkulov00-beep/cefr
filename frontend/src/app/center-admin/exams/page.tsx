'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { BookOpen, Plus, Upload, FileText, Headphones, PenTool, Mic, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { MockTest } from '@/types/mock-test';
import MockUploadForm from '@/components/MockUploadForm';

export default function CenterAdminExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'pdf' | 'manual'>('pdf');
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    type: 'CEFR' as 'IELTS' | 'CEFR',
    duration: 120,
    level: 'B1' as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  });
  const [files, setFiles] = useState({
    reading: null as File | null,
    listening: null as File | null,
    writing: null as File | null,
    speaking: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/exams');
      setExams(data);
    } catch (error) {
      console.error('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.title) {
      toast.error('Nomini kiriting');
      return;
    }

    setUploading(true);

    try {
      // Har bir fayl uchun alohida imtihon yaratish
      if (files.reading) {
        const formData = new FormData();
        formData.append('file', files.reading);
        formData.append('title', `${uploadData.title} - Reading`);
        formData.append('type', 'READING');
        formData.append('duration', uploadData.duration.toString());
        formData.append('level', uploadData.level);
        await api.post('/api/exams/upload-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (files.listening) {
        const formData = new FormData();
        formData.append('file', files.listening);
        formData.append('title', `${uploadData.title} - Listening`);
        formData.append('type', 'LISTENING');
        formData.append('duration', uploadData.duration.toString());
        formData.append('level', uploadData.level);
        await api.post('/api/exams/upload-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (files.writing) {
        const formData = new FormData();
        formData.append('file', files.writing);
        formData.append('title', `${uploadData.title} - Writing`);
        formData.append('type', 'WRITING');
        formData.append('duration', uploadData.duration.toString());
        formData.append('level', uploadData.level);
        await api.post('/api/exams/upload-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (files.speaking) {
        const formData = new FormData();
        formData.append('file', files.speaking);
        formData.append('title', `${uploadData.title} - Speaking`);
        formData.append('type', 'SPEAKING');
        formData.append('duration', uploadData.duration.toString());
        formData.append('level', uploadData.level);
        await api.post('/api/exams/upload-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Imtihonlar yuklandi');
      setShowUpload(false);
      setFiles({ reading: null, listening: null, writing: null, speaking: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Yuklash xatosi');
    } finally {
      setUploading(false);
    }
  };

  const handleManualUpload = async (mockTest: Partial<MockTest>) => {
    setUploading(true);

    try {
      await api.post('/api/exams/create-mock', mockTest);
      toast.success('Mock yaratildi');
      setShowUpload(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Yaratish xatosi');
    } finally {
      setUploading(false);
    }
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('Imtihonni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/api/exams/${examId}`);
      toast.success('Imtihon o\'chirildi');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'O\'chirish xatosi');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Imtihonlar</h1>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-xl"
            >
              <Plus size={18} />
              Mock yaratish
            </button>
          </div>

          {showUpload && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-dark rounded-2xl p-6 mb-6"
            >
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setUploadType('pdf')}
                  className={`px-4 py-2 rounded-xl ${uploadType === 'pdf' ? 'gradient-bg text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                  PDF yuklash
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('manual')}
                  className={`px-4 py-2 rounded-xl ${uploadType === 'manual' ? 'gradient-bg text-white' : 'bg-gray-700 text-gray-400'}`}
                >
                  Qo'lda yaratish
                </button>
              </div>

              {uploadType === 'pdf' ? (
                <form onSubmit={handlePdfUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Mock nomi</label>
                      <input
                        type="text"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Davomiylik (daqiqa)</label>
                      <input
                        type="number"
                        value={uploadData.duration}
                        onChange={(e) => setUploadData({ ...uploadData, duration: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Daraja</label>
                      <select
                        value={uploadData.level}
                        onChange={(e) => setUploadData({ ...uploadData, level: e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Reading PDF</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary-500 transition cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFiles({ ...files, reading: e.target.files?.[0] || null })}
                          className="hidden"
                          id="reading-upload"
                        />
                        <label htmlFor="reading-upload" className="cursor-pointer">
                          <FileText size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-400 text-sm">{files.reading ? files.reading.name : 'Reading PDF'}</p>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Listening PDF</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary-500 transition cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFiles({ ...files, listening: e.target.files?.[0] || null })}
                          className="hidden"
                          id="listening-upload"
                        />
                        <label htmlFor="listening-upload" className="cursor-pointer">
                          <Headphones size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-400 text-sm">{files.listening ? files.listening.name : 'Listening PDF'}</p>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Writing PDF</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary-500 transition cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFiles({ ...files, writing: e.target.files?.[0] || null })}
                          className="hidden"
                          id="writing-upload"
                        />
                        <label htmlFor="writing-upload" className="cursor-pointer">
                          <PenTool size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-400 text-sm">{files.writing ? files.writing.name : 'Writing PDF'}</p>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Speaking PDF</label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary-500 transition cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFiles({ ...files, speaking: e.target.files?.[0] || null })}
                          className="hidden"
                          id="speaking-upload"
                        />
                        <label htmlFor="speaking-upload" className="cursor-pointer">
                          <Mic size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-400 text-sm">{files.speaking ? files.speaking.name : 'Speaking PDF'}</p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 gradient-bg text-white py-2 rounded-xl disabled:opacity-50"
                    >
                      {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpload(false)}
                      className="px-6 py-2 bg-gray-700 text-white rounded-xl"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </form>
              ) : (
                <MockUploadForm
                  onSubmit={handleManualUpload}
                  onCancel={() => setShowUpload(false)}
                  loading={uploading}
                />
              )}
            </motion.div>
          )}

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam: any) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-xl p-5 relative"
                >
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                  <BookOpen size={24} className="text-primary-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{exam.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{exam.type}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{exam.duration} daqiqa</span>
                    <span className="text-emerald-400">{exam.level || '—'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
