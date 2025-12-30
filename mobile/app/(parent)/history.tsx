import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { parentService } from '../../services/api';
import { Outpass } from '../../types';
import { Stack } from 'expo-router';

export default function HistoryScreen() {
    const [outpasses, setOutpasses] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await parentService.getOutpassHistory();
            setOutpasses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return '#4CAF50';
            case 'REJECTED': return '#F44336';
            case 'CANCELLED': return '#9E9E9E';
            case 'EXPIRED': return '#FF9800';
            default: return '#000';
        }
    };

    if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} />}
        >
            <Stack.Screen options={{ title: 'Outpass History', headerShown: true }} />

            {outpasses.length === 0 ? (
                <View style={styles.center}>
                    <Text variant="bodyLarge" style={{ color: 'gray' }}>No history found.</Text>
                </View>
            ) : (
                outpasses.map(op => (
                    <Card key={op.id} style={styles.card}>
                        <Card.Title
                            title={op.student_name || "Student"}
                            subtitle={`${op.outgoing_date} ${op.outgoing_time}`}
                            right={(props) => (
                                <Chip
                                    style={{ backgroundColor: getStatusColor(op.status) + '20' }}
                                    textStyle={{ color: getStatusColor(op.status), fontSize: 10 }}
                                    {...props}
                                >
                                    {op.status}
                                </Chip>
                            )}
                        />
                        <Card.Content>
                            <Text variant="bodyMedium">Reason: {op.reason}</Text>
                            <Text variant="bodySmall" style={{ color: 'gray' }}>
                                Applied on: {new Date(op.created_at).toLocaleDateString()}
                            </Text>
                        </Card.Content>
                    </Card>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    card: { marginBottom: 16, backgroundColor: 'white' }
});
