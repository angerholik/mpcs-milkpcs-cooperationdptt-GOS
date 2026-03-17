import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { saveMpcsSubmission } from '../supabase';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import ActivityEditor from './ActivityEditor';
import { saveMpcsProfile, loadMpcsProfile, loadMpcsSocieties, addMpcsSociety, saveMpcsSocietyProfile, loadMpcsSocietyProfileByName } from '../utils/storage';


const COLORS = {
    emerald: '#064E3B',
    emeraldLight: '#047857',
    gold: '#D4AF37',
    goldLight: '#FBBF24',
    textHeader: '#F3F4F6',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    border: '#E2E8F0',
};

// Form Configuration Data 
const getFormSections = (formData, mpcsSocieties = []) => [
    {
        title: 'Section A: Cooperative Society Details',
        icon: 'business',
        ribbonColor: COLORS.emerald,
        fields: [
            ...(mpcsSocieties.length > 0 ? [{
                id: 'select_prev_society',
                label: 'Select Society (Previous Records)',
                fullWidth: true,
                options: mpcsSocieties
            }] : []),
            { id: '1.1', label: 'Name of Cooperative Society', icon: 'location-city', fullWidth: true, placeholder: 'Enter Name of Cooperative Society' },
            {
                id: '1.4', label: 'Registration Authority', icon: 'gavel', fullWidth: true, options: [
                    'Cooperation Department Gangtok',
                    'Cooperation Department Geyzing',
                    'Cooperation Department Mangan',
                    'Cooperation Department Namchi',
                    'Cooperation Department Pakyong',
                    'Cooperation Department Soreng'
                ]
            },
            { id: '1.5', label: 'Registration Number', icon: 'description', fullWidth: true, placeholder: 'Enter Registration Number' },
            { id: '1.6', label: 'Date of Registration', icon: 'event', type: 'date', fullWidth: true },
            { id: '1.8', label: 'PAN Card', icon: 'badge', fullWidth: true, placeholder: 'Enter PAN Number' },
        ]
    },
    {
        title: 'Section B: Office Bearers',
        icon: 'people-outline',
        ribbonColor: COLORS.gold,
        fields: [
            { id: '2.1', label: 'Name', icon: 'person', fullWidth: true, placeholder: 'Enter Name' },
            { id: '2.2', label: 'Designation', icon: 'assignment-ind', fullWidth: true, placeholder: 'Enter Designation' },
            { id: '2.3', label: 'Mobile Number (President)', icon: 'phone-android', numeric: true, fullWidth: true },
            { id: '2.4', label: 'Mobile Number (Manager)', icon: 'phone-iphone', numeric: true, fullWidth: true },
        ]
    },
    {
        id: 'section_d',
        title: 'Section C: Registered Caste Demographics',
        icon: 'groups',
        ribbonColor: '#1E3A8A',
        type: 'matrix', // New custom section type
        fields: [] // Fields will be handled by the matrix renderer
    },
    {
        title: 'Section D: Audit Details',
        icon: 'list-alt',
        ribbonColor: '#7C3AED',
        fields: [
            { 
                id: '4.1', 
                label: 'Financial Audit Status', 
                subLabel: 'Has the annual financial audit been completed?',
                type: 'switch', 
                fullWidth: true 
            },
            ...(formData['4.1'] === 'Yes' ? [
                { id: '4.2', label: 'Year of Latest Audit Completed', icon: 'calendar-check', numeric: true, fullWidth: true, placeholder: 'Enter Year (e.g. 2024)' },
                { id: '4.3', label: 'Category of Audit', icon: 'file-certificate', options: ['A', 'B', 'C', 'D'], fullWidth: true },
                { id: '4.4', label: 'Last Date of AGM', icon: 'calendar-multiselect', type: 'date', fullWidth: true },
            ] : [])
        ]
    },
    {
        title: 'Section E: Financial Performance',
        icon: 'trending-up',
        ribbonColor: '#059669',
        fields: [
            { id: '5.1', label: 'Annual Turnover (Rs)', icon: 'currency-rupee', numeric: true, prefix: '₹ ', placeholder: '0.00', fullWidth: true },
            { 
                id: '5.2', 
                label: 'Profitability Status', 
                subLabel: 'Declare if the Cooperative Society is currently profit-making',
                type: 'switch', 
                fullWidth: true 
            },
            { id: '5.3', label: `Net ${formData['5.2'] === 'No' ? 'Loss' : 'Profit'} for the year ${formData['4.2'] || 'YYYY'} (Rs)`, icon: 'bar-chart', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
        ]
    },
    {
        title: 'Section F: Supplemental',
        icon: 'credit-card',
        ribbonColor: '#DC2626',
        fields: [
            { 
                id: '8.0', 
                label: 'Active Loan Status', 
                subLabel: 'Declare if the cooperative holds institutional debt',
                type: 'switch', 
                fullWidth: true 
            },
            ...(formData['8.0'] === 'Yes' ? [
                { id: '8.1', label: 'Type of Loans', icon: 'list', fullWidth: true, placeholder: 'e.g. Working Capital' },
                { id: '8.2', label: 'Date of Loan Sanctioned', icon: 'history', type: 'date', fullWidth: true },
                { id: '8.3', label: 'Total number of Beneficiaries', icon: 'people-outline', numeric: true, fullWidth: true, placeholder: '0' },
                { id: '8.4', label: 'Total Loan extended in last FY (Rs)', icon: 'arrow-upward', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
                { id: '8.5', label: 'Total Loan recovered in last FY (Rs)', icon: 'arrow-downward', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
                { id: '8.6', label: 'Total Loan Outstanding in last FY (Rs)', icon: 'report-problem', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            ] : [])
        ]
    },
    {
        title: 'Section G: Dividend Details',
        icon: 'payments',
        ribbonColor: '#4F46E5',
        fields: [
            { 
                id: '6.1', 
                label: 'Dividend Distribution', 
                subLabel: 'Has Dividend been paid by the Cooperative Society?',
                type: 'switch', 
                fullWidth: true 
            },
            ...(formData['6.1'] === 'Yes' ? [
                { id: '6.2', label: 'Dividend rate paid (%)', icon: 'insights', numeric: true, prefix: '% ', fullWidth: true, placeholder: '0.0' },
                { id: '6.3', label: 'Dividend amount paid (Rs)', icon: 'payments', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' }
            ] : [])
        ]
    },
    {
        title: 'Section H: Bank Details',
        icon: 'account-balance',
        ribbonColor: '#0369A1',
        fields: [
            { id: '7.1', label: 'Type of Bank', icon: 'account-balance', fullWidth: true },
            { id: '7.2', label: 'Bank Name', icon: 'domain-verification', fullWidth: true },
            { id: '7.3', label: 'Bank Account Number', icon: 'pin', numeric: true, fullWidth: true },
            { id: '7.4', label: 'Bank IFSC Code', icon: 'fact-check', fullWidth: true },
            { id: '7.5', label: 'Bank Balance Amount (Rs)', icon: 'account-balance-wallet', numeric: true, prefix: '₹ ', fullWidth: true },
            { id: '7.6', label: 'Balance As On Date', icon: 'event', type: 'date', fullWidth: true },
        ]
    },
    {
        title: 'Section I: Monthly / Sales Deposits',
        icon: 'point-of-sale',
        ribbonColor: COLORS.gold,
        fields: [
            { id: '7.69', label: 'Year', icon: 'date-range', options: Array.from({ length: 26 }, (_, i) => (2010 + i).toString()), fullWidth: true },
            { id: '7.70', label: 'Select Month', icon: 'calendar-today', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fullWidth: true },
            { id: '7.71', label: `Deposit Amount for ${formData['7.70'] || 'Month'} (Rs)`, icon: 'storage', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '7.72', label: 'Total Deposits Till Date (Rs)', icon: 'functions', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
        ]
    },
    {
        title: 'Section J: Revenue & Share Capital',
        icon: 'show-chart',
        ribbonColor: '#D97706',
        fields: [
            { id: '8.7', label: 'Last FY Revenue from Non-Credit Activities', icon: 'trending-up', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '8.8', label: 'Authorised Share Capital (Rs)', icon: 'account-balance', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '8.9', label: 'Paid Up Share Capital (Rs)', icon: 'savings', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '8.10', label: 'Paid Up Share Capital Date', icon: 'event-available', type: 'date', fullWidth: true },
            { id: '8.11', label: 'Total Deposit (Rs)', icon: 'savings', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
        ]
    },
    {
        title: 'Section K: CSC Details',
        icon: 'dashboard',
        ribbonColor: '#0891B2',
        fields: [
            { 
                id: '9.1', 
                label: 'CSC Infrastructure', 
                subLabel: 'Does the PACS have a Common Service Centre?',
                type: 'switch', 
                fullWidth: true 
            },
            ...(formData['9.1'] === 'Yes' ? [
                { id: '9.2', label: 'CSC ID', icon: 'fingerprint', fullWidth: true, placeholder: 'Enter CSC ID' },
                { id: '9.3', label: 'PAN Card registered with CSC', icon: 'badge', fullWidth: true, placeholder: 'Enter PAN' },
                { id: '9.4', label: 'Aadhaar Card registered with CSC', icon: 'fingerprint', numeric: true, fullWidth: true, placeholder: 'Enter Aadhaar' },
                { id: '9.5', label: 'Registered Mobile Number with CSC', icon: 'settings-phone', numeric: true, fullWidth: true, placeholder: 'Enter Mobile' },
                { id: '9.6', label: 'Bank Account Number of CSC', icon: 'account-balance', numeric: true, fullWidth: true, placeholder: 'Enter Account Number' },
                { id: '9.7', label: 'CSC Email ID', icon: 'mail', fullWidth: true, placeholder: 'Enter Email' },
            ] : [])
        ]
    },
    {
        title: 'Section L: CSC Monthly Transactions',
        icon: 'sync',
        ribbonColor: '#6D28D9',
        fields: [
            { 
                id: '9.7z', 
                label: 'Active CSC Status', 
                subLabel: 'Confirm if CSC transactions were processed this month',
                type: 'switch', 
                fullWidth: true 
            },
            ...(formData['9.7z'] === 'Yes' ? [
                { id: '9.7a', label: 'Year', icon: 'date-range', options: Array.from({ length: 26 }, (_, i) => (2010 + i).toString()), fullWidth: true },
                { id: '9.8', label: 'Select Month', icon: 'calendar-today', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fullWidth: true },
                { id: '9.9', label: `Transaction Amount for ${formData['9.8'] || 'Month'} (Rs)`, icon: 'swap-horiz', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
                {
                    id: '9.10',
                    label: 'Total Transactions Till Date (Rs)',
                    icon: 'calculate',
                    numeric: true,
                    prefix: '₹ ',
                    fullWidth: true,
                    readOnly: true,
                    isTotal: true,
                    computedValue: (parseFloat(formData['9.9']) || 0).toLocaleString('en-IN')
                },
            ] : [])
        ]
    },
    {
        title: 'Section M: Activities / Events Log',
        icon: 'star',
        ribbonColor: '#7C3AED',
        fields: [
            { id: 'activities', label: 'Activities Log', type: 'activity', fullWidth: true },
        ]
    }
];

const FieldInput = ({ field, formData, handleChange }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    if (field.type === 'activity') {
        return (
            <View style={{ marginTop: 5 }}>
                <ActivityEditor
                    value={formData[field.id] || ''}
                    onChange={(v) => handleChange(field.id, v)}
                />
            </View>
        );
    }

    if (field.type === 'switch') {
        const isActive = formData[field.id] === 'Yes';
        return (
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => handleChange(field.id, isActive ? 'No' : 'Yes')}
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: isActive ? COLORS.emerald : '#E2E8F0',
                    padding: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: isActive ? COLORS.emerald : '#000',
                    shadowOffset: { width: 0, height: isActive ? 8 : 2 },
                    shadowOpacity: isActive ? 0.25 : 0.05,
                    shadowRadius: 12,
                    elevation: isActive ? 8 : 2,
                }}
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.3 }}>{field.label}</Text>
                    {field.subLabel && <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 14 }}>{field.subLabel}</Text>}
                </View>
                <View style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isActive ? COLORS.emerald : '#E2E8F0',
                    padding: 2,
                    justifyContent: 'center',
                }}>
                    <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#FFF',
                        transform: [{ translateX: isActive ? 20 : 0 }],
                    }} />
                </View>
            </TouchableOpacity>
        );
    }

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const formattedDate = selectedDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            handleChange(field.id, formattedDate);
        }
    };

    return (
        <View style={styles.floatingInputWrapper}>
            <Text style={styles.floatingInputLabel}>{field.label}</Text>
            {field.type === 'date' ? (
                <View style={[styles.floatingInputInner, { overflow: 'hidden' }]}>
                    <View style={styles.floatingIcon}>
                        <MaterialIcons name="event" size={18} color={COLORS.emerald} />
                    </View>
                    <Text style={[styles.floatingInputField, { lineHeight: Platform.OS === 'ios' ? 48 : 45, paddingTop: Platform.OS === 'ios' ? 0 : 0, color: formData[field.id] ? COLORS.textPrimary : COLORS.textSecondary }]}>
                        {formData[field.id] || 'Select Date...'}
                    </Text>
                    
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                opacity: 0,
                                width: '100%',
                                cursor: 'pointer',
                            }}
                            onChange={(e) => {
                                const d = new Date(e.target.value);
                                if (!isNaN(d.getTime())) {
                                    const formattedDate = d.toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    });
                                    handleChange(field.id, formattedDate);
                                }
                            }}
                        />
                    ) : (
                        <TouchableOpacity
                            style={{ ...StyleSheet.absoluteFillObject }}
                            onPress={() => setShowDatePicker(true)}
                        />
                    )}

                    {!Platform.OS === 'web' && showDatePicker && (
                        <DateTimePicker
                            value={formData[field.id] ? (function(){
                                const parts = formData[field.id].split('/');
                                if(parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                return new Date();
                            })() : new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                        />
                    )}
                </View>
            ) : field.type === 'radio' && field.options ? (
                    <View style={[styles.floatingInputInner, { paddingHorizontal: 4, paddingVertical: 4, backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', borderStyle: 'solid', borderWidth: 1.5 }]}>
                        {field.options.map((opt, i) => {
                            const isSelected = formData[field.id] === opt;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', borderRadius: 8, marginHorizontal: 2 },
                                        isSelected && { backgroundColor: COLORS.emerald, shadowColor: COLORS.emeraldLight, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }
                                    ]}
                                    onPress={() => handleChange(field.id, opt)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? COLORS.gold : COLORS.textSecondary, letterSpacing: 0.5 }}>{opt.toUpperCase()}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : field.options ? (
                    <View style={[styles.floatingInputInner, { height: 60, paddingVertical: 4 }]}>
                        {field.icon && (
                            <View style={styles.floatingIcon}>
                                <MaterialIcons name={
                                    field.icon === 'office-building' ? 'location-city' :
                                    field.icon === 'gavel' ? 'gavel' :
                                    field.icon === 'file-certificate' ? 'description' :
                                    field.icon === 'calendar' ? 'event' :
                                    field.icon === 'card-account-details' ? 'badge' :
                                    field.icon === 'account' ? 'person' :
                                    field.icon === 'badge-account' ? 'assignment-ind' :
                                    field.icon === 'phone' ? 'phone' :
                                    field.icon === 'account-group' ? 'groups' :
                                    field.icon === 'file-document-outline' ? 'list-alt' :
                                    field.icon === 'show-chart' ? 'trending-up' :
                                    field.icon === 'bank' ? 'account-balance' :
                                    field.icon === 'wallet' ? 'account-balance-wallet' :
                                    field.icon === 'cash-multiple' ? 'payments' :
                                    field.icon
                                } size={18} color={COLORS.emerald} />
                            </View>
                        )}
                        <Picker
                            selectedValue={formData[field.id] || ''}
                            onValueChange={(v) => handleChange(field.id, v)}
                            style={[
                                styles.pickerNative, 
                                { flex: 1, height: 60 },
                                Platform.OS !== 'web' && { 
                                    marginLeft: -16, // Pull text tighter to icon for mobile
                                    marginTop: -2    // Better baseline match
                                }
                            ]}
                        >
                            <Picker.Item label={`Select...`} value="" color={COLORS.textSecondary} />
                            {field.options.map((opt, i) => (
                                <Picker.Item key={i} label={opt} value={opt} color={COLORS.emerald} />
                            ))}
                        </Picker>
                    </View>
                ) : (
                    <View style={[
                        styles.floatingInputInner, 
                        field.readOnly && styles.readOnlyField,
                        field.isTotal && styles.premiumSummaryCard
                    ]}>
                        {(field.readOnly || field.isTotal) ? (
                            <LinearGradient
                                colors={field.isTotal ? ['#ECFDF5', '#D1FAE5'] : ['#F0FDF4', '#DCFCE7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    borderRadius: field.isTotal ? 20 : 16,
                                }}
                            />
                        ) : null}
                        {field.icon && (
                            <View style={[styles.floatingIcon, field.isTotal && styles.totalIconBox]}>
                                <MaterialIcons 
                                    name={
                                        field.icon === 'currency-inr' ? 'currency-rupee' :
                                        field.icon === 'chart-areaspline' ? 'show-chart' :
                                        field.icon === 'file-certificate' ? 'description' :
                                        field.icon === 'calendar' ? 'event' :
                                        field.icon === 'account' ? 'person' :
                                        field.icon === 'bank' ? 'account-balance' :
                                        field.icon === 'wallet' ? 'account-balance-wallet' :
                                        field.icon === 'database-import' ? 'storage' :
                                        field.icon === 'sigma' ? 'functions' :
                                        field.icon === 'finance' ? 'trending-up' :
                                        field.icon === 'bank-transfer' ? 'account-balance' :
                                        field.icon === 'safe-square' ? 'savings' :
                                        field.icon === 'piggy-bank' ? 'savings' :
                                        field.icon === 'identifier' ? 'fingerprint' :
                                        field.icon === 'card-account-details' ? 'badge' :
                                        field.icon === 'phone-settings' ? 'settings-phone' :
                                        field.icon === 'bank-outline' ? 'account-balance' :
                                        field.icon === 'email' ? 'mail' :
                                        field.icon === 'swap-horizontal' ? 'swap-horiz' :
                                        field.icon === 'calculator' ? 'calculate' :
                                        field.icon
                                    } 
                                    size={field.isTotal ? 22 : 18} 
                                    color={COLORS.emerald} 
                                />
                            </View>
                        )}
                        {field.prefix && <Text style={[
                            styles.inputPrefixText, 
                            (field.readOnly || field.isTotal) && { color: COLORS.emerald, fontWeight: '900', fontSize: 18 }
                        ]}>{field.prefix}</Text>}
                        <TextInput
                            style={[
                                styles.floatingInputField, 
                                (field.readOnly || field.isTotal) && { color: COLORS.emerald, fontWeight: '900', fontSize: 20 }
                            ]}
                            placeholder={field.placeholder}
                            placeholderTextColor="#94A3B8"
                            value={field.computedValue !== undefined ? field.computedValue.toString() : (formData[field.id] || '')}
                            onChangeText={(v) => !field.readOnly && handleChange(field.id, v)}
                            keyboardType={field.numeric ? "numeric" : "default"}
                            selectionColor={COLORS.emerald}
                            editable={!field.readOnly}
                        />
                    </View>
                )}
            </View>
        );
};

export default function MPCSForm({ onComplete }) {
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [mpcsSocieties, setMpcsSocieties] = useState([]);

    useEffect(() => {
        (async () => {
            const savedProfile = await loadMpcsProfile();
            if (savedProfile) {
                setFormData(prev => ({ ...prev, ...savedProfile }));
            }
            const societies = await loadMpcsSocieties();
            setMpcsSocieties(societies);
        })();
    }, []);

    const handleChange = async (id, value) => {
        if (id === 'select_prev_society') {
            if (value) {
                const profile = await loadMpcsSocietyProfileByName(value);
                if (profile) {
                    setFormData(prev => ({ ...prev, ...profile, 'select_prev_society': value }));
                } else {
                    setFormData(prev => ({ ...prev, '1.1': value, [id]: value }));
                }
            }
            return;
        }
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const DemographicMatrix = () => {
        const rows = [
            { id: '1', label: 'SC', color: '#3B82F6', icon: 'shield-account' },
            { id: '3', label: 'ST', color: '#8B5CF6', icon: 'account-child' },
            { id: '5', label: 'OBC', color: '#F59E0B', icon: 'account-star' },
            { id: '7', label: 'GEN', color: '#10B981', icon: 'account-check' },
        ];

        const totalMale = [1,3,5,7].reduce((sum, i) => sum + (parseInt(formData[`3.${i}`]) || 0), 0);
        const totalFemale = [2,4,6,8].reduce((sum, i) => sum + (parseInt(formData[`3.${i}`]) || 0), 0);
        const totalMembers = totalMale + totalFemale;
        const totals = { totalMale, totalFemale, totalMembers };

        return (
            <View style={styles.ledgerContainer}>
                {/* Header: Zero-Weight Architectural */}
                <View style={styles.ledgerHeader}>
                    <Text style={[styles.ledgerHeaderLabel, { flex: 1.5 }]}>REGISTRY</Text>
                    <View style={styles.ledgerColumnHeader}>
                        <MaterialIcons name="person" size={14} color="#94A3B8" />
                        <Text style={styles.ledgerHeaderLabel}>MALE</Text>
                    </View>
                    <View style={styles.ledgerColumnHeader}>
                        <MaterialIcons name="person" size={14} color="#94A3B8" />
                        <Text style={styles.ledgerHeaderLabel}>FEMALE</Text>
                    </View>
                    <Text style={[styles.ledgerHeaderLabel, { textAlign: 'right', width: 55 }]}>TOTAL</Text>
                </View>

                {rows.map((row, idx) => {
                    const mId = `3.${row.id}`;
                    const fId = `3.${parseInt(row.id) + 1}`;
                    const rowTotal = (parseInt(formData[mId]) || 0) + (parseInt(formData[fId]) || 0);
                    return (
                        <View key={row.id} style={styles.ledgerRow}>
                            <View style={styles.categoryCell}>
                                <Text style={styles.ledgerCategoryText}>{row.label}</Text>
                            </View>
                            
                            <View style={[styles.inputCell, styles.vDividerHair]}>
                                <TextInput
                                    style={styles.ledgerInput}
                                    keyboardType="numeric"
                                    value={formData[mId] || ''}
                                    onChangeText={(v) => handleChange(mId, v)}
                                    placeholder="0"
                                    placeholderTextColor="#E2E8F0"
                                    selectionColor={COLORS.emerald}
                                />
                            </View>
                            
                            <View style={[styles.inputCell, styles.vDividerHair]}>
                                <TextInput
                                    style={styles.ledgerInput}
                                    keyboardType="numeric"
                                    value={formData[fId] || ''}
                                    onChangeText={(v) => handleChange(fId, v)}
                                    placeholder="0"
                                    placeholderTextColor="#E2E8F0"
                                    selectionColor={COLORS.emerald}
                                />
                            </View>

                            <View style={[styles.rowTotalCell, styles.vDividerHair]}>
                                <Text style={styles.rowTotalText}>{rowTotal || '0'}</Text>
                            </View>
                        </View>
                    );
                })}

                {/* Footer: Fluid Summary */}
                <View style={styles.ledgerFooter}>
                     <Text style={styles.ledgerFooterLabel}>SUMMARY</Text>
                     <View style={[styles.footerValBox, styles.vDividerHair]}>
                        <Text style={styles.footerValText}>{totals.totalMale}</Text>
                     </View>
                     <View style={[styles.footerValBox, styles.vDividerHair]}>
                        <Text style={styles.footerValText}>{totals.totalFemale}</Text>
                     </View>
                     <View style={[styles.grandTotalPill, { marginLeft: 15 }]}>
                        <Text style={styles.grandTotalPillText}>{totals.totalMembers}</Text>
                     </View>
                </View>
            </View>
        );
    };

    const handleSave = async () => {
        const errors = [];
        if (!formData['1.1'] || !formData['1.1'].trim()) errors.push("Name of Cooperative Society");
        if (!formData['1.4']) errors.push("Registration Authority");
        if (!formData['1.5'] || !formData['1.5'].trim()) errors.push("Registration Number");

        if (errors.length > 0) {
            const msg = 'Please fill in the following before saving:\n\n• ' + errors.join('\n• ');
            if (Platform.OS === 'web') {
                alert('Required Fields\n\n' + msg);
            } else {
                Alert.alert('Required Fields', msg, [{ text: 'OK' }]);
            }
            return;
        }
        setSaving(true);
        try {
            const { error } = await saveMpcsSubmission(formData);
            if (error) {
                console.error('MPCS save error:', JSON.stringify(error));
                const errMsg = `Could not save to cloud: ${error.message || error.code}\nCheck that the mpcs_submissions table exists in Supabase.`;
                if (Platform.OS === 'web') {
                    alert('⚠️ Save Failed\n\n' + errMsg);
                } else {
                    Alert.alert('⚠️ Save Failed', errMsg, [{ text: 'OK' }]);
                }
            } else {
                if (Platform.OS === 'web') {
                    alert('✅ Saved\n\nMPCS return data saved successfully to the cloud dashboard!');
                } else {
                    Alert.alert('✅ Saved', 'MPCS return data saved successfully to the cloud dashboard!', [{ text: 'OK' }]);
                }
                // Save static profile for the next time
                saveMpcsProfile(formData);
                const sName = formData['1.1'];
                if (sName && sName.trim()) {
                    const cleanName = sName.trim();
                    saveMpcsSocietyProfile(cleanName, formData);
                    addMpcsSociety(cleanName).then(updated => {
                        if (updated) setMpcsSocieties(updated);
                    });
                }
                // Instead of clearing everything, we reload the static profile 
                // so the user doesn't have to re-enter Society Name, Authority, etc.
                loadMpcsProfile().then(profile => {
                    setFormData(profile || {});
                });
                if (onComplete) onComplete(formData);
            }
        } catch (e) {
            console.error('MPCS save exception:', e);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {getFormSections(formData, mpcsSocieties).map((section, idx) => (
                <View key={idx} style={styles.card}>
                    <View style={[styles.cardRibbon, section.ribbonColor && { backgroundColor: section.ribbonColor }]} />
                    <View style={styles.cardHeader}>
                        <MaterialIcons name={section.icon || 'description'} size={24} color={COLORS.emerald} />
                        <Text style={styles.cardTitle}>{section.title}</Text>
                    </View>
                    {section.type === 'matrix' ? (
                        <DemographicMatrix />
                    ) : (
                        <View style={styles.grid}>
                            {section.fields.map(field => {
                                const compactWidth = section.compact
                                    ? (Platform.OS === 'web' ? '15.5%' : '31%')
                                    : '48%';

                                return (
                                    <View key={field.id} style={[styles.gridInput, { width: compactWidth }, field.fullWidth && { width: '100%' }]}>
                                        <FieldInput field={field} formData={formData} handleChange={handleChange} />
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            ))}

            <View style={{ marginBottom: 40, marginTop: 10 }}>
                <TouchableOpacity activeOpacity={0.9} onPress={handleSave}>
                    <LinearGradient
                        colors={[COLORS.emeraldLight, COLORS.emerald]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.forgeButton}
                    >
                        <View style={styles.forgeInnerBox}>
                                <MaterialIcons name="cloud-done" size={28} color={COLORS.goldLight} />
                                <View style={styles.forgeTextCol}>
                                    <Text style={styles.forgeButtonMainText}>
                                        {saving ? 'SAVING...' : 'SAVE PORTAL DATA'}
                                    </Text>
                                    <Text style={styles.forgeButtonSubText}>
                                        {saving ? 'Uploading to cloud...' : 'Records saved to admin dashboard.'}
                                    </Text>
                                </View>
                                {saving && <ActivityIndicator color={COLORS.goldLight} size="small" style={{ marginLeft: 8 }} />}
                            </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    cardRibbon: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: COLORS.emerald,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 21,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontWeight: '900',
        color: COLORS.emerald,
        marginLeft: 10,
        letterSpacing: 0.2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    gridInput: {
        width: Platform.OS === 'web' ? '48%' : '100%',
        marginBottom: 22,
    },
    floatingInputWrapper: {
        marginBottom: 0,
    },
    floatingInputLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 0,
    },
    floatingInputInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderBottomWidth: 1.5,
        borderBottomColor: '#E2E8F0',
        borderRadius: 0,
        height: 48,
        paddingHorizontal: 0,
    },
    floatingIcon: {
        marginRight: 8,
        backgroundColor: 'transparent',
    },
    totalIconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    premiumSummaryCard: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D1FAE5',
        borderWidth: 1,
        borderRadius: 20,
        height: 72,
        paddingHorizontal: 16,
        borderBottomWidth: 1, 
    },
    readOnlyField: {
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.emeraldLight,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        borderBottomWidth: 1,
    },
    inputPrefixText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '700',
        marginRight: 4,
    },
    floatingInputField: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        height: '100%',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' })
    },
    pickerNative: {
        width: '100%',
        height: Platform.OS === 'web' ? '100%' : 48,
        color: '#064E3B',
        fontWeight: '800',
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 16,
        paddingHorizontal: 0,
        ...(Platform.OS === 'web' && { outlineStyle: 'none', appearance: 'none' })
    },
    pickerArrowOverlay: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        pointerEvents: 'none',
    },
    forgeButton: {
        borderRadius: 20,
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        padding: 3,
    },
    forgeInnerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 17,
    },
    forgeTextCol: {
        flex: 1,
        marginLeft: 16,
    },
    forgeButtonMainText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    forgeButtonSubText: {
        color: COLORS.goldLight,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    // Ledger Styles (Modern Professional Table)
    ledgerContainer: {
        marginTop: 10,
        overflow: 'hidden',
    },
    ledgerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    ledgerColumnHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ledgerHeaderLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginLeft: 4,
    },
    ledgerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    categoryCell: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ledgerCategoryIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    ledgerCategoryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    inputCell: {
        flex: 1,
        alignItems: 'center',
    },
    ledgerInput: {
        width: '90%',
        height: 38,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.emerald,
        paddingBottom: 2,
    },
    rowTotalCell: {
        width: 55,
        alignItems: 'flex-end',
    },
    rowTotalText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.emeraldLight,
        opacity: 0.3,
    },
    ledgerFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ECFDF5',
    },
    ledgerFooterLabel: {
        flex: 1.5,
        fontSize: 11,
        fontWeight: '900',
        color: COLORS.emerald,
        letterSpacing: 0.5,
    },
    footerValBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    footerValText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    grandTotalPill: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 45,
        alignItems: 'center',
    },
    grandTotalPillText: {
        color: COLORS.emerald,
        fontSize: 15,
        fontWeight: '900',
    },
    // Ledger Refinements
    vDividerLight: {
        borderLeftWidth: 1,
        borderLeftColor: '#E2E8F0',
    },
    vDividerFaint: {
        borderLeftWidth: 1,
        borderLeftColor: '#F1F5F9',
    },
    footerLabelGroup: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerGoldTag: {
        width: 3,
        height: 14,
        backgroundColor: COLORS.gold,
        borderRadius: 2,
        marginRight: 6,
    },
    vDividerHair: {
        borderLeftWidth: 1,
        borderLeftColor: '#F1F5F9',
    },
    footerValSubText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginLeft: 8,
        letterSpacing: 0.5,
    }
});
