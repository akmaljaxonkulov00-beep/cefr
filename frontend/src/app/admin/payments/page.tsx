'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { CreditCard, RefreshCw, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/manual-payments/pending');
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (id: string) => {
    try {
      await api.post(`/manual-payments/${id}/approve`);
      toast.success('Tasdiqlandi');
      fetchPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const rejectPayment = async (id: string) => {
    const reason = window.prompt('Rad etish sababi') || 'Rad etildi';
    try {
      await api.post(`/manual-payments/${id}/reject`, { reason });
      toast.success('Rad etildi');
      fetchPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">To'lovlar</h1>
            <button
              onClick={fetchPayments}
              className="flex items-center gap-2 px-4 py-2 glass text-gray-200 hover:bg-white/10 rounded-xl"
            >
              <RefreshCw size={18} />
              Yangilash
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Kutilayotgan qo'lda to'lovlar</h3>
              {payments.length === 0 ? (
                <p className="text-gray-400">Navbatda so'rov yo'q.</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((p: any) => (
                    <div key={p.id} className="border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 text-sm">
                        <p className="text-white font-medium">{p.user?.name} — {p.exam?.title}</p>
                        <p className="text-gray-400">{p.user?.email}</p>
                        {p.amountNote && <p className="text-gray-500 mt-1">{p.amountNote}</p>}
                        {p.screenshotKey && (
                          <img
                            src={`/uploads/${p.screenshotKey.replace(/^uploads\//, '')}`}
                            alt="chek"
                            className="mt-2 max-h-40 rounded-lg border border-gray-600"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approvePayment(p.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                        >
                          <Check size={16} />
                          Tasdiqlash
                        </button>
                        <button
                          onClick={() => rejectPayment(p.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/80 text-white text-sm"
                        >
                          <X size={16} />
                          Rad etish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
