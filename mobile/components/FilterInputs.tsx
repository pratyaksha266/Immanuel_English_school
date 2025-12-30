import React, { useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Text, Menu, TextInput, Button } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface FilterDropdownProps {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (value: string) => void;
    style?: any;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, value, options, onSelect, style }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={style}>
            <Menu
                visible={visible}
                onDismiss={() => setVisible(false)}
                anchor={
                    <TouchableOpacity onPress={() => setVisible(true)}>
                        <TextInput
                            label={label}
                            value={options.find(o => o.value === value)?.label || value}
                            mode="outlined"
                            dense
                            editable={false}
                            right={<TextInput.Icon icon="chevron-down" onPress={() => setVisible(true)} />}
                            style={{ backgroundColor: 'white' }}
                        />
                    </TouchableOpacity>
                }
            >
                <Menu.Item onPress={() => { onSelect(''); setVisible(false); }} title="All" />
                {options.map((opt) => (
                    <Menu.Item
                        key={opt.value}
                        onPress={() => { onSelect(opt.value); setVisible(false); }}
                        title={opt.label}
                    />
                ))}
            </Menu>
        </View>
    );
};

interface FilterDatePickerProps {
    label: string;
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    style?: any;
}

export const FilterDatePicker: React.FC<FilterDatePickerProps> = ({ label, value, onChange, style }) => {
    const [show, setShow] = useState(false);

    const handleConfirm = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }

        if (selectedDate) {
            // Format YYYY-MM-DD
            const formatted = selectedDate.toISOString().split('T')[0];
            onChange(formatted);
        }
    };

    const openPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: value ? new Date(value) : new Date(),
                onChange: handleConfirm,
                mode: 'date',
            });
        } else {
            setShow(true);
        }
    };

    return (
        <View style={style}>
            <TouchableOpacity onPress={openPicker}>
                <TextInput
                    label={label}
                    value={value}
                    mode="outlined"
                    dense
                    editable={false}
                    right={<TextInput.Icon icon="calendar" onPress={openPicker} />}
                    style={{ backgroundColor: 'white' }}
                />
            </TouchableOpacity>
            {Platform.OS === 'ios' && show && (
                <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => { setShow(false); handleConfirm(event, date); }}
                />
            )}
        </View>
    );
};
