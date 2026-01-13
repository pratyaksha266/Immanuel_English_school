import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
    token: string | null;
    role: string | null;
    userId: string | null;
    user: User | null;
    isLoading: boolean;
    dashboardData: any | null; // Cache for dashboard data from login
    login: (phone: string, password: string, role: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setUser: (user: any) => Promise<void>;
    clearDashboardCache: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    role: null,
    userId: null,
    user: null,
    isLoading: false,
    dashboardData: null,

    setUser: async (user: any) => {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },

    login: async (phone, password, role) => {
        set({ isLoading: true });
        try {
            const response = await api.post('auth/login/', { phone, password, role });
            const { access, user_id, user: userData, dashboard_data } = response.data;

            await AsyncStorage.setItem('token', access);
            await AsyncStorage.setItem('role', role);
            await AsyncStorage.setItem('userId', String(user_id));
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            }

            // Cache dashboard data if provided
            if (dashboard_data) {
                await AsyncStorage.setItem('dashboardData', JSON.stringify(dashboard_data));
            }

            set({
                token: access,
                role,
                userId: user_id,
                user: userData,
                dashboardData: dashboard_data || null
            });
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('role');
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('dashboardData');
        set({ token: null, role: null, userId: null, user: null, dashboardData: null });
    },

    checkAuth: async () => {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('role');
        const userId = await AsyncStorage.getItem('userId');
        const userJson = await AsyncStorage.getItem('user');
        const dashboardDataJson = await AsyncStorage.getItem('dashboardData');
        const user = userJson ? JSON.parse(userJson) : null;
        const dashboardData = dashboardDataJson ? JSON.parse(dashboardDataJson) : null;
        if (token) {
            set({ token, role, userId, user, dashboardData });
        }
    },

    clearDashboardCache: () => {
        AsyncStorage.removeItem('dashboardData');
        set({ dashboardData: null });
    }
}));
