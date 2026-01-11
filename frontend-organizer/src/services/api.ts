import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

export const eventsApi = {
  getAll: async (filters?: { search?: string; organizerId?: string }) => {
    const response = await api.get('/events', { params: filters });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/events', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

export const ticketsApi = {
  getAll: async (filters?: { eventId?: string; status?: string }) => {
    const response = await api.get('/tickets', { params: filters });
    return response.data;
  },
  verify: async (ticketId: string) => {
    const response = await api.post(`/tickets/verify/${ticketId}`);
    return response.data;
  },
};

export default api;

