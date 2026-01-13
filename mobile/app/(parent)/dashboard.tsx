import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl, ImageBackground, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator, IconButton, Surface, FAB } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { parentService } from '../../services/api';
import { Student, Outpass } from '../../types';
import { ChildCard } from '../../components/ChildCard';
import { useAuthStore } from '../../store/authStore';
import { theme, SCHOOL_NAME, SPACING } from '../../constants/theme';

export default function ParentDashboard() {
    const router = useRouter();
    const { logout, dashboardData, clearDashboardCache } = useAuthStore();
    const [children, setChildren] = useState<Student[]>([]);
    const [activeOutpasses, setActiveOutpasses] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Use cached data if available for instant display
        if (dashboardData && dashboardData.children) {
            console.log('Using cached dashboard data');
            setChildren(dashboardData.children);
            setActiveOutpasses(dashboardData.active_outpasses || []);
            setLoading(false);

            // Fetch fresh data in background
            fetchDashboardData(true);
        } else {
            fetchDashboardData();
        }
    }, []);

    const fetchDashboardData = async (isBackgroundRefresh = false) => {
        try {
            const [kids, outpasses] = await Promise.all([
                parentService.getChildren(),
                parentService.getActiveOutpasses()
            ]);
            setChildren(kids);
            setActiveOutpasses(outpasses);

            // Clear cache after successful fetch
            if (isBackgroundRefresh) {
                clearDashboardCache();
            }
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

    const renderHeader = () => (
        <Stack.Screen
            options={{
                title: SCHOOL_NAME,
                headerShown: true,
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
                headerRight: () => (
                    <IconButton
                        icon="account-circle"
                        size={28}
                        iconColor="white"
                        onPress={() => router.push('/(parent)/profile')}
                    />
                ),
            }}
        />
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    return (
        <>
            {renderHeader()}
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                <Surface style={styles.welcomeBanner} elevation={2}>
                    <View>
                        <Text variant="titleLarge" style={styles.welcomeText}>Welcome, Parent</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>Manage your children's outpasses</Text>
                    </View>
                    <Avatar.Icon size={48} icon="school" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                </Surface>

                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]} onPress={() => router.push('/(parent)/active')}>
                        <Card.Content style={styles.statContent}>
                            <View style={styles.iconBox}>
                                <Avatar.Icon size={36} icon="clock-outline" style={{ backgroundColor: 'transparent' }} color="#2E7D32" />
                            </View>
                            <View>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#1B5E20' }}>{activeOutpasses.length}</Text>
                                <Text variant="labelMedium" style={{ color: '#2E7D32' }}>Active Requests</Text>
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#FFF3E0' }]} onPress={() => router.push('/(parent)/history')}>
                        <Card.Content style={styles.statContent}>
                            <View style={styles.iconBox}>
                                <Avatar.Icon size={36} icon="history" style={{ backgroundColor: 'transparent' }} color="#E65100" />
                            </View>
                            <View>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#BF360C' }}>History</Text>
                                <Text variant="labelMedium" style={{ color: '#E65100' }}>Past Records</Text>
                            </View>
                        </Card.Content>
                    </Card>
                </View>

                {activeOutpasses.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Active Status</Text>
                            <Button mode="text" compact onPress={() => router.push('/(parent)/active')}>View All</Button>
                        </View>
                        {activeOutpasses.slice(0, 2).map(op => (
                            <Card key={op.id} style={styles.activeCard} onPress={() => router.push({ pathname: '/(parent)/active', params: { outpassId: op.id } })}>
                                <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{op.student_name}</Text>
                                        <Text variant="bodySmall" style={{ color: 'gray' }}>{op.reason}</Text>
                                    </View>
                                    <Surface style={[styles.statusBadge, { backgroundColor: op.status === 'APPROVED' ? '#E8F5E9' : '#FFF3E0' }]} elevation={0}>
                                        <Text style={{ color: op.status === 'APPROVED' ? '#2E7D32' : '#E65100', fontSize: 10, fontWeight: 'bold' }}>
                                            {op.status}
                                        </Text>
                                    </Surface>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>My Children</Text>
                    {children.map(child => (
                        <ChildCard
                            key={child.id}
                            student={child}
                            hasActiveOutpass={activeOutpasses.some(op => op.student === child.id)}
                            onRequestOutpass={(s) => router.push({ pathname: '/(parent)/new-outpass', params: { studentId: s.id } })}
                        />
                    ))}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: SPACING.m,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcomeBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: theme.roundness,
        backgroundColor: 'white',
        marginBottom: SPACING.m,
    },
    welcomeText: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    subtitle: {
        color: 'gray',
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    statCard: {
        flex: 1,
        borderRadius: theme.roundness,
        elevation: 1,
    },
    statContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.s,
        gap: SPACING.s,
    },
    iconBox: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: SPACING.m,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#424242',
        marginBottom: SPACING.s,
        marginLeft: SPACING.xs
    },
    activeCard: {
        marginBottom: SPACING.s,
        backgroundColor: 'white',
        borderRadius: theme.roundness,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    }
});
