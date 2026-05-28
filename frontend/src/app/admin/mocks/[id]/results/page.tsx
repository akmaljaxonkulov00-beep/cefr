'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Download, Filter, Search, Award, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MockResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [results, setResults] = useState<any[]>([]);
  const [mock, setMock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchResults();
      fetchMock(params.id as string);
    }
  }, [params.id, filterStatus, dateFrom, dateTo]);

  const fetchResults = async () => {
    try {
      const paramsObj: any = {};
      if (filterStatus !== 'ALL') paramsObj.status = filterStatus;
      if (dateFrom) paramsObj.dateFrom = dateFrom;
      if (dateTo) paramsObj.dateTo = dateTo;

      const { data } = await api.get(`/mocks/${params.id}/results`, { params: paramsObj });
      setResults(data);
    } catch (error) {
      toast.error('Natijalar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const fetchMock = async (id: string) => {
    try {
      const { data } = await api.get(`/mocks/${id}`);
      setMock(data);
    } catch (error) {
      // Ignore error
    }
  };

  const handleExport = () => {
    toast.success('Export tez orada qo\'shiladi');
  };

  const handleOverrideScore = async (resultId: string) => {
    const listening = prompt('Listening balli:');
    if (listening === null) return;
    
    const reading = prompt('Reading balli:');
    if (reading === null) return;
    
    const writing = prompt('Writing balli:');
    if (writing === null) return;
    
    const speaking = prompt('Speaking balli:');
    if (speaking === null) return;

    try {
      await api.patch(`/mocks/${params.id}/results/${resultId}/score`, {
        listening: parseFloat(listening) || undefined,
        reading: parseFloat(reading) || undefined,
        writing: parseFloat(writing) || undefined,
        speaking: parseFloat(speaking) || undefined,
      });
      toast.success('Ball yangilandi');
      fetchResults();
    } catch (error) {
      toast.error('Ball yangilab bo\'lmadi');
    }
  };

  const handleIssueCertificate = async (resultId: string) => {
    try {
      await api.post(`/mocks/${params.id}/results/${resultId}/certificate`);
      toast.success('Sertifikat berildi');
      fetchResults();
    } catch (error) {
      toast.error('Sertifikat berib bo\'lmadi');
    }
  };

  const filteredResults = results.filter(result => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        result.user?.name?.toLowerCase().includes(query) ||
        result.user?.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Natijalar</h1>
            <p className="text-gray-400 text-sm">
              {mock?.title} • {filteredResults.length} ta natija
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-semibold transition hover:bg-white/10"
          >
            <Download size={20} />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="glass-dark rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Foydalanuvchi qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-10 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition"
            >
              <option value="ALL">Barchasi</option>
              <option value="COMPLETED">Tugatilgan</option>
              <option value="IN_PROGRESS">Jarayonda</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-medium">Foydalanuvchi</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Ball</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Bo'limlar</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Sana</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Aksiya</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="text-white font-medium">{result.user?.name || '—'}</div>
                      <div className="text-gray-400 text-xs">{result.user?.email || '—'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-semibold">{result.score?.toFixed(1) || '—'}</div>
                      <div className="text-gray-400 text-xs">
                        {result.ieltsBand ? `Band: ${result.ieltsBand}` : result.cefrLevel || '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-400">
                        {(result.skillScores as any)?.listening && <div>L: {(result.skillScores as any).listening}</div>}
                        {(result.skillScores as any)?.reading && <div>R: {(result.skillScores as any).reading}</div>}
                        {(result.skillScores as any)?.writing && <div>W: {(result.skillScores as any).writing}</div>}
                        {(result.skillScores as any)?.speaking && <div>S: {(result.skillScores as any).speaking}</div>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        result.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400'
                          : result.status === 'IN_PROGRESS'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {result.status === 'COMPLETED' ? 'Tugatilgan' : result.status === 'IN_PROGRESS' ? 'Jarayonda' : result.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {result.startedAt ? new Date(result.startedAt).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOverrideScore(result.id)}
                          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                          title="Ballni o'zgartirish"
                        >
                          <Edit2 size={16} />
                        </button>
                        {result.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleIssueCertificate(result.id)}
                            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                            title="Sertifikat berish"
                          >
                            <Award size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-16">
              <Clock size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Natijalar topilmadi</h3>
              <p className="text-gray-400">
                {searchQuery || filterStatus !== 'ALL' || dateFrom || dateTo
                  ? 'Filtrni o\'zgartiring'
                  : 'Hozircha natijalar yo\'q'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
