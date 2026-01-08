import { Stack } from 'expo-router';
import { SCHOOL_NAME } from '../../constants/theme';

export default function StaffLayout() {
    return (
        <Stack>
            <Stack.Screen name="dashboard" options={{ title: SCHOOL_NAME }} />
            <Stack.Screen name="validate" options={{ title: 'Verify Exit/Return Code' }} />
        </Stack>
    );
}
