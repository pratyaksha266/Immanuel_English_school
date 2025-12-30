import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('PARENT');
    const [password, setPassword] = useState('');
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
            } else if (role === 'ACCOUNTANT') {
                router.replace('/(accountant)/dashboard');
            } else {
                router.replace('/(staff)/dashboard');
            }
        } catch (error) {
            Alert.alert('Error', 'Login failed. Check credentials.');
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>

            <Text variant="labelLarge" style={styles.label}>Select Role</Text>
            <SegmentedButtons
                value={role}
                onValueChange={setRole}
                buttons={[
                    { value: 'PARENT', label: 'Parent' },
                    { value: 'WARDEN', label: 'Warden' },
                    { value: 'HM', label: 'HM' },
                    { value: 'ACCOUNTANT', label: 'Accountant' },
                    { value: 'GATE_STAFF', label: 'Gate' },
                ]}
                style={styles.segmented}
            />


            <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
            />

            <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
            >
                Login
            </Button>

            <Button
                mode="text"
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotButton}
            >
                Forgot Password?
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    label: {
        marginBottom: 10,
    },
    segmented: {
        marginBottom: 20,
    },
    devRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    input: {
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5,
    },
    forgotButton: {
        marginTop: 10,
    }
});
