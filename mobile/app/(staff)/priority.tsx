import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Stack } from 'expo-router';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';

export default function PriorityScreen() {
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPriorityRequests = async () => {
        try {
            const data = await staffService.getHMOutpasses({ priority: true });
            setRequests(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch priority requests");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPriorityRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPriorityRequests();
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Stack.Screen options={{ title: 'Priority Requests' }} />

            <View style={styles.header}>
                <Text variant="headlineSmall">High Priority</Text>
                <Text variant="bodyMedium" style={{ color: 'gray' }}>Requires immediate attention</Text>
            </View>

            {requests.length === 0 ? (
                <View style={styles.center}>
                    <Text variant="bodyLarge">No priority requests found.</Text>
                </View>
            ) : (
                requests.map(op => (
                    <StaffOutpassCard
                        key={op.id}
                        outpass={op}
                        onApprove={async (id) => {
                            try {
                                await staffService.approveOutpass(id);
                                fetchPriorityRequests();
                            } catch (e) { Alert.alert("Error", "Failed to approve"); }
                        }}
                    />
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    header: { marginBottom: 20 },
});
