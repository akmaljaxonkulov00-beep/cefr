export const API_BASE_URL = 
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    .replace(/\/+$/, ''); // remove trailing slash

export const apiUrl = (path: string) => {
  // Keep /api prefix - backend requires it
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};
