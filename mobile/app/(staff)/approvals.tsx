import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, TextInput, Portal, Modal } from 'react-native-paper';
import { Stack } from 'expo-router';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';

export default function ApprovalsScreen() {
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Rejection Modal
    const [rejectVisible, setRejectVisible] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await staffService.getPendingApprovals();
            setRequests(data);
        } catch (error) {
            console.error("Fetch Approvals Error:", error);
            Alert.alert("Error", "Failed to fetch pending requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await staffService.approveOutpass(id);
            Alert.alert("Success", "Outpass approved");
            fetchRequests();
        } catch (error) {
            Alert.alert("Error", "Failed to approve outpass");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectReason) return;

        setActionLoading(rejectId);
        try {
            await staffService.rejectOutpass(rejectId, rejectReason);
            Alert.alert("Success", "Outpass rejected");
            setRejectVisible(false);
            setRejectReason('');
            setRejectId(null);
            fetchRequests();
        } catch (error) {
            Alert.alert("Error", "Failed to reject outpass");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Pending Approvals' }} />

            {requests.length === 0 ? (
                <View style={styles.center}>
                    <Text variant="bodyLarge">No pending requests found.</Text>
                </View>
            ) : (
                requests.map(op => (
                    <Card key={op.id} style={styles.card}>
                        <Card.Title
                            title={op.student_name || "Student"}
                            subtitle={op.student_roll_no || "Roll No"}
                        />
                        <Card.Content>
                            <View style={styles.row}>
                                <Text variant="labelLarge">Dates:</Text>
                                <Text variant="bodyMedium"> {op.outgoing_date} to {op.expected_return_date}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text variant="labelLarge">Reason:</Text>
                                <Text variant="bodyMedium"> {op.reason}</Text>
                            </View>
                            {op.is_priority && (
                                <Chip icon="alert" style={styles.priorityChip} textStyle={{ color: 'white' }}>Priority</Chip>
                            )}
                        </Card.Content>
                        <Divider style={{ marginVertical: 8 }} />
                        <Card.Actions>
                            <Button
                                mode="outlined"
                                textColor="red"
                                onPress={() => {
                                    setRejectId(op.id);
                                    setRejectVisible(true);
                                }}
                                disabled={actionLoading === op.id}
                            >
                                Reject
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => handleApprove(op.id)}
                                loading={actionLoading === op.id}
                                disabled={!!actionLoading}
                            >
                                Approve
                            </Button>
                        </Card.Actions>
                    </Card>
                ))
            )}

            <Portal>
                <Modal visible={rejectVisible} onDismiss={() => setRejectVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Reject Outpass</Text>
                    <TextInput
                        label="Reason for rejection"
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={{ marginBottom: 16 }}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <Button onPress={() => setRejectVisible(false)}>Cancel</Button>
                        <Button
                            mode="contained"
                            buttonColor="red"
                            onPress={handleReject}
                            disabled={!rejectReason}
                        >
                            Confirm Reject
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    card: { marginBottom: 16, backgroundColor: 'white' },
    row: { flexDirection: 'row', marginBottom: 4 },
    priorityChip: { backgroundColor: 'red', marginTop: 8, alignSelf: 'flex-start' },
    modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }
});
