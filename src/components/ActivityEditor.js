import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    emerald: '#7C1C1C',
    emeraldLight: '#991B1B',
    gold: '#B45309',
    goldLight: '#D97706',
    textPrimary: '#450A0A',
    textSecondary: '#7F1D1D',
    surface: '#FFFFFF',
    border: '#E2E8F0',
};

const ActivityEditor = ({ value, onChange }) => {
    const [mode, setMode] = useState('normal'); // 'normal' | 'bullet' | 'numbered'

    const getNextPrefix = (text, m) => {
        if (m === 'bullet') return '• ';
        if (m === 'numbered') {
            const lines = text.split('\n');
            let count = 0;
            lines.forEach(l => { if (/^\d+\.\s/.test(l)) count++; });
            return `${count + 1}. `;
        }
        return '';
    };

    const handleChangeText = (newText) => {
        if (mode === 'normal') { onChange(newText); return; }
        const prev = value || '';
        if (newText.length > prev.length && newText.endsWith('\n')) {
            const prefix = getNextPrefix(newText, mode);
            onChange(newText + prefix);
        } else {
            onChange(newText);
        }
    };

    const switchMode = (newMode) => {
        if (newMode === mode) { setMode('normal'); return; }
        setMode(newMode);
        if (!value || value === '' || value.endsWith('\n')) {
            const prefix = newMode === 'bullet' ? '• ' : '1. ';
            onChange((value || '') + prefix);
        }
    };

    const ToolBtn = ({ label, icon, active, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.toolBtn,
                active && styles.toolBtnActive,
            ]}
            activeOpacity={0.75}
        >
            <MaterialIcons
                name={icon}
                size={18}
                color={active ? COLORS.gold : COLORS.emerald}
            />
            <Text style={[styles.toolBtnText, active && { color: COLORS.surface }]}>
                {label.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.toolbar}>
                <ToolBtn
                    label="Normal"
                    icon="text-fields"
                    active={mode === 'normal'}
                    onPress={() => setMode('normal')}
                />
                <View style={styles.toolDivider} />
                <ToolBtn
                    label="Bullet"
                    icon="format-list-bulleted"
                    active={mode === 'bullet'}
                    onPress={() => switchMode('bullet')}
                />
                <View style={styles.toolDivider} />
                <ToolBtn
                    label="Numbered"
                    icon="format-list-numbered"
                    active={mode === 'numbered'}
                    onPress={() => switchMode('numbered')}
                />
                {Platform.OS !== 'web' && (
                    <>
                        <View style={styles.toolDivider} />
                        <TouchableOpacity
                            onPress={() => Keyboard.dismiss()}
                            style={[styles.toolBtn, { backgroundColor: COLORS.goldLight, flex: 0.8, borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
                        >
                            <MaterialIcons name="keyboard-hide" size={18} color={COLORS.emerald} />
                            <Text style={styles.toolBtnText}>DONE</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <View style={styles.editorBox}>
                <TextInput
                    style={styles.editorInput}
                    placeholder="Describe activities, events, trainings, or notable occurrences..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={value}
                    onChangeText={handleChangeText}
                    multiline
                    numberOfLines={Platform.OS === 'web' ? 8 : 6}
                    textAlignVertical="top"
                    selectionColor={COLORS.emerald}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 4,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    toolBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
    },
    toolBtnActive: {
        backgroundColor: COLORS.emerald,
    },
    toolBtnText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.emerald,
        letterSpacing: 1,
    },
    toolDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#F1F5F9',
    },
    editorBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        minHeight: 160,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    editorInput: {
        flex: 1,
        padding: 16,
        fontSize: 15,
        color: COLORS.textPrimary,
        lineHeight: 24,
        minHeight: 160,
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
    },
});

export default ActivityEditor;
