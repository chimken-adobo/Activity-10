import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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
  register: async (email: string, password: string, name: string, company?: string) => {
    const response = await api.post('/auth/register', { email, password, name, company });
    return response.data;
  },
};

export const eventsApi = {
  getAll: async (filters?: { search?: string; organizerId?: string; isActive?: boolean }) => {
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
  cancel: async (id: string) => {
    const response = await api.post(`/events/${id}/cancel`);
    return response.data;
  },
};

export const ticketsApi = {
  register: async (eventId: string) => {
    const response = await api.post('/tickets/register', { eventId });
    return response.data;
  },
  getAll: async (filters?: { eventId?: string; attendeeId?: string; status?: string }) => {
    const response = await api.get('/tickets', { params: filters });
    return response.data;
  },
  getMyTickets: async () => {
    const response = await api.get('/tickets/my-tickets');
    return response.data;
  },
  verify: async (ticketId: string) => {
    const response = await api.post(`/tickets/verify/${ticketId}`);
    return response.data;
  },
  cancel: async (id: string) => {
    const response = await api.patch(`/tickets/${id}/cancel`);
    return response.data;
  },
};

export const usersApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: { email: string; password: string; name: string; company?: string; role: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  toggleActive: async (id: string) => {
    const response = await api.patch(`/users/${id}/toggle-active`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default api;

