import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'superAdmin' | 'admin0' | 'admin1' | 'admin2';
  stationId?: string;
  regionId?: string;
}

export interface Verification {
  _id: string;
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhone?: string;
  fatherName?: string;
  aadharNumber?: string;
  purposeOfStay?: string;
  previousAddress?: string;
  tenantPhoto?: Array<{ url: string; filename: string; size: number }>;
  aadharPhoto?: Array<{ url: string; filename: string; size: number }>;
  familyPhoto?: Array<{ url: string; filename: string; size: number }>;
  address: string;
  stationId: string;
  regionId: string;
  status: 'pending' | 'submitted' | 'assigned' | 'verified' | 'flagged';
  assignedTo?: User;
  assignedBy?: User;
  history: Array<{
    actionBy: string;
    action: string;
    comment?: string;
    at: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  meta?: any;
  read: boolean;
  createdAt: string;
}

export interface Station {
  _id: string;
  name: string;
  regionId: string;
}

export interface Region {
  _id: string;
  name: string;
}

export interface Stats {
  stats: Array<{
    _id: string; // date
    submitted: number;
    assigned: number;
    verified: number;
    flagged: number;
  }>;
}
