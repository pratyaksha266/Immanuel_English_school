import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, Avatar, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { theme, SCHOOL_NAME, SPACING } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('PARENT');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuthStore();

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Error', 'Please enter phone number and password');
            return;
        }
        try {
            await login(phone, password, role);
            if (role === 'PARENT') {
                router.replace('/(parent)/dashboard');
            } else {
                router.replace('/(staff)/dashboard');
            }
        } catch (error) {
            Alert.alert('Error', 'Login failed. Check credentials.');
        }
    };

    const roles = [
        { value: 'PARENT', label: 'Parent', icon: 'account-child' },
        { value: 'WARDEN', label: 'Warden', icon: 'bunk-bed' },
        { value: 'HM', label: 'HM', icon: 'school' },
        { value: 'ACCOUNTANT', label: 'Accountant', icon: 'calculator' },
        { value: 'GATE_STAFF', label: 'Gate', icon: 'gate' },
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <Avatar.Icon size={80} icon="school" style={{ backgroundColor: theme.colors.primary }} color="white" />
                    </View>
                    <Text variant="headlineSmall" style={styles.schoolName}>{SCHOOL_NAME}</Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>Sign in to continue</Text>
                </View>

                <Surface style={styles.card} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Select Role</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScroll}>
                        {roles.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                style={[
                                    styles.roleItem,
                                    role === r.value && styles.roleItemActive
                                ]}
                                onPress={() => setRole(r.value)}
                            >
                                <Avatar.Icon
                                    size={40}
                                    icon={r.icon}
                                    style={{ backgroundColor: role === r.value ? theme.colors.primary : '#E0E0E0' }}
                                    color={role === r.value ? 'white' : '#757575'}
                                />
                                <Text style={[
                                    styles.roleLabel,
                                    role === r.value && styles.roleLabelActive
                                ]}>{r.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.formContainer}>
                        <TextInput
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="phone" />}
                            theme={{ roundness: 10 }}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="lock" />}
                            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                            theme={{ roundness: 10 }}
                        />

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.button}
                            contentStyle={{ paddingVertical: 8 }}
                            buttonColor={theme.colors.primary}
                        >
                            LOGIN
                        </Button>

                        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                </Surface>

                <Text style={styles.footerText}>© 2026 Outpass Management System</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.m,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.xl,
    },
    logoContainer: {
        marginBottom: SPACING.m,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        borderRadius: 40,
    },
    schoolName: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: SPACING.xs,
        paddingHorizontal: SPACING.m,
    },
    subtitle: {
        color: '#757575',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: SPACING.l,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    sectionTitle: {
        marginBottom: SPACING.m,
        fontWeight: 'bold',
        color: '#424242',
    },
    roleScroll: {
        marginBottom: SPACING.l,
    },
    roleItem: {
        alignItems: 'center',
        marginRight: SPACING.l,
        opacity: 0.7,
        padding: 4,
    },
    roleItemActive: {
        opacity: 1,
    },
    roleLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#757575',
    },
    roleLabelActive: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    formContainer: {
        gap: SPACING.m,
    },
    input: {
        backgroundColor: 'white',
    },
    button: {
        borderRadius: 10,
        marginTop: SPACING.s,
    },
    forgotText: {
        textAlign: 'center',
        color: theme.colors.primary,
        marginTop: SPACING.m,
        fontWeight: '500',
    },
    footerText: {
        textAlign: 'center',
        color: '#9E9E9E',
        fontSize: 12,
        marginTop: SPACING.xl,
        marginBottom: SPACING.m,
    }
});
