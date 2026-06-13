'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Check, X, Filter, BarChart3 } from 'lucide-react';

type Tab = 'speaking' | 'writing';

interface SpeakingQuestion {
  id: string;
  part: number;
  cefrLevel: string;
  questionText: string;
  topicCard?: string;
  timeLimitSeconds: number;
  isActive: boolean;
  createdAt: string;
}

interface WritingQuestion {
  id: string;
  task: number;
  cefrLevel: string;
  promptText: string;
  minWords?: number;
  maxWords?: number;
  sampleAnswer?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AiQuestionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('speaking');
  const [speakingQuestions, setSpeakingQuestions] = useState<SpeakingQuestion[]>([]);
  const [writingQuestions, setWritingQuestions] = useState<WritingQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ part: '', cefrLevel: '', isActive: '' });
  const [showStats, setShowStats] = useState(false);

  const [formData, setFormData] = useState({
    part: 1,
    cefrLevel: 'B1',
    questionText: '',
    topicCard: '',
    timeLimitSeconds: 60,
    task: 1,
    promptText: '',
    minWords: 150,
    maxWords: 300,
    sampleAnswer: '',
    isActive: true,
  });

  const loadSpeakingQuestions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/ai-questions/speaking', { params: filters });
      setSpeakingQuestions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading speaking questions:', error);
      toast.error(error.response?.data?.message || 'Savollar yuklanmadi');
      setSpeakingQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWritingQuestions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/ai-questions/writing', { params: filters });
      setWritingQuestions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading writing questions:', error);
      toast.error(error.response?.data?.message || 'Savollar yuklanmadi');
      setWritingQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'speaking') {
      loadSpeakingQuestions();
    } else {
      loadWritingQuestions();
    }
  }, [tab, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loadingToast = toast.loading(editingQuestion ? 'Yangilanmoqda...' : 'Qo\'shilmoqda...');
    
    try {
      const endpoint = tab === 'speaking' 
        ? `/api/ai-questions/speaking${editingQuestion ? `/${editingQuestion.id}` : ''}`
        : `/api/ai-questions/writing${editingQuestion ? `/${editingQuestion.id}` : ''}`;
      
      const method = editingQuestion ? 'put' : 'post';
      
      const payload = tab === 'speaking' 
        ? {
            part: Number(formData.part),
            cefrLevel: formData.cefrLevel,
            questionText: formData.questionText,
            topicCard: formData.topicCard || '',
            timeLimitSeconds: Number(formData.timeLimitSeconds),
            isActive: formData.isActive
          }
        : {
            task: Number(formData.task),
            cefrLevel: formData.cefrLevel,
            promptText: formData.promptText,
            minWords: Number(formData.minWords),
            maxWords: Number(formData.maxWords),
            sampleAnswer: formData.sampleAnswer || '',
            isActive: formData.isActive
          };
      
      await api[method](endpoint, payload);
      
      toast.dismiss(loadingToast);
      toast.success(editingQuestion ? 'Savol yangilandi' : 'Savol qo\'shildi');
      
      setShowModal(false);
      setEditingQuestion(null);
      resetForm();
      
      if (tab === 'speaking') {
        await loadSpeakingQuestions();
      } else {
        await loadWritingQuestions();
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Savolni o\'chirishni tasdiqlaysizmi?')) return;
    
    const loadingToast = toast.loading('O\'chirilmoqda...');
    
    try {
      const endpoint = tab === 'speaking' 
        ? `/api/ai-questions/speaking/${id}`
        : `/api/ai-questions/writing/${id}`;
      
      await api.delete(endpoint);
      
      toast.dismiss(loadingToast);
      toast.success('Savol o\'chirildi');
      
      if (tab === 'speaking') {
        await loadSpeakingQuestions();
      } else {
        await loadWritingQuestions();
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleToggleActive = async (id: string) => {
    const loadingToast = toast.loading('O\'zgartirilmoqda...');
    
    try {
      const endpoint = tab === 'speaking'
        ? `/api/ai-questions/speaking/${id}/toggle`
        : `/api/ai-questions/writing/${id}/toggle`;
      
      await api.put(endpoint);
      
      toast.dismiss(loadingToast);
      toast.success('Holat o\'zgartirildi');
      
      if (tab === 'speaking') {
        await loadSpeakingQuestions();
      } else {
        await loadWritingQuestions();
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Toggle error:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} ta savolni o\'chirishni tasdiqlaysizmi?`)) return;
    
    const loadingToast = toast.loading('O\'chirilmoqda...');
    
    try {
      const endpoint = tab === 'speaking'
        ? '/api/ai-questions/speaking/bulk'
        : '/api/ai-questions/writing/bulk';
      
      await api.delete(endpoint, { data: { ids: Array.from(selectedIds) } });
      
      toast.dismiss(loadingToast);
      toast.success('Savollar o\'chirildi');
      setSelectedIds(new Set());
      
      if (tab === 'speaking') {
        await loadSpeakingQuestions();
      } else {
        await loadWritingQuestions();
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Bulk delete error:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const openEditModal = (question: any) => {
    setEditingQuestion(question);
    if (tab === 'speaking') {
      setFormData({
        ...formData,
        part: question.part || 1,
        cefrLevel: question.cefrLevel || 'B1',
        questionText: question.questionText || '',
        topicCard: question.topicCard || '',
        timeLimitSeconds: question.timeLimitSeconds || 60,
        isActive: question.isActive ?? true,
      });
    } else {
      setFormData({
        ...formData,
        task: question.task || 1,
        cefrLevel: question.cefrLevel || 'B2',
        promptText: question.promptText || '',
        minWords: question.minWords || 150,
        maxWords: question.maxWords || 300,
        sampleAnswer: question.sampleAnswer || '',
        isActive: question.isActive ?? true,
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      part: 1,
      cefrLevel: 'B1',
      questionText: '',
      topicCard: '',
      timeLimitSeconds: 60,
      task: 1,
      promptText: '',
      minWords: 150,
      maxWords: 300,
      sampleAnswer: '',
      isActive: true,
    });
  };

  const questions = tab === 'speaking' ? speakingQuestions : writingQuestions;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">AI Savollar</h1>
              <p className="text-gray-400 text-sm">Speaking va Writing savollarini boshqarish</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <BarChart3 size={18} /> Statistika
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/ai-questions/sets')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                🎯 AI Mock Sets
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white hover:opacity-90 transition"
              >
                <Plus size={18} /> Savol qo'shish
              </button>
            </div>
          </div>

          {/* Statistics Dashboard */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-dark rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">📊 Savollar Statistikasi</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Speaking Stats */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-gray-400">Speaking Savollar</h3>
                    <span className="text-2xl">🗣️</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{speakingQuestions.length}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      Part 1: {speakingQuestions.filter(q => q.part === 1).length}
                    </p>
                    <p className="text-xs text-gray-400">
                      Part 2: {speakingQuestions.filter(q => q.part === 2).length}
                    </p>
                    <p className="text-xs text-gray-400">
                      Part 3: {speakingQuestions.filter(q => q.part === 3).length}
                    </p>
                  </div>
                </div>

                {/* Writing Stats */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-gray-400">Writing Savollar</h3>
                    <span className="text-2xl">✍️</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{writingQuestions.length}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      Task 1: {writingQuestions.filter(q => q.task === 1).length}
                    </p>
                    <p className="text-xs text-gray-400">
                      Task 2: {writingQuestions.filter(q => q.task === 2).length}
                    </p>
                  </div>
                </div>

                {/* Active Stats */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-gray-400">Aktiv Savollar</h3>
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {speakingQuestions.filter(q => q.isActive).length + writingQuestions.filter(q => q.isActive).length}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      Speaking: {speakingQuestions.filter(q => q.isActive).length}
                    </p>
                    <p className="text-xs text-gray-400">
                      Writing: {writingQuestions.filter(q => q.isActive).length}
                    </p>
                  </div>
                </div>

                {/* Inactive Stats */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-gray-400">Inaktiv Savollar</h3>
                    <span className="text-2xl">❌</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {speakingQuestions.filter(q => !q.isActive).length + writingQuestions.filter(q => !q.isActive).length}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      Speaking: {speakingQuestions.filter(q => !q.isActive).length}
                    </p>
                    <p className="text-xs text-gray-400">
                      Writing: {writingQuestions.filter(q => !q.isActive).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* CEFR Level Distribution */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">CEFR Level Bo'yicha Taqsimot</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => {
                    const speakingCount = speakingQuestions.filter(q => q.cefrLevel === level).length;
                    const writingCount = writingQuestions.filter(q => q.cefrLevel === level).length;
                    const total = speakingCount + writingCount;
                    
                    return (
                      <div key={level} className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">{level}</p>
                        <p className="text-xl font-bold text-white">{total}</p>
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="text-purple-400">🗣️{speakingCount}</span>
                          {' '}
                          <span className="text-blue-400">✍️{writingCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTab('speaking')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === 'speaking' ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
              }`}
            >
              Speaking ({speakingQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('writing')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === 'writing' ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
              }`}
            >
              Writing ({writingQuestions.length})
            </button>
          </div>

          {/* Filters */}
          <div className="glass-dark rounded-2xl p-4 lg:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filters.part}
                onChange={(e) => setFilters({ ...filters, part: e.target.value })}
                className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Barcha Part/Task</option>
                {tab === 'speaking' ? (
                  <>
                    <option value="1">Part 1</option>
                    <option value="2">Part 2</option>
                    <option value="3">Part 3</option>
                  </>
                ) : (
                  <>
                    <option value="1">Task 1</option>
                    <option value="2">Task 2</option>
                  </>
                )}
              </select>
              <select
                value={filters.cefrLevel}
                onChange={(e) => setFilters({ ...filters, cefrLevel: e.target.value })}
                className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Barcha Level</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Barcha holat</option>
                <option value="true">Aktiv</option>
                <option value="false">Inaktiv</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="glass-dark rounded-2xl p-4 mb-6 flex items-center justify-between">
              <span className="text-white">{selectedIds.size} ta savol tanlandi</span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
              >
                O'chirish
              </button>
            </div>
          )}

          {/* Questions Table */}
          <div className="glass-dark rounded-2xl p-4 lg:p-6">
            {loading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 mt-4">Yuklanmoqda...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">Savollar mavjud emas</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    resetForm();
                    setShowModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white"
                >
                  <Plus size={18} /> Birinchi savolni qo'shing
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-2 lg:p-3 text-gray-400">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === questions.length && questions.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(new Set(questions.map((q) => q.id)));
                            } else {
                              setSelectedIds(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2 lg:p-3 text-gray-400">
                        {tab === 'speaking' ? 'Part' : 'Task'}
                      </th>
                      <th className="text-left p-2 lg:p-3 text-gray-400">Level</th>
                      <th className="text-left p-2 lg:p-3 text-gray-400">Savol</th>
                      <th className="text-left p-2 lg:p-3 text-gray-400">Holat</th>
                      <th className="text-left p-2 lg:p-3 text-gray-400">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question: any) => (
                      <tr key={question.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                        <td className="p-2 lg:p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(question.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedIds);
                              if (e.target.checked) {
                                newSelected.add(question.id);
                              } else {
                                newSelected.delete(question.id);
                              }
                              setSelectedIds(newSelected);
                            }}
                          />
                        </td>
                        <td className="p-2 lg:p-3 text-white">
                          {tab === 'speaking' ? `Part ${question.part}` : `Task ${question.task}`}
                        </td>
                        <td className="p-2 lg:p-3 text-gray-300">{question.cefrLevel}</td>
                        <td className="p-2 lg:p-3 text-gray-300 max-w-xs truncate">
                          {tab === 'speaking' ? question.questionText : question.promptText}
                        </td>
                        <td className="p-2 lg:p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              question.isActive ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
                            }`}
                          >
                            {question.isActive ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td className="p-2 lg:p-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(question.id)}
                            className={`p-1 rounded ${question.isActive ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                            title={question.isActive ? 'Inaktiv qilish' : 'Aktiv qilish'}
                          >
                            {question.isActive ? <X size={16} /> : <Check size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(question)}
                            className="p-1 rounded text-blue-400 hover:bg-blue-400/10"
                            title="Tahrirlash"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(question.id)}
                            className="p-1 rounded text-red-400 hover:bg-red-400/10"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-dark rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                {editingQuestion ? 'Savolni tahrirlash' : 'Yangi savol qo\'shish'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'speaking' ? (
                  <>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Part *</label>
                      <select
                        value={formData.part}
                        onChange={(e) => setFormData({ ...formData, part: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
                      >
                        <option value={1}>Part 1</option>
                        <option value={2}>Part 2</option>
                        <option value={3}>Part 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">CEFR Level *</label>
                      <select
                        value={formData.cefrLevel}
                        onChange={(e) => setFormData({ ...formData, cefrLevel: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
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
                      <label className="block text-gray-400 text-sm mb-2">Savol matni *</label>
                      <textarea
                        value={formData.questionText}
                        onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                        required
                        placeholder="Masalan: What is your name?"
                      />
                    </div>
                    {formData.part === 2 && (
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Topic Card (Part 2 uchun)</label>
                        <textarea
                          value={formData.topicCard}
                          onChange={(e) => setFormData({ ...formData, topicCard: e.target.value })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                          placeholder="Topic card mazmuni..."
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Vaqt limiti (soniya) *</label>
                      <input
                        type="number"
                        value={formData.timeLimitSeconds}
                        onChange={(e) => setFormData({ ...formData, timeLimitSeconds: parseInt(e.target.value) || 60 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
                        min="10"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Task *</label>
                      <select
                        value={formData.task}
                        onChange={(e) => setFormData({ ...formData, task: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
                      >
                        <option value={1}>Task 1</option>
                        <option value={2}>Task 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">CEFR Level *</label>
                      <select
                        value={formData.cefrLevel}
                        onChange={(e) => setFormData({ ...formData, cefrLevel: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
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
                      <label className="block text-gray-400 text-sm mb-2">Prompt matni *</label>
                      <textarea
                        value={formData.promptText}
                        onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                        required
                        placeholder="Writing task matni..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Min so'zlar</label>
                        <input
                          type="number"
                          value={formData.minWords}
                          onChange={(e) => setFormData({ ...formData, minWords: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Max so'zlar</label>
                        <input
                          type="number"
                          value={formData.maxWords}
                          onChange={(e) => setFormData({ ...formData, maxWords: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Namuna javob (ixtiyoriy)</label>
                      <textarea
                        value={formData.sampleAnswer}
                        onChange={(e) => setFormData({ ...formData, sampleAnswer: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                        placeholder="Sample answer..."
                      />
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-gray-400 text-sm">Aktiv</label>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg gradient-bg text-white hover:opacity-90 transition"
                  >
                    {editingQuestion ? 'Yangilash' : 'Qo\'shish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingQuestion(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
