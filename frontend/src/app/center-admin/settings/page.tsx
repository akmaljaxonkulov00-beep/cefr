'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Settings, Save, RefreshCw, Building2, MapPin, Phone, Mail, Upload, Camera } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function CenterAdminSettings() {
  const [mockLimit, setMockLimit] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [center, setCenter] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      if (user?.centerId) {
        const { data } = await api.get(`/centers/${user.centerId}`);
        setCenter(data);
        setMockLimit(data.mockLimit || 100);
        setAvatarPreview(data.avatar || '');
      }
    } catch (error) {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user?.centerId) {
      toast.error('Markaz ID topilmadi');
      return;
    }
    setSaving(true);
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.put(`/centers/${user.centerId}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Update center info (mockLimit is managed by super admin only)
      await api.patch(`/centers/${user.centerId}`, {
        name: center?.name,
        address: center?.address,
        phone: center?.phone,
        email: center?.email,
      });

      toast.success('Sozlamalar saqlandi');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Yangilash xatosi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-6">Sozlamalar</h1>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="glass-dark rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Camera size={24} className="text-primary-400" />
                  <h2 className="text-xl font-semibold text-white">Markaz Logosi</h2>
                </div>

                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-700 flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={48} className="text-gray-500" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 gradient-bg rounded-full flex items-center justify-center cursor-pointer">
                      <Upload size={16} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-2">
                      Markaz logosi yuklang (PNG, JPG, WEBP)
                    </p>
                    <p className="text-gray-500 text-xs">
                      Tavsiya etilgan o'lcham: 200x200 piksel. Maksimum fayl hajmi: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Center Information */}
              <div className="glass-dark rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 size={24} className="text-primary-400" />
                  <h2 className="text-xl font-semibold text-white">Markaz Ma'lumotlari</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Markaz Nomi</label>
                    <input
                      type="text"
                      value={center?.name || ''}
                      onChange={(e) => setCenter({ ...center, name: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Manzil</label>
                    <input
                      type="text"
                      value={center?.address || ''}
                      onChange={(e) => setCenter({ ...center, address: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Telefon</label>
                      <input
                        type="tel"
                        value={center?.phone || ''}
                        onChange={(e) => setCenter({ ...center, phone: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Email</label>
                      <input
                        type="email"
                        value={center?.email || ''}
                        onChange={(e) => setCenter({ ...center, email: e.target.value })}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Limit (Read-only) */}
              <div className="glass-dark rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings size={24} className="text-primary-400" />
                  <h2 className="text-xl font-semibold text-white">Mock Limit</h2>
                </div>

                <div className="max-w-md">
                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Mock Testlar Limiti</label>
                    <p className="text-gray-500 text-xs mb-3">Bu markaz uchun maksimal mock imtihonlar soni (Super Admin tomonidan belgilanadi)</p>
                    <input
                      type="number"
                      value={mockLimit}
                      disabled
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg opacity-50"
                      min="0"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={fetchSettings}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl"
                    >
                      <RefreshCw size={18} />
                      Qayta yuklash
                    </button>
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
