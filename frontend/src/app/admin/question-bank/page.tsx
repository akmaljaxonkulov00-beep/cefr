'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Plus, Edit, Trash2, Filter, Search, Upload, FileText, Mic, BookOpen, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';

type Question = {
  id: string;
  type: 'speaking' | 'writing' | 'reading' | 'listening';
  examType: 'CEFR' | 'IELTS';
  level?: string;
  title: string;
  content: any;
  mediaUrl?: string;
  mediaKey?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  isActive: boolean;
  createdAt: string;
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterExamType, setFilterExamType] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType) {
      filtered = filtered.filter(q => q.type === filterType);
    }

    if (filterExamType) {
      filtered = filtered.filter(q => q.examType === filterExamType);
    }

    if (filterLevel) {
      filtered = filtered.filter(q => q.level === filterLevel);
    }

    setFilteredQuestions(filtered);
  }, [searchTerm, filterType, filterExamType, filterLevel, questions]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/question-bank');
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      toast.error('Savollarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham o\'chirmoqchimisiz?')) return;

    try {
      await api.delete(`/question-bank/${id}`);
      toast.success('Savol o\'chirildi');
      fetchQuestions();
    } catch (error) {
      toast.error('O\'chirishda xatolik');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/question-bank/${id}/status`);
      toast.success('Holat o\'zgartirildi');
      fetchQuestions();
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleBulkUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const questions = JSON.parse(text);
        
        if (!Array.isArray(questions)) {
          toast.error('JSON formati noto\'g\'ri. Array bo\'lishi kerak.');
          return;
        }

        setLoading(true);
        for (const q of questions) {
          await api.post('/question-bank', q);
        }
        toast.success(`${questions.length} ta savol muvaffaqiyatli qo\'shildi`);
        fetchQuestions();
      } catch (error) {
        toast.error('JSON faylni o\'qishda xatolik');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'speaking': return <Mic size={16} />;
      case 'writing': return <FileText size={16} />;
      case 'reading': return <BookOpen size={16} />;
      case 'listening': return <Headphones size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'speaking': return 'bg-purple-500/20 text-purple-300';
      case 'writing': return 'bg-blue-500/20 text-blue-300';
      case 'reading': return 'bg-green-500/20 text-green-300';
      case 'listening': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Savol Banki</h1>
              <p className="text-gray-400 text-sm">CEFR va IELTS savollarini boshqaring</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingQuestion(null); setShowModal(true); }}
                className="flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:gradient-bg-hover transition"
              >
                <Plus size={20} />
                Yangi Savol
              </button>
              <button
                onClick={() => handleBulkUpload()}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-gray-700 rounded-xl text-white font-medium hover:bg-white/10 transition"
              >
                <Upload size={20} />
                Bulk JSON
              </button>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
              >
                <option value="">Barcha Turlar</option>
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
              </select>

              <select
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
              >
                <option value="">Barcha Imtihonlar</option>
                <option value="CEFR">CEFR</option>
                <option value="IELTS">IELTS</option>
              </select>

              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
              >
                <option value="">Barcha Darajalar</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="glass-dark rounded-2xl p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Yuklanmoqda...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="glass-dark rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Savollar topilmadi</h3>
              <p className="text-gray-400 text-sm mb-6">Birinchi savolni qo\'shing</p>
              <button
                onClick={() => { setEditingQuestion(null); setShowModal(true); }}
                className="px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:gradient-bg-hover transition"
              >
                <Plus size={20} className="inline mr-2" />
                Yangi Savol Qo\'shish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((question) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-2xl p-6 hover:border-primary-500/50 transition border border-transparent"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(question.type)}`}>
                      {getTypeIcon(question.type)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(question.id)}
                        className={`p-2 rounded-lg transition ${question.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                        title={question.isActive ? 'Faol' : 'Nofaol'}
                      >
                        <div className={`w-2 h-2 rounded-full ${question.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                      </button>
                      <button
                        onClick={() => { setEditingQuestion(question); setShowModal(true); }}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{question.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                      {question.type.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300">
                      {question.examType}
                    </span>
                    {question.level && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                        {question.level}
                      </span>
                    )}
                    {question.difficulty && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>

                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {question.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 rounded-md text-xs bg-white/5 text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {question.mediaUrl && (
                    <div className="mt-3 p-2 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Upload size={14} />
                        <span className="truncate">Media fayl mavjud</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {showModal && (
          <QuestionModal
            question={editingQuestion}
            onClose={() => { setShowModal(false); setEditingQuestion(null); }}
            onSave={() => { setShowModal(false); setEditingQuestion(null); fetchQuestions(); }}
          />
        )}
      </main>
    </div>
  );
}

function QuestionModal({ question, onClose, onSave }: { question: Question | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    type: question?.type || 'speaking',
    examType: question?.examType || 'CEFR',
    level: question?.level || '',
    title: question?.title || '',
    content: question?.content || {},
    difficulty: question?.difficulty || 'medium',
    tags: question?.tags || [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (question) {
        await api.patch(`/question-bank/${question.id}`, formData);
        toast.success('Savol yangilandi');
      } else {
        await api.post('/question-bank', formData);
        toast.success('Savol qo\'shildi');
      }
      onSave();
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-dark rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          {question ? 'Savolni Tahrirlash' : 'Yangi Savol Qo\'shish'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tur</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
                required
              >
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imtihon Turi</label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
                required
              >
                <option value="CEFR">CEFR</option>
                <option value="IELTS">IELTS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Daraja</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
              >
                <option value="">Tanlang</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Qiyinchilik</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition"
              >
                <option value="easy">Oson</option>
                <option value="medium">O\'rtacha</option>
                <option value="hard">Qiyin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sarlavha</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Teglar (vergul bilan ajrating)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
              placeholder="masalan: grammar, vocabulary, past tense"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/5 border border-gray-700 rounded-xl text-white hover:bg-white/10 transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:gradient-bg-hover transition disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
