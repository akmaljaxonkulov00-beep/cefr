'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { DollarSign, Activity, TrendingUp, Building2 } from 'lucide-react';

export default function AdminReports() {
  const [revenue, setRevenue] = useState<any>(null);
  const [participation, setParticipation] = useState<any>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const [revenueRes, participationRes, centersRes] = await Promise.all([
        api.get('/reports/revenue', { params: { period } }),
        api.get('/reports/participation'),
        api.get('/reports/centers'),
      ]);
      setRevenue(revenueRes.data);
      setParticipation(participationRes.data);
      setCenters(centersRes.data);
    } catch (error) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-6">Hisobotlar</h1>

          {/* Period Filter */}
          <div className="flex gap-2 mb-6">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === p
                    ? 'gradient-bg text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {p === 'daily' ? 'Kunlik' : p === 'weekly' ? 'Haftalik' : p === 'monthly' ? 'Oylik' : 'Yillik'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Tushgan pul (UZS)', value: revenue?.totalRevenue?.toLocaleString() || '0', icon: DollarSign, color: 'text-emerald-400' },
                  { label: 'Qatnashganlar', value: participation?.totalParticipants || 0, icon: Activity, color: 'text-amber-400' },
                  { label: 'To\'lovlar soni', value: revenue?.paymentCount || 0, icon: TrendingUp, color: 'text-primary-400' },
                  { label: 'O\'quv markazlari', value: centers.length, icon: Building2, color: 'text-accent-400' },
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

              {/* Centers Report */}
              <div className="glass-dark rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">O'quv Markazlari</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-3 text-gray-400">Nomi</th>
                        <th className="text-left p-3 text-gray-400">O'quvchilar</th>
                        <th className="text-left p-3 text-gray-400">Mock Limit</th>
                        <th className="text-left p-3 text-gray-400">Mock topshirgan</th>
                        <th className="text-left p-3 text-gray-400">Tushgan pul (UZS)</th>
                        <th className="text-left p-3 text-gray-400">Yaratilgan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centers.map((center: any) => (
                        <tr key={center.id} className="border-b border-gray-800">
                          <td className="p-3 text-white">{center.name}</td>
                          <td className="p-3 text-gray-400">{center.studentCount}</td>
                          <td className="p-3 text-gray-300">{center.mockLimit}</td>
                          <td className="p-3 text-gray-300">{center.examsTaken || 0}</td>
                          <td className="p-3 text-emerald-400">{center.totalRevenue?.toLocaleString() || '0'}</td>
                          <td className="p-3 text-gray-400">
                            {new Date(center.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
