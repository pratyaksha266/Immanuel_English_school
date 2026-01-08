import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, ScrollView } from 'react-native';
import { Text, Appbar, Menu, Portal, Modal, TextInput, Button, ActivityIndicator, Surface, Chip, IconButton } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';
import { theme, SPACING, SCHOOL_NAME } from '../../constants/theme';

export default function AccountantDashboard() {
    const router = useRouter();
    const { logout, user, role } = useAuthStore();
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <Stack.Screen options={{
                title: SCHOOL_NAME,
                headerRight: () => (
                    <IconButton icon="account-circle" onPress={() => router.push('/(accountant)/profile')} />
                )
            }} />

            <Surface style={styles.roleBanner} elevation={0}>
                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 4 }}>
                    {SCHOOL_NAME}
                </Text>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    Welcome, {user?.first_name || (role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Accountant')}
                </Text>
                <Chip style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: theme.colors.secondaryContainer }}>
                    <Text style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>{role || 'ACCOUNTANT'}</Text>
                </Chip>
            </Surface>

            <View style={styles.content}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Today's Requests</Text>

                {loading && !refreshing ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
                ) : (
                    <View>
                        {requests.length === 0 ? (
                            <Text style={styles.emptyText}>No pending fee requests</Text>
                        ) : (
                            requests.map((item) => (
                                <StaffOutpassCard
                                    key={item.id}
                                    outpass={item}
                                    role="ACCOUNTANT"
                                    onApprove={handleApprove}
                                    onFeeDue={(id) => {
                                        setSelectedId(id);
                                        setFeeModalVisible(true);
                                    }}
                                />
                            ))
                        )}
                    </View>
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
        </ScrollView>
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
        color: '#616161'
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
    },
    roleBanner: {
        padding: SPACING.m,
        backgroundColor: 'white',
        marginBottom: SPACING.s,
        elevation: 1,
    },
});
