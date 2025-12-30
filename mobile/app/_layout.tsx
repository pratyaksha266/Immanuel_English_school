import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const { LightTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
});

const theme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...LightTheme.colors,
        primary: '#1a237e', // Deep Blue
        secondary: '#006064', // Cyan/Teal
        tertiary: '#7B1FA2', // Purple
        background: '#f8f9fa',
        surface: '#ffffff',
    },
};

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...MaterialCommunityIcons.font,
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <Stack>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(parent)" options={{ headerShown: false }} />
                    <Stack.Screen name="(staff)" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                </Stack>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}
