'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { PenLine, Send, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIWritingPage() {
  const [essay, setEssay] = useState('');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState<'CEFR' | 'IELTS'>('CEFR');
  const [mode, setMode] = useState<'practice' | 'free'>('practice');
  const [prompt, setPrompt] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);

  useEffect(() => {
    if (mode === 'practice') {
      loadPrompts();
    }
  }, [mode, examType]);

  const loadPrompts = async () => {
    try {
      const { data } = await api.get('/question-bank', {
        params: { type: 'writing', examType, limit: 10 }
      });
      setPrompts(data);
      if (data.length > 0) {
        setPrompt(data[0]);
        setTopic(data[0].title);
      }
    } catch (error) {
      console.error('Failed to load prompts');
    }
  };

  const nextPrompt = () => {
    const currentIndex = prompts.findIndex(p => p.id === prompt?.id);
    if (currentIndex < prompts.length - 1) {
      const next = prompts[currentIndex + 1];
      setPrompt(next);
      setTopic(next.title);
    } else {
      toast.success('Barcha mavzular tugadi');
    }
  };

  const topics = [
    'Technology and Society',
    'Environment and Climate Change',
    'Education and Learning',
    'Health and Wellbeing',
    'Culture and Traditions',
    'Science and Innovation',
  ];

  const handleSubmit = async () => {
    if (!essay.trim()) return toast.error('Please write your essay');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/writing', { essay, examType });
      setResult(data);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Failed to analyze essay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">AI Writing</h1>
          <p className="text-gray-400 mb-4">Write an essay and get instant AI feedback on grammar, vocabulary, and coherence.</p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Imtihon Turi</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setExamType('CEFR')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  examType === 'CEFR' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
                }`}
              >
                CEFR
              </button>
              <button
                type="button"
                onClick={() => setExamType('IELTS')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  examType === 'IELTS' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
                }`}
              >
                IELTS
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Rejim</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  mode === 'practice' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
                }`}
              >
                Practice (Mavzular)
              </button>
              <button
                type="button"
                onClick={() => setMode('free')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  mode === 'free' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
                }`}
              >
                Free (Erkin)
              </button>
            </div>
          </div>

          {mode === 'practice' && prompt && (
            <div className="mb-6 glass-dark rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Mavzu {prompts.findIndex(p => p.id === prompt.id) + 1}/{prompts.length}</h3>
                <button
                  onClick={nextPrompt}
                  className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition"
                >
                  Keyingi mavzu
                </button>
              </div>
              <p className="text-gray-200">{prompt.title}</p>
              {prompt.content && (
                <div className="mt-3 text-gray-400 text-sm whitespace-pre-wrap">{JSON.stringify(prompt.content, null, 2)}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="glass-dark rounded-2xl p-6 mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">Choose a topic (optional)</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`px-4 py-2 rounded-full text-sm transition ${topic === t ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-300 mb-3">Your Essay</label>
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  className="w-full h-64 bg-white/5 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition resize-none"
                  placeholder="Write your essay here... (minimum 50 words)"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-400 text-sm">{essay.split(/\s+/).filter(Boolean).length} words</span>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || essay.split(/\s+/).filter(Boolean).length < 10}
                    className="flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:gradient-bg-hover transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              {result ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-primary-400" /> AI Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Grammar</span>
                      <span className={`font-semibold ${(result.grammarScore || 0) > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.grammarScore}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Vocabulary</span>
                      <span className={`font-semibold ${(result.vocabScore || 0) > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.vocabScore}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Coherence</span>
                      <span className={`font-semibold ${(result.coherenceScore || 0) > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.coherenceScore}/100
                      </span>
                    </div>
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <p className="text-gray-400 text-sm mb-2">AI fikr (o‘zbekcha)</p>
                      <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{result.aiFeedback}</p>
                    </div>
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Estimated CEFR Level</span>
                        <span className="text-2xl font-bold gradient-text">{result.estimatedLevel}</span>
                      </div>
                      <p className="text-gray-400 text-sm">Word Count: {result.wordCount}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-dark rounded-2xl p-6 text-center">
                  <PenLine size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">AI Writing Analysis</h3>
                  <p className="text-gray-400">Write your essay on the left and click Analyze to get AI feedback.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
