import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, List, Button, Divider, TextInput, Portal, Modal } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
    const { user, role, logout, setUser } = useAuthStore();
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [passVisible, setPassVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);

    const [editData, setEditData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [passData, setPassData] = useState({ old: '', new: '' });

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        try {
            // Assume api has updateProfile
            // await authService.updateProfile(editData);
            setUser({ ...user, ...editData });
            setEditVisible(false);
            Alert.alert("Success", "Profile updated locally (Integration with API next)");
        } catch (e) {
            Alert.alert("Error", "Update failed");
        } finally {
            setIsUpdating(false);
        }
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
            <Stack.Screen options={{ title: 'My Profile' }} />

            <View style={styles.header}>
                <Avatar.Text size={80} label={user?.first_name?.[0] || 'U'} />
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
                <Button mode="contained-tonal" onPress={() => setEditVisible(true)} style={styles.btn}>Update Profile</Button>
                <Button mode="outlined" onPress={() => setPassVisible(true)} style={styles.btn}>Change Password</Button>
                <Button mode="contained" buttonColor="#B00020" onPress={handleLogout} style={styles.btn}>Logout</Button>
            </View>

            <Portal>
                {/* Edit Profile Modal */}
                <Modal visible={editVisible} onDismiss={() => setEditVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Update Profile</Text>
                    <TextInput label="First Name" value={editData.first_name} onChangeText={t => setEditData({ ...editData, first_name: t })} mode="outlined" style={styles.input} />
                    <TextInput label="Last Name" value={editData.last_name} onChangeText={t => setEditData({ ...editData, last_name: t })} mode="outlined" style={styles.input} />
                    <TextInput label="Email" value={editData.email} onChangeText={t => setEditData({ ...editData, email: t })} mode="outlined" style={styles.input} />
                    <TextInput label="Phone" value={editData.phone} onChangeText={t => setEditData({ ...editData, phone: t })} mode="outlined" style={styles.input} />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setEditVisible(false)}>Cancel</Button>
                        <Button mode="contained" loading={isUpdating} onPress={handleUpdateProfile}>Save</Button>
                    </View>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={passVisible} onDismiss={() => setPassVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Change Password</Text>
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
    container: { flex: 1, backgroundColor: '#fff' },
    header: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
    name: { marginTop: 10, fontWeight: 'bold' },
    actions: { padding: 20, gap: 12 },
    btn: { width: '100%' },
    modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
    input: { marginBottom: 12 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }
});
