import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, Divider, Avatar } from 'react-native-paper';
import { Outpass } from '../types';

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
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#FFA500';
            case 'APPROVED': return '#4CAF50';
            case 'READY_FOR_EXIT': return '#9C27B0';
            case 'COMPLETED': return '#2196F3';
            case 'REJECTED': return '#F44336';
            case 'OVERDUE': return '#FF5252';
            default: return '#757575';
        }
    };

    return (
        <Card style={styles.card} mode="elevated">
            <Card.Title
                title={outpass.student_name || "Student Name"}
                subtitle={`${outpass.student_class || ''} ${outpass.student_section || ''} | Roll: ${outpass.student_roll_no || ''}`}
                left={(props) => <Avatar.Text {...props} size={40} label={outpass.student_name?.[0] || 'S'} />}
            />
            <Card.Content>
                <View style={styles.infoRow}>
                    <Text variant="labelMedium">Dates: </Text>
                    <Text variant="bodyMedium">{outpass.outgoing_date} to {outpass.expected_return_date}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text variant="labelMedium">Reason: </Text>
                    <Text variant="bodyMedium" numberOfLines={1}>{outpass.reason}</Text>
                </View>

                <View style={styles.badgeContainer}>
                    <Chip style={{ backgroundColor: getStatusColor(outpass.status) }} textStyle={{ color: 'white' }} compact>
                        {outpass.status}
                    </Chip>
                    {outpass.is_priority && (
                        <Chip icon="alert" style={styles.priorityChip} textStyle={{ color: 'white' }} compact>
                            Priority
                        </Chip>
                    )}
                    {outpass.meeting_scheduled && (
                        <Chip icon="calendar" style={styles.meetingChip} textStyle={{ color: 'white' }} compact>
                            Meeting
                        </Chip>
                    )}
                </View>

                {outpass.meeting_scheduled && outpass.meeting_date && (
                    <View style={styles.meetingInfo}>
                        <Text variant="labelSmall" style={{ color: '#6200ee' }}>
                            Meeting: {new Date(outpass.meeting_date).toLocaleString()}
                        </Text>
                        <Text variant="labelSmall" style={{ color: '#6200ee' }}>
                            Venue: {outpass.meeting_venue}
                        </Text>
                    </View>
                )}
                {(outpass.status === 'READY_FOR_EXIT' && outpass.exit_code) && (
                    <View style={styles.codeInfo}>
                        <Text variant="labelLarge" style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>
                            Exit Code: {outpass.exit_code}
                        </Text>
                    </View>
                )}
                {(outpass.status === 'CHECKED_OUT' && outpass.return_code) && (
                    <View style={styles.codeInfo}>
                        <Text variant="labelLarge" style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>
                            Return Code: {outpass.return_code}
                        </Text>
                    </View>
                )}
                {outpass.fee_due !== undefined && outpass.fee_due > 0 && (
                    <View style={styles.feeInfo}>
                        <Text variant="labelSmall" style={{ color: outpass.fee_paid ? '#4CAF50' : '#F44336' }}>
                            Fee: ₹{outpass.fee_due} ({outpass.fee_paid ? 'Paid' : 'Pending'})
                        </Text>
                    </View>
                )}
            </Card.Content>

            <Divider style={styles.divider} />

            <Card.Actions style={styles.actions}>
                {(outpass.status === 'PENDING' || (outpass.status === 'FEE_PENDING' && role === 'HM')) && role !== 'ACCOUNTANT' && (
                    <>
                        <Button mode="text" textColor="red" onPress={() => onReject?.(outpass.id)}>Reject</Button>
                        <Button mode="text" onPress={() => onMeeting?.(outpass.id)}>Meeting</Button>
                        <Button mode="contained" onPress={() => onApprove?.(outpass.id)}>Approve</Button>
                    </>
                )}

                {outpass.status === 'APPROVED' && (
                    <>
                        {role === 'WARDEN' && (
                            <>
                                <Button mode="text" textColor="red" onPress={() => onReject?.(outpass.id)}>Reject</Button>
                                <Button mode="contained" onPress={() => onMarkLeftHostel?.(outpass.id)}>Depart Hostel</Button>
                            </>
                        )}
                        <Button mode="outlined" onPress={() => onViewDetail?.(outpass)}>Details</Button>
                    </>
                )}

                {(outpass.status === 'MEETING' || (outpass.meeting_scheduled && outpass.status === 'PENDING')) && (
                    <>
                        <Button mode="text" onPress={() => onCancelMeeting?.(outpass.id)}>Cancel</Button>
                        <Button mode="outlined" onPress={() => onEditMeeting?.(outpass)}>Edit</Button>
                        <Button mode="text" textColor="red" onPress={() => onReject?.(outpass.id)}>Reject</Button>
                        <Button mode="contained" onPress={() => onApprove?.(outpass.id)}>Approve</Button>
                    </>
                )}

                {outpass.status === 'COMPLETED' && (
                    <Button mode="outlined" onPress={() => onViewDetail?.(outpass)}>View Details</Button>
                )}

                {(outpass.status === 'CHECKED_OUT' || outpass.status === 'OVERDUE') && role !== 'GATE_STAFF' && (
                    <>
                        <Button mode="outlined" onPress={() => onViewDetail?.(outpass)}>Contact</Button>
                        <Button mode="contained" onPress={() => onMarkReturned?.(outpass.id)}>Mark Returned</Button>
                    </>
                )}

                {role === 'ACCOUNTANT' && (outpass.status === 'PENDING' || outpass.status === 'FEE_PENDING') && (
                    <>
                        {!outpass.fee_paid && <Button mode="outlined" onPress={() => onFeeDue?.(outpass.id)}>Fee Due</Button>}
                        {!outpass.fee_paid && (
                            <Button mode="contained" onPress={() => onApprove?.(outpass.id)}>Mark Paid</Button>
                        )}
                    </>
                )}
            </Card.Actions>
        </Card >
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        flexWrap: 'wrap',
    },
    priorityChip: {
        backgroundColor: '#D32F2F',
    },
    meetingChip: {
        backgroundColor: '#6200ee',
    },
    meetingInfo: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f3e5f5',
        borderRadius: 4,
    },
    feeInfo: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f1f8e9',
        borderRadius: 4,
    },
    codeInfo: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2196F3',
        borderStyle: 'dashed'
    },
    divider: {
        marginVertical: 4,
    },
    actions: {
        justifyContent: 'flex-end',
    }
});
