import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile')
};

export const orderAPI = {
  calculateCharge: (data) => api.post('/orders/calculate-charge', data),
  createOrder: (data) => api.post('/orders', data),
  getOrders: (filters = {}) => api.get('/orders', { params: filters }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  assignAgent: (id, agentId) => api.put(`/orders/${id}/assign-agent`, { agentId })
};

export const adminAPI = {
  createZone: (data) => api.post('/admin/zones', data),
  getZones: () => api.get('/admin/zones'),
  createRateCard: (data) => api.post('/admin/rate-cards', data),
  getRateCards: () => api.get('/admin/rate-cards'),
  getOrders: (filters = {}) => api.get('/admin/orders', { params: filters }),
  getAgents: () => api.get('/admin/agents'),
  getStats: () => api.get('/admin/stats')
};

export default api;
