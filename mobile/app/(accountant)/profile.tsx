import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, List, Button, Divider, TextInput, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { parentService } from '../../services/api';

export default function AccountantProfile() {
    const { user, role, logout, userId } = useAuthStore();
    const router = useRouter();

    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    const [editData, setEditData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const handleUpdateProfile = async () => {
        if (!userId) return;
        try {
            await parentService.updateProfile(userId, editData);
            Alert.alert('Success', 'Profile updated successfully. Please re-login to see changes.');
            setUpdateModalVisible(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        // Assuming updateProfile handles password or there's a specific endpoint.
        // For now, mocking as per usual app flow if not explicitly defined in requirements.
        Alert.alert('Feature', 'Change password logic would go here');
        setPasswordModalVisible(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Avatar.Text size={80} label={user?.first_name?.[0] || 'A'} />
                <Text variant="headlineSmall" style={styles.name}>{user?.first_name} {user?.last_name}</Text>
                <Text variant="bodyMedium" style={{ color: 'gray' }}>{role}</Text>
            </View>

            <List.Section>
                <List.Subheader>Information</List.Subheader>
                <List.Item title="ID" description={user?.id || 'N/A'} left={props => <List.Icon {...props} icon="id-card" />} />
                <List.Item title="Email" description={user?.email || 'N/A'} left={props => <List.Icon {...props} icon="email" />} />
                <List.Item title="Phone" description={user?.phone || 'N/A'} left={props => <List.Icon {...props} icon="phone" />} />
            </List.Section>

            <Divider />

            <View style={styles.actions}>
                <Button mode="contained-tonal" onPress={() => setUpdateModalVisible(true)} style={styles.btn}>Update Profile</Button>
                <Button mode="outlined" onPress={() => setPasswordModalVisible(true)} style={styles.btn}>Change Password</Button>
                <Button mode="contained" buttonColor="#B00020" onPress={handleLogout} style={styles.btn}>Logout</Button>
            </View>

            <Portal>
                {/* Update Profile Modal */}
                <Modal visible={updateModalVisible} onDismiss={() => setUpdateModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={styles.modalTitle}>Update Profile</Text>
                    <TextInput
                        label="First Name"
                        value={editData.first_name}
                        onChangeText={t => setEditData({ ...editData, first_name: t })}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Last Name"
                        value={editData.last_name}
                        onChangeText={t => setEditData({ ...editData, last_name: t })}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Email"
                        value={editData.email}
                        onChangeText={t => setEditData({ ...editData, email: t })}
                        mode="outlined"
                        keyboardType="email-address"
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setUpdateModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleUpdateProfile}>Update</Button>
                    </View>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={passwordModalVisible} onDismiss={() => setPasswordModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={styles.modalTitle}>Change Password</Text>
                    <TextInput
                        label="Current Password"
                        value={passwords.current}
                        onChangeText={t => setPasswords({ ...passwords, current: t })}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="New Password"
                        value={passwords.new}
                        onChangeText={t => setPasswords({ ...passwords, new: t })}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Confirm New Password"
                        value={passwords.confirm}
                        onChangeText={t => setPasswords({ ...passwords, confirm: t })}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setPasswordModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleChangePassword}>Change</Button>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
    name: { marginTop: 10, fontWeight: 'bold' },
    actions: { padding: 20, gap: 12 },
    btn: { width: '100%' },
    modal: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 20,
    },
    input: {
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    }
});
