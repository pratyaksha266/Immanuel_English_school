import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Avatar, Chip, Button } from 'react-native-paper';
import { Student } from '../types';
import { theme, SPACING } from '../constants/theme';

interface ChildCardProps {
    student: Student;
    hasActiveOutpass?: boolean;
    onRequestOutpass: (student: Student) => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({ student, onRequestOutpass, hasActiveOutpass }) => {
    return (
        <Card style={styles.card} mode="elevated" elevation={1}>
            <Card.Content style={styles.content}>
                <View style={styles.row}>
                    <Avatar.Text
                        size={50}
                        label={student.first_name[0]}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <View style={styles.info}>
                        <Text variant="titleMedium" style={styles.name}>
                            {student.first_name} {student.last_name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: 'gray' }}>
                            Class: {student.class_name || student.class_obj || 'N/A'} {student.section_name || student.section || ''} | Roll No: {student.roll_number}
                        </Text>
                    </View>
                </View>

                {student.hostel && (
                    <Chip icon="home" style={styles.chip} compact textStyle={{ fontSize: 12 }}>
                        {student.hostel_name || student.hostel} {student.room_number || student.room ? `(${student.room_number || student.room})` : ''}
                    </Chip>
                )}

                {hasActiveOutpass && (
                    <Chip
                        icon="alert-circle"
                        style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                        textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
                        compact
                    >
                        Active Outpass Request
                    </Chip>
                )}
            </Card.Content>

            <Card.Actions style={{ justifyContent: 'flex-end', paddingRight: 16, paddingBottom: 16 }}>
                <Button
                    mode={hasActiveOutpass ? "text" : "contained"}
                    onPress={() => onRequestOutpass(student)}
                    disabled={hasActiveOutpass}
                    buttonColor={hasActiveOutpass ? undefined : theme.colors.primary}
                >
                    {hasActiveOutpass ? 'View Status' : 'Request Outpass'}
                </Button>
            </Card.Actions>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.m,
        backgroundColor: 'white',
        borderRadius: theme.roundness,
    },
    content: {
        paddingVertical: SPACING.s,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    info: {
        marginLeft: SPACING.m,
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        color: '#424242',
    },
    chip: {
        marginTop: SPACING.xs,
        alignSelf: 'flex-start',
        marginRight: SPACING.xs,
    },
});
