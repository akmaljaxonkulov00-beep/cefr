'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Settings, Save, DollarSign, Clock, Users, Globe, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentCardManager from '@/components/admin/PaymentCardManager';

interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  pricing: {
    cefrMockPrice: number;
    ieltsMockPrice: number;
  };
  examSettings: {
    defaultTimeLimit: number;
    maxAttempts: number;
    autoSubmitOnTimeout: boolean;
  };
  paymentInstructions?: string;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data);
    } catch (error) {
      toast.error('Sozlamalar yuklab olinmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await api.put('/api/admin/settings', settings);
      toast.success('Sozlamalar saqlandi');
    } catch (error) {
      toast.error('Sozlamalar saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-gray-400">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-gray-400">Sozlamalar topilmadi</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sozlamalar</h1>
            <p className="text-gray-400">Sayt bo'ylab sozlamalarni boshqarish</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-semibold disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe size={24} className="text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Umumiy Sozlamalar</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Sayt Nomi</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Sayt Tavsifi</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Global To'lov Ma'lumotlari</label>
                <textarea
                  value={settings.paymentInstructions || ''}
                  onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                  placeholder="Global to'lov ma'lumotlari (markaz o'z ma'lumotlarini belgilamaganda ishlatiladi)"
                />
              </div>
            </div>
          </div>

          {/* Pricing Settings */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign size={24} className="text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Mock Narxlari</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">CEFR Mock Narxi (UZS)</label>
                <input
                  type="number"
                  value={settings.pricing.cefrMockPrice}
                  onChange={(e) => setSettings({
                    ...settings,
                    pricing: { ...settings.pricing, cefrMockPrice: Number(e.target.value) }
                  })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">IELTS Mock Narxi (UZS)</label>
                <input
                  type="number"
                  value={settings.pricing.ieltsMockPrice}
                  onChange={(e) => setSettings({
                    ...settings,
                    pricing: { ...settings.pricing, ieltsMockPrice: Number(e.target.value) }
                  })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Exam Settings */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock size={24} className="text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Imtihon Sozlamalari</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Vaqt Limiti (daqiqa)</label>
                <input
                  type="number"
                  value={settings.examSettings.defaultTimeLimit}
                  onChange={(e) => setSettings({
                    ...settings,
                    examSettings: { ...settings.examSettings, defaultTimeLimit: Number(e.target.value) }
                  })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Maksimum Urinishlar</label>
                <input
                  type="number"
                  value={settings.examSettings.maxAttempts}
                  onChange={(e) => setSettings({
                    ...settings,
                    examSettings: { ...settings.examSettings, maxAttempts: Number(e.target.value) }
                  })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoSubmit"
                  checked={settings.examSettings.autoSubmitOnTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    examSettings: { ...settings.examSettings, autoSubmitOnTimeout: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <label htmlFor="autoSubmit" className="text-gray-300">
                  Vaqt tugaganda avtomatik tugatish
                </label>
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="glass-dark rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-primary-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Texnik Xizmat Rejimi</h2>
                  <p className="text-gray-400 text-sm">Saytni vaqtinchalik yopish</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>

          {/* Payment Cards */}
          <div className="glass-dark rounded-xl p-6">
            <PaymentCardManager />
          </div>
        </div>
      </div>
    </div>
  );
}
