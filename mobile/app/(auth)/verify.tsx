import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function VerifyScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState('');
    const router = useRouter();
    const { verifyOtp, isLoading, role } = useAuthStore();

    const handleVerify = async () => {
        if (!otp) return;
        const success = await verifyOtp(phone, otp);
        if (success) {
            // Redirect based on role
            if (role === 'PARENT') router.replace('/(parent)/dashboard');
            else if (role === 'WARDEN' || role === 'HM' || role === 'ACCOUNTANT') router.replace('/(staff)/dashboard');
            else router.replace('/');
        } else {
            Alert.alert('Error', 'Invalid OTP');
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Sent to {phone}</Text>

            <TextInput
                label="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
            />

            <Button
                mode="contained"
                onPress={handleVerify}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
            >
                Verify Code
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
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
    },
    input: {
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5,
    },
});
