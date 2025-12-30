import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Searchbar, IconButton, Menu, Divider, Button, Portal, Modal, Chip, TextInput } from 'react-native-paper';
import { Stack } from 'expo-router';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';
import { FilterDropdown, FilterDatePicker } from '../../components/FilterInputs';

export default function HistoryScreen() {
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Advanced Filters
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterRoll, setFilterRoll] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // UI State
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params: any = { history: true };
            if (searchQuery) params.search = searchQuery;

            // Advanced Filters
            if (filterStatus) params.status = filterStatus.toLowerCase();
            if (filterClass) params.class_name = filterClass;
            if (filterSection) params.section = filterSection;
            if (filterRoll) params.roll_no = filterRoll;
            if (filterStartDate) params.start_date = filterStartDate;
            if (filterEndDate) params.end_date = filterEndDate;

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

    const clearFilters = () => {
        setFilterClass('');
        setFilterSection('');
        setFilterRoll('');
        setFilterStatus('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        // fetchHistory(); // Trigger search on enter or debounce if needed, simplified to manual refresh or use effect
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
            }} />

            <Searchbar
                placeholder="Search Name/Roll"
                onChangeText={setSearchQuery}
                onIconPress={fetchHistory}
                onSubmitEditing={fetchHistory}
                value={searchQuery}
                style={styles.searchBar}
            />

            <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: filterClass || filterSection || filterRoll || filterStatus ? 8 : 0 }}>
                    <Text variant="titleMedium">Advanced Filters</Text>
                    <IconButton
                        icon={isFilterExpanded ? "chevron-up" : "filter-variant"}
                        onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                    />
                </View>
                {isFilterExpanded && (
                    <View style={{ gap: 8 }}>
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
                        <TextInput label="Roll No" value={filterRoll} onChangeText={setFilterRoll} style={{ fontSize: 14 }} mode="outlined" dense />
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
                            <Button mode="contained" onPress={fetchHistory} style={{ flex: 1 }}>Apply</Button>
                        </View>
                    </View>
                )}
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
    detailRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }
});
