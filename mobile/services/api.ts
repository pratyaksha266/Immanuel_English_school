import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error(`API Error: ${error.response.status} ${error.config.method?.toUpperCase()} ${error.config.url}`, error.response.data);
        } else if (error.request) {
            console.error(`Network Error: ${error.config.method?.toUpperCase()} ${error.config.url}`, error.message);
        }
        return Promise.reject(error);
    }
);

export default api;

import { Student, Outpass, Guardian, User } from '../types';

export const parentService = {
    getChildren: async (): Promise<Student[]> => {
        const response = await api.get<Student[]>('students/');
        return response.data;
    },

    getGuardians: async (): Promise<Guardian[]> => {
        const response = await api.get<Guardian[]>('guardians/');
        return response.data;
    },

    getActiveOutpasses: async (): Promise<Outpass[]> => {
        const response = await api.get<Outpass[]>('outpasses/');
        // Backend returns all. Filter client side or update backend to accept status param.
        // For now, filtering client side as per previous code, but we can do it here.
        return response.data.filter(op =>
            ['PENDING', 'FEE_PENDING', 'APPROVED', 'READY_FOR_EXIT', 'CHECKED_OUT', 'OVERDUE', 'MEETING'].includes(op.status)
        );
    },

    getOutpassHistory: async (): Promise<Outpass[]> => {
        const response = await api.get<Outpass[]>('outpasses/');
        return response.data.filter(op =>
            ['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(op.status)
        );
    },

    createOutpass: async (data: Partial<Outpass>): Promise<Outpass> => {
        const response = await api.post<Outpass>('outpasses/', data);
        return response.data;
    },

    addGuardian: async (data: Partial<Guardian>): Promise<Guardian> => {
        const response = await api.post<Guardian>('guardians/', data);
        return response.data;
    },

    deleteGuardian: async (id: string) => {
        await api.delete(`guardians/${id}/`);
    },

    getProfile: async (userId: string): Promise<User> => {
        const response = await api.get<User>(`users/${userId}/`);
        return response.data;
    },

    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
        const response = await api.patch<User>(`users/${userId}/`, data);
        return response.data;
    }
};

export const staffService = {
    getPendingApprovals: async (): Promise<Outpass[]> => {
        // Staff dashboard endpoint returns role-based pending by default
        const response = await api.get<Outpass[]>('staff/dashboard/');
        return response.data;
    },

    approveOutpass: async (id: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/hm/approve/`);
        return response.data;
    },

    rejectOutpass: async (id: string, reason: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/hm/reject/`, { reason });
        return response.data;
    },

    scheduleMeeting: async (id: string, data: { date: string; venue: string; reason: string }): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/hm/meeting/`, data);
        return response.data;
    },

    cancelMeeting: async (id: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/hm/cancel-meeting/`);
        return response.data;
    },

    markAsReturned: async (id: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/mark-returned/`);
        return response.data;
    },

    getAnalytics: async (period: string = 'daily'): Promise<any> => {
        const response = await api.get('staff/dashboard/reports/', { params: { period } });
        return response.data;
    },

    getHMOutpasses: async (params: { status?: string; priority?: boolean; history?: boolean; date?: string }): Promise<Outpass[]> => {
        const response = await api.get<Outpass[]>('staff/dashboard/', { params });
        return response.data;
    },

    accountantApprove: async (id: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/accountant/approve/`);
        return response.data;
    },

    markFeeDue: async (id: string, amount: number): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/accountant/fee-pending/`, { amount });
        return response.data;
    },

    wardenMarkLeft: async (id: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/warden_vacate/`, { verification_photo: null });
        return response.data;
    },

    wardenReject: async (id: string, reason: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/warden/reject/`, { reason });
        return response.data;
    },

    gateCheckout: async (id: string): Promise<any> => {
        const response = await api.post(`staff/dashboard/${id}/gate/checkout/`);
        return response.data;
    },

    gateScan: async (qrCode: string): Promise<any> => {
        const response = await api.post('staff/dashboard/gate/scan/', { qr_code: qrCode });
        return response.data;
    },

    processCode: async (code: string): Promise<any> => {
        const response = await api.post('staff/dashboard/gate/process-code/', { code });
        return response.data;
    },

    getAccountantOutpasses: async (params: { status?: string; search?: string; date?: string; history?: boolean }): Promise<Outpass[]> => {
        const response = await api.get<Outpass[]>('staff/dashboard/', { params });
        return response.data;
    }
};
