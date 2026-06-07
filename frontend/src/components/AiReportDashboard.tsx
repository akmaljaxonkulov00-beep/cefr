'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { BookOpen, Headphones, PenTool, Mic, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DiagnosticReport {
  overall_score: string;
  skills: {
    reading: { score: string; feedback: string };
    listening: { score: string; feedback: string };
    writing: { score: string; feedback: string };
    speaking: { score: string; feedback: string };
  };
  diagnostics: {
    strengths: string;
    weaknesses: string;
    action_plan: string;
  };
}

interface AiReportDashboardProps {
  testType: 'IELTS' | 'CEFR';
  readingScore: number;
  listeningScore: number;
  writingText: string;
  speakingTranscript: string;
}

export default function AiReportDashboard({
  testType,
  readingScore,
  listeningScore,
  writingText,
  speakingTranscript,
}: AiReportDashboardProps) {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      const { data } = await api.post('/api/ai/diagnostic-report', {
        testType,
        readingScore,
        listeningScore,
        writingText,
        speakingTranscript,
      });
      setReport(data);
    } catch (error) {
      toast.error('Report yaratib bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    const num = parseFloat(score);
    if (testType === 'IELTS') {
      if (num >= 7) return 'text-emerald-400';
      if (num >= 6) return 'text-blue-400';
      if (num >= 5) return 'text-amber-400';
      return 'text-red-400';
    } else {
      if (score === 'C1' || score === 'C2') return 'text-emerald-400';
      if (score === 'B2') return 'text-blue-400';
      if (score === 'B1') return 'text-amber-400';
      return 'text-red-400';
    }
  };

  const getProgressWidth = (score: string) => {
    const num = parseFloat(score);
    if (testType === 'IELTS') {
      return `${(num / 9) * 100}%`;
    } else {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const idx = levels.indexOf(score);
      return `${((idx + 1) / 6) * 100}%`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">AI Report yaratilmoqda...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Report yaratib bo\'lmadi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">AI Diagnostic Report</h1>
          <p className="text-gray-400">{testType} Mock Test Analysis</p>
        </motion.div>

        {/* Overall Score Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark rounded-2xl p-8 flex items-center justify-center"
        >
          <div className="relative">
            <div className="w-48 h-48 rounded-full border-8 border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Overall Score</p>
                <p className={`text-6xl font-bold ${getScoreColor(report.overall_score)}`}>
                  {report.overall_score}
                </p>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 bg-primary-500 rounded-full p-2">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </motion.div>

        {/* Skills Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Reading */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={24} className="text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Reading</h3>
              <span className={`ml-auto text-2xl font-bold ${getScoreColor(report.skills.reading.score)}`}>
                {report.skills.reading.score}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full gradient-bg transition-all duration-500"
                style={{ width: getProgressWidth(report.skills.reading.score) }}
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{report.skills.reading.feedback}</p>
          </div>

          {/* Listening */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Headphones size={24} className="text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Listening</h3>
              <span className={`ml-auto text-2xl font-bold ${getScoreColor(report.skills.listening.score)}`}>
                {report.skills.listening.score}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full gradient-bg transition-all duration-500"
                style={{ width: getProgressWidth(report.skills.listening.score) }}
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{report.skills.listening.feedback}</p>
          </div>

          {/* Writing */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <PenTool size={24} className="text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Writing</h3>
              <span className={`ml-auto text-2xl font-bold ${getScoreColor(report.skills.writing.score)}`}>
                {report.skills.writing.score}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full gradient-bg transition-all duration-500"
                style={{ width: getProgressWidth(report.skills.writing.score) }}
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{report.skills.writing.feedback}</p>
          </div>

          {/* Speaking */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mic size={24} className="text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Speaking</h3>
              <span className={`ml-auto text-2xl font-bold ${getScoreColor(report.skills.speaking.score)}`}>
                {report.skills.speaking.score}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full gradient-bg transition-all duration-500"
                style={{ width: getProgressWidth(report.skills.speaking.score) }}
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{report.skills.speaking.feedback}</p>
          </div>
        </motion.div>

        {/* Diagnostics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Strengths */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/20 rounded-full p-3">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-400 mb-2">Strengths</h3>
                <p className="text-gray-300 leading-relaxed">{report.diagnostics.strengths}</p>
              </div>
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/20 rounded-full p-3">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Areas for Improvement</h3>
                <p className="text-gray-300 leading-relaxed">{report.diagnostics.weaknesses}</p>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/20 rounded-full p-3">
                <ArrowRight size={24} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Action Plan</h3>
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {report.diagnostics.action_plan}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
