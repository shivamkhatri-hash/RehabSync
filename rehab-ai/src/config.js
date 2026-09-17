const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_URL = import.meta.env.VITE_API_URL || `http://${hostname}:5000`;
export const CV_API_URL = import.meta.env.VITE_CV_API_URL || `http://${hostname}:8000`;

