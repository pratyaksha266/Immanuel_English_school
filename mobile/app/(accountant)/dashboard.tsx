import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, Menu, Portal, Modal, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';

export default function AccountantDashboard() {
    const router = useRouter();
    const { logout, user } = useAuthStore();
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [menuVisible, setMenuVisible] = useState(false);
    const [feeModalVisible, setFeeModalVisible] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [feeAmount, setFeeAmount] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await staffService.getAccountantOutpasses({ status: 'pending' });
            setRequests(data);
        } catch (error) {
            console.error('Fetch requests error:', error);
            Alert.alert('Error', 'Failed to fetch outpass requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleLogout = async () => {
        setMenuVisible(false);
        await logout();
        router.replace('/(auth)/login');
    };

    const handleApprove = async (id: string) => {
        try {
            await staffService.accountantApprove(id);
            Alert.alert('Success', 'Fee marked as paid');
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve fee');
        }
    };

    const handleMarkFeeDue = async () => {
        if (!selectedId || !feeAmount) return;
        try {
            await staffService.markFeeDue(selectedId, parseFloat(feeAmount));
            setFeeModalVisible(false);
            setFeeAmount('');
            setSelectedId(null);
            Alert.alert('Success', 'Fee marked as due');
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to mark fee due');
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Accountant Portal" subtitle="Fee Management" />
                <Appbar.Action icon="account-circle" onPress={() => router.push('/(accountant)/profile')} />
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
                >
                    <Menu.Item onPress={handleLogout} title="Logout" />
                </Menu>
            </Appbar.Header>

            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.sectionTitle}>Today's Requests</Text>

                {loading && !refreshing ? (
                    <ActivityIndicator style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={requests}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <StaffOutpassCard
                                outpass={item}
                                role="ACCOUNTANT"
                                onApprove={handleApprove}
                                onFeeDue={(id) => {
                                    setSelectedId(id);
                                    setFeeModalVisible(true);
                                }}
                            />
                        )}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => {
                                setRefreshing(true);
                                fetchRequests();
                            }} />
                        }
                        ListEmptyComponent={<Text style={styles.emptyText}>No pending fee requests</Text>}
                        contentContainerStyle={styles.list}
                    />
                )}
            </View>

            <Portal>
                <Modal
                    visible={feeModalVisible}
                    onDismiss={() => setFeeModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Enter Fee Amount</Text>
                    <TextInput
                        label="Amount (₹)"
                        value={feeAmount}
                        onChangeText={setFeeAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.modalInput}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setFeeModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleMarkFeeDue}>Submit</Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#757575',
    },
    modal: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 16,
    },
    modalInput: {
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    }
});
