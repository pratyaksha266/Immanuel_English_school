import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, Searchbar, Chip, Portal, Modal, Button, Divider } from 'react-native-paper';
import { staffService } from '../../services/api';
import { Outpass } from '../../types';
import { StaffOutpassCard } from '../../components/StaffOutpassCard';

export default function AccountantHistory() {
    const [requests, setRequests] = useState<Outpass[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [filterVisible, setFilterVisible] = useState(false);

    const statuses = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Returned', value: 'returned' },
        { label: 'Not Returned', value: 'not_returned' },
    ];

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {
                history: true,
                search: searchQuery,
            };
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const data = await staffService.getAccountantOutpasses(params);
            setRequests(data);
        } catch (error) {
            console.error('Fetch history error:', error);
            Alert.alert('Error', 'Failed to fetch history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Outpass History" />
                <Appbar.Action icon="filter-variant" onPress={() => setFilterVisible(true)} />
            </Appbar.Header>

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Class, Section, Roll No or Name"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            {statusFilter !== 'all' && (
                <View style={styles.activeFilters}>
                    <Chip
                        onClose={() => setStatusFilter('all')}
                        style={styles.filterChip}
                    >
                        Status: {statusFilter.toUpperCase()}
                    </Chip>
                </View>
            )}

            <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <StaffOutpassCard outpass={item} role="ACCOUNTANT" />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        fetchHistory();
                    }} />
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No matching records found</Text>}
                contentContainerStyle={styles.list}
            />

            <Portal>
                <Modal
                    visible={filterVisible}
                    onDismiss={() => setFilterVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Filter Options</Text>

                    <Text variant="labelLarge" style={styles.filterLabel}>Status</Text>
                    <View style={styles.chipGroup}>
                        {statuses.map(s => (
                            <Chip
                                key={s.value}
                                selected={statusFilter === s.value}
                                onPress={() => setStatusFilter(s.value)}
                                style={styles.chip}
                            >
                                {s.label}
                            </Chip>
                        ))}
                    </View>

                    <Divider style={{ marginVertical: 20 }} />

                    <Button mode="contained" onPress={() => setFilterVisible(false)}>
                        Apply Filters
                    </Button>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: 'white',
    },
    searchBar: {
        elevation: 1,
    },
    activeFilters: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    filterChip: {
        backgroundColor: '#e1bee7',
    },
    list: {
        padding: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#757575',
    },
    modal: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 20,
    },
    filterLabel: {
        marginBottom: 12,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        marginBottom: 8,
    }
});
