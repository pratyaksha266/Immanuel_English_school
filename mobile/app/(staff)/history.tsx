import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Searchbar, IconButton, Menu, Divider, Button, Portal, Modal, Chip, TextInput } from 'react-native-paper';
import { Stack } from 'expo-router';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';

export default function HistoryScreen() {
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterMenuVisible, setFilterMenuVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const fetchHistory = async (search = searchQuery, status = filterStatus) => {
        setLoading(true);
        try {
            const params: any = { history: true };
            if (search) params.search = search;
            if (status) params.status = status;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (startTime) params.start_time = startTime;
            if (endTime) params.end_time = endTime;

            const data = await staffService.getHMOutpasses(params);
            setRequests(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load history");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        fetchHistory(query, filterStatus);
    };

    const handleFilter = (status: string | null) => {
        setFilterStatus(status);
        setFilterMenuVisible(false);
        fetchHistory(searchQuery, status);
    };

    const handleAction = async (action: string, id: string) => {
        try {
            if (action === 'return') await staffService.markAsReturned(id);
            Alert.alert("Success", "Action successful");
            fetchHistory();
        } catch (error) {
            Alert.alert("Error", "Failed to perform action");
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'History',
                headerRight: () => (
                    <Menu
                        visible={filterMenuVisible}
                        onDismiss={() => setFilterMenuVisible(false)}
                        anchor={<IconButton icon="filter-variant" onPress={() => setFilterMenuVisible(true)} />}
                    >
                        <Menu.Item onPress={() => handleFilter(null)} title="All Status" />
                        <Divider />
                        <Menu.Item onPress={() => handleFilter('pending')} title="Pending" />
                        <Menu.Item onPress={() => handleFilter('approved')} title="Approved" />
                        <Menu.Item onPress={() => handleFilter('not_returned')} title="Not Returned" />
                        <Menu.Item onPress={() => handleFilter('returned')} title="Returned" />
                    </Menu>
                )
            }} />

            <Searchbar
                placeholder="Search Class/Roll/Name"
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchBar}
            />

            <View style={styles.filterChipContainer}>
                {filterStatus && (
                    <Chip onClose={() => handleFilter(null)} style={styles.chip}>
                        Status: {filterStatus}
                    </Chip>
                )}
                {(startDate || endDate || startTime || endTime) && (
                    <Chip onClose={() => { setStartDate(''); setEndDate(''); setStartTime(''); setEndTime(''); fetchHistory(searchQuery, filterStatus); }} style={styles.chip}>
                        Date/Time Filter Active
                    </Chip>
                )}
            </View>

            {/* Filter Inputs (Expandable) */}
            <View style={styles.filterInputs}>
                <View style={styles.row}>
                    <TextInput
                        label="From Date (YYYY-MM-DD)"
                        value={startDate}
                        onChangeText={setStartDate}
                        mode="outlined"
                        dense
                        style={styles.dateInput}
                    />
                    <TextInput
                        label="To Date"
                        value={endDate}
                        onChangeText={setEndDate}
                        mode="outlined"
                        dense
                        style={styles.dateInput}
                    />
                </View>
                <View style={styles.row}>
                    <TextInput
                        label="From Time (HH:MM)"
                        value={startTime}
                        onChangeText={setStartTime}
                        mode="outlined"
                        dense
                        style={styles.dateInput}
                    />
                    <TextInput
                        label="To Time"
                        value={endTime}
                        onChangeText={setEndTime}
                        mode="outlined"
                        dense
                        style={styles.dateInput}
                    />
                </View>
                <Button mode="contained-tonal" style={{ marginVertical: 4 }} onPress={() => fetchHistory()}>Apply Date/Time Filter</Button>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}><ActivityIndicator /></View>
            ) : (
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.scrollContent}
                >
                    {requests.length === 0 ? (
                        <View style={styles.center}>
                            <Text variant="bodyLarge">No records found matching filters.</Text>
                        </View>
                    ) : (
                        requests.map(op => (
                            <StaffOutpassCard
                                key={op.id}
                                outpass={op}
                                onViewDetail={(item) => { setSelectedOutpass(item); setDetailVisible(true); }}
                                onMarkReturned={(id) => handleAction('return', id)}
                            />
                        ))
                    )}
                </ScrollView>
            )}

            <Portal>
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
                            {selectedOutpass.status === 'COMPLETED' && selectedOutpass.actual_return_date && (
                                <View style={[styles.detailRow, { marginTop: 10 }]}>
                                    <Text variant="labelLarge" style={{ color: 'green' }}>Actual Return: </Text>
                                    <Text variant="bodyLarge" style={{ color: 'green' }}>{new Date(selectedOutpass.actual_return_date).toLocaleString()}</Text>
                                </View>
                            )}
                        </View>
                    )}
                    <View style={styles.modalActions}>
                        <Button mode="contained" onPress={() => setDetailVisible(false)}>Close</Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    searchBar: { margin: 16, elevation: 2, backgroundColor: 'white' },
    filterChipContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
    chip: { backgroundColor: '#e1bee7' },
    scrollContent: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    detailRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' },
    filterInputs: { paddingHorizontal: 16, paddingBottom: 8 },
    row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    dateInput: { flex: 1, backgroundColor: 'white' }
});
