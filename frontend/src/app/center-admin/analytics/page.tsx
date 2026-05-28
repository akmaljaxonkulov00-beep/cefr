'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { LineChart, TrendingUp, Users, BookOpen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function CenterAdminAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes] = await Promise.all([
        api.get('/users/center-students'),
      ]);
      setStats({
        totalStudents: studentsRes.data.length,
        activeStudents: studentsRes.data.filter((s: any) => s.role === 'STUDENT').length,
      });
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-6">Statistika</h1>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Barcha o\'quvchilar', value: stats?.totalStudents || 0, color: 'text-primary-400' },
                { icon: TrendingUp, label: 'Faol o\'quvchilar', value: stats?.activeStudents || 0, color: 'text-emerald-400' },
                { icon: BookOpen, label: 'Imtihonlar', value: '0', color: 'text-amber-400' },
                { icon: LineChart, label: 'O\'rtacha ball', value: '0%', color: 'text-accent-400' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-dark rounded-xl p-5"
                >
                  <stat.icon size={24} className={stat.color + ' mb-3'} />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
