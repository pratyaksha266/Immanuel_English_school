import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar, IconButton, SegmentedButtons, Portal, Modal, TextInput, Divider, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';

import { theme, SPACING, SCHOOL_NAME } from '../../constants/theme';

export default function StaffDashboard() {
    const router = useRouter();
    const { role, user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [category, setCategory] = useState('pending');
    const [requests, setRequests] = useState<Outpass[]>([]);

    // Dialogs
    const [rejectVisible, setRejectVisible] = useState(false);
    const [meetingVisible, setMeetingVisible] = useState(false);
    const [feeVisible, setFeeVisible] = useState(false); // New
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [meetingData, setMeetingData] = useState({ date: '', venue: '', reason: '' });
    const [feeAmount, setFeeAmount] = useState(''); // New
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);

    // Warden Search
    const [searchParams, setSearchParams] = useState({ hostel: '', class_name: '', section: '', name: '' });
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const fetchCategorizedRequests = async (cat: string) => {
        setLoading(true);
        try {
            const data = await staffService.getHMOutpasses({ status: cat });
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchAccountantDashboard = async () => {
        setLoading(true);
        try {
            // Re-use getHMOutpasses or specific one. api.ts has getAccountantOutpasses
            const data = await staffService.getAccountantOutpasses({});
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (role === 'HM') {
            fetchCategorizedRequests(category);
        } else if (role === 'WARDEN') {
            fetchWardenDashboard();
        } else if (role === 'ACCOUNTANT') {
            fetchAccountantDashboard();
        } else if (role === 'GATE_STAFF') {
            // Gate staff loaded statically or needs fetch? 
            // renderGateContent calls fetchWardenDashboard logic? No, let's just set loading false
            // Actually Gate Content shows "Recent Checkouts", so we should fetch relevant data
            fetchGateDashboard();
        } else {
            setLoading(false);
        }
    }, [category, role]);

    const fetchGateDashboard = async () => {
        setLoading(true);
        try {
            const data = await staffService.getHMOutpasses({ status: 'checked_out' }); // Reuse
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchWardenDashboard = async () => {
        setLoading(true);
        try {
            // Map category to status_param
            let status_param = '';
            if (category === 'pending') status_param = 'in_hostel';
            if (category === 'checked_out') status_param = 'checked_out';
            if (category === 'outside') status_param = 'outside';

            const params: any = { status: status_param };
            if (searchParams.name) params.search = searchParams.name;
            // Additional search filters can be applied on top of queryset or via backend if updated

            const data = await staffService.getHMOutpasses(params);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (role === 'HM') fetchCategorizedRequests(category);
        else if (role === 'ACCOUNTANT') fetchAccountantDashboard();
        else if (role === 'WARDEN') fetchWardenDashboard();
        else if (role === 'GATE_STAFF') fetchGateDashboard();
        else setRefreshing(false);
    };

    const handleAction = async (action: string, id: string) => {
        try {
            if (action === 'approve') {
                if (role === 'ACCOUNTANT') await staffService.accountantApprove(id);
                else await staffService.approveOutpass(id);
            }
            if (action === 'reject') {
                if (!reason) return Alert.alert("Error", "Reason is required");
                await staffService.rejectOutpass(id, reason);
            }
            if (action === 'meeting') {
                if (!meetingData.date || !meetingData.venue) return Alert.alert("Error", "Date and Venue are required");
                await staffService.scheduleMeeting(id, meetingData);
            }
            if (action === 'cancel-meeting') {
                await staffService.cancelMeeting(id);
            }
            if (action === 'return') await staffService.markAsReturned(id);
            if (action === 'warden-left') {
                await staffService.wardenMarkLeft(id);
            }
            if (action === 'reject' && role === 'WARDEN') {
                if (!reason) return Alert.alert("Error", "Reason is required");
                await staffService.wardenReject(id, reason);
            }
            if (action === 'mark-fee-due') {
                if (!feeAmount) return Alert.alert("Error", "Amount is required");
                await staffService.markFeeDue(id, parseFloat(feeAmount));
            }

            Alert.alert("Success", `Action successful`);
            onRefresh(); // Refresh current view
            setRejectVisible(false);
            setMeetingVisible(false);
            setFeeVisible(false);
            setReason('');
            setMeetingData({ date: '', venue: '', reason: '' });
            setFeeAmount('');
            setSelectedId(null);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to perform action");
        }
    };

    const handleEditMeeting = (op: Outpass) => {
        setSelectedId(op.id);
        setMeetingData({
            date: op.meeting_date || '',
            venue: op.meeting_venue || '',
            reason: op.meeting_notes || ''
        });
        setMeetingVisible(true);
    };

    const renderAccountantContent = () => {
        // Calculate total pending fee (mock logic or real if data available)
        const pendingCount = requests.filter(r => !r.fee_paid).length;
        const totalFeeDue = requests.reduce((sum, r) => sum + (r.fee_due || 0), 0);

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#616161' }}>Student Requests</Text>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
                ) : (
                    <View style={styles.listContainer}>
                        {requests.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Avatar.Icon size={64} icon="check-all" style={{ backgroundColor: '#E0F2F1' }} color="#00695C" />
                                <Text style={{ marginTop: 16, color: 'gray' }}>No pending fee approvals.</Text>
                            </View>
                        ) : (
                            requests.map(op => (
                                <StaffOutpassCard
                                    key={op.id}
                                    outpass={op}
                                    role={role || ''}
                                    onFeeDue={(id) => { setSelectedId(id); setFeeVisible(true); }}
                                    onApprove={(id) => handleAction('approve', id)}
                                    onViewDetail={(item) => { setSelectedOutpass(item); setDetailVisible(true); }}
                                />
                            ))
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderHMContent = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/priority')}>
                    <Avatar.Icon size={48} icon="fire" style={{ backgroundColor: '#FFEBEE' }} color={theme.colors.error} />
                    <Text variant="labelMedium" style={{ marginTop: 4 }}>Priority</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/history')}>
                    <Avatar.Icon size={48} icon="history" style={{ backgroundColor: '#E8F5E9' }} color="#2E7D32" />
                    <Text variant="labelMedium" style={{ marginTop: 4 }}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/analytics')}>
                    <Avatar.Icon size={48} icon="chart-bar" style={{ backgroundColor: '#E3F2FD' }} color="#1565C0" />
                    <Text variant="labelMedium" style={{ marginTop: 4 }}>Analytics</Text>
                </TouchableOpacity>
            </View>

            <SegmentedButtons
                value={category}
                onValueChange={setCategory}
                style={styles.segmented}
                theme={{ colors: { secondaryContainer: theme.colors.primaryContainer, onSecondaryContainer: theme.colors.onPrimaryContainer } }}
                buttons={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'meeting', label: 'Meeting' },
                    { value: 'returned', label: 'Returned' },
                    { value: 'not_returned', label: 'Out' },
                ]}
            />

            {category === 'not_returned' && (
                <Text variant="bodySmall" style={{ textAlign: 'center', color: 'gray', marginBottom: 10 }}>
                    Students currently outside the campus.
                </Text>
            )}

            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : (
                <View style={styles.listContainer}>
                    {requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Avatar.Icon size={64} icon="cancel" style={{ backgroundColor: '#FAFAFA' }} color="gray" />
                            <Text style={{ marginTop: 16, color: 'gray' }}>No requests in this category.</Text>
                        </View>
                    ) : (
                        requests.map(op => (
                            <StaffOutpassCard
                                key={op.id}
                                outpass={op}
                                role={role || ''}
                                onApprove={(id) => handleAction('approve', id)}
                                onReject={(id) => { setSelectedId(id); setRejectVisible(true); }}
                                onMeeting={(id) => { setSelectedId(id); setMeetingVisible(true); }}
                                onCancelMeeting={(id) => handleAction('cancel-meeting', id)}
                                onEditMeeting={(item) => handleEditMeeting(item)}
                                onMarkReturned={(id) => handleAction('return', id)}
                                onViewDetail={(item) => { setSelectedOutpass(item); setDetailVisible(true); }}
                            />
                        ))
                    )}
                </View>
            )}
        </View>
    );

    const renderWardenContent = () => (
        <View style={{ flex: 1 }}>
            <Surface style={styles.searchSection} elevation={1}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Today's Requests</Text>
                    <IconButton
                        icon={isSearchExpanded ? "chevron-up" : "magnify"}
                        onPress={() => setIsSearchExpanded(!isSearchExpanded)}
                        iconColor={theme.colors.primary}
                    />
                </View>

                {isSearchExpanded && (
                    <View style={styles.expandedSearch}>
                        <TextInput
                            label="Hostel"
                            value={searchParams.hostel}
                            onChangeText={(t) => setSearchParams({ ...searchParams, hostel: t })}
                            mode="outlined"
                            dense
                            style={styles.smallInput}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                label="Class"
                                value={searchParams.class_name}
                                onChangeText={(t) => setSearchParams({ ...searchParams, class_name: t })}
                                mode="outlined"
                                dense
                                style={[styles.smallInput, { flex: 1 }]}
                            />
                            <TextInput
                                label="Section"
                                value={searchParams.section}
                                onChangeText={(t) => setSearchParams({ ...searchParams, section: t })}
                                mode="outlined"
                                dense
                                style={[styles.smallInput, { flex: 1 }]}
                            />
                        </View>
                        <TextInput
                            label="Name/Roll No"
                            value={searchParams.name}
                            onChangeText={(t) => setSearchParams({ ...searchParams, name: t })}
                            mode="outlined"
                            dense
                            style={styles.smallInput}
                        />
                        <Button mode="contained" onPress={fetchWardenDashboard} style={{ marginTop: 8 }} buttonColor={theme.colors.primary}>Search</Button>
                    </View>
                )}
            </Surface>

            <SegmentedButtons
                value={category}
                onValueChange={setCategory}
                style={styles.segmented}
                theme={{ colors: { secondaryContainer: theme.colors.primaryContainer, onSecondaryContainer: theme.colors.onPrimaryContainer } }}
                buttons={[
                    { value: 'pending', label: 'In Hostel' },
                    { value: 'checked_out', label: 'Ready' },
                    { value: 'outside', label: 'Outside' },
                    { value: 'all', label: 'All' },
                ]}
            />

            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/history')}>
                    <Avatar.Icon size={40} icon="history" style={{ backgroundColor: '#C8E6C9' }} color="#388E3C" />
                    <Text variant="labelMedium">History</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : (
                <View style={styles.listContainer}>
                    {requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Avatar.Icon size={64} icon="bunk-bed-outline" style={{ backgroundColor: '#ECEFF1' }} color="#607D8B" />
                            <Text style={{ marginTop: 16, color: 'gray' }}>No students found in this category.</Text>
                        </View>
                    ) : (
                        requests.map(op => (
                            <StaffOutpassCard
                                key={op.id}
                                outpass={op}
                                role={role || ''}
                                onReject={(id) => { setSelectedId(id); setRejectVisible(true); }}
                                onMarkLeftHostel={(id) => handleAction('warden-left', id)}
                                onMarkReturned={(id) => handleAction('return', id)}
                                onViewDetail={(item) => { setSelectedOutpass(item); setDetailVisible(true); }}
                            />
                        ))
                    )}
                </View>
            )}
        </View>
    );

    const renderGateContent = () => (
        <View style={{ flex: 1, padding: 16 }}>
            <Surface style={styles.gateCard} elevation={2} onTouchEnd={() => router.push('/(staff)/validate')}>
                <View style={{ alignItems: 'center', padding: SPACING.l }}>
                    <Avatar.Icon size={80} icon="qrcode-scan" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />
                    <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: 'bold', color: theme.colors.primary }}>Verify Exit/Return</Text>
                    <Text variant="bodyMedium" style={{ color: 'gray', textAlign: 'center', marginTop: 8 }}>
                        Tap here to scan QR code or enter code manually.
                    </Text>
                </View>
            </Surface>

            <View style={{ marginTop: 24 }}>
                <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>Recent Checkouts</Text>
                {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Avatar.Icon size={64} icon="history" style={{ backgroundColor: '#F5F5F5' }} color="gray" />
                        <Text style={{ marginTop: 16, color: 'gray' }}>No recent activity.</Text>
                    </View>
                ) : (
                    requests.map(op => (
                        <StaffOutpassCard
                            key={op.id}
                            outpass={op}
                            role={role || ''}
                            onViewDetail={(item) => { setSelectedOutpass(item); setDetailVisible(true); }}
                        />
                    ))
                )}
            </View>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Stack.Screen options={{
                title: SCHOOL_NAME,
                headerRight: () => (
                    <IconButton icon="account-circle" onPress={() => router.push('/(staff)/profile')} />
                )
            }} />


            <Surface style={styles.roleBanner} elevation={0}>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    Welcome, {user?.first_name || (role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Staff')}
                </Text>
                <Chip style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: theme.colors.secondaryContainer }}>
                    <Text style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>{role}</Text>
                </Chip>
            </Surface>

            {role === 'HM' ? renderHMContent() : (
                role === 'WARDEN' ? renderWardenContent() : (
                    role === 'ACCOUNTANT' ? renderAccountantContent() : renderGateContent()
                )
            )}

            <Portal>
                <Modal visible={rejectVisible} onDismiss={() => setRejectVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge">Reject Outpass</Text>
                    <TextInput
                        label="Reason for rejection"
                        value={reason}
                        onChangeText={setReason}
                        mode="outlined"
                        multiline
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setRejectVisible(false)}>Cancel</Button>
                        <Button mode="contained" buttonColor="red" onPress={() => handleAction('reject', selectedId!)}>Reject</Button>
                    </View>
                </Modal>

                <Modal visible={meetingVisible} onDismiss={() => setMeetingVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge">Schedule Meeting</Text>
                    <TextInput
                        label="Date & Time"
                        placeholder="e.g. 2023-12-25 10:00"
                        value={meetingData.date}
                        onChangeText={(t) => setMeetingData({ ...meetingData, date: t })}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Venue"
                        value={meetingData.venue}
                        onChangeText={(t) => setMeetingData({ ...meetingData, venue: t })}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Notes (Optional)"
                        value={meetingData.reason}
                        onChangeText={(t) => setMeetingData({ ...meetingData, reason: t })}
                        mode="outlined"
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setMeetingVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={() => handleAction('meeting', selectedId!)}>Schedule</Button>
                    </View>
                </Modal>

                <Modal visible={feeVisible} onDismiss={() => setFeeVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge">Mark Fee Pending</Text>
                    <Text variant="bodyMedium" style={{ marginBottom: 10, color: 'gray' }}>Enter amount due for the student.</Text>
                    <TextInput
                        label="Fee Amount (₹)"
                        value={feeAmount}
                        onChangeText={setFeeAmount}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setFeeVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={() => handleAction('mark-fee-due', selectedId!)}>Confirm</Button>
                    </View>
                </Modal>

                <Modal visible={detailVisible} onDismiss={() => setDetailVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={{ marginBottom: 15 }}>Outpass Details</Text>
                    {selectedOutpass && (
                        <View>
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Student: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.student_name} ({selectedOutpass.student_roll_no})</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Class: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.student_class} - {selectedOutpass.student_section}</Text>
                            </View>
                            <Divider style={{ marginVertical: 10 }} />
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Parent: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.parent_name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Phone: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.parent_phone}</Text>
                            </View>
                            <Divider style={{ marginVertical: 10 }} />
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Outgoing: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.outgoing_date} at {selectedOutpass.outgoing_time}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Return: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.expected_return_date} at {selectedOutpass.expected_return_time}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text variant="labelLarge">Reason: </Text>
                                <Text variant="bodyLarge">{selectedOutpass.reason}</Text>
                            </View>
                            {selectedOutpass.meeting_scheduled && (
                                <View style={[styles.detailRow, { marginTop: 10, padding: 8, backgroundColor: '#f3e5f5', borderRadius: 4 }]}>
                                    <Text variant="labelLarge">Meeting: </Text>
                                    <Text variant="bodyMedium">{new Date(selectedOutpass.meeting_date!).toLocaleString()} at {selectedOutpass.meeting_venue}</Text>
                                </View>
                            )}
                            {selectedOutpass.approvals && selectedOutpass.approvals.length > 0 && (
                                <View style={{ marginTop: 15 }}>
                                    <Divider style={{ marginVertical: 10 }} />
                                    <Text variant="titleMedium" style={{ marginBottom: 5 }}>Approval History</Text>
                                    {selectedOutpass.approvals.map((app, index) => (
                                        <View key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Text variant="labelMedium">{app.approver_role}</Text>
                                                <Text variant="labelSmall" style={{ color: 'gray' }}>{new Date(app.approved_at).toLocaleString()}</Text>
                                            </View>
                                            <Text variant="bodySmall">By: {app.approver_name || 'System'}</Text>
                                            <Text variant="bodySmall" style={{
                                                color: app.status === 'APPROVED' ? 'green' : (app.status === 'REJECTED' ? 'red' : 'orange')
                                            }}>
                                                Status: {app.status}
                                            </Text>
                                            {app.comments ? <Text variant="bodySmall" style={{ fontStyle: 'italic' }}>Note: {app.comments}</Text> : null}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                    <View style={[styles.modalActions, { marginTop: 20 }]}>
                        <Button mode="contained" onPress={() => setDetailVisible(false)}>Close</Button>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    welcomeHeader: { marginBottom: 20 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    actionItem: { alignItems: 'center', gap: 4 },
    segmented: { marginBottom: 16 },
    listContainer: { paddingBottom: 40 },
    emptyText: { textAlign: 'center', marginTop: 40, color: 'gray' },
    wardenCard: { marginBottom: 20, backgroundColor: 'white' },
    modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
    input: { marginVertical: 8 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
    detailRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' },
    searchSection: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 16, elevation: 2 },
    expandedSearch: { gap: 4 },
    smallInput: { fontSize: 14 },
    gateCard: { backgroundColor: 'white', elevation: 4, borderRadius: 16 },
    gateCardContent: { alignItems: 'center', paddingVertical: 40 },
    statsContainer: {
        backgroundColor: 'white',
        padding: SPACING.m,
        borderRadius: theme.roundness,
        marginBottom: SPACING.m,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBanner: {
        marginBottom: SPACING.m,
        backgroundColor: 'transparent',
    },
    sectionHeader: {
        marginBottom: SPACING.s,
        marginTop: SPACING.s
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    }
});
