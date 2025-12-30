import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, RadioButton, Switch, Chip, Menu, Divider, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { parentService } from '../../services/api';
import { Student, Guardian, Outpass } from '../../types';

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

    const [returnDate, setReturnDate] = useState(''); // YYYY-MM-DD
    const [returnTime, setReturnTime] = useState('18:00'); // HH:MM

    const [reason, setReason] = useState('');

    const [isPriority, setIsPriority] = useState(false);
    const [priorityReason, setPriorityReason] = useState('');

    useEffect(() => {
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
                console.log("Pre-selecting student:", sId);

                // Check if this student has active outpass
                const hasActive = outpasses.some(op => String(op.student) === String(sId));
                if (hasActive) {
                    Alert.alert("Notice", "This student already has an active outpass request.");
                } else {
                    setSelectedStudents([String(sId)]);
                }
            }

            // Set default return date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setReturnDate(tomorrow.toISOString().split('T')[0]);

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

    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            Alert.alert('Error', 'Please select at least one student');
            return;
        }
        if (!returnDate || !returnTime || !reason) {
            Alert.alert('Error', 'Please fill all required fields');
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
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const outgoingTime = `${hours}:${minutes}`;

            // Create Outpass for EACH selected student
            await Promise.all(selectedStudents.map(studentId => {
                return parentService.createOutpass({
                    student: studentId,
                    guardian: pickupType === 'GUARDIAN' ? selectedGuardian : undefined,
                    pickup_person_name: pickupType === 'PARENT' ? 'Parent' : undefined, // Or verified guardian name

                    outgoing_date: outgoingDate,
                    outgoing_time: outgoingTime,
                    expected_return_date: returnDate,
                    expected_return_time: returnTime,

                    reason,
                    destination: "Not Specified",
                    mode_of_travel: 'Private', // Hardcode or add field

                    is_priority: isPriority,
                    priority_reason: isPriority ? priorityReason : '',
                });
            }));

            Alert.alert('Success', `${selectedStudents.length} Outpass request(s) submitted.`);
            router.replace('/(parent)/dashboard');
        } catch (error: any) {
            const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            Alert.alert('Error', `Failed to submit: ${msg}`);
            console.error("Submit Error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'New Outpass Request' }} />

            <Text variant="titleMedium" style={styles.label}>Select Student</Text>
            <View style={styles.rowWrap}>
                {children.map(child => {
                    const hasActive = activeOutpasses.some(op => String(op.student) === String(child.id));
                    return (
                        <Chip
                            key={child.id}
                            selected={selectedStudents.includes(String(child.id))}
                            onPress={() => {
                                if (hasActive) {
                                    Alert.alert("Notice", `${child.first_name} already has an active outpass request.`);
                                } else {
                                    toggleStudent(String(child.id));
                                }
                            }}
                            disabled={hasActive}
                            showSelectedOverlay
                            style={[styles.chip, hasActive && { opacity: 0.5 }]}
                        >
                            {child.first_name} {child.last_name}
                        </Chip>
                    );
                })}
            </View>

            <Text variant="titleMedium" style={styles.label}>Who is picking up?</Text>
            <RadioButton.Group onValueChange={value => setPickupType(value as any)} value={pickupType}>
                <View style={styles.radioRow}>
                    <RadioButton.Item label="Me (Parent)" value="PARENT" />
                    <RadioButton.Item label="Trusted Guardian" value="GUARDIAN" />
                </View>
            </RadioButton.Group>

            {pickupType === 'GUARDIAN' && (
                <View style={styles.inputContainer}>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                                {selectedGuardian
                                    ? guardians.find(g => g.id === selectedGuardian)?.name
                                    : "Select Guardian"}
                            </Button>
                        }
                    >
                        {getVerifiedGuardians().length === 0 ? (
                            <Menu.Item title="No verified guardians" disabled />
                        ) : (
                            getVerifiedGuardians().map(g => (
                                <Menu.Item
                                    key={g.id}
                                    onPress={() => {
                                        setSelectedGuardian(g.id);
                                        setMenuVisible(false);
                                    }}
                                    title={`${g.name} (${g.relationship})`}
                                />
                            ))
                        )}
                        <Divider />
                        <Menu.Item onPress={() => router.push('/(parent)/profile')} title="+ Add New Guardian" leadingIcon="plus" />
                    </Menu>
                    <HelperText type="info">Only Verified Guardians can be selected.</HelperText>
                </View>
            )}

            <Divider style={{ marginVertical: 10 }} />

            <Text variant="titleMedium" style={styles.label}>Details</Text>
            <View style={styles.row}>
                <TextInput
                    label="Return Date (YYYY-MM-DD)"
                    value={returnDate}
                    onChangeText={setReturnDate}
                    mode="outlined"
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="2025-12-25"
                />
                <TextInput
                    label="Time (HH:MM)"
                    value={returnTime}
                    onChangeText={setReturnTime}
                    mode="outlined"
                    style={[styles.input, { flex: 1 }]}
                    placeholder="18:00"
                />
            </View>


            <TextInput
                label="Reason / Purpose"
                value={reason}
                onChangeText={setReason}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
            />

            <View style={styles.priorityBox}>
                <View style={styles.rowBetween}>
                    <Text variant="bodyLarge" style={{ fontWeight: 'bold', color: isPriority ? 'red' : 'black' }}>Mark as Priority</Text>
                    <Switch value={isPriority} onValueChange={setIsPriority} color="red" />
                </View>
                {isPriority && (
                    <>
                        <Text variant="bodySmall" style={{ color: 'red', marginBottom: 5 }}>
                            Caution: This request will be treated as urgent. Misuse may lead to action.
                        </Text>
                        <TextInput
                            label="Priority Reason (Required)"
                            value={priorityReason}
                            onChangeText={setPriorityReason}
                            mode="outlined"
                            style={styles.input}
                            error={!priorityReason}
                        />
                    </>
                )}
            </View>

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                style={styles.submitBtn}
                contentStyle={{ paddingVertical: 8 }}
            >
                Submit Request
            </Button>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    label: {
        marginTop: 10,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputContainer: {
        marginBottom: 10,
    },
    input: {
        marginBottom: 10,
        backgroundColor: 'transparent'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    priorityBox: {
        borderWidth: 1,
        borderColor: '#ffcccb',
        backgroundColor: '#fff5f5',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    submitBtn: {
        marginTop: 20,
        marginBottom: 30,
    }
});
