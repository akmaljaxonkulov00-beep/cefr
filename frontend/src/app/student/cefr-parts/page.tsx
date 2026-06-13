'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Headphones, ArrowRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

type SkillType = 'READING' | 'LISTENING';

export default function CefrPartsPage() {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);

  const handleSkillSelect = (skill: SkillType) => {
    setSelectedSkill(skill);
    // Navigate to parts list for selected skill
    router.push(`/student/cefr-parts/${skill.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">CEFR Partlar</h1>
            <p className="text-gray-400">Alohida partlar bilan ishlash (Reading yoki Listening)</p>
          </div>

          {/* Skill Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Reading Card */}
            <motion.button
              onClick={() => handleSkillSelect('READING')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-8 text-left overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <BookOpen size={48} className="mb-4" />
                <h2 className="text-2xl font-bold mb-2">Reading</h2>
                <p className="text-blue-100 mb-4">
                  O'qish ko'nikmalarini tekshirish
                </p>
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-lg font-medium">5 ta part</span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-white">
                  <span>Partlar ro'yxatiga o'tish</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </motion.button>

            {/* Listening Card */}
            <motion.button
              onClick={() => handleSkillSelect('LISTENING')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-8 text-left overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <Headphones size={48} className="mb-4" />
                <h2 className="text-2xl font-bold mb-2">Listening</h2>
                <p className="text-purple-100 mb-4">
                  Tinglash ko'nikmalarini tekshirish
                </p>
                <div className="flex items-center gap-2 text-purple-200 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-lg font-medium">6 ta part</span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-white">
                  <span>Partlar ro'yxatiga o'tish</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </motion.button>
          </div>

          {/* Info Section */}
          <div className="mt-8 glass-dark rounded-2xl p-6 max-w-4xl">
            <h3 className="text-lg font-semibold text-white mb-3">Qanday ishlaydi?</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-1">1.</span>
                <span>Skill turini tanlang (Reading yoki Listening)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-1">2.</span>
                <span>Ishlashni istagan partni tanlang</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-1">3.</span>
                <span>Testni ishlang va javoblarni yuboring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-1">4.</span>
                <span>Natijalarni ko'ring (to'g'ri/noto'g'ri javoblar bilan)</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
