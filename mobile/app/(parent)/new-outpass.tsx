import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, TextInput, Button, RadioButton, Switch, Chip, Menu, Divider, HelperText, Surface, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { parentService } from '../../services/api';
import { Student, Guardian, Outpass } from '../../types';
import { theme, SPACING } from '../../constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NewOutpassScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Data State
    const [children, setChildren] = useState<Student[]>([]);
    const [activeOutpasses, setActiveOutpasses] = useState<Outpass[]>([]);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]); // Student IDs

    const [pickupType, setPickupType] = useState<'PARENT' | 'GUARDIAN'>('PARENT');
    const [selectedGuardian, setSelectedGuardian] = useState<string>(''); // Guardian ID
    const [menuVisible, setMenuVisible] = useState(false);

    // Date Time State
    const [returnDate, setReturnDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1))); // Default tomorrow
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [returnTime, setReturnTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [reason, setReason] = useState('');

    const [isPriority, setIsPriority] = useState(false);
    const [priorityReason, setPriorityReason] = useState('');

    useEffect(() => {
        // Set default time to 18:00
        const t = new Date();
        t.setHours(18, 0, 0, 0);
        setReturnTime(t);

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [kids, outpasses, guards] = await Promise.all([
                parentService.getChildren(),
                parentService.getActiveOutpasses(),
                parentService.getGuardians()
            ]);
            setChildren(kids);
            setActiveOutpasses(outpasses);
            setGuardians(guards);

            // Pre-select student if passed via params
            if (params.studentId) {
                const sId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
                const hasActive = outpasses.some(op => String(op.student) === String(sId));
                if (!hasActive) {
                    setSelectedStudents([String(sId)]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (id: string) => {
        const strId = String(id);
        if (selectedStudents.includes(strId)) {
            setSelectedStudents(selectedStudents.filter(s => s !== strId));
        } else {
            setSelectedStudents([...selectedStudents, strId]);
        }
    };

    const getVerifiedGuardians = () => guardians.filter(g => g.is_approved);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setReturnDate(selectedDate);
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) setReturnTime(selectedTime);
    };

    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            Alert.alert('Error', 'Please select at least one student');
            return;
        }
        if (!reason) {
            Alert.alert('Error', 'Please provide a reason');
            return;
        }
        if (pickupType === 'GUARDIAN' && !selectedGuardian) {
            Alert.alert('Error', 'Please select a guardian');
            return;
        }
        if (isPriority && !priorityReason) {
            Alert.alert('Error', 'Priority reason is required for priority requests');
            return;
        }

        setSubmitting(true);
        try {
            const now = new Date();
            const outgoingDate = now.toISOString().split('T')[0];
            const outgoingTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const rDate = returnDate.toISOString().split('T')[0];
            const rTime = `${String(returnTime.getHours()).padStart(2, '0')}:${String(returnTime.getMinutes()).padStart(2, '0')}`;

            await Promise.all(selectedStudents.map(studentId => {
                return parentService.createOutpass({
                    student: studentId,
                    guardian: pickupType === 'GUARDIAN' ? selectedGuardian : undefined,
                    pickup_person_name: pickupType === 'PARENT' ? 'Parent' : undefined,
                    outgoing_date: outgoingDate,
                    outgoing_time: outgoingTime,
                    expected_return_date: rDate,
                    expected_return_time: rTime,
                    reason,
                    destination: "Not Specified",
                    mode_of_travel: 'Private',
                    is_priority: isPriority,
                    priority_reason: isPriority ? priorityReason : '',
                });
            }));

            Alert.alert('Success', 'Request submitted successfully.');
            router.replace('/(parent)/dashboard');
        } catch (error: any) {
            const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            Alert.alert('Error', `Failed to submit: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'New Outpass Request', headerStyle: { backgroundColor: theme.colors.primary }, headerTintColor: '#fff' }} />

            <Surface style={styles.section} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Select Student(s)</Text>
                <View style={styles.chipRow}>
                    {children.map(child => {
                        const hasActive = activeOutpasses.some(op => String(op.student) === String(child.id));
                        const selected = selectedStudents.includes(String(child.id));
                        return (
                            <Chip
                                key={child.id}
                                selected={selected}
                                onPress={() => !hasActive && toggleStudent(String(child.id))}
                                disabled={hasActive}
                                style={[styles.chip, selected && { backgroundColor: theme.colors.primaryContainer }]}
                                textStyle={{ color: selected ? theme.colors.onPrimaryContainer : '#000' }}
                                showSelectedOverlay
                                icon={selected ? "check" : "account"}
                            >
                                {child.first_name}
                            </Chip>
                        );
                    })}
                </View>
                {children.length === 0 && <Text style={{ color: 'gray' }}>No students found.</Text>}
            </Surface>

            <Surface style={styles.section} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Pickup Details</Text>
                <RadioButton.Group onValueChange={value => setPickupType(value as any)} value={pickupType}>
                    <View style={styles.radioRow}>
                        <RadioButton.Item label="I will pick up (Parent)" value="PARENT" color={theme.colors.primary} />
                        <RadioButton.Item label="Guardian" value="GUARDIAN" color={theme.colors.primary} />
                    </View>
                </RadioButton.Group>

                {pickupType === 'GUARDIAN' && (
                    <View style={{ marginTop: SPACING.s }}>
                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchor={
                                <Button mode="outlined" onPress={() => setMenuVisible(true)} style={{ borderColor: theme.colors.primary }}>
                                    {selectedGuardian ? guardians.find(g => g.id === selectedGuardian)?.name : "Select Verified Guardian"}
                                </Button>
                            }
                        >
                            {getVerifiedGuardians().map(g => (
                                <Menu.Item key={g.id} onPress={() => { setSelectedGuardian(g.id); setMenuVisible(false); }} title={g.name} />
                            ))}
                            <Divider />
                            <Menu.Item onPress={() => router.push('/(parent)/profile')} title="Add New Guardian" leadingIcon="plus" />
                        </Menu>
                    </View>
                )}
            </Surface>

            <Surface style={styles.section} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Return Schedule</Text>
                <View style={styles.row}>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
                        <Text variant="labelSmall" style={{ color: 'gray' }}>Date</Text>
                        <Text variant="bodyLarge">{returnDate.toISOString().split('T')[0]}</Text>
                        <Avatar.Icon size={24} icon="calendar" style={{ position: 'absolute', right: 8, top: 8, backgroundColor: 'transparent' }} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateBtn}>
                        <Text variant="labelSmall" style={{ color: 'gray' }}>Time</Text>
                        <Text variant="bodyLarge">{`${String(returnTime.getHours()).padStart(2, '0')}:${String(returnTime.getMinutes()).padStart(2, '0')}`}</Text>
                        <Avatar.Icon size={24} icon="clock-outline" style={{ position: 'absolute', right: 8, top: 8, backgroundColor: 'transparent' }} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && <DateTimePicker value={returnDate} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />}
                {showTimePicker && <DateTimePicker value={returnTime} mode="time" display="default" onChange={onTimeChange} />}
            </Surface>

            <Surface style={styles.section} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Reason</Text>
                <TextInput
                    mode="outlined"
                    placeholder="e.g. Health checkup, Family event..."
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    style={{ backgroundColor: 'white' }}
                />
            </Surface>

            <Surface style={[styles.section, isPriority ? { borderColor: theme.colors.error, borderWidth: 1 } : {}]} elevation={1}>
                <View style={styles.rowBetween}>
                    <View>
                        <Text variant="titleMedium" style={{ color: isPriority ? theme.colors.error : '#000' }}>Emergency / Priority</Text>
                        <Text variant="bodySmall" style={{ color: 'gray' }}>Mark this only for urgent cases</Text>
                    </View>
                    <Switch value={isPriority} onValueChange={setIsPriority} color={theme.colors.error} />
                </View>

                {isPriority && (
                    <TextInput
                        label="Explain Urgency"
                        value={priorityReason}
                        onChangeText={setPriorityReason}
                        mode="outlined"
                        style={{ marginTop: SPACING.m, backgroundColor: '#FFFEBEE' }}
                        activeOutlineColor={theme.colors.error}
                    />
                )}
            </Surface>

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                style={styles.submitBtn}
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
                labelStyle={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }}
                contentStyle={{ paddingVertical: 4 }}
            >
                Submit Request
            </Button>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: SPACING.m,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: theme.roundness,
        padding: SPACING.m,
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        color: '#424242',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
    },
    chip: {
        borderRadius: 20,
    },
    radioRow: {
        // flexDirection: 'row',
        // justifyContent: 'space-around',
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    dateBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: theme.roundness,
        padding: SPACING.s,
        backgroundColor: '#FCFCFC',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submitBtn: {
        marginTop: SPACING.s,
        marginBottom: SPACING.xl,
        paddingVertical: 6,
    }
});
