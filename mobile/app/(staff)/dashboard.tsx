import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar, IconButton, SegmentedButtons, Portal, Modal, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';
import { FilterDropdown, FilterDatePicker } from '../../components/FilterInputs';
import * as ImagePicker from 'expo-image-picker';

export default function StaffDashboard() {
    const router = useRouter();
    const { role, logout } = useAuthStore();
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

    // HM Filters
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterRoll, setFilterRoll] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Warden Search
    const [searchParams, setSearchParams] = useState({ hostel: '', class_name: '', section: '', name: '' });
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Replaced useEffect with useFocusEffect to auto-refresh when screen is focused (e.g. back from Validate)
    useFocusEffect(
        React.useCallback(() => {
            if (role === 'HM') {
                fetchCategorizedRequests(category);
            } else if (role === 'ACCOUNTANT') {
                fetchAccountantDashboard();
            } else if (role === 'WARDEN') {
                fetchWardenDashboard();
            } else if (role === 'GATE_STAFF') {
                fetchGateDashboard();
            }
        }, [category, role])
    );

    const fetchCategorizedRequests = async (cat: string) => {
        setLoading(true);
        try {
            const params: any = { status: cat };
            // Apply HM Filters if present
            if (filterStatus) params.status = filterStatus.toLowerCase(); // Override category
            if (filterClass) params.class_name = filterClass;
            if (filterSection) params.section = filterSection;
            if (filterRoll) params.roll_no = filterRoll;
            if (filterStartDate) params.start_date = filterStartDate;
            if (filterEndDate) params.end_date = filterEndDate;

            const data = await staffService.getHMOutpasses(params);
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
            const data = await staffService.getAccountantOutpasses({});
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchGateDashboard = async () => {
        setLoading(true);
        try {
            const data = await staffService.getHMOutpasses({ status: 'checked_out' });
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
            let status_param = '';
            if (category === 'pending') status_param = 'in_hostel';
            if (category === 'checked_out') status_param = 'checked_out';
            if (category === 'outside') status_param = 'outside';

            const params: any = { status: status_param };
            if (searchParams.name) params.search = searchParams.name;

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
            // Optimistic Update: Immediately remove from list to make UI feel instant
            setRequests(prev => prev.filter(req => req.id !== id));

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
                const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.5,
                });

                if (!result.canceled) {
                    await staffService.wardenMarkLeft(id, result.assets[0].uri);
                } else {
                    // Revert optimistic update if cancelled
                    onRefresh();
                    return;
                }
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
            // Background refresh to ensure consistency
            onRefresh();

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
            onRefresh(); // Revert on error
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

    const renderAccountantContent = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.welcomeHeader}>
                <Text variant="headlineSmall">Hello, Accountant</Text>
                <Text variant="bodyMedium" style={{ color: 'gray' }}>Pending Fee Actions</Text>
            </View>
            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <View style={styles.listContainer}>
                    {requests.length === 0 ? (
                        <Text style={styles.emptyText}>No pending requests</Text>
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

    const clearFilters = () => {
        setFilterClass('');
        setFilterSection('');
        setFilterRoll('');
        setFilterStatus('');
        setFilterStartDate('');
        setFilterEndDate('');
        // fetchCategorizedRequests(category); // Optional: auto-fetch on clear
    };

    const renderHMContent = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.searchSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: filterClass || filterSection || filterRoll || filterStatus ? 8 : 0 }}>
                    <Text variant="titleMedium">Advanced Filters</Text>
                    <IconButton
                        icon={isFilterExpanded ? "chevron-up" : "filter-variant"}
                        onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                    />
                </View>
                {isFilterExpanded && (
                    <View style={styles.expandedSearch}>
                        <FilterDropdown
                            label="Status"
                            value={filterStatus}
                            onSelect={setFilterStatus}
                            options={[
                                { label: 'Pending', value: 'pending' },
                                { label: 'Approved', value: 'approved' },
                                { label: 'Out / Active', value: 'checked_out' },
                                { label: 'Returned', value: 'completed' },
                                { label: 'Rejected', value: 'rejected' },
                                { label: 'Meeting', value: 'meeting' },
                            ]}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <FilterDropdown
                                label="Class"
                                value={filterClass}
                                onSelect={setFilterClass}
                                style={{ flex: 1 }}
                                options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }))}
                            />
                            <FilterDropdown
                                label="Section"
                                value={filterSection}
                                onSelect={setFilterSection}
                                style={{ flex: 1 }}
                                options={['A', 'B', 'C', 'D'].map(s => ({ label: s, value: s }))}
                            />
                        </View>
                        <TextInput label="Roll No" value={filterRoll} onChangeText={setFilterRoll} style={styles.smallInput} mode="outlined" dense />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <FilterDatePicker
                                label="From"
                                value={filterStartDate}
                                onChange={setFilterStartDate}
                                style={{ flex: 1 }}
                            />
                            <FilterDatePicker
                                label="To"
                                value={filterEndDate}
                                onChange={setFilterEndDate}
                                style={{ flex: 1 }}
                            />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <Button mode="outlined" onPress={clearFilters} style={{ flex: 1 }}>Clear</Button>
                            <Button mode="contained" onPress={() => fetchCategorizedRequests(category)} style={{ flex: 1 }}>Apply</Button>
                        </View>
                    </View>
                )}
            </View>
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/priority')}>
                    <Avatar.Icon size={40} icon="fire" style={{ backgroundColor: '#FFCDD2' }} color="#D32F2F" />
                    <Text variant="labelMedium">Priority</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/history')}>
                    <Avatar.Icon size={40} icon="history" style={{ backgroundColor: '#C8E6C9' }} color="#388E3C" />
                    <Text variant="labelMedium">History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/analytics')}>
                    <Avatar.Icon size={40} icon="chart-bar" style={{ backgroundColor: '#BBDEFB' }} color="#1976D2" />
                    <Text variant="labelMedium">Analytics</Text>
                </TouchableOpacity>
            </View>

            <SegmentedButtons
                value={category}
                onValueChange={setCategory}
                style={styles.segmented}
                buttons={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'meeting', label: 'Meeting' },
                    { value: 'returned', label: 'Returned' },
                    { value: 'not_returned', label: 'Out / Late' },
                ]}
            />

            {category === 'not_returned' && (
                <Text variant="bodySmall" style={{ textAlign: 'center', color: 'gray', marginBottom: 10 }}>
                    Students currently outside the campus. Mark as returned when they arrive.
                </Text>
            )}

            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <View style={styles.listContainer}>
                    {requests.length === 0 ? (
                        <Text style={styles.emptyText}>No requests in this category</Text>
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
            <View style={styles.searchSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text variant="titleMedium">Today's Requests</Text>
                    <IconButton
                        icon={isSearchExpanded ? "chevron-up" : "magnify"}
                        onPress={() => setIsSearchExpanded(!isSearchExpanded)}
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
                        <Button mode="contained" onPress={fetchWardenDashboard} style={{ marginTop: 8 }}>Search</Button>
                    </View>
                )}
            </View>

            <SegmentedButtons
                value={category}
                onValueChange={setCategory}
                style={styles.segmented}
                buttons={[
                    { value: 'pending', label: 'In Hostel' },
                    { value: 'checked_out', label: 'Checked Out' },
                    { value: 'outside', label: 'Outside' },
                    { value: 'all', label: 'All Today' },
                ]}
            />

            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(staff)/history')}>
                    <Avatar.Icon size={40} icon="history" style={{ backgroundColor: '#C8E6C9' }} color="#388E3C" />
                    <Text variant="labelMedium">History</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <View style={styles.listContainer}>
                    {requests.length === 0 ? (
                        <Text style={styles.emptyText}>No outpasses found</Text>
                    ) : (
                        requests.map(op => (
                            <StaffOutpassCard
                                key={op.id}
                                outpass={op}
                                role={role || ''}
                                onReject={(id) => { setSelectedId(id); setRejectVisible(true); }}
                                onMarkLeftHostel={(id) => handleAction('warden-left', id)}
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
            <Card style={styles.gateCard} onPress={() => router.push('/(staff)/validate')}>
                <Card.Content style={styles.gateCardContent}>
                    <Avatar.Icon size={80} icon="numeric" style={{ backgroundColor: '#6200ee' }} color="white" />
                    <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: 'bold' }}>Verify Code</Text>
                    <Text variant="bodyMedium" style={{ color: 'gray', textAlign: 'center' }}>
                        Tap here to verify exit/return codes.
                    </Text>
                </Card.Content>
            </Card>

            <View style={{ marginTop: 24 }}>
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>Recent Checkouts</Text>
                {requests.length === 0 ? (
                    <Text style={{ color: 'gray', textAlign: 'center', marginTop: 20 }}>No checkouts today</Text>
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
                title: 'Staff Portal',
                headerRight: () => (
                    <IconButton icon="account-circle" onPress={() => router.push('/(staff)/profile')} />
                )
            }} />

            {role !== 'ACCOUNTANT' && ( // Accountant has their own header
                <View style={styles.welcomeHeader}>
                    <Text variant="headlineSmall">Hello, Staff</Text>
                    <Text variant="bodyMedium" style={{ color: 'gray' }}>{role} Role</Text>
                </View>
            )}

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
});
