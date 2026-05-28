'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Edit, FileText, Clock, Users, Search, Filter, MoreVertical, Eye, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface MockTest {
  id: string;
  title: string;
  type: 'MOCK_IELTS' | 'MOCK_CEFR' | 'IELTS_ACADEMIC' | 'IELTS_GENERAL' | 'CEFR_B1' | 'CEFR_B2' | 'CEFR_C1';
  level: string;
  duration: number;
  createdAt: string;
  isPublished: boolean;
  requiresPayment?: boolean;
  priceUzs?: number;
  paymentInstructions?: string;
  _count?: {
    results: number;
  };
}

export default function AdminMocksPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [filteredMocks, setFilteredMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CEFR' | 'IELTS'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'full' | 'parts'>('full');

  useEffect(() => {
    fetchMocks();
  }, [page, filterType, filterStatus]);

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
      const params: any = { page, limit: 10 };
      if (filterType !== 'ALL') params.type = filterType;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      
      const { data } = await api.get('/mocks', { params });
      setMocks(data.mocks);
      setFilteredMocks(data.mocks);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error('Mocklar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham bu mockni o\'chirmoqchimisiz?')) return;

    try {
      await api.delete(`/mocks/${id}`);
      toast.success('Mock o\'chirildi');
      fetchMocks();
    } catch (error) {
      toast.error('Mock o\'chirilmadi');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/mocks/${id}/status`, { status: currentStatus ? 'DRAFT' : 'ACTIVE' });
      toast.success('Mock holati yangilandi');
      fetchMocks();
    } catch (error) {
      toast.error('Mock holatini o\'zgartirib bo\'lmadi');
    }
  };

  const getTypeLabel = (type: string) => {
    if (type.includes('IELTS')) return 'IELTS';
    if (type.includes('CEFR')) return 'CEFR';
    return type;
  };

  const getTypeColor = (type: string) => {
    if (type.includes('IELTS')) return 'blue';
    if (type.includes('CEFR')) return 'emerald';
    return 'primary';
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
            <h1 className="text-3xl font-bold text-white mb-2">Mocklar</h1>
            <p className="text-gray-400">Barcha mock testlarni boshqarish ({filteredMocks.length} ta)</p>
          </div>
          {activeTab === 'full' ? (
            <button
              onClick={() => router.push('/admin/mocks/create')}
              className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
            >
              <Plus size={20} />
              Yangi Mock
            </button>
          ) : (
            <button
              onClick={() => router.push('/admin/mocks/parts/create')}
              className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
            >
              <Plus size={20} />
              Yangi Part
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('full')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'full'
                ? 'gradient-bg text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            To'liq Mocklar
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'parts'
                ? 'gradient-bg text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Alohida Partlar
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'full' ? (
          <>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Mock qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-4 py-3 rounded-xl font-medium transition ${
                    filterType === 'ALL'
                      ? 'gradient-bg text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Barchasi
                </button>
                <button
                  onClick={() => setFilterType('CEFR')}
                  className={`px-4 py-3 rounded-xl font-medium transition ${
                    filterType === 'CEFR'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  CEFR
                </button>
                <button
                  onClick={() => setFilterType('IELTS')}
                  className={`px-4 py-3 rounded-xl font-medium transition ${
                    filterType === 'IELTS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  IELTS
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
                  onClick={() => setFilterStatus('ACTIVE')}
                  className={`px-4 py-3 rounded-xl font-medium transition ${
                    filterStatus === 'ACTIVE'
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Faol
                </button>
                <button
                  onClick={() => setFilterStatus('DRAFT')}
                  className={`px-4 py-3 rounded-xl font-medium transition ${
                    filterStatus === 'DRAFT'
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
                      <th className="text-left p-4 text-gray-400 font-medium">Turi</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Bo'limlar</th>
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
                            getTypeColor(mock.type) === 'blue'
                              ? 'bg-blue-500/20 text-blue-400'
                              : getTypeColor(mock.type) === 'emerald'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-primary-500/20 text-primary-400'
                          }`}>
                            {getTypeLabel(mock.type)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <span className="text-lg">🎧</span>
                            <span className="text-lg">📖</span>
                            <span className="text-lg">✍️</span>
                            <span className="text-lg">🗣️</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">
                          {mock.requiresPayment ? `${mock.priceUzs?.toLocaleString()} UZS` : 'Bepul'}
                        </td>
                        <td className="p-4 text-gray-300">{mock._count?.results || 0}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStatus(mock.id, mock.isPublished)}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                          >
                            {mock.isPublished ? (
                              <ToggleRight size={20} className="text-green-500" />
                            ) : (
                              <ToggleLeft size={20} className="text-yellow-500" />
                            )}
                            <span className={mock.isPublished ? 'text-green-400' : 'text-yellow-400'}>
                              {mock.isPublished ? 'Faol' : 'Qoralama'}
                            </span>
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/mocks/${mock.id}`)}
                              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                              title="Ko'rish"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/mocks/${mock.id}/edit`)}
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
                  <h3 className="text-xl font-semibold text-white mb-2">Mock testlar topilmadi</h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL'
                      ? 'Qidiruv yoki filtrni o\'zgartiring'
                      : 'Hozircha mock testlar yo\'q'}
                  </p>
                  {!searchQuery && filterType === 'ALL' && filterStatus === 'ALL' && (
                    <button
                      onClick={() => router.push('/admin/mocks/create')}
                      className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
                    >
                      Birinchi Mock Qo'shish
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-800">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                  >
                    Oldingi
                  </button>
                  <span className="text-gray-400">
                    Sahifa {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                  >
                    Keyingi
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-dark rounded-2xl p-8 text-center">
            <p className="text-gray-400">Alohida Partlar uchun /admin/mocks/parts sahifasidan foydalaning</p>
            <button
              onClick={() => router.push('/admin/mocks/parts')}
              className="mt-4 px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
            >
              Partlarga o'tish
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
