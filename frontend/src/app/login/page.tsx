'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email kiritilishi shart';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Email formati noto\'g\'ri';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Parol kiritilishi shart';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
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
      const { data } = await api.post('/api/auth/login', { email, password });
      
      // Handle both token and access_token formats
      const token = data.token || data.access_token;
      setToken(token);
      setUser(data.user);
      
      toast.success('Muvaffaqiyatli kirildi!');
      
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
        toast.error('Serverda xatolik, qayta urinib ko\'ring');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />

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
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue your learning journey</p>
        </div>

        <div className="glass-dark rounded-2xl p-8 space-y-5">
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
                placeholder="you@example.com"
                required
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
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
                required
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
            <div className="flex justify-end mt-2">
              <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gradient-bg hover:gradient-bg-hover text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <p className="text-center text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
