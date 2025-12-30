import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import api from '../../services/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP & Reset
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!phone) {
            Alert.alert('Error', 'Please enter phone number');
            return;
        }
        setIsLoading(true);
        try {
            const resp = await api.post('/auth/forgot-password/', { phone });
            Alert.alert('OTP Sent', `For dev: ${resp.data.dev_otp}`);
            setStep(2);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword) {
            Alert.alert('Error', 'Please enter OTP and new password');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password/', { phone, otp, new_password: newPassword });
            Alert.alert('Success', 'Password reset successfully. Please login.');
            router.replace('/(auth)/login');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Reset Password</Text>

            {step === 1 ? (
                <>
                    <TextInput
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        mode="outlined"
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleSendOTP}
                        loading={isLoading}
                        style={styles.button}
                    >
                        Send OTP
                    </Button>
                </>
            ) : (
                <>
                    <TextInput
                        label="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleResetPassword}
                        loading={isLoading}
                        style={styles.button}
                    >
                        Reset Password
                    </Button>
                </>
            )}

            <Button mode="text" onPress={() => router.back()} style={styles.backButton}>
                Back to Login
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
        marginBottom: 30,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5,
    },
    backButton: {
        marginTop: 20,
    }
});
