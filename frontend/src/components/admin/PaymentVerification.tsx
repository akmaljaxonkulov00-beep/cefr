'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  studentId: string;
  mockPartId: string;
  amount: number;
  checkImageUrl: string;
  status: string;
  aiVerdict: any;
  createdAt: string;
}

export default function PaymentVerification() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ paymentId: string; reason: string } | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/mock-payments/pending');
      setPayments(data);
    } catch (error) {
      toast.error('To\'lovlarni yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    try {
      await api.patch(`/mock-payments/${paymentId}/status`, { status: 'approved' });
      toast.success('To\'lov tasdiqlandi');
      fetchPayments();
    } catch (error) {
      toast.error('Tasdiqlashda xatolik');
    }
  };

  const handleReject = async () => {
    if (!rejectModal?.reason.trim()) {
      toast.error('Rad etish sababini kiriting');
      return;
    }

    try {
      await api.patch(`/mock-payments/${rejectModal.paymentId}/status`, {
        status: 'rejected',
        reason: rejectModal.reason,
      });
      toast.success('To\'lov rad etildi');
      setRejectModal(null);
      fetchPayments();
    } catch (error) {
      toast.error('Rad etishda xatolik');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Kutilayotgan To\'lovlar</h3>

      {payments.length === 0 ? (
        <div className="glass-dark rounded-xl p-8 text-center text-gray-400">
          Kutilayotgan to\'lovlar yo\'q
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="glass-dark rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                      {payment.status === 'pending' ? 'AI tekshirilmoqda' : 'Qo\'lda tekshirilmoqda'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(payment.createdAt).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Summa:</span>
                      <span className="text-white font-medium">{payment.amount.toLocaleString()} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Student ID:</span>
                      <span className="text-white">{payment.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mock Part ID:</span>
                      <span className="text-white">{payment.mockPartId}</span>
                    </div>
                  </div>

                  {payment.aiVerdict && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">AI qarori:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valid:</span>
                          <span className={payment.aiVerdict.isValid ? 'text-green-400' : 'text-red-400'}>
                            {payment.aiVerdict.isValid ? 'Ha' : 'Yo\'q'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ishonch:</span>
                          <span className="text-white">{payment.aiVerdict.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Summa:</span>
                          <span className="text-white">{payment.aiVerdict.amount || 'N/A'}</span>
                        </div>
                        <p className="text-gray-300 mt-1">{payment.aiVerdict.reason}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      onClick={() => window.open(payment.checkImageUrl, '_blank')}
                      className="flex items-center gap-2 text-primary-400 text-sm hover:underline"
                    >
                      <Eye size={14} />
                      Chek rasmini ko'rish
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(payment.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    <CheckCircle size={16} />
                    Tasdiqlash
                  </button>
                  <button
                    onClick={() => setRejectModal({ paymentId: payment.id, reason: '' })}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                  >
                    <XCircle size={16} />
                    Rad etish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Rad etish sababi</h3>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Rad etish sababini kiriting..."
              className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition min-h-[100px] resize-none mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold transition hover:bg-white/20"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold transition hover:bg-red-700"
              >
                Rad etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
