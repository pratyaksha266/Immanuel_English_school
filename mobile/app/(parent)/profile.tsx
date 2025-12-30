import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Card, List, IconButton, Divider, Portal, Modal, HelperText, Chip } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import api, { parentService } from '../../services/api';
import { Guardian, User, Student } from '../../types';
import { Stack, useRouter } from 'expo-router';

export default function ParentProfilePage() {
    const userId = useAuthStore(state => state.userId);
    const logout = useAuthStore(state => state.logout);
    const router = useRouter(); // For logout if needed
    const [profile, setProfile] = useState<User | null>(null);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(true);
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
            // Fetch children and guardians (Token based)
            const [g, k] = await Promise.all([
                parentService.getGuardians(),
                parentService.getChildren()
            ]);
            setGuardians(g);
            setChildren(k);
            console.log("Fetched children:", k);



            // Fetch Profile (ID based)
            if (userId) {
                const p = await parentService.getProfile(userId);
                setProfile(p);
            } else {
                console.warn("User ID missing, skipping profile fetch");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            // Even if profile fails, we might have children
        } finally {
            setLoading(false);
        }
    };



    const handleAddGuardian = async () => {
        if (!newGuardian.name) {
            Alert.alert("Error", "Please enter Guardian Name");
            return;
        }
        if (!newGuardian.phone) {
            Alert.alert("Error", "Please enter Phone Number");
            return;
        }
        if (!newGuardian.relationship) {
            Alert.alert("Error", "Please enter Relationship");
            return;
        }

        try {
            // Backend now handles adding this guardian to ALL linked students of the parent
            await parentService.addGuardian({
                ...newGuardian,
                is_emergency_contact: false
            });
            Alert.alert("Success", "Guardian added for all your children and pending approval.");
            setVisible(false);
            setNewGuardian({ name: '', phone: '', relationship: '', student_id: '' });
            fetchData(); // Refresh list
        } catch (error) {
            Alert.alert("Error", "Failed to add guardian");
            console.error(error);
        }
    };

    // ... (rest of the file until the render part) ...

    // ... (rest of the file until the render part) ...

    const getStatusIcon = (is_approved: boolean) => {
        return is_approved ? 'check-decagram' : 'clock-outline';
    };

    const getStatusColor = (is_approved: boolean) => {
        return is_approved ? '#4CAF50' : '#FFA000';
    };

    const handleDeleteGuardian = async (id: string) => {
        Alert.alert(
            "Cancel Verification",
            "Are you sure you want to remove this guardian request?",
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
                            Alert.alert("Error", "Failed to delete guardian");
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
        if (!passData.old || !passData.new) return Alert.alert("Error", "Both current and new passwords are required");
        if (passData.new.length < 6) return Alert.alert("Error", "New password must be at least 6 characters");

        setIsUpdating(true);
        try {
            await api.post('/auth/change-password/', {
                old_password: passData.old,
                new_password: passData.new
            });
            setPassVisible(false);
            setPassData({ old: '', new: '' });
            Alert.alert("Success", "Password changed successfully");
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.error || "Failed to change password");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: "My Profile" }} />

            <View style={styles.header}>
                <Avatar.Text size={80} label={profile?.first_name?.[0] || "P"} />
                <Text variant="headlineSmall" style={styles.name}>
                    {profile?.first_name} {profile?.last_name}
                </Text>
                <Text variant="bodyLarge" style={{ color: 'gray' }}>Parent / Guardian</Text>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <List.Item
                        title="Phone"
                        description={profile?.phone}
                        left={props => <List.Icon {...props} icon="phone" />}
                    />
                    <Divider />
                    <List.Item
                        title="Email"
                        description={profile?.email || "Not provided"}
                        left={props => <List.Icon {...props} icon="email" />}
                    />
                    <Divider />
                    <List.Item
                        title="Occupation"
                        description={profile?.parent_profile?.occupation || "Not provided"}
                        left={props => <List.Icon {...props} icon="briefcase" />}
                    />
                </Card.Content>
                <Card.Actions>
                    <Button onPress={() => Alert.alert("Info", "Contact Admin to update profile")}>Edit Profile</Button>
                </Card.Actions>
            </Card>

            <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Trusted Guardians</Text>
                <Button mode="contained-tonal" icon="account-plus" onPress={() => setVisible(true)}>Add</Button>
            </View>

            {guardians.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>No trusted guardians added.</Text>
            ) : (
                guardians.map(g => (
                    <Card key={g.id} style={styles.guardianCard}>
                        <Card.Title
                            title={g.name}
                            subtitle={`${g.relationship} • ${g.phone}`}
                            left={props => <Avatar.Icon {...props} icon="account-check" size={40} style={{ backgroundColor: '#e0e0e0' }} />}
                            right={props => (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                                    <Text style={{ color: getStatusColor(g.is_approved), marginRight: 4 }}>
                                        {g.is_approved ? "Verified" : "Pending"}
                                    </Text>
                                    <IconButton icon={getStatusIcon(g.is_approved)} iconColor={getStatusColor(g.is_approved)} size={20} />
                                    {!g.is_approved && (
                                        <IconButton
                                            icon="delete"
                                            iconColor="red"
                                            size={20}
                                            onPress={() => handleDeleteGuardian(g.id)}
                                        />
                                    )}
                                </View>
                            )}
                        />
                        {children.length > 1 && (
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: 'gray' }}>
                                    For: {children.find(c => c.id === g.student)?.first_name || "Unknown"}
                                </Text>
                            </Card.Content>
                        )}
                    </Card>
                ))
            )}

            <View style={{ marginTop: 20, gap: 10 }}>
                <Button mode="outlined" onPress={() => setPassVisible(true)}>
                    Change Password
                </Button>
                <Button mode="outlined" onPress={handleLogout} textColor="red" style={{ borderColor: 'red' }}>
                    Log Out
                </Button>
            </View>

            <View style={{ height: 50 }} />

            <Portal>
                <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Add Trusted Guardian</Text>

                    <TextInput
                        label="Guardian Name"
                        value={newGuardian.name}
                        onChangeText={t => setNewGuardian({ ...newGuardian, name: t })}
                        style={styles.input}
                    />
                    <TextInput
                        label="Phone Number"
                        value={newGuardian.phone}
                        onChangeText={t => setNewGuardian({ ...newGuardian, phone: t })}
                        keyboardType="phone-pad"
                        style={styles.input}
                    />
                    <TextInput
                        label="Relationship (e.g. Uncle)"
                        value={newGuardian.relationship}
                        onChangeText={t => setNewGuardian({ ...newGuardian, relationship: t })}
                        style={styles.input}
                    />



                    <Button mode="contained" onPress={handleAddGuardian} style={{ marginTop: 10 }}>
                        Submit for Approval
                    </Button>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={passVisible} onDismiss={() => setPassVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Change Password</Text>
                    <TextInput
                        label="Current Password"
                        value={passData.old}
                        onChangeText={t => setPassData({ ...passData, old: t })}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                    />
                    <TextInput
                        label="New Password"
                        value={passData.new}
                        onChangeText={t => setPassData({ ...passData, new: t })}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                    />
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
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    name: {
        marginTop: 10,
        fontWeight: 'bold',
    },
    card: {
        marginBottom: 20,
        backgroundColor: 'white',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontWeight: 'bold',
    },
    guardianCard: {
        marginBottom: 10,
        backgroundColor: 'white',
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    input: {
        marginBottom: 10,
        backgroundColor: 'transparent'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12
    }
});
