'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

export default function CenterAdminPricing() {
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPrices, setEditPrices] = useState({
    mockCefrUzs: 0,
    mockIeltsUzs: 0,
    readingUzs: 0,
    listeningUzs: 0,
    writingUzs: 0,
    speakingUzs: 0,
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data } = await api.get('/settings/pricing');
      setPrices(data);
      setEditPrices({
        mockCefrUzs: data?.mockCefrUzs || 0,
        mockIeltsUzs: data?.mockIeltsUzs || 0,
        readingUzs: data?.readingUzs || 0,
        listeningUzs: data?.listeningUzs || 0,
        writingUzs: data?.writingUzs || 0,
        speakingUzs: data?.speakingUzs || 0,
      });
    } catch (error) {
      console.error('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/pricing', editPrices);
      toast.success('Narxlar yangilandi');
      fetchPrices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Yangilash xatosi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-6">Narxlar</h1>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: 'mockCefrUzs', label: 'Mock CEFR (UZS)', icon: DollarSign },
                  { key: 'mockIeltsUzs', label: 'Mock IELTS (UZS)', icon: DollarSign },
                  { key: 'readingUzs', label: 'Reading (UZS)', icon: DollarSign },
                  { key: 'listeningUzs', label: 'Listening (UZS)', icon: DollarSign },
                  { key: 'writingUzs', label: 'Writing (UZS)', icon: DollarSign },
                  { key: 'speakingUzs', label: 'Speaking (UZS)', icon: DollarSign },
                ].map((item) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <item.icon size={20} className="text-primary-400" />
                      <span className="text-gray-400 text-sm">{item.label}</span>
                    </div>
                    <input
                      type="number"
                      value={editPrices[item.key as keyof typeof editPrices]}
                      onChange={(e) =>
                        setEditPrices({
                          ...editPrices,
                          [item.key]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white text-lg"
                    />
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                <button
                  onClick={fetchPrices}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl"
                >
                  <RefreshCw size={18} />
                  Qayta yuklash
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
