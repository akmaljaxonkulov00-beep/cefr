'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { BarChart3, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function CenterAdminResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/exams/results/center');
      setResults(data);
    } catch (error) {
      console.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-6">Natijalar</h1>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-gray-400">O'quvchi</th>
                      <th className="text-left p-3 text-gray-400">Imtihon</th>
                      <th className="text-left p-3 text-gray-400">Ball</th>
                      <th className="text-left p-3 text-gray-400">CEFR</th>
                      <th className="text-left p-3 text-gray-400">Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result: any) => (
                      <tr key={result.id} className="border-b border-gray-800">
                        <td className="p-3 text-white">{result.user?.name || '—'}</td>
                        <td className="p-3 text-gray-400">{result.exam?.title || '—'}</td>
                        <td className="p-3 text-gray-300">{Math.round(result.score)}%</td>
                        <td className="p-3 text-gray-300">{result.cefrLevel || '—'}</td>
                        <td className="p-3 text-gray-400">
                          {new Date(result.completedAt).toLocaleDateString('uz-UZ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
