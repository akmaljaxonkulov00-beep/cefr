'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Play, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface MockPart {
  id: string;
  title: string;
  type: 'IELTS' | 'CEFR';
  skill: 'reading' | 'listening';
  partNumber: number;
  questions: any[];
  price: number;
  isCompleted: boolean;
  questionCount: number;
  estimatedTime: number;
}

interface FullMock {
  id: string;
  title: string;
  type: string;
  isPublished: boolean;
  requiresPayment?: boolean;
  priceUzs?: number;
}

export default function StudentMocksPage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as 'IELTS' | 'CEFR';
  const skill = params.skill as 'reading' | 'listening';
  
  const [fullMocks, setFullMocks] = useState<FullMock[]>([]);
  const [parts, setParts] = useState<MockPart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [type, skill]);

  const fetchData = async () => {
    try {
      // Fetch full mocks (existing functionality)
      const { data: fullMocksData } = await api.get('/mocks', {
        params: { type: type === 'IELTS' ? 'IELTS' : 'CEFR', status: 'ACTIVE', limit: 10 }
      });
      setFullMocks(fullMocksData.mocks || []);

      // Fetch individual parts
      const { data: partsData } = await api.get('/student/mock-parts', {
        params: { type, skill }
      });
      setParts(partsData || []);
    } catch (error) {
      toast.error('Ma\'lumotlar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const groupedParts = parts.reduce((acc: any, part) => {
    if (!acc[part.partNumber]) acc[part.partNumber] = [];
    acc[part.partNumber].push(part);
    return acc;
  }, {});

  const handleStart = async (partId: string) => {
    try {
      // Check access first
      const { data: accessData } = await api.get('/mock-payments/check-access', {
        params: { mockPartId: partId }
      });

      if (!accessData.hasAccess) {
        router.push(`/payment/mock-part/${partId}`);
        return;
      }

      router.push(`/student/mocks/${type}/${skill}/part/${partId}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        router.push(`/payment/mock-part/${partId}`);
      } else {
        toast.error('Urinishni boshlab bo\'lmadi');
      }
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
        <h1 className="text-3xl font-bold text-white mb-2">
          {type} {skill === 'reading' ? '📖 Reading' : '🎧 Listening'}
        </h1>
        <p className="text-gray-400">
          {type} {skill} bo'yicha to'liq mocklar va alohida partlar
        </p>
      </div>

      {/* Section 1: Full Mocks */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm">To'liq Mocklar</span>
        </h2>
        
        {fullMocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fullMocks.map((mock) => (
              <div key={mock.id} className="glass-dark rounded-xl p-6 hover:bg-white/5 transition cursor-pointer">
                <h3 className="text-lg font-semibold text-white mb-2">{mock.title}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <Clock size={16} />
                  <span>To'liq imtihon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    {mock.requiresPayment ? `${mock.priceUzs?.toLocaleString()} UZS` : 'Bepul'}
                  </span>
                  <button
                    onClick={() => router.push(`/exams/${mock.id}`)}
                    className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg font-medium transition hover:opacity-90"
                  >
                    <Play size={16} />
                    Boshlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-dark rounded-xl p-8 text-center text-gray-400">
            Hozircha to'liq mocklar yo'q
          </div>
        )}
      </section>

      {/* Section 2: Individual Parts */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-sm">Alohida Partlar</span>
        </h2>

        {Object.keys(groupedParts).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedParts).map(([partNumber, partList]: [string, any]) => (
              <div key={partNumber} className="glass-dark rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Part {partNumber}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partList.map((part: MockPart) => (
                    <div key={part.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition">
                      <h4 className="text-white font-medium mb-2">{part.title}</h4>
                      <div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
                        <span>{part.questionCount} savol</span>
                        <span>•</span>
                        <span>{part.estimatedTime} daqiqa</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">
                          {part.price === 0 ? 'Bepul' : `${part.price.toLocaleString()} UZS`}
                        </span>
                        {part.isCompleted ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle size={16} />
                            Bajarilgan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleStart(part.id)}
                            className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg font-medium transition hover:opacity-90"
                          >
                            <Play size={16} />
                            Boshlash
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-dark rounded-xl p-8 text-center text-gray-400">
            Hozircha alohida partlar yo'q
          </div>
        )}
      </section>
    </div>
  );
}
