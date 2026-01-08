import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Card, List, IconButton, Divider, Portal, Modal, HelperText, Chip, Surface } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import api, { parentService } from '../../services/api';
import { Guardian, User, Student } from '../../types';
import { Stack, useRouter } from 'expo-router';
import { theme, SPACING } from '../../constants/theme';

export default function ParentProfilePage() {
    const userId = useAuthStore(state => state.userId);
    const logout = useAuthStore(state => state.logout);
    const router = useRouter(); // For logout if needed
    const [profile, setProfile] = useState<User | null>(null);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(true);

    // Change Password State
    const [passVisible, setPassVisible] = useState(false);
    const [passData, setPassData] = useState({ old: '', new: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    // Add Guardian Modal
    const [visible, setVisible] = useState(false);
    const [newGuardian, setNewGuardian] = useState({
        name: '',
        phone: '',
        relationship: '',
        student_id: ''
    });
    const [children, setChildren] = useState<Student[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [g, k] = await Promise.all([
                parentService.getGuardians(),
                parentService.getChildren()
            ]);
            setGuardians(g);
            setChildren(k);

            if (userId) {
                const p = await parentService.getProfile(userId);
                setProfile(p);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGuardian = async () => {
        if (!newGuardian.name || !newGuardian.phone || !newGuardian.relationship) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        try {
            await parentService.addGuardian({
                ...newGuardian,
                is_emergency_contact: false
            });
            Alert.alert("Success", "Guardian request submitted for approval.");
            setVisible(false);
            setNewGuardian({ name: '', phone: '', relationship: '', student_id: '' });
            fetchData();
        } catch (error) {
            Alert.alert("Error", "Failed to add guardian");
        }
    };

    const handleDeleteGuardian = async (id: string) => {
        Alert.alert(
            "Cancel Verification",
            "Remove this guardian request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await parentService.deleteGuardian(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete");
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const handleChangePassword = async () => {
        if (!passData.old || !passData.new) return Alert.alert("Error", "All fields required");
        if (passData.new.length < 6) return Alert.alert("Error", "Password too short");

        setIsUpdating(true);
        try {
            await api.post('/auth/change-password/', {
                old_password: passData.old,
                new_password: passData.new
            });
            setPassVisible(false);
            setPassData({ old: '', new: '' });
            Alert.alert("Success", "Password updated");
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.error || "Failed");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (is_approved: boolean) => is_approved ? theme.colors.primary : theme.colors.secondary;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: "My Profile", headerStyle: { backgroundColor: theme.colors.primary }, headerTintColor: '#fff' }} />

            <Surface style={styles.header} elevation={1}>
                <Avatar.Text
                    size={80}
                    label={profile?.first_name?.[0] || "P"}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                />
                <Text variant="headlineSmall" style={styles.name}>
                    {profile?.first_name} {profile?.last_name}
                </Text>
                <Chip icon="account-circle" style={{ marginTop: 8 }}>Parent / Guardian</Chip>
            </Surface>

            <Card style={styles.card} mode="elevated">
                <Card.Content>
                    <List.Item
                        title="Phone"
                        description={profile?.phone}
                        left={props => <Avatar.Icon {...props} icon="phone" size={40} style={{ backgroundColor: '#F5F5F5' }} color={theme.colors.primary} />}
                    />
                    <Divider style={{ marginVertical: 8 }} />
                    <List.Item
                        title="Email"
                        description={profile?.email || "Not provided"}
                        left={props => <Avatar.Icon {...props} icon="email" size={40} style={{ backgroundColor: '#F5F5F5' }} color={theme.colors.primary} />}
                    />
                </Card.Content>
            </Card>

            <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Trusted Guardians</Text>
                <Button mode="contained" compact onPress={() => setVisible(true)} buttonColor={theme.colors.primary}>+ Add New</Button>
            </View>

            {guardians.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={{ color: 'gray' }}>No trusted guardians added yet.</Text>
                </View>
            ) : (
                guardians.map(g => (
                    <Card key={g.id} style={styles.guardianCard}>
                        <Card.Title
                            title={g.name}
                            subtitle={g.relationship}
                            left={props => <Avatar.Icon {...props} icon="account-check" size={40} style={{ backgroundColor: g.is_approved ? '#E8F5E9' : '#FFF3E0' }} color={g.is_approved ? '#2E7D32' : '#E65100'} />}
                            right={props => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {!g.is_approved && (
                                        <IconButton icon="trash-can-outline" iconColor={theme.colors.error} size={20} onPress={() => handleDeleteGuardian(g.id)} />
                                    )}
                                    {g.is_approved && <IconButton icon="check-decagram" iconColor={theme.colors.primary} size={20} />}
                                </View>
                            )}
                        />
                        <Card.Content>
                            <View style={styles.row}>
                                <Chip icon="phone" compact style={{ marginRight: 8 }}>{g.phone}</Chip>
                                <Chip icon="account-school" compact>{children.find(c => c.id === g.student)?.first_name || "Any Child"}</Chip>
                            </View>
                        </Card.Content>
                    </Card>
                ))
            )}

            <View style={styles.actions}>
                <Button mode="outlined" icon="lock-reset" onPress={() => setPassVisible(true)} style={{ marginBottom: 10 }}>
                    Change Password
                </Button>
                <Button mode="outlined" icon="logout" onPress={handleLogout} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>
                    Log Out
                </Button>
            </View>
            <View style={{ height: 60 }} />

            <Portal>
                {/* Add Guardian Modal */}
                <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>New Guardian</Text>
                    <TextInput label="Full Name" value={newGuardian.name} onChangeText={t => setNewGuardian({ ...newGuardian, name: t })} mode="outlined" style={styles.input} />
                    <TextInput label="Phone Number" value={newGuardian.phone} onChangeText={t => setNewGuardian({ ...newGuardian, phone: t })} keyboardType="phone-pad" mode="outlined" style={styles.input} />
                    <TextInput label="Relationship (e.g. Uncle)" value={newGuardian.relationship} onChangeText={t => setNewGuardian({ ...newGuardian, relationship: t })} mode="outlined" style={styles.input} />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleAddGuardian}>Submit</Button>
                    </View>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={passVisible} onDismiss={() => setPassVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>Change Password</Text>
                    <TextInput label="Current Password" value={passData.old} onChangeText={t => setPassData({ ...passData, old: t })} mode="outlined" secureTextEntry style={styles.input} />
                    <TextInput label="New Password" value={passData.new} onChangeText={t => setPassData({ ...passData, new: t })} mode="outlined" secureTextEntry style={styles.input} />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setPassVisible(false)}>Cancel</Button>
                        <Button mode="contained" loading={isUpdating} onPress={handleChangePassword}>Update</Button>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: SPACING.m,
    },
    header: {
        alignItems: 'center',
        paddingVertical: SPACING.l,
        backgroundColor: 'white',
        borderRadius: theme.roundness,
        marginBottom: SPACING.m,
    },
    name: {
        marginTop: SPACING.s,
        fontWeight: 'bold',
        color: '#424242',
    },
    card: {
        marginBottom: SPACING.m,
        backgroundColor: 'white',
        borderRadius: theme.roundness,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
        marginTop: SPACING.s,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#616161',
    },
    guardianCard: {
        marginBottom: SPACING.m,
        backgroundColor: 'white',
        borderRadius: theme.roundness,
    },
    emptyState: {
        padding: SPACING.l,
        alignItems: 'center',
        backgroundColor: '#EEEEEE',
        borderRadius: theme.roundness,
    },
    row: {
        flexDirection: 'row',
        marginTop: SPACING.xs,
    },
    actions: {
        marginTop: SPACING.l,
    },
    modal: {
        backgroundColor: 'white',
        padding: SPACING.l,
        margin: SPACING.l,
        borderRadius: theme.roundness,
    },
    modalTitle: {
        marginBottom: SPACING.m,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        marginBottom: SPACING.s,
        backgroundColor: 'white',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.s,
        marginTop: SPACING.m,
    }
});
