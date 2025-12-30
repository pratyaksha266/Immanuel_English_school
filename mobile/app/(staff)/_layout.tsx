import { Stack } from 'expo-router';

export default function StaffLayout() {
    return (
        <Stack>
            <Stack.Screen name="dashboard" options={{ title: 'Staff Dashboard' }} />
            <Stack.Screen name="validate" options={{ title: 'Verify Exit/Return Code' }} />
        </Stack>
    );
}
