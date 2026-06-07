'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Play, Clock, BookOpen, Mic, PenLine, Search, Filter, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

interface IeltsMock {
  id: string;
  title: string;
  type: 'Academic' | 'General';
  description?: string;
  price: number;
  status: 'draft' | 'active';
  listening?: { duration: number };
  reading?: { duration: number };
  writing?: { duration: number };
  speaking?: { duration: number };
  attempts?: any[];
  latestAttempt?: any;
}

export default function IeltsPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<IeltsMock[]>([]);
  const [filteredMocks, setFilteredMocks] = useState<IeltsMock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Academic' | 'General'>('ALL');

  useEffect(() => {
    fetchMocks();
  }, [filterType]);

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
      if (filterType !== 'ALL') params.type = filterType;
      
      const { data } = await api.get('/api/ielts/student/mocks', { params });
      setMocks(data);
      setFilteredMocks(data);
    } catch (error) {
      toast.error('IELTS mocklar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (mockId: string) => {
    try {
      await api.post(`/ielts/student/mocks/${mockId}/start`);
      router.push(`/ielts/${mockId}`);
    } catch (error) {
      toast.error('Imtihonni boshlashda xatolik');
    }
  };

  const handleContinueExam = (mockId: string) => {
    router.push(`/ielts/${mockId}`);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">IELTS Mock Tests</h1>
          <p className="text-gray-400">Haqiqiy IELTS imtihoniga tayyorlaning</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="IELTS mock qidirish..."
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
              onClick={() => setFilterType('Academic')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterType === 'Academic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Academic
            </button>
            <button
              onClick={() => setFilterType('General')}
              className={`px-4 py-3 rounded-xl font-medium transition ${
                filterType === 'General'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              General
            </button>
          </div>
        </div>

        {/* Mocks Grid */}
        {filteredMocks.length === 0 ? (
          <div className="glass-dark rounded-2xl p-16 text-center">
            <FileText size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">IELTS mock testlar topilmadi</h3>
            <p className="text-gray-400">
              {searchQuery || filterType !== 'ALL'
                ? 'Qidiruv yoki filtrni o\'zgartiring'
                : 'Hozircha IELTS mock testlar yo\'q'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMocks.map((mock) => (
              <div key={mock.id} className="glass-dark rounded-2xl p-6 hover:border-primary-500/50 transition">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    mock.type === 'Academic'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {mock.type}
                  </span>
                  {mock.price > 0 && (
                    <span className="text-primary-400 font-semibold">{mock.price.toLocaleString()} UZS</span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{mock.title}</h3>
                {mock.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{mock.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock size={16} />
                    <span>{mock.listening?.duration || 30}d Listening</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <BookOpen size={16} />
                    <span>{mock.reading?.duration || 60}d Reading</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <PenLine size={16} />
                    <span>{mock.writing?.duration || 60}d Writing</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Mic size={16} />
                    <span>{mock.speaking?.duration || 15}d Speaking</span>
                  </div>
                </div>

                {mock.latestAttempt && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Oxinchi urinish</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        Band: {mock.latestAttempt.totalBand || '-'}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(mock.latestAttempt.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {mock.latestAttempt?.status === 'in_progress' ? (
                  <button
                    onClick={() => handleContinueExam(mock.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition"
                  >
                    <Play size={18} />
                    Davom ettirish
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartExam(mock.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 gradient-bg text-white rounded-xl font-semibold hover:opacity-90 transition"
                  >
                    <Play size={18} />
                    Boshlash
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
