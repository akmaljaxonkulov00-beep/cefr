'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Mic, PenLine, BarChart3, Trophy, Route, LogOut, Menu, X, Bell, LineChart, UserCircle, Cpu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const getNavItems = (role: string | undefined) => {
  if (role === 'SUPER_ADMIN') {
    return [
      { href: '/admin', icon: LayoutDashboard, label: 'Admin Panel' },
      { href: '/admin/mocks', icon: BookOpen, label: 'Mocklar' },
      { href: '/admin/ai-questions', icon: Cpu, label: 'AI Savollar' },
      { href: '/admin/ielts', icon: BookOpen, label: 'IELTS Mocklar' },
      { href: '/admin/cefr', icon: BookOpen, label: 'CEFR Mocklar' },
      { href: '/admin/centers', icon: BookOpen, label: 'Markazlar' },
      { href: '/admin/pricing', icon: Trophy, label: 'Narxlar' },
      { href: '/admin/users', icon: UserCircle, label: 'Foydalanuvchilar' },
      { href: '/admin/payments', icon: BarChart3, label: 'To\'lovlar' },
      { href: '/admin/reports', icon: BarChart3, label: 'Hisobotlar' },
      { href: '/admin/settings', icon: Route, label: 'Sozlamalar' },
    ];
  }

  if (role === 'CENTER_ADMIN') {
    return [
      { href: '/center-admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/center-admin/students', icon: UserCircle, label: 'O\'quvchilar' },
      { href: '/center-admin/analytics', icon: LineChart, label: 'Statistika' },
      { href: '/center-admin/exams', icon: BookOpen, label: 'Imtihonlar' },
      { href: '/center-admin/results', icon: BarChart3, label: 'Natijalar' },
      { href: '/center-admin/pricing', icon: Trophy, label: 'Narxlar' },
      { href: '/center-admin/settings', icon: Route, label: 'Sozlamalar' },
    ];
  }

  // STUDENT and other roles
  return [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/profile', icon: UserCircle, label: 'Profile' },
    { href: '/exams', icon: BookOpen, label: 'Mock Exams' },
    { href: '/ielts', icon: BookOpen, label: 'IELTS' },
    { href: '/cefr', icon: BookOpen, label: 'CEFR' },
    { href: '/ai-speaking', icon: Mic, label: 'AI Speaking' },
    { href: '/ai-writing', icon: PenLine, label: 'AI Writing' },
    { href: '/results', icon: BarChart3, label: 'Results' },
    { href: '/dashboard/analytics', icon: LineChart, label: 'Analytics' },
    { href: '/progress', icon: Route, label: 'Progress' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];
};

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = getNavItems(user?.role);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-dark rounded-xl text-white"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 glass-dark border-r border-gray-800 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 flex flex-col`}>
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text">Mock</span>CEFR
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item: any) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
