import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, Divider, Avatar, Surface, IconButton } from 'react-native-paper';
import { Outpass } from '../types';
import { theme, SPACING } from '../constants/theme';

interface StaffOutpassCardProps {
    outpass: Outpass;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onMeeting?: (id: string) => void;
    onViewDetail?: (outpass: Outpass) => void;
    onMarkReturned?: (id: string) => void;
    onMarkLeftHostel?: (id: string) => void;
    onEditMeeting?: (outpass: Outpass) => void;
    onCancelMeeting?: (id: string) => void;
    onCompleteMeeting?: (id: string) => void;
    onFeeDue?: (id: string) => void;
    role?: string;
}

export const StaffOutpassCard: React.FC<StaffOutpassCardProps> = ({
    outpass,
    onApprove,
    onReject,
    onMeeting,
    onViewDetail,
    onMarkReturned,
    onMarkLeftHostel,
    onEditMeeting,
    onCancelMeeting,
    onCompleteMeeting,
    onFeeDue,
    role
}) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return { bg: theme.colors.secondary, text: theme.colors.onSecondary }; // Amber bg, Black text
            case 'APPROVED': return { bg: theme.colors.primary, text: theme.colors.onPrimary }; // Indigo bg, White text
            case 'READY_FOR_EXIT': return { bg: '#9C27B0', text: 'white' };
            case 'COMPLETED': return { bg: '#2196F3', text: 'white' };
            case 'REJECTED': return { bg: theme.colors.error, text: theme.colors.onPrimary };
            case 'OVERDUE': return { bg: theme.colors.error, text: theme.colors.onPrimary };
            default: return { bg: '#E0E0E0', text: '#424242' };
        }
    };

    const statusStyle = getStatusStyle(outpass.status);

    return (
        <Surface style={styles.card} elevation={1}>
            <View style={styles.header}>
                <View style={styles.studentInfo}>
                    <Avatar.Text
                        size={40}
                        label={outpass.student_name?.[0] || 'S'}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <View style={{ marginLeft: SPACING.s, flex: 1, marginRight: 8 }}>
                        <Text variant="titleMedium" style={styles.studentName} numberOfLines={1} ellipsizeMode="tail">
                            {outpass.student_name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: 'gray' }} numberOfLines={1}>
                            {outpass.student_class} {outpass.student_section} • Roll: {outpass.student_roll_no}
                        </Text>
                    </View>
                </View>
                <View style={{ flexShrink: 0 }}>
                    <Chip
                        textStyle={{ color: statusStyle.text, fontSize: 11, fontWeight: 'bold', marginHorizontal: 2 }}
                        style={{ backgroundColor: statusStyle.bg, alignSelf: 'flex-start', borderRadius: 12 }}
                    >
                        {outpass.status.replace(/_/g, ' ')}
                    </Chip>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Avatar.Icon size={24} icon="calendar-range" style={{ backgroundColor: 'transparent' }} color="gray" />
                    <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 4 }}>
                        {outpass.outgoing_date} <Text style={{ color: 'gray' }}>to</Text> {outpass.expected_return_date}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Avatar.Icon size={24} icon="text-short" style={{ backgroundColor: 'transparent' }} color="gray" />
                    <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 4 }} numberOfLines={2}>
                        {outpass.reason}
                    </Text>
                </View>

                {outpass.is_priority && (
                    <View style={[styles.infoBox, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
                        <Avatar.Icon size={20} icon="alert-circle" color={theme.colors.error} style={{ backgroundColor: 'transparent' }} />
                        <Text style={{ color: theme.colors.error, fontWeight: 'bold', marginLeft: 4 }}>Priority Request</Text>
                    </View>
                )}

                {outpass.meeting_scheduled && (
                    <View style={[styles.infoBox, { backgroundColor: '#F3E5F5', borderColor: '#E1BEE7' }]}>
                        <Avatar.Icon size={20} icon="calendar-clock" color="#7B1FA2" style={{ backgroundColor: 'transparent' }} />
                        <Text style={{ color: '#7B1FA2', marginLeft: 4 }}>
                            Meeting: {outpass.meeting_date} @ {outpass.meeting_venue}
                        </Text>
                    </View>
                )}

                {(outpass.status === 'READY_FOR_EXIT' && outpass.exit_code) && (
                    <View style={styles.codeBox}>
                        <Text variant="bodySmall" style={{ color: 'gray' }}>EXIT CODE</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, letterSpacing: 2 }}>
                            {outpass.exit_code}
                        </Text>
                    </View>
                )}

                {(outpass.status === 'CHECKED_OUT' && outpass.return_code) && (
                    <View style={styles.codeBox}>
                        <Text variant="bodySmall" style={{ color: 'gray' }}>RETURN CODE</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, letterSpacing: 2 }}>
                            {outpass.return_code}
                        </Text>
                    </View>
                )}

                {outpass.fee_due !== undefined && outpass.fee_due > 0 && (
                    <View style={[styles.infoBox, {
                        backgroundColor: outpass.fee_paid ? '#E8F5E9' : '#FFF3E0',
                        borderColor: outpass.fee_paid ? '#C8E6C9' : '#FFE0B2'
                    }]}>
                        <Avatar.Icon size={20} icon={outpass.fee_paid ? "check-circle" : "cash-remove"} color={outpass.fee_paid ? 'green' : 'orange'} style={{ backgroundColor: 'transparent' }} />
                        <Text style={{ color: outpass.fee_paid ? 'green' : 'orange', fontWeight: 'bold', marginLeft: 4 }}>
                            Fee: ₹{outpass.fee_due} ({outpass.fee_paid ? 'Paid' : 'Due'})
                        </Text>
                    </View>
                )}
            </View>

            <Divider />

            <View style={styles.actions}>
                {/* PENDING ACTIONS */}
                {(outpass.status === 'PENDING' || (outpass.status === 'FEE_PENDING' && role === 'HM')) && role !== 'ACCOUNTANT' && (
                    <>
                        <Button mode="text" textColor={theme.colors.error} onPress={() => onReject?.(outpass.id)}>Reject</Button>
                        <Button mode="text" textColor={theme.colors.primary} onPress={() => onMeeting?.(outpass.id)}>Meeting</Button>
                        <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => onApprove?.(outpass.id)}>Approve</Button>
                    </>
                )}

                {/* APPROVED ACTIONS */}
                {outpass.status === 'APPROVED' && (
                    <>
                        {role === 'WARDEN' && (
                            <>
                                <Button mode="text" textColor={theme.colors.error} onPress={() => onReject?.(outpass.id)}>Reject</Button>
                                <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => onMarkLeftHostel?.(outpass.id)}>Depart</Button>
                            </>
                        )}
                        <Button mode="outlined" style={{ borderColor: theme.colors.primary }} textColor={theme.colors.primary} onPress={() => onViewDetail?.(outpass)}>Details</Button>
                    </>
                )}

                {/* MEETING ACTIONS */}
                {(outpass.status === 'MEETING' || (outpass.meeting_scheduled && outpass.status === 'PENDING')) && (
                    <>
                        <Button mode="text" textColor="gray" onPress={() => onCancelMeeting?.(outpass.id)}>Cancel</Button>
                        <Button mode="text" textColor={theme.colors.primary} onPress={() => onEditMeeting?.(outpass)}>Edit</Button>
                        <Button mode="text" textColor={theme.colors.error} onPress={() => onReject?.(outpass.id)}>Reject</Button>
                        <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => onApprove?.(outpass.id)}>Approve</Button>
                    </>
                )}

                {/* EXIT/RETURN ACTIONS */}
                {(outpass.status === 'CHECKED_OUT' || outpass.status === 'OVERDUE') && role !== 'GATE_STAFF' && (
                    <>
                        <Button mode="outlined" onPress={() => onViewDetail?.(outpass)}>Contact</Button>
                        <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => onMarkReturned?.(outpass.id)}>Mark Returned</Button>
                    </>
                )}

                {/* ACCOUNTANT ACTIONS */}
                {role === 'ACCOUNTANT' && (outpass.status === 'PENDING' || outpass.status === 'FEE_PENDING') && (
                    <>
                        {!outpass.fee_paid && (!outpass.fee_due || outpass.fee_due === 0) && <Button mode="outlined" onPress={() => onFeeDue?.(outpass.id)} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>Mark Fee Due</Button>}
                        {!outpass.fee_paid && (
                            <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => onApprove?.(outpass.id)}>Mark Paid & Approve</Button>
                        )}
                    </>
                )}

                {/* COMPLETED ACTIONS */}
                {outpass.status === 'COMPLETED' && (
                    <Button mode="outlined" onPress={() => onViewDetail?.(outpass)}>View Details</Button>
                )}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.m,
        backgroundColor: 'white',
        borderRadius: theme.roundness,
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: SPACING.m,
        paddingBottom: SPACING.s,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    studentName: {
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.s,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.s,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: SPACING.s,
    },
    codeBox: {
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginVertical: SPACING.s,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed'
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: SPACING.s,
        backgroundColor: '#FAFAFA',
        flexWrap: 'wrap',
        gap: SPACING.xs
    }
});
