'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Center {
  id: string;
  name: string;
  address?: string;
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [centerId, setCenterId] = useState('');
  const [phone, setPhone] = useState('');
  const [centers, setCenters] = useState<Center[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; centerId?: string }>({});
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    setLoadingCenters(true);
    try {
      const { data } = await api.get('/api/centers');
      setCenters(data);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    } finally {
      setLoadingCenters(false);
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string; centerId?: string } = {};

    if (!name || name.length < 3) {
      newErrors.name = 'Ism kamida 3 ta belgidan iborat bo\'lishi kerak';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Bu maydon to\'ldirilishi shart';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Email noto\'g\'ri formatda';
    }

    if (!password) {
      newErrors.password = 'Bu maydon to\'ldirilishi shart';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Bu maydon to\'ldirilishi shart';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: any = { email, password, name };
      if (centerId) payload.centerId = centerId;
      if (phone) payload.phone = phone;
      
      const { data } = await api.post('/api/auth/register', payload);
      
      const token = data.token || data.access_token;
      setToken(token);
      setUser(data.user);
      
      toast.success('Hisob muvaffaqiyatli yaratildi!');
      
      const role = data.user.role;
      if (role === 'SUPER_ADMIN') router.push('/admin');
      else if (role === 'CENTER_ADMIN') router.push('/center-admin');
      else if (role === 'STUDENT') router.push('/student/dashboard');
      else router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (!error.response) {
        toast.error('Internet aloqasi yo\'q');
      } else {
        toast.error('Ro\'yxatdan o\'tishda xatolik');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">Mock</span>CEFR
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Ro\'yxatdan o\'tish</h1>
          <p className="text-gray-400">Ingliz tili o\'rganishni boshlang</p>
        </div>

        <div className="glass-dark rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To\'liq ism</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`w-full bg-white/5 border rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                  errors.name ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
                placeholder="Ismingiz"
              />
            </div>
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`w-full bg-white/5 border rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                  errors.email ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
                placeholder="email@example.com"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Parol</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`w-full bg-white/5 border rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                  errors.password ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Parolni tasdiqlash</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                className={`w-full bg-white/5 border rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">O\'quv markazni tanlang (ixtiyoriy)</label>
            <div className="relative">
              <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={centerId}
                onChange={(e) => {
                  setCenterId(e.target.value);
                  if (errors.centerId) setErrors({ ...errors, centerId: undefined });
                }}
                className={`w-full bg-white/5 border rounded-xl px-10 py-3 text-white focus:outline-none transition appearance-none cursor-pointer ${
                  errors.centerId ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
                disabled={loadingCenters}
              >
                <option value="">O\'quv markazni tanlang (ixtiyoriy)</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id} className="bg-gray-800">
                    {center.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                ▼
              </div>
            </div>
            {errors.centerId && <p className="text-red-400 text-sm mt-1">{errors.centerId}</p>}
            {centers.length === 0 && !loadingCenters && (
              <p className="text-xs text-gray-500 mt-1">Hozircha markazlar mavjud emas</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefon (ixtiyoriy)</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gradient-bg hover:gradient-bg-hover text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Yaratilmoqda...' : 'Ro\'yxatdan o\'tish'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <p className="text-center text-gray-400">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Tizimga kirish
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
