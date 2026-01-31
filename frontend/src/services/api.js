import axios from 'axios';

// axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;