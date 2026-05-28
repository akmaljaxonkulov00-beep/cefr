'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Edit, Users, TrendingUp, DollarSign, FileText, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MockDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [mock, setMock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchMock(params.id as string);
    }
  }, [params.id]);

  const fetchMock = async (id: string) => {
    try {
      const { data } = await api.get(`/mocks/${id}`);
      setMock(data);
    } catch (error) {
      toast.error('Mock yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!mock) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="text-center py-16">
            <FileText size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Mock topilmadi</h3>
          </div>
        </main>
      </div>
    );
  }

  const typeLabel = mock.type.includes('IELTS') ? 'IELTS' : 'CEFR';
  const typeColor = mock.type.includes('IELTS') ? 'blue' : 'emerald';

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{mock.title}</h1>
            <p className="text-gray-400 text-sm">
              {typeLabel} • {mock.level}
            </p>
          </div>
          <button
            onClick={() => router.push(`/admin/mocks/${mock.id}/edit`)}
            className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
          >
            <Edit size={20} />
            Tahrirlash
          </button>
        </div>

        {/* Section Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SectionCard icon="🎧" title="Listening" status="warning" count="0/4" />
          <SectionCard icon="📖" title="Reading" status="warning" count="0/3" />
          <SectionCard icon="✍️" title="Writing" status="warning" count="0/2" />
          <SectionCard icon="🗣️" title="Speaking" status="warning" count="0/3" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Jami urinishlar" value={mock.totalAttempts || 0} />
          <StatCard icon={TrendingUp} label="O'rtacha band" value="—" />
          <StatCard icon={FileText} label="O'tish %" value="—" />
          <StatCard icon={DollarSign} label="Tushum" value={mock.requiresPayment ? `${mock.priceUzs?.toLocaleString()} UZS` : 'Bepul'} />
        </div>

        {/* Results Button */}
        <div className="glass-dark rounded-2xl p-6">
          <button
            onClick={() => router.push(`/admin/mocks/${mock.id}/results`)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
          >
            Natijalarni ko'rish
            <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}

function SectionCard({ icon, title, status, count }: { icon: string; title: string; status: 'success' | 'warning' | 'error'; count: string }) {
  const statusColors = {
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="glass-dark rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-white font-medium">{title}</h3>
          <p className={`text-sm ${statusColors[status]}`}>{count}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass-dark rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-500/20 rounded-lg">
          <Icon size={20} className="text-primary-400" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
