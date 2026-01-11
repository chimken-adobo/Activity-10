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
  register: async (email: string, password: string, name: string, company?: string) => {
    const response = await api.post('/auth/register', { email, password, name, company });
    return response.data;
  },
};

export const eventsApi = {
  getAll: async (filters?: { search?: string; isActive?: boolean }) => {
    const response = await api.get('/events', { params: filters });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
};

export const ticketsApi = {
  register: async (eventId: string) => {
    const response = await api.post('/tickets/register', { eventId });
    return response.data;
  },
  getMyTickets: async () => {
    const response = await api.get('/tickets/my-tickets');
    return response.data;
  },
  cancel: async (id: string) => {
    const response = await api.patch(`/tickets/${id}/cancel`);
    return response.data;
  },
};

export default api;

