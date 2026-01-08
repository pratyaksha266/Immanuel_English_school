import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator, IconButton, FAB, Menu, Divider, Badge } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { parentService } from '../../services/api';
import { Student, Outpass } from '../../types';
import { ChildCard } from '../../components/ChildCard';
import { useAuthStore } from '../../store/authStore';

export default function ParentDashboard() {
    const router = useRouter();
    const logout = useAuthStore(state => state.logout);
    const [children, setChildren] = useState<Student[]>([]);
    const [activeOutpasses, setActiveOutpasses] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Menu state
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [kids, outpasses] = await Promise.all([
                parentService.getChildren(),
                parentService.getActiveOutpasses()
            ]);
            setChildren(kids);
            setActiveOutpasses(outpasses);
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleLogout = () => {
        setMenuVisible(false);
        logout();
        router.replace('/(auth)/login');
    };

    // Render Header Options
    const renderHeader = () => (
        <Stack.Screen
            options={{
                title: "Dashboard",
                headerShown: true,
                headerRight: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconButton
                            icon="account-circle"
                            size={30}
                            onPress={() => router.push('/(parent)/profile')}
                        />
                    </View>
                ),
            }}
        />
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

    return (
        <>
            {renderHeader()}
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Greeting / Quick Actions */}
                <View style={styles.headerSection}>
                    <Text variant="headlineSmall" style={styles.greeting}>Welcome, Parent</Text>
                    <Text variant="bodyMedium" style={{ color: 'gray' }}>Select a child below to request an outpass.</Text>
                </View>

                {/* Dashboard Cards Grid */}
                <View style={styles.grid}>
                    <Card style={[styles.gridCard, { backgroundColor: '#E3F2FD' }]} onPress={() => router.push('/(parent)/active')}>
                        <Card.Content style={styles.gridContent}>
                            <IconButton icon="clock-outline" size={30} iconColor="#1976D2" />
                            <Text variant="titleMedium">Active ({activeOutpasses.length})</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.gridCard, { backgroundColor: '#F3E5F5' }]} onPress={() => router.push('/(parent)/history')}>
                        <Card.Content style={styles.gridContent}>
                            <IconButton icon="history" size={30} iconColor="#7B1FA2" />
                            <Text variant="titleMedium">History</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Active Outpasses Preview */}
                {activeOutpasses.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Current Status</Text>
                        {activeOutpasses.slice(0, 3).map(op => (
                            <Card key={op.id} style={styles.miniCard} onPress={() => router.push({ pathname: '/(parent)/active', params: { outpassId: op.id } })}>
                                <Card.Title
                                    title={op.student_name || "Student"}
                                    subtitle={`Status: ${op.status}`}
                                    left={(props) => <Avatar.Icon {...props} icon="run-fast" size={40} style={{ backgroundColor: '#e0f7fa' }} color='#006064' />}
                                    right={(props) => <IconButton {...props} icon="chevron-right" />}
                                />
                            </Card>
                        ))}
                    </View>
                )}

                {activeOutpasses.length === 0 ? (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={{ textAlign: 'center', color: 'gray' }}>No active outpasses</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    activeOutpasses.slice(0, 3).map(op => (
                        <Card key={op.id} style={styles.miniCard} onPress={() => router.push({ pathname: '/(parent)/active', params: { outpassId: op.id } })}>
                            <Card.Title
                                title={op.student_name || "Student"}
                                subtitle={`Status: ${op.status}`}
                                right={(props) => <IconButton {...props} icon="chevron-right" />}
                            />
                        </Card>
                    ))
                )}


                {/* My Children */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>My Children</Text>
                </View>

                {children.map(child => (
                    <ChildCard
                        key={child.id}
                        student={child}
                        hasActiveOutpass={activeOutpasses.some(op => op.student === child.id)}
                        onRequestOutpass={(s) => router.push({ pathname: '/(parent)/new-outpass', params: { studentId: s.id } })}
                    />
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        marginBottom: 20,
    },
    greeting: {
        fontWeight: 'bold',
        color: '#1a237e',
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    gridCard: {
        flex: 1,
        borderRadius: 12,
        elevation: 2,
    },
    gridContent: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 4,
    },
    card: {
        marginBottom: 10,
        backgroundColor: 'white',
    },
    miniCard: {
        marginBottom: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 1,
    }
});
