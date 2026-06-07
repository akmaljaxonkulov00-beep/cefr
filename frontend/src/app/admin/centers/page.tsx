'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Building2, Plus, Trash2, Users, Edit, Key, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCenters() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [newCenter, setNewCenter] = useState({ name: '', address: '', phone: '', mockLimit: 100, studentLimit: 100, isVip: false });

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const { data } = await api.get('/api/centers');
      setCenters(data);
    } catch (error) {
      console.error('Failed to fetch centers');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenter.name) {
      toast.error('Markaz nomi kiritilishi shart');
      return;
    }
    try {
      const adminEmail = `admin-${newCenter.name.toLowerCase().replace(/\s+/g, '-')}@mockcefr.uz`;
      const adminPassword = generatePassword();
      
      await api.post('/api/centers', { 
        name: newCenter.name, 
        address: newCenter.address,
        phone: newCenter.phone,
        mockLimit: newCenter.mockLimit,
        studentLimit: newCenter.studentLimit,
        isVip: newCenter.isVip,
        adminEmail,
        adminPassword
      });
      toast.success('Markaz yaratildi. Admin login: ' + adminEmail + ', Parol: ' + adminPassword);
      setNewCenter({ name: '', address: '', phone: '', mockLimit: 100, studentLimit: 100, isVip: false });
      setShowAdd(false);
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Markazni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/centers/${id}`);
      toast.success('Markaz o\'chirildi');
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const handleUpdateLimit = async (id: string, mockLimit: number) => {
    try {
      await api.patch(`/api/centers/${id}/limit`, { mockLimit });
      toast.success('Limit yangilandi');
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const handleToggleVip = async (id: string, isVip: boolean) => {
    try {
      await api.patch(`/api/centers/${id}/vip`, { isVip });
      toast.success(isVip ? 'VIP yoqildi' : 'VIP o\'chirildi');
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const handleSetStudentLimit = async (id: string, studentLimit: number) => {
    try {
      await api.patch(`/api/centers/${id}/student-limit`, { studentLimit });
      toast.success('O\'quvchi limiti yangilandi');
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const handleEdit = (center: any) => {
    setEditingCenter(center);
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter) return;
    try {
      await api.patch(`/centers/${editingCenter.id}`, {
        name: editingCenter.name,
        address: editingCenter.address,
        phone: editingCenter.phone,
        email: editingCenter.email,
        mockLimit: editingCenter.mockLimit,
        paymentInstructions: editingCenter.paymentInstructions,
      });
      toast.success('Markaz yangilandi');
      setShowEdit(false);
      setEditingCenter(null);
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const handleRegeneratePassword = async (id: string) => {
    if (!confirm('Yangi parol generatsiya qilinsinmi?')) return;
    try {
      const newPassword = generatePassword();
      await api.patch(`/centers/${id}`, { adminPassword: newPassword });
      toast.success('Yangi parol: ' + newPassword);
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xato');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Nusxa olindi');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">O'quv Markazlari</h1>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-xl"
            >
              <Plus size={18} />
              Markaz qo'shish
            </button>
          </div>

          {showAdd && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-dark rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Yangi markaz yaratish</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Nomi</label>
                    <input
                      type="text"
                      value={newCenter.name}
                      onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Manzil</label>
                    <input
                      type="text"
                      value={newCenter.address}
                      onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Telefon</label>
                    <input
                      type="text"
                      value={newCenter.phone}
                      onChange={(e) => setNewCenter({ ...newCenter, phone: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Mock Limit</label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        id="unlimited-new"
                        checked={newCenter.mockLimit === -1}
                        onChange={(e) => {
                          setNewCenter({ ...newCenter, mockLimit: e.target.checked ? -1 : 100 });
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="unlimited-new" className="text-white text-sm">Cheksiz</label>
                    </div>
                    {newCenter.mockLimit !== -1 && (
                      <input
                        type="number"
                        value={newCenter.mockLimit ?? ''}
                        onChange={(e) => setNewCenter({ ...newCenter, mockLimit: e.target.value ? parseInt(e.target.value) : 100 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        min={0}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">O'quvchi Limiti</label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        id="unlimited-students-new"
                        checked={newCenter.studentLimit === -1}
                        onChange={(e) => {
                          setNewCenter({ ...newCenter, studentLimit: e.target.checked ? -1 : 100 });
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="unlimited-students-new" className="text-white text-sm">Cheksiz</label>
                    </div>
                    {newCenter.studentLimit !== -1 && (
                      <input
                        type="number"
                        value={newCenter.studentLimit ?? ''}
                        onChange={(e) => setNewCenter({ ...newCenter, studentLimit: e.target.value ? parseInt(e.target.value) : 100 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        min={0}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 gradient-bg text-white py-2 rounded-xl">
                    Yaratish
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-xl"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {showEdit && editingCenter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-dark rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Markazni tahrirlash</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Nomi</label>
                    <input
                      type="text"
                      value={editingCenter.name}
                      onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Manzil</label>
                    <input
                      type="text"
                      value={editingCenter.address || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, address: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Telefon</label>
                    <input
                      type="text"
                      value={editingCenter.phone || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, phone: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={editingCenter.email || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, email: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Mock Limit</label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        id="unlimited-edit"
                        checked={editingCenter.mockLimit === -1}
                        onChange={(e) => {
                          setEditingCenter({ ...editingCenter, mockLimit: e.target.checked ? -1 : 100 });
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="unlimited-edit" className="text-white text-sm">Cheksiz</label>
                    </div>
                    {editingCenter.mockLimit !== -1 && (
                      <input
                        type="number"
                        value={editingCenter.mockLimit ?? ''}
                        onChange={(e) => setEditingCenter({ ...editingCenter, mockLimit: e.target.value ? parseInt(e.target.value) : 100 })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        min={0}
                      />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">To'lov Ma'lumotlari</label>
                    <textarea
                      value={editingCenter.paymentInstructions || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, paymentInstructions: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                      placeholder="Markaz uchun to'lov ma'lumotlari (karta raqami, telefon, bank, etc.)"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 gradient-bg text-white py-2 rounded-xl">
                    Yangilash
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEdit(false); setEditingCenter(null); }}
                    className="px-6 py-2 bg-gray-700 text-white rounded-xl"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-6">
              {centers.length === 0 ? (
                <div className="text-center py-10">
                  <Building2 size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">Hozircha markazlar mavjud emas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-3 text-gray-400">Nomi</th>
                        <th className="text-left p-3 text-gray-400">Manzil</th>
                        <th className="text-left p-3 text-gray-400">Telefon</th>
                        <th className="text-left p-3 text-gray-400">Admin Email</th>
                        <th className="text-left p-3 text-gray-400">Admin Parol</th>
                        <th className="text-left p-3 text-gray-400">O'quvchilar</th>
                        <th className="text-left p-3 text-gray-400">Mock Limit</th>
                        <th className="text-left p-3 text-gray-400">O'quvchi Limit</th>
                        <th className="text-left p-3 text-gray-400">Status</th>
                        <th className="text-left p-3 text-gray-400">Aksiya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centers.map((center: any) => (
                        <tr key={center.id} className="border-b border-gray-800">
                          <td className="p-3 text-white">{center.name}</td>
                          <td className="p-3 text-gray-400">{center.address || '—'}</td>
                          <td className="p-3 text-gray-400">{center.phone || '—'}</td>
                          <td className="p-3 text-gray-300 text-xs">
                            {center.adminEmail ? (
                              <div className="flex items-center gap-1">
                                <span>{center.adminEmail}</span>
                                <button onClick={() => copyToClipboard(center.adminEmail)} className="text-primary-400 hover:text-primary-300">
                                  <Copy size={12} />
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-gray-300 text-xs">
                            {center.adminPassword ? (
                              <div className="flex items-center gap-1">
                                <span>••••••••••••</span>
                                <button onClick={() => copyToClipboard(center.adminPassword)} className="text-primary-400 hover:text-primary-300">
                                  <Copy size={12} />
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-gray-300">{center._count?.users || 0}</td>
                          <td className="p-3 text-gray-300">
                            <input
                              type="number"
                              defaultValue={center.mockLimit || 100}
                              onBlur={(e) => handleUpdateLimit(center.id, parseInt(e.target.value))}
                              className="w-20 bg-white/5 border border-gray-700 rounded px-2 py-1 text-white"
                            />
                          </td>
                          <td className="p-3 text-gray-300">
                            <input
                              type="number"
                              defaultValue={center.studentLimit || 100}
                              onBlur={(e) => handleSetStudentLimit(center.id, parseInt(e.target.value))}
                              className="w-20 bg-white/5 border border-gray-700 rounded px-2 py-1 text-white"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {center.isVip && (
                                <span className="px-2 py-1 rounded-lg bg-yellow-600/80 text-white text-xs">⭐ VIP</span>
                              )}
                              {center.isActive !== false && (
                                <span className="px-2 py-1 rounded-lg bg-green-600/80 text-white text-xs">Aktiv</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleEdit(center)}
                              className="text-xs px-2 py-1 rounded-lg bg-blue-600/80 text-white"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleVip(center.id, !center.isVip)}
                              className={`text-xs px-2 py-1 rounded-lg ${center.isVip ? 'bg-gray-600/80' : 'bg-yellow-600/80'} text-white`}
                              title={center.isVip ? 'VIP olib tashlash' : 'VIP qilish'}
                            >
                              ⭐
                            </button>
                            <button
                              onClick={() => handleRegeneratePassword(center.id)}
                              className="text-xs px-2 py-1 rounded-lg bg-amber-600/80 text-white"
                              title="Parolni yangilash"
                            >
                              <Key size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(center.id)}
                              className="text-xs px-2 py-1 rounded-lg bg-red-600/80 text-white"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
