import { Stack } from 'expo-router';

export default function ParentLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#f5f5f5' }
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="new-outpass" options={{ presentation: 'modal', headerShown: true, title: 'New Request' }} />
            <Stack.Screen name="history" options={{ headerShown: true, title: 'History' }} />
            <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile' }} />
            <Stack.Screen name="active" options={{ headerShown: true, title: 'Active Outpasses' }} />
        </Stack>
    );
}
