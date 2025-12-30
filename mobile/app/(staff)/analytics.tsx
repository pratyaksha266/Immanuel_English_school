import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { staffService } from '../../services/api';

export default function AnalyticsScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async (period = 'daily') => {
        setLoading(true);
        try {
            const result = await staffService.getAnalytics(period);
            setData(result);
        } catch (error) {
            Alert.alert("Error", "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (period: string) => {
        Alert.alert("Download", `Report for ${period} requested. In a real app, this would trigger a PDF/Excel generation.`);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Analytics' }} />

            <Text variant="headlineSmall" style={styles.title}>Outpass Statistics</Text>

            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="titleLarge">{data?.total_outpasses || 0}</Text>
                        <Text variant="labelSmall">Total Requests</Text>
                    </Card.Content>
                </Card>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={{ color: 'green' }}>{data?.approved || 0}</Text>
                        <Text variant="labelSmall">Approved</Text>
                    </Card.Content>
                </Card>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={{ color: 'blue' }}>{data?.returned_on_time || 0}</Text>
                        <Text variant="labelSmall">Returned</Text>
                    </Card.Content>
                </Card>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="titleLarge" style={{ color: 'red' }}>{data?.late_returns || 0}</Text>
                        <Text variant="labelSmall">Overdue</Text>
                    </Card.Content>
                </Card>
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.subtitle}>Download Reports</Text>
            <View style={styles.buttonRow}>
                <Button mode="outlined" onPress={() => handleDownload('daily')} style={styles.btn}>Daily</Button>
                <Button mode="outlined" onPress={() => handleDownload('weekly')} style={styles.btn}>Weekly</Button>
                <Button mode="outlined" onPress={() => handleDownload('monthly')} style={styles.btn}>Monthly</Button>
            </View>

            <Card style={styles.chartCard}>
                <Card.Title title="Outpass Status Distribution" />
                <Card.Content>
                    {data?.data?.map((item: any, index: number) => (
                        <View key={index} style={styles.chartRow}>
                            <Text style={{ flex: 1 }}>{item.name}</Text>
                            <View style={[styles.bar, { width: `${item.value}%` }]} />
                            <Text style={{ width: 40, textAlign: 'right' }}>{item.value}%</Text>
                        </View>
                    ))}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { marginBottom: 20 },
    subtitle: { marginVertical: 10 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { width: '47%', backgroundColor: '#f0f4f8' },
    divider: { marginVertical: 20 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    btn: { flex: 1, marginHorizontal: 4 },
    chartCard: { marginTop: 10 },
    chartRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    bar: { height: 10, backgroundColor: '#6200ee', borderRadius: 5, marginHorizontal: 10 },
});
