'use client';

import { Toaster } from 'react-hot-toast';
import AuthProvider from './AuthProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
