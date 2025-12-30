import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, Camera } from "expo-camera";
import { useRouter } from 'expo-router';
import { staffService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Alert } from 'react-native';

export default function ScanScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getCameraPermissions();
    }, []);

    const { role } = useAuthStore();
    const router = useRouter();

    const handleBarCodeScanned = async ({ type, data }: any) => {
        setScanned(true);

        if (role === 'GATE_STAFF') {
            try {
                // QR data is the random UUID string, verified by backend
                console.log("Scanning QR:", data);
                const res = await staffService.gateScan(data);

                let message = "";
                if (res.type === 'EXIT') {
                    message = `Checked OUT: ${res.student}`;
                } else {
                    message = `Checked IN (Returned): ${res.student}`;
                }

                Alert.alert("Success", message, [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } catch (error: any) {
                console.log("Scan Error:", error.response?.data);
                const msg = error.response?.data?.error || "Invalid QR or Not Ready for Exit";
                Alert.alert("Error", msg, [
                    { text: "Try Again", onPress: () => setScanned(false) }
                ]);
            }
        } else {
            alert(`QR scanned (Data: ${data}). Only Gate Staff can perform check-outs.`);
            setScanned(false);
        }
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
});
