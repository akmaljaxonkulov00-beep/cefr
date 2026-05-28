'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Users, Building2, CreditCard, DollarSign, Cpu, ShieldAlert, RefreshCw, Activity, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentVerification from '@/components/admin/PaymentVerification';

type Tab = 'overview' | 'payments' | 'ai' | 'integrity' | 'centers' | 'pricing';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [participation, setParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [newCenter, setNewCenter] = useState({ name: '', address: '' });
  const [newCenterAdmin, setNewCenterAdmin] = useState({ centerId: '', email: '', password: '', name: '' });
  const [prices, setPrices] = useState<any>(null);
  const [showAddCenter, setShowAddCenter] = useState(false);
  const [showAddCenterAdmin, setShowAddCenterAdmin] = useState(false);

  const loadCore = useCallback(async () => {
    try {
      const [usersRes, subsRes, centersRes] = await Promise.all([
        api.get('/users'),
        api.get('/payments/subscriptions/all'),
        api.get('/centers'),
      ]);
      setUsers(usersRes.data);
      setSubscriptions(subsRes.data);
      setCenters(centersRes.data);
    } catch {
      toast.error('Ma’lumot yuklanmadi');
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const { data } = await api.get('/manual-payments/pending');
      setPendingPayments(data);
    } catch {
      toast.error('To‘lovlar yuklanmadi');
    }
  }, []);

  const loadAi = useCallback(async () => {
    try {
      const { data } = await api.get('/analytics/admin/ai-usage');
      setAiUsage(data);
    } catch {
      toast.error('AI usage yuklanmadi');
    }
  }, []);

  const loadSuspicious = useCallback(async () => {
    try {
      const { data } = await api.get('/exams/admin/suspicious-results');
      setSuspicious(data);
    } catch {
      toast.error('Shubhali natijalar yuklanmadi');
    }
  }, []);

  const loadPricing = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      setPrices(data);
    } catch {
      toast.error('Narxlar yuklanmadi');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCore();
      await Promise.all([loadPayments(), loadAi(), loadSuspicious()]);
      if (tab === 'pricing') await loadPricing();
      setLoading(false);
    })();
  }, [loadCore, loadPayments, loadAi, loadSuspicious, tab]);

  const approvePayment = async (id: string) => {
    try {
      await api.post(`/manual-payments/${id}/approve`);
      toast.success('Tasdiqlandi');
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const rejectPayment = async (id: string) => {
    const reason = window.prompt('Rad etish sababi') || 'Rad etildi';
    try {
      await api.post(`/manual-payments/${id}/reject`, { reason });
      toast.success('Rad etildi');
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const saveRole = async (userId: string) => {
    const role = roleEdits[userId];
    if (!role) return;
    try {
      await api.patch(`/users/${userId}/role`, { role });
      toast.success('Rol yangilandi');
      loadCore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const createCenter = async () => {
    if (!newCenter.name) {
      toast.error('Markaz nomi kiritilishi shart');
      return;
    }
    try {
      await api.post('/centers', newCenter);
      toast.success('Markaz yaratildi');
      setNewCenter({ name: '', address: '' });
      setShowAddCenter(false);
      loadCore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const deleteCenter = async (centerId: string) => {
    if (!confirm('Markazni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/centers/${centerId}`);
      toast.success('Markaz o\'chirildi');
      loadCore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const createCenterAdmin = async () => {
    if (!newCenterAdmin.centerId || !newCenterAdmin.email || !newCenterAdmin.password || !newCenterAdmin.name) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }
    try {
      await api.post(`/centers/${newCenterAdmin.centerId}/admin`, {
        email: newCenterAdmin.email,
        password: newCenterAdmin.password,
        name: newCenterAdmin.name,
      });
      toast.success('Center admin yaratildi');
      setNewCenterAdmin({ centerId: '', email: '', password: '', name: '' });
      setShowAddCenterAdmin(false);
      loadCore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const updatePrice = async (key: string, value: number) => {
    try {
      await api.put('/settings', { key: `examPrices.${key}`, value });
      toast.success('Narx yangilandi');
      loadPricing();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const stats = [
    { icon: Users, label: 'Foydalanuvchilar', value: users.length, color: 'text-primary-400' },
    { icon: Building2, label: 'Markazlar', value: centers.length, color: 'text-emerald-400' },
    { icon: CreditCard, label: 'Obunalar', value: subscriptions.length, color: 'text-amber-400' },
    { icon: DollarSign, label: 'Kutilayotgan to‘lov', value: pendingPayments.length, color: 'text-accent-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Admin panel</h1>
              <p className="text-gray-400 text-sm">To‘lovlar, AI usage, monitoring.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                loadCore();
                loadPayments();
                loadAi();
                loadSuspicious();
                toast.success('Yangilandi');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-gray-200 hover:bg-white/10"
            >
              <RefreshCw size={18} /> Yangilash
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {(['overview', 'payments', 'ai', 'integrity', 'centers', 'pricing'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === t ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {t === 'overview' && 'Umumiy'}
                {t === 'payments' && 'To‘lovlar'}
                {t === 'ai' && 'AI usage'}
                {t === 'integrity' && 'Shubhali'}
                {t === 'centers' && 'Markazlar'}
                {t === 'pricing' && 'Narxlar'}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-dark rounded-xl p-5"
                  >
                    <stat.icon size={24} className={stat.color + ' mb-3'} />
                    <div className="text-2xl font-bold text-white">{loading ? '—' : stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={20} className="text-primary-400" /> Foydalanuvchilar
                </h3>
                {loading ? (
                  <div className="text-center py-10">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-3 text-gray-400">Ism</th>
                          <th className="text-left p-3 text-gray-400">Email</th>
                          <th className="text-left p-3 text-gray-400">Rol</th>
                          <th className="text-left p-3 text-gray-400">Aksiya</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user: any) => (
                          <tr key={user.id} className="border-b border-gray-800">
                            <td className="p-3 text-white">{user.name}</td>
                            <td className="p-3 text-gray-400">{user.email}</td>
                            <td className="p-3 text-gray-300">{user.role}</td>
                            <td className="p-3 flex flex-wrap gap-2 items-center">
                              <select
                                className="bg-white/5 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                                value={roleEdits[user.id] ?? user.role}
                                onChange={(e) => setRoleEdits((s) => ({ ...s, [user.id]: e.target.value }))}
                              >
                                {['STUDENT', 'TEACHER', 'CENTER_ADMIN', 'SUPER_ADMIN'].map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => saveRole(user.id)}
                                className="text-xs px-2 py-1 rounded-lg bg-primary-600 text-white"
                              >
                                Saqlash
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'payments' && (
            <div className="space-y-6">
              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Kutilayotgan qo‘lda to‘lovlar</h3>
                {pendingPayments.length === 0 ? (
                  <p className="text-gray-400">Navbatda so‘rov yo‘q.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingPayments.map((p: any) => (
                      <div key={p.id} className="border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 text-sm">
                          <p className="text-white font-medium">{p.user?.name} — {p.exam?.title}</p>
                          <p className="text-gray-400">{p.user?.email}</p>
                          {p.amountNote && <p className="text-gray-500 mt-1">{p.amountNote}</p>}
                          <img
                            src={p.screenshotKey ? `/uploads/${p.screenshotKey.replace(/^uploads\//, '')}` : ''}
                            alt="chek"
                            className="mt-2 max-h-40 rounded-lg border border-gray-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => approvePayment(p.id)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">
                            Tasdiqlash
                          </button>
                          <button type="button" onClick={() => rejectPayment(p.id)} className="px-4 py-2 rounded-lg bg-red-600/80 text-white text-sm">
                            Rad etish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <PaymentVerification />
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu size={20} /> Groq AI usage
              </h3>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left p-2">Vaqt</th>
                      <th className="text-left p-2">Endpoint</th>
                      <th className="text-left p-2">Model</th>
                      <th className="text-left p-2">Token</th>
                      <th className="text-left p-2">ms</th>
                      <th className="text-left p-2">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.map((row: any) => (
                      <tr key={row.id} className="border-b border-gray-800/80">
                        <td className="p-2 text-gray-400 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-gray-300">{row.endpoint}</td>
                        <td className="p-2 text-gray-300">{row.model}</td>
                        <td className="p-2 text-gray-300">{(row.inputTokens ?? 0) + (row.outputTokens ?? 0)}</td>
                        <td className="p-2 text-gray-300">{row.latencyMs}</td>
                        <td className="p-2 text-gray-400">{row.user?.email ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'integrity' && (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-400" /> Yuqori shubha balli
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left p-2">Sana</th>
                      <th className="text-left p-2">O‘quvchi</th>
                      <th className="text-left p-2">Imtihon</th>
                      <th className="text-left p-2">Ball</th>
                      <th className="text-left p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspicious.map((r: any) => (
                      <tr key={r.id} className="border-b border-gray-800">
                        <td className="p-2 text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-white">{r.user?.name}</td>
                        <td className="p-2 text-gray-300">{r.exam?.title}</td>
                        <td className="p-2 text-amber-300">{r.integrityScore ?? '—'}</td>
                        <td className="p-2 text-gray-300">{Math.round(r.score)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'centers' && (
            <div className="space-y-6">
              <div className="glass-dark rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 size={20} className="text-emerald-400" /> O'quv Markazlari
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCenter(!showAddCenter)}
                    className="px-4 py-2 rounded-xl gradient-bg text-white text-sm"
                  >
                    + Markaz qo'shish
                  </button>
                </div>

                {showAddCenter && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl">
                    <h4 className="text-white font-medium mb-3">Yangi markaz yaratish</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Markaz nomi"
                        value={newCenter.name}
                        onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                        className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Manzil"
                        value={newCenter.address}
                        onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                        className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={createCenter}
                        className="px-4 py-2 rounded-lg gradient-bg text-white text-sm"
                      >
                        Yaratish
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCenter(false)}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-3 text-gray-400">Nomi</th>
                        <th className="text-left p-3 text-gray-400">Manzil</th>
                        <th className="text-left p-3 text-gray-400">O'quvchilar</th>
                        <th className="text-left p-3 text-gray-400">Aksiya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centers.map((center: any) => (
                        <tr key={center.id} className="border-b border-gray-800">
                          <td className="p-3 text-white">{center.name}</td>
                          <td className="p-3 text-gray-400">{center.address || '—'}</td>
                          <td className="p-3 text-gray-300">{center._count?.users || 0}</td>
                          <td className="p-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewCenterAdmin({ ...newCenterAdmin, centerId: center.id });
                                setShowAddCenterAdmin(true);
                              }}
                              className="text-xs px-3 py-1 rounded-lg bg-primary-600 text-white"
                            >
                              Admin qo'shish
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCenter(center.id)}
                              className="text-xs px-3 py-1 rounded-lg bg-red-600/80 text-white"
                            >
                              O'chirish
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {showAddCenterAdmin && (
                <div className="glass-dark rounded-2xl p-6">
                  <h4 className="text-white font-medium mb-4">Center Admin yaratish</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <select
                      value={newCenterAdmin.centerId}
                      onChange={(e) => setNewCenterAdmin({ ...newCenterAdmin, centerId: e.target.value })}
                      className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">Markazni tanlang</option>
                      {centers.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-gray-800">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ism"
                      value={newCenterAdmin.name}
                      onChange={(e) => setNewCenterAdmin({ ...newCenterAdmin, name: e.target.value })}
                      className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCenterAdmin.email}
                      onChange={(e) => setNewCenterAdmin({ ...newCenterAdmin, email: e.target.value })}
                      className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                    <input
                      type="password"
                      placeholder="Parol"
                      value={newCenterAdmin.password}
                      onChange={(e) => setNewCenterAdmin({ ...newCenterAdmin, password: e.target.value })}
                      className="bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={createCenterAdmin}
                      className="px-4 py-2 rounded-lg gradient-bg text-white text-sm"
                    >
                      Yaratish
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCenterAdmin(false)}
                      className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'pricing' && (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-accent-400" /> Narxlar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prices?.examPrices && Object.entries(prices.examPrices).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white/5 rounded-xl p-4">
                    <label className="block text-gray-400 text-sm mb-2">{key}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setPrices({ ...prices, examPrices: { ...prices.examPrices, [key]: parseInt(e.target.value) } })}
                        className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                      <span className="text-gray-400 text-sm">UZS</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePrice(key, value)}
                      className="mt-2 w-full px-4 py-2 rounded-lg gradient-bg text-white text-sm"
                    >
                      Saqlash
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
