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
    login: (phone: string, password: string, role: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    verifyOtp: (phone: string, otp: string) => Promise<boolean>;
    setUser: (user: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    role: null,
    userId: null,
    user: null,
    isLoading: false,

    setUser: async (user: any) => {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },

    login: async (phone, password, role) => {
        set({ isLoading: true });
        try {
            const response = await api.post('auth/login/', { phone, password, role });
            const { access, user_id, user: userData } = response.data;

            await AsyncStorage.setItem('token', access);
            await AsyncStorage.setItem('role', role);
            await AsyncStorage.setItem('userId', String(user_id));
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            }

            set({ token: access, role, userId: user_id, user: userData });
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
        set({ token: null, role: null, userId: null, user: null });
    },

    verifyOtp: async (phone, otp) => {
        set({ isLoading: true });
        try {
            const response = await api.post('auth/verify-otp/', { phone, otp });
            const { access, user_id, role, user: userData } = response.data;

            await AsyncStorage.setItem('token', access);
            await AsyncStorage.setItem('role', role);
            await AsyncStorage.setItem('userId', String(user_id));
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            }

            set({ token: access, role, userId: user_id, user: userData });
            return true;
        } catch (error) {
            console.error('Verify OTP error:', error);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    checkAuth: async () => {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('role');
        const userId = await AsyncStorage.getItem('userId');
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        if (token) {
            set({ token, role, userId, user });
        }
    },
}));
