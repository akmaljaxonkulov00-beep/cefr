'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Edit, FileText, Search, Filter, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface CefrMock {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  description?: string;
  duration: number;
  price: number;
  isPaid: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  _count?: {
    attempts: number;
  };
}

export default function AdminCefrPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<CefrMock[]>([]);
  const [filteredMocks, setFilteredMocks] = useState<CefrMock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'published' | 'draft'>('ALL');

  useEffect(() => {
    fetchMocks();
  }, [filterLevel, filterStatus]);

  useEffect(() => {
    let filtered = mocks;
    
    if (searchQuery) {
      filtered = filtered.filter(mock => 
        mock.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredMocks(filtered);
  }, [searchQuery, mocks]);

  const fetchMocks = async () => {
    try {
      const params: any = {};
      if (filterLevel !== 'ALL') params.level = filterLevel;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      
      const { data } = await api.get('/api/cefr/mocks', { params });
      setMocks(data);
      setFilteredMocks(data);
    } catch (error) {
      toast.error('CEFR mocklar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham bu CEFR mockni o\'chirmoqchimisiz?')) return;

    try {
      await api.delete(`/api/cefr/mocks/${id}`);
      toast.success('CEFR mock o\'chirildi');
      fetchMocks();
    } catch (error) {
      toast.error('CEFR mock o\'chirilmadi');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/api/cefr/mocks/${id}/status`);
      toast.success('CEFR mock holati yangilandi');
      fetchMocks();
    } catch (error) {
      toast.error('CEFR mock holatini o\'zgartirib bo\'lmadi');
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

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CEFR Mocklar</h1>
            <p className="text-gray-400">Barcha CEFR mock testlarni boshqarish ({filteredMocks.length} ta)</p>
          </div>
          <button
            onClick={() => router.push('/admin/cefr/create')}
            className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
          >
            <Plus size={20} />
            Yangi CEFR Mock
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="CEFR mock qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-gray-700 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'ALL'
                  ? 'gradient-bg text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterLevel('A1')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'A1'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              A1
            </button>
            <button
              onClick={() => setFilterLevel('A2')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'A2'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              A2
            </button>
            <button
              onClick={() => setFilterLevel('B1')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'B1'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              B1
            </button>
            <button
              onClick={() => setFilterLevel('B2')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'B2'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              B2
            </button>
            <button
              onClick={() => setFilterLevel('C1')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'C1'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              C1
            </button>
            <button
              onClick={() => setFilterLevel('C2')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterLevel === 'C2'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              C2
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterStatus === 'ALL'
                  ? 'gradient-bg text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterStatus === 'published'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              E'lon qilingan
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterStatus === 'draft'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Qoralama
            </button>
          </div>
        </div>

        {/* Mocks Table */}
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-medium">Nomi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Daraja</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Davomiylik</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Narxi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Topshirganlar</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Statusi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Aksiya</th>
                </tr>
              </thead>
              <tbody>
                {filteredMocks.map((mock) => (
                  <tr key={mock.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                    <td className="p-4 text-white font-medium">{mock.title}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        mock.level === 'A1' ? 'bg-gray-500/20 text-gray-400' :
                        mock.level === 'A2' ? 'bg-purple-500/20 text-purple-400' :
                        mock.level === 'B1' ? 'bg-blue-500/20 text-blue-400' :
                        mock.level === 'B2' ? 'bg-green-500/20 text-green-400' :
                        mock.level === 'C1' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {mock.level}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{mock.duration} daqiqa</td>
                    <td className="p-4 text-gray-300">
                      {mock.isPaid ? `${mock.price.toLocaleString()} UZS` : 'Bepul'}
                    </td>
                    <td className="p-4 text-gray-300">{mock._count?.attempts || 0}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(mock.id)}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                      >
                        {mock.status === 'published' ? (
                          <ToggleRight size={20} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={20} className="text-yellow-500" />
                        )}
                        <span className={mock.status === 'published' ? 'text-green-400' : 'text-yellow-400'}>
                          {mock.status === 'published' ? 'E\'lon qilingan' : 'Qoralama'}
                        </span>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/cefr/${mock.id}`)}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                          title="Ko'rish"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/cefr/${mock.id}/edit`)}
                          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          title="Tahrirlash"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(mock.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                          title="O'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMocks.length === 0 && (
            <div className="text-center py-16">
              <FileText size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">CEFR mock testlar topilmadi</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || filterLevel !== 'ALL' || filterStatus !== 'ALL'
                  ? 'Qidiruv yoki filtrni o\'zgartiring'
                  : 'Hozircha CEFR mock testlar yo\'q'}
              </p>
              {!searchQuery && filterLevel === 'ALL' && filterStatus === 'ALL' && (
                <button
                  onClick={() => router.push('/admin/cefr/create')}
                  className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
                >
                  Birinchi CEFR Mock Qo'shish
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
