'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Play, Clock, BookOpen, Search, Filter, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

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
  latestAttempt?: {
    id: string;
    status: string;
    startedAt: string;
  };
}

export default function StudentCefrPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<CefrMock[]>([]);
  const [filteredMocks, setFilteredMocks] = useState<CefrMock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('ALL');

  useEffect(() => {
    fetchMocks();
  }, [filterLevel]);

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
      
      const { data } = await api.get('/api/cefr/student/mocks', { params });
      setMocks(data);
      setFilteredMocks(data);
    } catch (error) {
      toast.error('CEFR mocklar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (mockId: string) => {
    try {
      router.push(`/student/cefr/${mockId}`);
    } catch (error) {
      toast.error('Mockni boshlab bo\'lmadi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">CEFR Mock Testlar</h1>
        <p className="text-gray-400">Ingliz tili darajasini aniqlash uchun CEFR mock testlar ({filteredMocks.length} ta)</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
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
      </div>

      {/* Mocks Grid */}
      {filteredMocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMocks.map((mock) => (
            <div key={mock.id} className="glass-dark rounded-2xl p-6 hover:bg-white/5 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
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
                </div>
                {mock.isPaid && (
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400">
                    Pullik
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{mock.title}</h3>
              {mock.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{mock.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{mock.duration} daqiqa</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={16} />
                  <span>Listening, Reading, Writing, Speaking</span>
                </div>
              </div>

              {mock.latestAttempt && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  {mock.latestAttempt.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle size={16} />
                      Tugatilgan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Clock size={16} />
                      Davom etmoqda
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">
                  {mock.isPaid ? `${mock.price.toLocaleString()} UZS` : 'Bepul'}
                </span>
                <button
                  onClick={() => handleStart(mock.id)}
                  className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg font-medium transition hover:opacity-90"
                >
                  {mock.latestAttempt?.status === 'in_progress' ? (
                    <>
                      <ArrowRight size={16} />
                      Davom et
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Boshlash
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <BookOpen size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">CEFR mock testlar topilmadi</h3>
          <p className="text-gray-400">
            {searchQuery || filterLevel !== 'ALL'
              ? 'Qidiruv yoki filtrni o\'zgartiring'
              : 'Hozircha CEFR mock testlar yo\'q'}
          </p>
        </div>
      )}
    </div>
  );
}
