'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Edit, FileText, Search, Filter, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface MockPart {
  id: string;
  title: string;
  type: 'IELTS' | 'CEFR';
  skill: 'reading' | 'listening';
  partNumber: number;
  questions: any[];
  price: number;
  status: 'active' | 'draft';
  createdAt: string;
}

export default function AdminMockPartsPage() {
  const router = useRouter();
  const [parts, setParts] = useState<MockPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<MockPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CEFR' | 'IELTS'>('ALL');
  const [filterSkill, setFilterSkill] = useState<'ALL' | 'reading' | 'listening'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'draft'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchParts();
  }, [page, filterType, filterSkill, filterStatus]);

  useEffect(() => {
    let filtered = parts;
    
    if (searchQuery) {
      filtered = filtered.filter(part => 
        part.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredParts(filtered);
  }, [searchQuery, parts]);

  const fetchParts = async () => {
    try {
      const params: any = { page, limit: 10 };
      if (filterType !== 'ALL') params.type = filterType;
      if (filterSkill !== 'ALL') params.skill = filterSkill;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      
      const { data } = await api.get('/mock-parts', { params });
      setParts(data.parts);
      setFilteredParts(data.parts);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error('Partlar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham bu partni o\'chirmoqchimisiz?')) return;

    try {
      await api.delete(`/mock-parts/${id}`);
      toast.success('Part o\'chirildi');
      fetchParts();
    } catch (error) {
      toast.error('Part o\'chirilmadi');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await api.patch(`/mock-parts/${id}/status`, { status: currentStatus === 'active' ? 'draft' : 'active' });
      toast.success('Part holati yangilandi');
      fetchParts();
    } catch (error) {
      toast.error('Part holatini o\'zgartirib bo\'lmadi');
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
            <h1 className="text-3xl font-bold text-white mb-2">Alohida Partlar</h1>
            <p className="text-gray-400">Barcha alohida partlarni boshqarish ({filteredParts.length} ta)</p>
          </div>
          <button
            onClick={() => router.push('/admin/mocks/parts/create')}
            className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
          >
            <Plus size={20} />
            Yangi Part
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Part qidirish..."
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
              onClick={() => setFilterSkill('ALL')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterSkill === 'ALL'
                  ? 'gradient-bg text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterSkill('reading')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterSkill === 'reading'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              📖 Reading
            </button>
            <button
              onClick={() => setFilterSkill('listening')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterSkill === 'listening'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              🎧 Listening
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
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Faol
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

        {/* Parts Table */}
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-medium">Nomi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Turi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Skill</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Part raqami</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Savollar soni</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Narxi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Statusi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Aksiya</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr key={part.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                    <td className="p-4 text-white font-medium">{part.title}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        part.type === 'IELTS'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {part.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        part.skill === 'reading'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {part.skill === 'reading' ? '📖 Reading' : '🎧 Listening'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg bg-gray-700 text-white text-xs font-medium">
                        Part {part.partNumber}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{Array.isArray(part.questions) ? part.questions.length : 0}</td>
                    <td className="p-4 text-gray-300">{part.price === 0 ? 'Bepul' : `${part.price.toLocaleString()} UZS`}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(part.id, part.status)}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                      >
                        {part.status === 'active' ? (
                          <ToggleRight size={20} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={20} className="text-yellow-500" />
                        )}
                        <span className={part.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                          {part.status === 'active' ? 'Faol' : 'Qoralama'}
                        </span>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/mocks/parts/${part.id}`)}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                          title="Ko'rish"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/mocks/parts/${part.id}/edit`)}
                          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          title="Tahrirlash"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
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

          {filteredParts.length === 0 && (
            <div className="text-center py-16">
              <FileText size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Partlar topilmadi</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || filterType !== 'ALL' || filterSkill !== 'ALL' || filterStatus !== 'ALL'
                  ? 'Qidiruv yoki filtrni o\'zgartiring'
                  : 'Hozircha partlar yo\'q'}
              </p>
              {!searchQuery && filterType === 'ALL' && filterSkill === 'ALL' && filterStatus === 'ALL' && (
                <button
                  onClick={() => router.push('/admin/mocks/parts/create')}
                  className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
                >
                  Birinchi Part Qo'shish
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
      </main>
    </div>
  );
}
