'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Users, Building2, BookOpen, TrendingUp, LogOut, DollarSign, Activity, Settings, FileText, BarChart3, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Tab = 'dashboard' | 'students' | 'exams' | 'results' | 'analytics' | 'pricing' | 'settings';

export default function CenterAdminDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [participation, setParticipation] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, resultsRes, revenueRes, participationRes, examsRes, centerRes] = await Promise.all([
        api.get('/api/users/center-students'),
        api.get('/api/exams/results/center'),
        api.get('/api/reports/revenue'),
        api.get('/api/reports/participation'),
        api.get('/api/exams'),
        api.get(`/api/centers/${user?.centerId}`),
      ]);
      setStudents(studentsRes.data);
      setResults(resultsRes.data);
      setRevenue(revenueRes.data);
      setParticipation(participationRes.data);
      setExams(examsRes.data);
      
      const center = centerRes.data;
      const examsTaken = studentsRes.data.filter((s: any) => s.examResults?.length > 0).length;
      const limit = center.mockLimit || 100;
      
      setStats({
        totalStudents: studentsRes.data.length,
        totalRevenue: revenueRes.data.totalRevenue,
        totalParticipants: participationRes.data.totalParticipants,
        mockLimit: limit,
        mockUsed: examsTaken,
        mockRemaining: limit - examsTaken,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const updateExamPrice = async (examId: string, newPrice: number) => {
    try {
      await api.patch(`/api/exams/${examId}/price`, { priceUzs: newPrice });
      toast.success('Narx yangilandi');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Narxni yangilash xatosi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="glass-dark border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="text-primary-400" size={28} />
            <div>
              <h1 className="text-xl font-bold text-white">{user?.centerId ? 'O\'quv Markazi Admini' : 'Admin'}</h1>
              <p className="text-gray-400 text-sm">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
          >
            <LogOut size={18} />
            Chiqish
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <div className="flex gap-2 flex-wrap">
              {(['dashboard', 'students', 'exams', 'results', 'analytics', 'pricing', 'settings'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    tab === t ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'dashboard' && 'Umumiy'}
                  {t === 'students' && 'O\'quvchilar'}
                  {t === 'exams' && 'Imtihonlar'}
                  {t === 'results' && 'Natijalar'}
                  {t === 'analytics' && 'Tahlil'}
                  {t === 'pricing' && 'Narxlar'}
                  {t === 'settings' && 'Sozlamalar'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'O\'quvchilar', value: stats?.totalStudents || 0, icon: Users, color: 'text-primary-400' },
                  { label: 'Tushgan pul (UZS)', value: stats?.totalRevenue?.toLocaleString() || '0', icon: DollarSign, color: 'text-emerald-400' },
                  { label: 'Mock Limit', value: `${stats?.mockUsed || 0}/${stats?.mockLimit || 100}`, icon: Activity, color: 'text-amber-400' },
                  { label: 'Qolgan Mock', value: stats?.mockRemaining || 0, icon: Building2, color: 'text-accent-400' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-dark rounded-xl p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon size={24} className={item.color} />
                    </div>
                    <div className="text-2xl font-bold text-white">{item.value}</div>
                    <div className="text-gray-400 text-sm">{item.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Students List */}
              <div className="glass-dark rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">O\'quvchilar Ro\'yxati</h3>
                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Ism</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Ro\'yxatdan o\'tgan</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student: any, i: number) => (
                          <tr key={i} className="border-b border-gray-800 hover:bg-white/5">
                            <td className="py-3 px-4 text-white">{student.name}</td>
                            <td className="py-3 px-4 text-gray-400">{student.email}</td>
                            <td className="py-3 px-4 text-gray-400">
                              {new Date(student.createdAt).toLocaleDateString('uz-UZ')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm">
                                {student.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Hozircha o\'quvchilar yo\'q</p>
                )}
              </div>
            </>
          )}

          {tab === 'students' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserCheck size={20} className="text-primary-400" /> O'quvchilar Ro'yxati
              </h3>
              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Ism</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Ro'yxatdan o'tgan</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student: any, i: number) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-white/5">
                          <td className="py-3 px-4 text-white">{student.name}</td>
                          <td className="py-3 px-4 text-gray-400">{student.email}</td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(student.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm">
                              {student.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Hozircha o'quvchilar yo'q</p>
              )}
            </div>
          )}

          {tab === 'exams' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-emerald-400" /> Imtihonlar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam: any) => (
                  <div key={exam.id} className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-2">{exam.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">{exam.type}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">{exam.duration} daqiqa</span>
                      <span className="text-emerald-400 text-sm font-medium">
                        {exam.priceUzs?.toLocaleString()} UZS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'results' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" /> Natijalar
              </h3>
              {results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">O'quvchi</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Imtihon</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Ball</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Sana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result: any, i: number) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-white/5">
                          <td className="py-3 px-4 text-white">{result.user?.name}</td>
                          <td className="py-3 px-4 text-gray-400">{result.exam?.title}</td>
                          <td className="py-3 px-4 text-emerald-400 font-medium">{result.score}%</td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(result.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Hozircha natijalar yo'q</p>
              )}
            </div>
          )}

          {tab === 'analytics' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-amber-400" /> Tahlil
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Umumiy statistika</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jami o'quvchilar</span>
                      <span className="text-white font-medium">{stats?.totalStudents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jami imtihonlar</span>
                      <span className="text-white font-medium">{stats?.mockUsed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">O'rtacha ball</span>
                      <span className="text-white font-medium">{stats?.totalParticipants || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Moliyaviy tahlil</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jami tushgan pul</span>
                      <span className="text-emerald-400 font-medium">
                        {stats?.totalRevenue?.toLocaleString() || '0'} UZS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mock limit</span>
                      <span className="text-white font-medium">{stats?.mockLimit || 100}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Qolgan mock</span>
                      <span className="text-amber-400 font-medium">{stats?.mockRemaining || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'pricing' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings size={20} className="text-accent-400" /> Imtihon Narxlari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam: any) => (
                  <div key={exam.id} className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-2">{exam.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">{exam.type}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="number"
                        defaultValue={exam.priceUzs || 0}
                        onBlur={(e) => updateExamPrice(exam.id, parseInt(e.target.value))}
                        className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                      <span className="text-gray-400 text-sm">UZS</span>
                    </div>
                    <p className="text-gray-500 text-xs">Narxni o'zgartirish uchun maydonni tarkiting</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings size={20} className="text-gray-400" /> Sozlamalar
              </h3>
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Markaz ma'lumotlari</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Markaz nomi</label>
                      <input
                        type="text"
                        defaultValue={user?.centerId ? 'Toshkent Ingliz Tili Markazi' : ''}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Manzil</label>
                      <input
                        type="text"
                        defaultValue="Toshkent sh., Amir Temur ko'chasi"
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">To'lov ma'lumotlari</h4>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">To'lov ko'rsatmalari</label>
                    <textarea
                      rows={4}
                      placeholder="To'lov uchun bank hisob raqami va boshqa ma'lumotlar..."
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
