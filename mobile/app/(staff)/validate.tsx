import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { staffService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ValidateCodeScreen() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { role } = useAuthStore();

    const handleVerify = async () => {
        if (!code || code.length < 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit code');
            return;
        }

        if (role !== 'GATE_STAFF') {
            Alert.alert('Error', 'Only Gate Staff can verify exit/return codes');
            return;
        }

        try {
            setLoading(true);
            const res = await staffService.processCode(code);

            let message = "";
            let title = "Success";

            if (res.type === 'EXIT') {
                message = `Checked OUT: ${res.student}\n\nGENERATED RETURN CODE: ${res.return_code}\n\nPlease share this return code with the student.`;
            } else {
                message = `Checked IN (Returned): ${res.student}\n\nOutpass Completed.`;
            }

            Alert.alert(title, message, [
                {
                    text: "OK", onPress: () => {
                        setCode('');
                        router.back();
                    }
                }
            ]);
        } catch (error: any) {
            console.log("Verify Error:", error.response?.data);
            const msg = error.response?.data?.error || "Invalid Code or Request Failed";
            Alert.alert("Verification Failed", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Gate Verification" subtitle="Enter Student Exit/Return Code" />
                <Card.Content>
                    <TextInput
                        label="Enter 6-digit Code"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        mode="outlined"
                        style={styles.input}
                        right={<TextInput.Icon icon="key" />}
                    />

                    <Button
                        mode="contained"
                        onPress={handleVerify}
                        loading={loading}
                        disabled={loading || code.length < 6}
                        style={styles.button}
                    >
                        Verify Code
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: 'white',
    },
    input: {
        marginBottom: 20,
        backgroundColor: 'white',
        fontSize: 24,
        textAlign: 'center',
    },
    button: {
        paddingVertical: 6,
    }
});
