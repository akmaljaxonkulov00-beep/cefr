'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentCheckUpload from '@/components/PaymentCheckUpload';
import Sidebar from '@/components/Sidebar';

export default function MockPartPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const mockPartId = params.id as string;
  
  const [mockPart, setMockPart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    fetchMockPart();
    checkAccess();
  }, [mockPartId]);

  const fetchMockPart = async () => {
    try {
      const { data } = await api.get(`/api/student/mock-parts/${mockPartId}`);
      setMockPart(data);
    } catch (error) {
      toast.error('Part yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      const { data } = await api.get('/api/mock-payments/check-access', {
        params: { mockPartId }
      });
      setHasAccess(data.hasAccess);
      
      if (data.hasAccess) {
        router.push(`/student/mocks/${mockPart?.type}/${mockPart?.skill}/part/${mockPartId}`);
      }
    } catch (error) {
      console.error('Access check failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white">Yo'naltirilmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={20} />
            Orqaga
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">To'lov</h1>
            <p className="text-gray-400">
              {mockPart?.title} - To'lovni tasdiqlang
            </p>
          </div>

          <PaymentCheckUpload
            mockPartId={mockPartId}
            amount={mockPart?.price || 0}
            mockTitle={mockPart?.title || ''}
            onSuccess={() => {
              toast.success('To\'lov tasdiqlandi!');
              router.push(`/student/mocks/${mockPart?.type}/${mockPart?.skill}/part/${mockPartId}`);
            }}
          />
        </div>
      </main>
    </div>
  );
}
