import { MD3LightTheme } from 'react-native-paper';

export const SCHOOL_NAME = "IMMANUEL ENGLISH SCHOOL OF SDA";

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#1A237E', // Deep Indigo
        onPrimary: '#FFFFFF',
        primaryContainer: '#C5CAE9',
        onPrimaryContainer: '#000051',
        secondary: '#FFB300', // Amber/Gold for accent
        onSecondary: '#000000',
        secondaryContainer: '#FFECB3',
        onSecondaryContainer: '#3E2723',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        error: '#B00020',
    },
    roundness: 12,
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48
};
