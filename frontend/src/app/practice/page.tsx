'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { BookOpen, Headphones, PenLine, Mic, ArrowRight, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

type ExamType = 'CEFR' | 'IELTS';
type Skill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';

interface Part {
  part: string;
  questions: any[];
}

interface SkillParts {
  [key: string]: Part;
}

export default function PracticePage() {
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examParts, setExamParts] = useState<any>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const skills = [
    { key: 'READING', icon: BookOpen, label: 'Reading', color: 'text-blue-400' },
    { key: 'LISTENING', icon: Headphones, label: 'Listening', color: 'text-emerald-400' },
    { key: 'WRITING', icon: PenLine, label: 'Writing', color: 'text-amber-400' },
    { key: 'SPEAKING', icon: Mic, label: 'Speaking', color: 'text-purple-400' },
  ];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data);
    } catch (error) {
      toast.error('Imtihonlar yuklanmadi');
    }
  };

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type);
    setSelectedSkill(null);
    setSelectedExam(null);
    setExamParts(null);
    setSelectedPart(null);
  };

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    setSelectedPart(null);
  };

  const handleExamSelect = async (exam: any) => {
    setSelectedExam(exam);
    setLoading(true);
    try {
      const { data } = await api.get(`/exams/${exam.id}/parts`);
      setExamParts(data as any);
    } catch (error) {
      toast.error('Qismlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  const handlePartSelect = (part: string) => {
    setSelectedPart(part);
  };

  const startPractice = async () => {
    if (!selectedExam || !selectedSkill || !selectedPart) {
      toast.error('Iltimos, barcha tanlovlarni amalga oshiring');
      return;
    }

    try {
      const { data } = await api.get(`/exams/${selectedExam.id}/questions`, {
        params: { skill: selectedSkill, part: selectedPart },
      });
      
      // Navigate to practice session with the questions
      // For now, just show a success message
      toast.success(`${selectedSkill} ${selectedPart} qismi boshlandi`);
      console.log('Questions:', data);
    } catch (error) {
      toast.error('Savollar yuklanmadi');
    }
  };

  const getAvailableParts = () => {
    if (!examParts || !selectedSkill) return [];
    const skillParts = (examParts as any).parts[selectedSkill];
    return skillParts ? Object.values(skillParts) : [];
  };

  const getRandomPart = () => {
    const availableParts = getAvailableParts();
    if (availableParts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableParts.length);
    return (availableParts[randomIndex] as any).part;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Amaliyot</h1>
          <p className="text-gray-400 mb-8">IELTS yoki CEFR mock testlari bilan mashq qiling</p>

          {/* Step 1: Select Exam Type */}
          {!examType && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-white mb-6">Imtihon turini tanlang</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(['CEFR', 'IELTS'] as ExamType[]).map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => handleExamTypeSelect(type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass-dark rounded-2xl p-8 text-left transition ${
                      type === 'CEFR' ? 'hover:border-emerald-500/50' : 'hover:border-blue-500/50'
                    } border-2 border-transparent`}
                  >
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                      type === 'CEFR' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                    }`}>
                      <BookOpen size={32} className={type === 'CEFR' ? 'text-emerald-400' : 'text-blue-400'} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{type}</h3>
                    <p className="text-gray-400">
                      {type === 'CEFR' ? 'A1-C2 darajalari uchun CEFR formatidagi testlar' : 'Akademik va General IELTS testlari'}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Skill */}
          {examType && !selectedSkill && (
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setExamType(null)}
                className="mb-6 text-gray-400 hover:text-white flex items-center gap-2"
              >
                ← Orqaga
              </button>
              <h2 className="text-xl font-semibold text-white mb-6">Ko\'nikma tanlang</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <motion.button
                    key={skill.key}
                    onClick={() => handleSkillSelect(skill.key as Skill)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-dark rounded-xl p-6 text-left transition hover:bg-white/10"
                  >
                    <skill.icon size={32} className={skill.color + ' mb-3'} />
                    <h3 className="text-lg font-semibold text-white">{skill.label}</h3>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Exam */}
          {examType && selectedSkill && !selectedExam && (
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setSelectedSkill(null)}
                className="mb-6 text-gray-400 hover:text-white flex items-center gap-2"
              >
                ← Orqaga
              </button>
              <h2 className="text-xl font-semibold text-white mb-6">
                {examType} {selectedSkill} testini tanlang
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams
                  .filter((exam) => exam.type === (examType === 'CEFR' ? 'MOCK_CEFR' : 'MOCK_IELTS'))
                  .map((exam) => (
                    <motion.button
                      key={exam.id}
                      onClick={() => handleExamSelect(exam)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="glass-dark rounded-xl p-6 text-left transition hover:bg-white/10"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">{exam.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{exam.level}</span>
                        <span>{exam.duration} daqiqa</span>
                      </div>
                    </motion.button>
                  ))}
              </div>
            </div>
          )}

          {/* Step 4: Select Part */}
          {examType && selectedSkill && selectedExam && (
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setSelectedExam(null)}
                className="mb-6 text-gray-400 hover:text-white flex items-center gap-2"
              >
                ← Orqaga
              </button>
              <h2 className="text-xl font-semibold text-white mb-6">
                {selectedExam.title} - {selectedSkill} qismini tanlang
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Yuklanmoqda...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        const randomPart = getRandomPart();
                        if (randomPart) setSelectedPart(randomPart);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition"
                    >
                      <ArrowRight size={20} />
                      Tasodifiy qismni tanlash
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAvailableParts().map((partData: any) => (
                      <motion.button
                        key={partData.part}
                        onClick={() => handlePartSelect(partData.part)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`glass-dark rounded-xl p-6 text-left transition ${
                          selectedPart === partData.part ? 'border-2 border-primary-500' : 'hover:bg-white/10'
                        }`}
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {selectedSkill} Part {partData.part}
                        </h3>
                        <p className="text-gray-400 text-sm">{partData.questions?.length || 0} savol</p>
                      </motion.button>
                    ))}
                  </div>

                  {selectedPart && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8"
                    >
                      <button
                        onClick={startPractice}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 gradient-bg hover:gradient-bg-hover text-white rounded-xl font-semibold transition"
                      >
                        <BookOpen size={24} />
                        Boshlash - {selectedSkill} Part {selectedPart}
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
