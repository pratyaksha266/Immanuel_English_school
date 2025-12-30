import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AccountantLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#6200ee',
            headerShown: false,
        }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="history" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
