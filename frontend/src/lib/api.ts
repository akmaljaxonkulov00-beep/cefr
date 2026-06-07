import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown>)['Content-Type'];
  }
  if (typeof window !== 'undefined') {
    // Try to get token from multiple sources
    const cookieToken = Cookies.get('auth-token');
    const storageToken = localStorage.getItem('token');
    const persistToken = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
    
    const token = cookieToken || storageToken || persistToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
