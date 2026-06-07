'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Play, Clock, BookOpen, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface IeltsMock {
  id: string;
  title: string;
  type: 'Academic' | 'General';
  level: 'B1' | 'B2' | 'C1' | 'C2';
  description?: string;
  duration: number;
  price: number;
  isPaid: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  listening?: {
    duration: number;
    sections: any[];
  };
  reading?: {
    duration: number;
    passages: any[];
  };
  writing?: {
    duration: number;
    task11?: any;
    task12?: any;
    task2?: any;
  };
  speaking?: {
    task1?: any;
    task2?: any;
    task3?: any;
  };
}

interface Attempt {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalBand?: string;
}

export default function StudentIeltsOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const mockId = params.id as string;
  
  const [mock, setMock] = useState<IeltsMock | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchMockData();
  }, [mockId]);

  const fetchMockData = async () => {
    try {
      const { data } = await api.get(`/api/ielts/student/mocks/${mockId}`);
      setMock(data.mock);
      setAttempt(data.attempt);
    } catch (error) {
      toast.error('Mock ma\'lumotlari yuklab olinmadi');
      router.push('/student/ielts');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      if (attempt?.status === 'in_progress') {
        router.push(`/student/ielts/${mockId}/exam`);
      } else {
        await api.post(`/api/ielts/student/mocks/${mockId}/start`);
        router.push(`/student/ielts/${mockId}/exam`);
      }
    } catch (error) {
      toast.error('Mockni boshlab bo\'lmadi');
    } finally {
      setStarting(false);
    }
  };

  const handleViewResult = () => {
    router.push(`/student/ielts/${mockId}/result`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mock) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Mock topilmadi</h3>
          <button
            onClick={() => router.push('/student/ielts')}
            className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/student/ielts')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={20} />
          Orqaga
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                mock.type === 'Academic'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {mock.type}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                mock.level === 'B1' ? 'bg-purple-500/20 text-purple-400' :
                mock.level === 'B2' ? 'bg-blue-500/20 text-blue-400' :
                mock.level === 'C1' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {mock.level}
              </span>
              {mock.isPaid && (
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400">
                  Pullik
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{mock.title}</h1>
            {mock.description && (
              <p className="text-gray-400">{mock.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">
              {mock.isPaid ? `${mock.price.toLocaleString()} UZS` : 'Bepul'}
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Clock size={16} />
              <span>{mock.duration} daqiqa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attempt Status */}
      {attempt && (
        <div className="glass-dark rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {attempt.status === 'completed' ? (
                <CheckCircle size={24} className="text-green-500" />
              ) : (
                <Clock size={24} className="text-yellow-500" />
              )}
              <div>
                <div className="text-white font-semibold">
                  {attempt.status === 'completed' ? 'Imtihon tugatildi' : 'Imtihon davom etmoqda'}
                </div>
                <div className="text-gray-400 text-sm">
                  Boshlangan: {new Date(attempt.startedAt).toLocaleDateString('uz-UZ')}
                </div>
              </div>
            </div>
            {attempt.status === 'completed' && attempt.totalBand && (
              <button
                onClick={handleViewResult}
                className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold transition hover:opacity-90"
              >
                Natijani ko'rish
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sections Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BookOpen size={24} className="text-blue-400" />
            </div>
            <div>
              <div className="text-white font-semibold">Listening</div>
              <div className="text-gray-400 text-sm">{mock.listening?.duration || 30} daqiqa</div>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            {mock.listening?.sections?.length || 0} section
          </div>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <BookOpen size={24} className="text-green-400" />
            </div>
            <div>
              <div className="text-white font-semibold">Reading</div>
              <div className="text-gray-400 text-sm">{mock.reading?.duration || 60} daqiqa</div>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            {mock.reading?.passages?.length || 0} passage
          </div>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <BookOpen size={24} className="text-purple-400" />
            </div>
            <div>
              <div className="text-white font-semibold">Writing</div>
              <div className="text-gray-400 text-sm">{mock.writing?.duration || 60} daqiqa</div>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            Task 1 & Task 2
          </div>
        </div>

        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <BookOpen size={24} className="text-red-400" />
            </div>
            <div>
              <div className="text-white font-semibold">Speaking</div>
              <div className="text-gray-400 text-sm">11-14 daqiqa</div>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            Part 1, 2, 3
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-dark rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Imtihon haqida ma'lumot</h2>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            Imtihon {mock.duration} daqiqa davom etadi
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            Har bir qism uchun vaqt beriladi, vaqt tugagandan keyin qism avtomatik yopiladi
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            Javoblarni saqlash mumkin, imtihonni qayta boshlash mumkin
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            Imtihon tugagandan so'ng natijalar avtomatik hisoblanadi
          </li>
        </ul>
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={starting}
          className="flex items-center gap-3 px-8 py-4 gradient-bg text-white rounded-2xl font-semibold text-lg transition hover:opacity-90 disabled:opacity-50"
        >
          {starting ? (
            'Boshlanmoqda...'
          ) : attempt?.status === 'in_progress' ? (
            <>
              <ArrowRight size={24} />
              Davom et
            </>
          ) : (
            <>
              <Play size={24} />
              Imtihonni boshlash
            </>
          )}
        </button>
      </div>
    </div>
  );
}
