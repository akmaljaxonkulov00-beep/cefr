'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { isLoggedIn } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!isLoggedIn()) {
        router.push('/login');
        return;
      }

      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect based on role
        if (user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (user.role === 'CENTER_ADMIN') {
          router.push('/center-admin');
        } else if (user.role === 'STUDENT') {
          router.push('/student');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
