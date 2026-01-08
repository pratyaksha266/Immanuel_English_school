import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
    return (
        <PaperProvider>
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(parent)" options={{ headerShown: false }} />
                <Stack.Screen name="(staff)" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
        </PaperProvider>
    );
}
