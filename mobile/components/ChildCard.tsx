import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Card, Text, Avatar, Chip, Button } from 'react-native-paper';
import { Student } from '../types';

interface ChildCardProps {
    student: Student;
    hasActiveOutpass?: boolean;
    onRequestOutpass: (student: Student) => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({ student, onRequestOutpass, hasActiveOutpass }) => {
    return (
        <Card style={styles.card} mode="elevated">
            <Card.Content style={styles.content}>
                <View style={styles.row}>
                    <Avatar.Text
                        size={50}
                        label={student.first_name[0]}
                        style={{ backgroundColor: '#6200ee' }}
                        color="white"
                    />
                    <View style={styles.info}>
                        <Text variant="titleMedium" style={styles.name}>
                            {student.first_name} {student.last_name}
                        </Text>
                        <Text variant="bodySmall">
                            Class: {student.class_name || student.class_obj || 'N/A'} {student.section_name || student.section || ''}
                        </Text>
                        <Text variant="bodySmall">
                            Roll No: {student.roll_number}
                        </Text>
                        <Text variant="bodySmall" style={{ color: 'gray' }}>
                            Adm No: {student.admission_number}
                        </Text>
                    </View>
                </View>

                {student.hostel ? (
                    <Chip icon="home" style={styles.chip} compact>
                        {student.hostel_name || student.hostel} {student.room_number || student.room ? `(${student.room_number || student.room})` : ''}
                    </Chip>
                ) : null}

                {hasActiveOutpass && (
                    <Chip icon="alert-circle" style={[styles.chip, { backgroundColor: '#FFF9C4' }]} textStyle={{ color: '#FBC02D' }} compact>
                        Active Outpass Request
                    </Chip>
                )}
            </Card.Content>

            <Card.Actions>
                <Button
                    mode="contained-tonal"
                    onPress={() => onRequestOutpass(student)}
                    disabled={hasActiveOutpass}
                >
                    {hasActiveOutpass ? 'Request Active' : 'Request Outpass'}
                </Button>
            </Card.Actions>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        marginHorizontal: 4,
        backgroundColor: 'white',
    },
    content: {
        paddingVertical: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    info: {
        marginLeft: 16,
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
    },
    chip: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
});
