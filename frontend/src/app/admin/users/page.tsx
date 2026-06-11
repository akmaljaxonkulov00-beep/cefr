'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const saveRole = async (userId: string) => {
    const role = roleEdits[userId];
    if (!role) return;
    try {
      await api.patch(`/users/${userId}/role`, { role });
      toast.success('Rol yangilandi');
      fetchUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Foydalanuvchilar</h1>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 glass text-gray-200 hover:bg-white/10 rounded-xl"
            >
              <RefreshCw size={18} />
              Yangilash
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-gray-400">Ism</th>
                      <th className="text-left p-3 text-gray-400">Email</th>
                      <th className="text-left p-3 text-gray-400">Rol</th>
                      <th className="text-left p-3 text-gray-400">Markaz</th>
                      <th className="text-left p-3 text-gray-400">Aksiya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => (
                      <tr key={user.id} className="border-b border-gray-800">
                        <td className="p-3 text-white">{user.name}</td>
                        <td className="p-3 text-gray-400">{user.email}</td>
                        <td className="p-3 text-gray-300">{user.role}</td>
                        <td className="p-3 text-gray-300">{user.centerId || '—'}</td>
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
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
