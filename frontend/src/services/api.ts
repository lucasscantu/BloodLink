// ============================================
// HospitalChain API Service
// Academic prototype for blood bag traceability using blockchain
// ============================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BloodBag, Demand, Transfer, Event, User, Institution, ApiResponse, PaginatedResponse } from '../types';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Authentication API
// ============================================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    institutionId: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// ============================================
// Institution API
// ============================================

export const institutionApi = {
  getAll: async (): Promise<ApiResponse<Institution[]>> => {
    const response = await api.get('/institutions');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Institution>> => {
    const response = await api.get(`/institutions/${id}`);
    return response.data;
  },

  create: async (institutionData: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Institution>> => {
    const response = await api.post('/institutions', institutionData);
    return response.data;
  },

  update: async (id: string, institutionData: Partial<Institution>): Promise<ApiResponse<Institution>> => {
    const response = await api.put(`/institutions/${id}`, institutionData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<Institution>> => {
    const response = await api.delete(`/institutions/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<{
    total: number;
    byType: Record<string, number>;
    active: number;
    inactive: number;
  }>> => {
    const response = await api.get('/institutions/stats');
    return response.data;
  },
};

// ============================================
// User API
// ============================================

export const userApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'institution'>): Promise<ApiResponse<User>> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getByInstitution: async (institutionId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/users/by-institution/${institutionId}`);
    return response.data;
  },
};

// ============================================
// Blood Bag API
// ============================================

export const bloodBagApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    tipoSanguineo?: string;
    status?: string;
    instituicaoId?: string;
  }): Promise<ApiResponse<PaginatedResponse<BloodBag>>> => {
    const response = await api.get('/blood-bags', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.get(`/blood-bags/${id}`);
    return response.data;
  },

  getByCode: async (codigo: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.get(`/blood-bags/by-code/${codigo}`);
    return response.data;
  },

  create: async (bloodBagData: Omit<BloodBag, 'id' | 'createdAt' | 'updatedAt' | 'codigo' | 'qrCode' | 'instituicaoAtual'>): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post('/blood-bags', bloodBagData);
    return response.data;
  },

  update: async (id: string, bloodBagData: Partial<BloodBag>): Promise<ApiResponse<BloodBag>> => {
    const response = await api.put(`/blood-bags/${id}`, bloodBagData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.delete(`/blood-bags/${id}`);
    return response.data;
  },

  // Collect blood bag
  collect: async (bagId: string, data: { temperaturaAtual?: number; localizacaoAtual?: string }): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/collect`, data);
    return response.data;
  },

  // Register tests
  registerTests: async (bagId: string, data: { resultados: Record<string, string> }): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/register-tests`, data);
    return response.data;
  },

  // Approve blood bag
  approve: async (bagId: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/approve`);
    return response.data;
  },

  // Reject blood bag
  reject: async (bagId: string, reason: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/reject`, { reason });
    return response.data;
  },

  // Store blood bag
  store: async (bagId: string, data: { localizacaoAtual: string; temperaturaAtual: number }): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/store`, data);
    return response.data;
  },

  // Reserve blood bag
  reserve: async (bagId: string, demandId: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/reserve`, { demandId });
    return response.data;
  },

  // Use blood bag
  use: async (bagId: string, data: { pacienteId?: string; motivo?: string }): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/use`, data);
    return response.data;
  },

  // Discard blood bag
  discard: async (bagId: string, reason: string): Promise<ApiResponse<BloodBag>> => {
    const response = await api.post(`/blood-bags/${bagId}/discard`, { reason });
    return response.data;
  },

  // Get history
  getHistory: async (bagId: string): Promise<ApiResponse<Event[]>> => {
    const response = await api.get(`/blood-bags/${bagId}/history`);
    return response.data;
  },

  // Get QR Code
  getQRCode: async (bagId: string): Promise<ApiResponse<{ qrCode: string }>> => {
    const response = await api.get(`/blood-bags/${bagId}/qrcode`);
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<ApiResponse<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    available: number;
    expired: number;
    inTransit: number;
    used: number;
  }>> => {
    const response = await api.get('/blood-bags/stats');
    return response.data;
  },

  // Search compatible bags for demand
  searchCompatible: async (demandId: string): Promise<ApiResponse<BloodBag[]>> => {
    const response = await api.get(`/blood-bags/compatible/${demandId}`);
    return response.data;
  },
};

// ============================================
// Demand API
// ============================================

export const demandApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    tipoSanguineo?: string;
    status?: string;
    institutionId?: string;
    urgencia?: string;
  }): Promise<ApiResponse<PaginatedResponse<Demand>>> => {
    const response = await api.get('/demands', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Demand>> => {
    const response = await api.get(`/demands/${id}`);
    return response.data;
  },

  create: async (demandData: Omit<Demand, 'id' | 'createdAt' | 'updatedAt' | 'institution' | 'dataCriacao' | 'dataAtendimento' | 'dataExpiracao'>): Promise<ApiResponse<Demand>> => {
    const response = await api.post('/demands', demandData);
    return response.data;
  },

  update: async (id: string, demandData: Partial<Demand>): Promise<ApiResponse<Demand>> => {
    const response = await api.put(`/demands/${id}`, demandData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<Demand>> => {
    const response = await api.delete(`/demands/${id}`);
    return response.data;
  },

  // Cancel demand
  cancel: async (id: string, reason: string): Promise<ApiResponse<Demand>> => {
    const response = await api.post(`/demands/${id}/cancel`, { reason });
    return response.data;
  },

  // Get demands by my institution
  getByMyInstitution: async (): Promise<ApiResponse<Demand[]>> => {
    const response = await api.get('/demands/my-institution');
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    urgent: number;
    open: number;
  }>> => {
    const response = await api.get('/demands/stats');
    return response.data;
  },
};

// ============================================
// Transfer API
// ============================================

export const transferApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    deInstituicaoId?: string;
    paraInstituicaoId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Transfer>>> => {
    const response = await api.get('/transfers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Transfer>> => {
    const response = await api.get(`/transfers/${id}`);
    return response.data;
  },

  create: async (transferData: {
    demandaId: string;
    bolsaId: string;
    quantidade: number;
    observacoes?: string;
  }): Promise<ApiResponse<Transfer>> => {
    const response = await api.post('/transfers', transferData);
    return response.data;
  },

  update: async (id: string, transferData: Partial<Transfer>): Promise<ApiResponse<Transfer>> => {
    const response = await api.put(`/transfers/${id}`, transferData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<Transfer>> => {
    const response = await api.delete(`/transfers/${id}`);
    return response.data;
  },

  // Approve transfer
  approve: async (id: string): Promise<ApiResponse<Transfer>> => {
    const response = await api.post(`/transfers/${id}/approve`);
    return response.data;
  },

  // Reject transfer
  reject: async (id: string, reason: string): Promise<ApiResponse<Transfer>> => {
    const response = await api.post(`/transfers/${id}/reject`, { reason });
    return response.data;
  },

  // Start transport
  startTransport: async (id: string, data: { transportadora?: string; veiculo?: string }): Promise<ApiResponse<Transfer>> => {
    const response = await api.post(`/transfers/${id}/start-transport`, data);
    return response.data;
  },

  // Receive transfer
  receive: async (id: string, data: { temperaturaAtual?: number; localizacaoAtual?: string }): Promise<ApiResponse<Transfer>> => {
    const response = await api.post(`/transfers/${id}/receive`, data);
    return response.data;
  },

  // Get transfers by my institution
  getByMyInstitution: async (): Promise<ApiResponse<Transfer[]>> => {
    const response = await api.get('/transfers/my-institution');
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    pending: number;
    inTransit: number;
    completed: number;
  }>> => {
    const response = await api.get('/transfers/stats');
    return response.data;
  },
};

// ============================================
// Event API
// ============================================

export const eventApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    bagId?: string;
    tipoEvento?: string;
    instituicaoId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Event>>> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Event>> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Verify event integrity
  verify: async (eventId: string): Promise<ApiResponse<{ verified: boolean; hash: string; message: string }>> => {
    const response = await api.get(`/events/${eventId}/verify`);
    return response.data;
  },

  // Verify bag history
  verifyBagHistory: async (bagId: string): Promise<ApiResponse<{ verified: boolean; events: Event[]; message: string }>> => {
    const response = await api.get(`/events/verify-bag/${bagId}`);
    return response.data;
  },
};

// ============================================
// Temperature API
// ============================================

export const temperatureApi = {
  getAll: async (bagId: string, params?: { page?: number; pageSize?: number }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response = await api.get(`/temperature/${bagId}`, { params });
    return response.data;
  },

  create: async (bagId: string, data: { temperature: number }): Promise<ApiResponse<any>> => {
    const response = await api.post(`/temperature/${bagId}`, data);
    return response.data;
  },

  // Simulate temperature readings
  simulate: async (bagId: string, count: number = 10): Promise<ApiResponse<any[]>> => {
    const response = await api.post(`/temperature/${bagId}/simulate`, { count });
    return response.data;
  },

  // Get alerts
  getAlerts: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/temperature/alerts');
    return response.data;
  },

  // Configure temperature thresholds
  configureThresholds: async (data: { min: number; max: number }): Promise<ApiResponse<{ min: number; max: number }>> => {
    const response = await api.post('/temperature/configure', data);
    return response.data;
  },
};

// ============================================
// Blockchain API
// ============================================

export const blockchainApi = {
  // Get blockchain info
  getInfo: async (): Promise<ApiResponse<{
    network: string;
    chainId: string;
    latestBlock: number;
    contractAddress: string;
  }>> => {
    const response = await api.get('/blockchain/info');
    return response.data;
  },

  // Get bag info from blockchain
  getBagInfo: async (bagId: string): Promise<ApiResponse<{
    bagId: string;
    status: string;
    transactions: string[];
  }>> => {
    const response = await api.get(`/blockchain/bag/${bagId}`);
    return response.data;
  },

  // Verify bag on blockchain
  verifyBag: async (bagId: string): Promise<ApiResponse<{ verified: boolean; message: string }>> => {
    const response = await api.get(`/blockchain/verify/${bagId}`);
    return response.data;
  },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getNetworkMap: async (): Promise<ApiResponse<{
    nodes: any[];
    connections: any[];
  }>> => {
    const response = await api.get('/dashboard/network-map');
    return response.data;
  },

  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/dashboard/recent-activity', { params: { limit } });
    return response.data;
  },
};

// ============================================
// Health Check API
// ============================================

export const healthApi = {
  check: async (): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    services: Record<string, { status: string; latency?: number }>;
  }>> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Export all APIs
export default {
  auth: authApi,
  institutions: institutionApi,
  users: userApi,
  bloodBags: bloodBagApi,
  demands: demandApi,
  transfers: transferApi,
  events: eventApi,
  temperature: temperatureApi,
  blockchain: blockchainApi,
  dashboard: dashboardApi,
  health: healthApi,
};
