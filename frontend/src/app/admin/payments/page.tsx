'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { CreditCard, RefreshCw, Check, X, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      let endpoint = '/manual-payments/pending';
      if (activeTab === 'approved') endpoint = '/manual-payments/approved';
      else if (activeTab === 'rejected') endpoint = '/manual-payments/rejected';
      else if (activeTab === 'all') endpoint = '/manual-payments/all';
      
      const { data } = await api.get(endpoint);
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

  const aiCheckPayment = async (id: string) => {
    try {
      const { data } = await api.post(`/manual-payments/${id}/ai-verify`);
      toast.success(data.action === 'approved' ? 'AI tasdiqladi' : 'AI rad etildi: ' + data.reason);
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

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'pending' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              Kutilayotgan
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'approved' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              Tasdiqlangan
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'rejected' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              Rad etilgan
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'all' ? 'gradient-bg text-white' : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              Barchasi
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
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowReceiptModal(true);
                            }}
                            className="mt-2"
                          >
                            <img
                              src={`/uploads/${p.screenshotKey.replace(/^uploads\//, '')}`}
                              alt="chek"
                              className="max-h-40 rounded-lg border border-gray-600 hover:border-primary-500 transition cursor-pointer"
                            />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => aiCheckPayment(p.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
                          title="AI tekshirish"
                        >
                          <Bot size={16} />
                          AI Check
                        </button>
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

        {showReceiptModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-dark rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Chek to'liq ko'rinishi</h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <img
                src={`/uploads/${selectedPayment.screenshotKey.replace(/^uploads\//, '')}`}
                alt="Chek to'liq"
                className="max-w-full h-auto rounded-lg"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    approvePayment(selectedPayment.id);
                    setShowReceiptModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white"
                >
                  <Check size={16} />
                  Tasdiqlash
                </button>
                <button
                  onClick={() => {
                    rejectPayment(selectedPayment.id);
                    setShowReceiptModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600/80 text-white"
                >
                  <X size={16} />
                  Rad etish
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
