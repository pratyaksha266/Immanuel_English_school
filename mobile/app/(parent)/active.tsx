import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { parentService } from '../../services/api';
import { Outpass } from '../../types';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function ActiveOutpassesScreen() {
    const [outpasses, setOutpasses] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchOutpasses();
    }, []);

    const params = useLocalSearchParams();

    const fetchOutpasses = async () => {
        try {
            const data = await parentService.getActiveOutpasses();
            if (params.outpassId) {
                setOutpasses(data.filter(op => op.id === params.outpassId));
            } else {
                setOutpasses(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Active Outpasses' }} />

            {outpasses.length === 0 ? (
                <View style={styles.center}>
                    <Text variant="bodyLarge" style={{ color: 'gray' }}>No active outpasses found.</Text>
                </View>
            ) : (
                outpasses.map(op => (
                    <Card key={op.id} style={styles.card}>
                        <Card.Title
                            title={op.student_name || "Student"}
                            subtitle={`${op.outgoing_date} ${op.outgoing_time}`}
                            right={(props) => <Chip mode="outlined" {...props}>{op.status}</Chip>}
                        />
                        <Card.Content>
                            <Text variant="bodyMedium">Reason: {op.reason}</Text>
                            <Text variant="bodyMedium">Return By: {op.expected_return_date} {op.expected_return_time}</Text>

                            {op.status === 'MEETING' && (
                                <View style={styles.meetingInfo}>
                                    <Text variant="titleSmall" style={{ color: '#6200ee' }}>Meeting Scheduled</Text>
                                    <Text variant="bodySmall">Date: {op.meeting_date ? new Date(op.meeting_date).toLocaleString() : 'TBD'}</Text>
                                    <Text variant="bodySmall">Venue: {op.meeting_venue}</Text>
                                    {op.meeting_notes ? <Text variant="bodySmall">Notes: {op.meeting_notes}</Text> : null}
                                </View>
                            )}

                            {op.fee_due && op.fee_due > 0 && !op.fee_paid && (
                                <Text style={{ color: 'red', marginTop: 5 }}>Fee Due: ₹{op.fee_due}</Text>
                            )}

                            {op.status === 'READY_FOR_EXIT' && (
                                <View style={styles.qrContainer}>
                                    <Text variant="titleSmall" style={styles.qrLabel}>Ready for Campus Departure</Text>
                                    <Text variant="bodySmall" style={styles.qrSub}>Show this Exit Code at the Main Gate</Text>
                                    <View style={styles.qrBox}>
                                        <Text style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>
                                            {op.exit_code || '---'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {op.status === 'CHECKED_OUT' && (
                                <View style={styles.qrContainer}>
                                    <Text variant="titleSmall" style={styles.qrLabel}>Checked Out</Text>
                                    <Text variant="bodySmall" style={styles.qrSub}>Show this Return Code upon Return</Text>
                                    <View style={styles.qrBox}>
                                        <Text style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>
                                            {op.return_code || '---'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    card: { marginBottom: 16, backgroundColor: 'white' },
    meetingInfo: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f3e5f5',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#6200ee',
    },
    qrContainer: {
        marginTop: 20,
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    qrLabel: {
        color: '#2e7d32',
        fontWeight: 'bold',
    },
    qrSub: {
        color: '#666',
        marginBottom: 15,
    },
    qrBox: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 2,
    }
});
