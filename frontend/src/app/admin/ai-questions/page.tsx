'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Check, X, Filter } from 'lucide-react';

type Tab = 'speaking' | 'writing';

export default function AiQuestionsPage() {
  const [tab, setTab] = useState<Tab>('speaking');
  const [speakingQuestions, setSpeakingQuestions] = useState<any[]>([]);
  const [writingQuestions, setWritingQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ part: '', cefrLevel: '', isActive: '' });

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
      const { data } = await api.get('/api/ai-questions/speaking', { params: filters });
      setSpeakingQuestions(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Savollar yuklanmadi');
    }
  };

  const loadWritingQuestions = async () => {
    try {
      const { data } = await api.get('/api/ai-questions/writing', { params: filters });
      setWritingQuestions(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Savollar yuklanmadi');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (tab === 'speaking') await loadSpeakingQuestions();
      else await loadWritingQuestions();
      setLoading(false);
    })();
  }, [tab, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        if (tab === 'speaking') {
          await api.put(`/api/ai-questions/speaking/${editingQuestion.id}`, formData);
        } else {
          await api.put(`/api/ai-questions/writing/${editingQuestion.id}`, formData);
        }
        toast.success('Savol yangilandi');
      } else {
        if (tab === 'speaking') {
          await api.post('/api/ai-questions/speaking', formData);
        } else {
          await api.post('/api/ai-questions/writing', formData);
        }
        toast.success('Savol qo\'shildi');
      }
      setShowModal(false);
      setEditingQuestion(null);
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
      if (tab === 'speaking') await loadSpeakingQuestions();
      else await loadWritingQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Savolni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      if (tab === 'speaking') {
        await api.delete(`/api/ai-questions/speaking/${id}`);
      } else {
        await api.delete(`/api/ai-questions/writing/${id}`);
      }
      toast.success('Savol o\'chirildi');
      if (tab === 'speaking') await loadSpeakingQuestions();
      else await loadWritingQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      if (tab === 'speaking') {
        await api.put(`/api/ai-questions/speaking/${id}/toggle`);
      } else {
        await api.put(`/api/ai-questions/writing/${id}/toggle`);
      }
      toast.success('Holat o\'zgartirildi');
      if (tab === 'speaking') await loadSpeakingQuestions();
      else await loadWritingQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} ta savolni o\'chirishni tasdiqlaysizmi?`)) return;
    try {
      if (tab === 'speaking') {
        await api.delete('/api/ai-questions/speaking/bulk', { data: { ids: Array.from(selectedIds) } });
      } else {
        await api.delete('/api/ai-questions/writing/bulk', { data: { ids: Array.from(selectedIds) } });
      }
      toast.success('Savollar o\'chirildi');
      setSelectedIds(new Set());
      if (tab === 'speaking') await loadSpeakingQuestions();
      else await loadWritingQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const openEditModal = (question: any) => {
    setEditingQuestion(question);
    setFormData({
      part: question.part || 1,
      cefrLevel: question.cefrLevel || 'B1',
      questionText: question.questionText || question.promptText || '',
      topicCard: question.topicCard || '',
      timeLimitSeconds: question.timeLimitSeconds || 60,
      task: question.task || 1,
      promptText: question.promptText || '',
      minWords: question.minWords || 150,
      maxWords: question.maxWords || 300,
      sampleAnswer: question.sampleAnswer || '',
      isActive: question.isActive !== undefined ? question.isActive : true,
    });
    setShowModal(true);
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
            <button
              type="button"
              onClick={() => {
                setEditingQuestion(null);
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
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white"
            >
              <Plus size={18} /> Savol qo'shish
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTab('speaking')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === 'speaking' ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
              }`}
            >
              Speaking
            </button>
            <button
              type="button"
              onClick={() => setTab('writing')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === 'writing' ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
              }`}
            >
              Writing
            </button>
          </div>

          <div className="glass-dark rounded-2xl p-4 lg:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
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

          {selectedIds.size > 0 && (
            <div className="glass-dark rounded-2xl p-4 mb-6 flex items-center justify-between">
              <span className="text-white">{selectedIds.size} ta savol tanlandi</span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm"
              >
                O'chirish
              </button>
            </div>
          )}

          <div className="glass-dark rounded-2xl p-4 lg:p-6">
            {loading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : questions.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Savollar mavjud emas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-2 lg:p-3 text-gray-400">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === questions.length}
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
                      <tr key={question.id} className="border-b border-gray-800">
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
                          >
                            {question.isActive ? <X size={16} /> : <Check size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(question)}
                            className="p-1 rounded text-blue-400 hover:bg-blue-400/10"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(question.id)}
                            className="p-1 rounded text-red-400 hover:bg-red-400/10"
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
                      <label className="block text-gray-400 text-sm mb-2">Part</label>
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
                      <label className="block text-gray-400 text-sm mb-2">CEFR Level</label>
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
                      <label className="block text-gray-400 text-sm mb-2">Savol matni</label>
                      <textarea
                        value={formData.questionText}
                        onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                        required
                      />
                    </div>
                    {formData.part === 2 && (
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Topic Card (Part 2 uchun)</label>
                        <textarea
                          value={formData.topicCard}
                          onChange={(e) => setFormData({ ...formData, topicCard: e.target.value })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Vaqt limiti (soniya)</label>
                      <input
                        type="number"
                        value={formData.timeLimitSeconds}
                        onChange={(e) => setFormData({ ...formData, timeLimitSeconds: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Task</label>
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
                      <label className="block text-gray-400 text-sm mb-2">CEFR Level</label>
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
                      <label className="block text-gray-400 text-sm mb-2">Prompt matni</label>
                      <textarea
                        value={formData.promptText}
                        onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Min so'zlar</label>
                        <input
                          type="number"
                          value={formData.minWords}
                          onChange={(e) => setFormData({ ...formData, minWords: parseInt(e.target.value) })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Max so'zlar</label>
                        <input
                          type="number"
                          value={formData.maxWords}
                          onChange={(e) => setFormData({ ...formData, maxWords: parseInt(e.target.value) })}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Namuna javob (ixtiyoriy)</label>
                      <textarea
                        value={formData.sampleAnswer}
                        onChange={(e) => setFormData({ ...formData, sampleAnswer: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[100px]"
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
                  />
                  <label htmlFor="isActive" className="text-gray-400 text-sm">Aktiv</label>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg gradient-bg text-white"
                  >
                    {editingQuestion ? 'Yangilash' : 'Qo\'shish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white"
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
