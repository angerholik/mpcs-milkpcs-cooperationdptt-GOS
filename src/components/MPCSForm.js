import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { saveMpcsSubmission, uploadEvidence } from '../supabase';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import ActivityEditor from './ActivityEditor';
import { saveMpcsProfile, loadMpcsProfile, loadMpcsSocieties, addMpcsSociety, saveMpcsSocietyProfile, loadMpcsSocietyProfileByName } from '../utils/storage';


const COLORS = {
    emerald: '#7C1C1C',
    emeraldLight: '#991B1B',
    gold: '#B45309',
    goldLight: '#D97706',
    textHeader: '#F3F4F6',
    textPrimary: '#450A0A',
    textSecondary: '#7F1D1D',
    surface: '#FFFFFF',
    background: '#F8F5F2',
    border: '#E2E8F0',
};

// Digital Evidence Component for MPCS
const DigitalEvidenceCapture = ({ formData, handleChange }) => {
    const [capturing, setCapturing] = useState(false);
    const imageUri = formData['evidence_image_uri'];
    const timestamp = formData['evidence_timestamp'];
    const lat = formData['latitude'];
    const lng = formData['longitude'];

    const captureImage = async () => {
        setCapturing(true);
        try {
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (result.canceled) {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                    base64: true,
                });
            }

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const now = new Date();
                const formattedTime = now.toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                let loc = null;
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                        loc = {
                            latitude: currentLoc.coords.latitude,
                            longitude: currentLoc.coords.longitude,
                        };
                    }
                } catch (locErr) {
                    console.warn('Location fetching warning:', locErr);
                }

                handleChange('evidence_image_uri', asset.uri);
                if (asset.base64) {
                    handleChange('evidence_image_base64', asset.base64);
                }
                handleChange('evidence_timestamp', formattedTime);
                if (loc) {
                    handleChange('latitude', loc.latitude);
                    handleChange('longitude', loc.longitude);
                }
            }
        } catch (error) {
            console.error('Camera/Location capture error:', error);
            if (Platform.OS === 'web') {
                alert('Verification capture failed. Please try choosing a photo from library or check permissions.');
            } else {
                Alert.alert('Capture Error', 'Verification capture failed. Please try again.');
            }
        } finally {
            setCapturing(false);
        }
    };

    return (
        <View style={styles.evidenceContainer}>
            {!imageUri ? (
                <TouchableOpacity style={styles.evidenceDropzone} onPress={captureImage} activeOpacity={0.75} disabled={capturing}>
                    {capturing ? (
                        <ActivityIndicator size="large" color={COLORS.emerald} />
                    ) : (
                        <>
                            <View style={styles.dropzoneCircle}>
                                <MaterialIcons name="add-a-photo" size={36} color={COLORS.emerald} />
                            </View>
                            <Text style={styles.dropzoneTitle}>Initialize Camera Sensor</Text>
                            <Text style={styles.dropzoneSub}>Secure GPS geotag locking required upon capture</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.evidenceSnapshotBox}>
                    <Image source={{ uri: imageUri }} style={styles.evidenceImage} />
                    <LinearGradient colors={['transparent', 'rgba(124,28,28,0.92)']} style={styles.evidenceOverlay}>
                        <View style={styles.evidenceMetaData}>
                            <View style={styles.metaBadge}>
                                <MaterialIcons name="satellite" size={14} color={COLORS.gold} />
                                <Text style={styles.metaBadgeText}>GPS LOCKED</Text>
                            </View>
                            <Text style={styles.metaTextLatLong}>
                                {lat && lng ? `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}` : 'Location Locked'}
                            </Text>
                            <Text style={styles.metaTextTime}>{timestamp || 'Timestamp recorded'}</Text>
                        </View>
                        <TouchableOpacity style={styles.recaptureBtn} onPress={captureImage} activeOpacity={0.8}>
                            <MaterialIcons name="refresh" size={20} color={COLORS.surface} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}
        </View>
    );
};

// Form Configuration Data 
const getFormSections = (formData, mpcsSocieties = []) => [
    {
        id: 'section_evidence',
        title: 'Section A: Digital Evidence',
        icon: 'camera-enhance',
        ribbonColor: COLORS.emerald,
        type: 'evidence',
        fields: []
    },
    {
        title: 'Section B: Cooperative Society Details',
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
            { id: '1.5', label: 'Registration Number', icon: 'description', fullWidth: true, placeholder: 'Enter Registration Number' },
            { id: '1.6', label: 'Date of Registration', icon: 'event', type: 'date', fullWidth: true },
            { id: '1.8', label: 'PAN Card Number', icon: 'badge', fullWidth: true, placeholder: 'Enter PAN Number' },
        ]
    },
    {
        title: 'Section C: Office Bearers',
        icon: 'people-outline',
        ribbonColor: COLORS.gold,
        fields: [
            { id: '2.1', label: 'President Name', icon: 'person', fullWidth: true, placeholder: 'Enter President Name' },
            { id: '2.3', label: 'President Mobile Number', icon: 'phone-android', numeric: true, fullWidth: true, placeholder: 'Enter President Mobile Number' },
            { id: '2.2', label: 'Manager Name', icon: 'badge', fullWidth: true, placeholder: 'Enter Manager Name' },
            { id: '2.4', label: 'Manager Mobile Number', icon: 'phone-iphone', numeric: true, fullWidth: true, placeholder: 'Enter Manager Mobile Number' },
        ]
    },
    {
        id: 'section_d',
        title: 'Section D: Registered Caste Demographics',
        icon: 'groups',
        ribbonColor: '#1E3A8A',
        type: 'matrix',
        fields: []
    },
    {
        title: 'Section E: Audit & AGM Details',
        icon: 'list-alt',
        ribbonColor: '#7C3AED',
        fields: [
            { id: '4.1', label: 'Latest Audit Conducted Date', icon: 'event', type: 'date', fullWidth: true, placeholder: 'Select/Enter Date of latest audit (e.g. 15/03/2025)' },
            { id: '4.2', label: 'Audit Year', icon: 'event-available', numeric: true, fullWidth: true, placeholder: 'Enter Year (e.g. 2025)' },
            { id: '4.3', label: 'Audit Category', icon: 'description', options: ['A', 'B', 'C', 'D'], fullWidth: true },
            { id: '4.4', label: 'Latest AGM Conducted Date', icon: 'date-range', type: 'date', fullWidth: true, placeholder: 'Select/Enter Date of latest AGM (e.g. 20/04/2025)' },
        ]
    },
    {
        title: 'Section F: Financial Performance',
        icon: 'trending-up',
        ribbonColor: '#7C1C1C',
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
        title: 'Section H: Dividend Details',
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
                { id: '6.3', label: 'Dividend amount paid (Rs)', icon: 'payments', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
                { id: '6.4', label: 'Dividend Distribution Date', icon: 'event', type: 'date', fullWidth: true }
            ] : [])
        ]
    },
    {
        title: 'Section I: Bank Details',
        icon: 'account-balance',
        ribbonColor: '#0369A1',
        fields: [
            { id: '7.2', label: 'Bank Name', icon: 'account-balance', fullWidth: true, placeholder: 'Enter Bank Name' },
            { id: '7.5', label: 'Bank Balance Amount (Rs)', icon: 'account-balance-wallet', numeric: true, prefix: '₹ ', fullWidth: true },
            { id: '7.6', label: 'Balance As On Date', icon: 'event', type: 'date', fullWidth: true },
        ]
    },
    {
        id: 'section_j',
        title: 'Section J: Monthly / Sales Deposits',
        icon: 'point-of-sale',
        ribbonColor: COLORS.gold,
        fields: [
            { id: '7.70', label: 'Select Month', icon: 'calendar-today', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fullWidth: true },
            { id: '7.71', label: `Deposit Amount for ${formData['7.70'] || 'Month'} (Rs)`, icon: 'storage', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
        ]
    },
    {
        id: 'section_k',
        title: 'Section K: Revenue & Share Capital',
        icon: 'show-chart',
        ribbonColor: '#D97706',
        fields: [
            { id: '8.8', label: 'Authorised Share Capital (Rs)', icon: 'account-balance', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '8.9', label: 'Paid Up Share Capital (Rs)', icon: 'savings', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '8.10', label: 'Paid Up Share Capital Date', icon: 'event-available', type: 'date', fullWidth: true },
            { id: '8.11', label: 'Total Bank Deposit (Rs)', icon: 'savings', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
        ]
    },
    {
        id: 'section_l',
        title: 'Section L: Monthly Business Performance',
        icon: 'shopping-cart',
        ribbonColor: '#10B981',
        fields: [
            { id: '8.12', label: 'Select Month', icon: 'calendar-today', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fullWidth: true },
            { id: '8.13', label: `Total Purchases for ${formData['8.12'] || 'Month'} (Rs)`, icon: 'shopping-bag', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
            { id: '8.14', label: `Total Sales for ${formData['8.12'] || 'Month'} (Rs)`, icon: 'trending-up', numeric: true, prefix: '₹ ', fullWidth: true, placeholder: '0.00' },
        ]
    },
    {
        id: 'section_m',
        title: 'Section M: CSC Details',
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
        id: 'section_n',
        title: 'Section N: CSC Monthly Transactions',
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
        id: 'section_o',
        title: 'Section O: Activities / Events Log',
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

    if (field.type === 'image') {
        const hasImage = !!formData[field.id];
        const pickImage = async () => {
            try {
                let result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                    base64: true,
                });

                if (!result.canceled) {
                    handleChange(field.id, result.assets[0].uri);
                    // If you need base64 for supabase, you might need a secondary field or object structure
                }
            } catch (error) {
                Alert.alert('Camera Error', 'Could not open camera.');
            }
        };

        return (
            <View style={{ marginBottom: 15 }}>
                <Text style={styles.floatingInputLabel}>{field.label}</Text>
                <TouchableOpacity 
                    onPress={pickImage}
                    style={{
                        height: 120,
                        backgroundColor: '#F8F5F2',
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: hasImage ? COLORS.emerald : '#E2E8F0',
                        borderStyle: hasImage ? 'solid' : 'dashed',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {hasImage ? (
                        <Image source={{ uri: formData[field.id] }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <MaterialIcons name="add-a-photo" size={32} color={COLORS.emerald} />
                            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: '700' }}>TAP TO CAPTURE</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
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
                <View style={[styles.floatingInputInner, { overflow: 'hidden', position: 'relative' }]}>
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => {
                            if (Platform.OS !== 'web') setShowDatePicker(true);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, height: '100%' }}
                    >
                        <View style={styles.floatingIcon}>
                            <MaterialIcons name={field.icon === 'date-range' ? 'date-range' : field.icon === 'event-available' ? 'event-available' : 'event'} size={18} color={COLORS.emerald} />
                        </View>
                        <TextInput
                            style={[styles.floatingInputField, { color: COLORS.textPrimary }]}
                            value={formData[field.id] || ''}
                            placeholder={field.placeholder || "DD/MM/YYYY or click calendar"}
                            placeholderTextColor={COLORS.textSecondary}
                            onChangeText={(text) => handleChange(field.id, text)}
                        />
                    </TouchableOpacity>

                    {Platform.OS === 'web' && (
                        <input
                            type="date"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                zIndex: 100,
                            }}
                            onClick={(e) => {
                                if (e.target && e.target.showPicker) {
                                    try { e.target.showPicker(); } catch(err) {}
                                }
                            }}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const parts = e.target.value.split('-');
                                    if (parts.length === 3) {
                                        handleChange(field.id, `${parts[2]}/${parts[1]}/${parts[0]}`);
                                    }
                                }
                            }}
                        />
                    )}

                    {Platform.OS !== 'web' && showDatePicker && (
                        <DateTimePicker
                            value={(function(){
                                const val = formData[field.id];
                                if(!val) return new Date();
                                if(typeof val === 'string' && val.includes('/')) {
                                    const parts = val.split('/');
                                    if(parts.length === 3) {
                                        const d = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, y = parseInt(parts[2], 10);
                                        if(!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1900) return new Date(y, m, d);
                                    }
                                }
                                const dt = new Date(val);
                                return !isNaN(dt.getTime()) ? dt : new Date();
                            })()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                        />
                    )}
                </View>
            ) : field.type === 'radio' && field.options ? (
                    <View style={[styles.floatingInputInner, { paddingHorizontal: 4, paddingVertical: 4, backgroundColor: '#F8F5F2', borderColor: '#CBD5E1', borderStyle: 'solid', borderWidth: 1.5 }]}>
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
                    <View style={[styles.floatingInputInner, { height: 60, paddingVertical: 4, position: 'relative' }]}>
                        {field.icon && (
                        <View style={styles.floatingIcon} pointerEvents="none">
                            <MaterialIcons name={
                                field.icon === 'office-building' ? 'location-city' :
                                field.icon === 'gavel' ? 'gavel' :
                                field.icon === 'file-certificate' ? 'description' :
                                field.icon === 'calendar' ? 'event' :
                                field.icon === 'calendar-check' ? 'event-available' :
                                field.icon === 'calendar-multiselect' ? 'date-range' :
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
                                (field.icon || 'description')
                            } size={18} color={COLORS.emerald} />
                        </View>
                    )}
                    <Picker
                        selectedValue={formData[field.id] || ''}
                        onValueChange={(v) => handleChange(field.id, v)}
                        style={[
                            styles.pickerNative, 
                            { 
                                flex: 1, 
                                height: 60,
                                width: '100%',
                                position: Platform.OS === 'web' ? 'absolute' : 'relative',
                                opacity: Platform.OS === 'web' ? 0 : 1,
                                zIndex: 10,
                            },
                            Platform.OS === 'web' && { top: 0, left: 0, right: 0, bottom: 0 },
                            Platform.OS !== 'web' && { 
                                marginLeft: -16, // Pull text tighter to icon for mobile
                                marginTop: -2    // Better baseline match
                            }
                        ]}
                    >
                        <Picker.Item label={`Select ${field.label}...`} value="" color={COLORS.textSecondary} />
                        {field.options.map((opt, i) => (
                            <Picker.Item key={i} label={opt} value={opt} color={COLORS.emerald} />
                        ))}
                    </Picker>
                    {Platform.OS === 'web' && (
                        <Text 
                            pointerEvents="none"
                            style={[styles.floatingInputField, { flex: 1, marginLeft: 38, lineHeight: 60, color: formData[field.id] ? COLORS.textPrimary : COLORS.textSecondary }]}>
                            {formData[field.id] || `Select ${field.label}...`}
                        </Text>
                    )}
                    </View>
                ) : (
                    <View style={[
                        styles.floatingInputInner, 
                        field.readOnly && styles.readOnlyField,
                        field.isTotal && styles.premiumSummaryCard
                    ]}>
                        {(field.readOnly || field.isTotal) ? (
                            <LinearGradient
                                colors={field.isTotal ? ['#FEE2E2', '#FECACA'] : ['#F9FAFB', '#F3F4F6']}
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

const DemographicMatrix = ({ formData, handleChange }) => {
    const rows = [
        { id: '1', label: 'SC', color: '#3B82F6', icon: 'shield-account' },
        { id: '3', label: 'ST', color: '#8B5CF6', icon: 'account-child' },
        { id: '5', label: 'OBC', color: '#F59E0B', icon: 'account-star' },
        { id: '7', label: 'GEN', color: '#7C1C1C', icon: 'account-check' },
    ];

    const totalMale = [1, 3, 5, 7].reduce((sum, i) => sum + (parseInt(formData[`3.${i}`]) || 0), 0);
    const totalFemale = [2, 4, 6, 8].reduce((sum, i) => sum + (parseInt(formData[`3.${i}`]) || 0), 0);
    const totalMembers = totalMale + totalFemale;
    const totals = { totalMale, totalFemale, totalMembers };

    return (
        <View style={styles.ledgerContainer}>
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

            {rows.map((row) => {
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

export default function MPCSForm({ onComplete }) {
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [mpcsSocieties, setMpcsSocieties] = useState([]);
    const [isMasterExpanded, setIsMasterExpanded] = useState(false);

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
                    const periodicKeys = [
                        'photo_uri', 'evidence_timestamp', 'latitude', 'longitude', // Section A Evidence
                        '7.69', '7.70', '7.71', '7.72', // Section J Monthly Deposits
                        '8.12', '8.13', '8.14', // Section L Monthly Business Performance
                        '9.7z', '9.7a', '9.8', '9.9', '9.10', // Section N CSC Monthly Transactions
                        'activities', '10.1' // Section O Activities Log
                    ];
                    const filteredProfile = Object.keys(profile).reduce((acc, k) => {
                        if (!periodicKeys.includes(k)) acc[k] = profile[k];
                        return acc;
                    }, {});
                    setFormData(prev => ({ ...prev, ...filteredProfile, 'select_prev_society': value }));
                } else {
                    setFormData(prev => ({ ...prev, '1.1': value, [id]: value }));
                }
            }
            return;
        }
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        const errors = [];
        if (!formData['1.1'] || !formData['1.1'].trim()) errors.push("Name of Cooperative Society");
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
                saveMpcsProfile(formData);
                const sName = formData['1.1'];
                if (sName && sName.trim()) {
                    const cleanName = sName.trim();
                    saveMpcsSocietyProfile(cleanName, formData);
                    addMpcsSociety(cleanName).then(updated => {
                        if (updated) setMpcsSocieties(updated);
                    });
                }
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

    const allSections = getFormSections(formData, mpcsSocieties);
    const evidenceSection = allSections.find(s => s.id === 'section_evidence') || allSections[0];
    const periodicSections = allSections.filter(s => ['section_j', 'section_l', 'section_n', 'section_o'].includes(s.id));
    const masterSections = allSections.filter(s => !['section_evidence', 'section_j', 'section_l', 'section_n', 'section_o'].includes(s.id));
    const isAutoFilled = !!formData['1.1'];

    return (
        <View style={styles.container}>
            {/* Top Quick Status & Society Selection Card */}
            <View style={[styles.card, { borderColor: isAutoFilled ? '#10B981' : '#E2E8F0', borderWidth: 2 }]}>
                <View style={[styles.cardRibbon, { backgroundColor: isAutoFilled ? '#10B981' : COLORS.emerald }]} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="business" size={24} color={COLORS.emerald} />
                        <Text style={[styles.cardTitle, { fontSize: 18 }]}>Active Society Profile</Text>
                    </View>
                    {isAutoFilled && (
                        <View style={styles.autoFillBadge}>
                            <MaterialIcons name="verified" size={14} color="#10B981" />
                            <Text style={styles.autoFillBadgeText}>MASTER PROFILE LOADED</Text>
                        </View>
                    )}
                </View>

                {mpcsSocieties.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={styles.floatingInputLabel}>Quick Select Registered Society</Text>
                        <View style={styles.pickerWrapperGold}>
                            <Picker
                                selectedValue={formData['select_prev_society'] || ''}
                                onValueChange={(itemValue) => handleChange('select_prev_society', itemValue)}
                                style={styles.pickerInput}
                            >
                                <Picker.Item label="-- Choose Society (Auto-fills 10 Master Sections) --" value="" />
                                {mpcsSocieties.map((soc, idx) => (
                                    <Picker.Item key={idx} label={soc} value={soc} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                )}

                {isAutoFilled && (
                    <View style={styles.societySummaryPillBox}>
                        <Text style={styles.societySummaryTitle}>{formData['1.1'] || 'Selected Society'}</Text>
                        <Text style={styles.societySummarySub}>Reg No: {formData['1.5'] || 'N/A'} • President: {formData['2.1'] || 'N/A'}</Text>
                    </View>
                )}
            </View>

            {/* Primary Hero Feature: Section A Digital Evidence */}
            <View style={styles.card}>
                <View style={[styles.cardRibbon, { backgroundColor: COLORS.emerald }]} />
                <View style={styles.cardHeader}>
                    <MaterialIcons name="camera-enhance" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>{evidenceSection.title}</Text>
                </View>
                <DigitalEvidenceCapture formData={formData} handleChange={handleChange} />
            </View>

            {/* Operational & Monthly Periodic Returns */}
            {periodicSections.length > 0 && (
                <View style={{ marginTop: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.emerald, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        ⚡ Periodic Operational Returns (Current Inspection Visit)
                    </Text>
                    {periodicSections.map((section, idx) => (
                        <View key={idx} style={styles.card}>
                            <View style={[styles.cardRibbon, section.ribbonColor && { backgroundColor: section.ribbonColor }]} />
                            <View style={styles.cardHeader}>
                                <MaterialIcons name={section.icon || 'description'} size={24} color={COLORS.emerald} />
                                <Text style={styles.cardTitle}>{section.title}</Text>
                            </View>
                            {section.type === 'matrix' ? (
                                <DemographicMatrix formData={formData} handleChange={handleChange} />
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
                </View>
            )}

            {/* Collapsible Master Institutional Details Accordion */}
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsMasterExpanded(!isMasterExpanded)}
                    style={styles.accordionHeaderBtn}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialIcons name="inventory" size={22} color={COLORS.emerald} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.accordionTitle}>Fixed Master Institutional Profile ({masterSections.length} Sections)</Text>
                            <Text style={styles.accordionSub}>Fixed registration, office bearers, demographics, audit & bank records</Text>
                        </View>
                    </View>
                    <View style={styles.accordionArrowBox}>
                        <MaterialIcons
                            name={isMasterExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                            size={24}
                            color={COLORS.emerald}
                        />
                    </View>
                </TouchableOpacity>

                {isMasterExpanded && (
                    <View style={{ padding: 20, paddingTop: 10, backgroundColor: '#FAF8F5' }}>
                        {masterSections.map((section, idx) => (
                            <View key={idx} style={[styles.card, { marginBottom: 18, backgroundColor: '#FFFFFF' }]}>
                                <View style={[styles.cardRibbon, section.ribbonColor && { backgroundColor: section.ribbonColor }]} />
                                <View style={styles.cardHeader}>
                                    <MaterialIcons name={section.icon || 'description'} size={22} color={COLORS.emerald} />
                                    <Text style={[styles.cardTitle, { fontSize: 17 }]}>{section.title}</Text>
                                </View>
                                {section.type === 'matrix' ? (
                                    <DemographicMatrix formData={formData} handleChange={handleChange} />
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
                    </View>
                )}
            </View>

            {/* Primary Action Button */}
            <View style={{ marginBottom: 40, marginTop: 16 }}>
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
                                    {saving ? 'SAVING VERIFICATION...' : 'SUBMIT FIELD VERIFICATION & EVIDENCE'}
                                </Text>
                                <Text style={styles.forgeButtonSubText}>
                                    {saving ? 'Uploading geotagged photo to cloud...' : 'Seals geotagged photo + pre-filled master profile'}
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
        borderRadius: 0,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardRibbon: {
        display: 'none',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
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
        marginBottom: 18,
    },
    floatingInputWrapper: {
        marginBottom: 0,
    },
    floatingInputLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
        marginLeft: 0,
    },
    floatingInputInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 0,
        height: 44,
        paddingHorizontal: 12,
        position: 'relative',
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
        borderColor: '#FEE2E2',
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
        color: '#7C1C1C',
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
        borderBottomColor: '#F8F5F2',
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
        borderTopColor: '#FEE2E2',
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
        backgroundColor: '#FEE2E2',
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
    },

    // Digital Evidence Styles for MPCS
    evidenceContainer: {
        marginTop: 5,
    },
    evidenceDropzone: {
        borderWidth: 2,
        borderColor: 'rgba(124, 28, 28, 0.25)',
        borderStyle: 'dashed',
        backgroundColor: '#FBF8F5',
        borderRadius: 16,
        padding: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropzoneCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    dropzoneTitle: {
        color: COLORS.emerald,
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    dropzoneSub: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    evidenceSnapshotBox: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 240,
        backgroundColor: '#000',
        elevation: 5,
    },
    evidenceImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    evidenceOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingTop: 36,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    evidenceMetaData: {
        flex: 1,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 6,
        borderWidth: 0.5,
        borderColor: COLORS.gold,
    },
    metaBadgeText: {
        color: COLORS.gold,
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        letterSpacing: 1,
    },
    metaTextLatLong: {
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    metaTextTime: {
        color: '#FEE2E2',
        fontSize: 11,
        fontWeight: '600',
    },
    recaptureBtn: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Master Profile Accordion Styles
    autoFillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    autoFillBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#047857',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    societySummaryPillBox: {
        backgroundColor: '#F8FAF6',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        marginTop: 4,
    },
    societySummaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.emerald,
    },
    societySummarySub: {
        fontSize: 12,
        color: '#475569',
        marginTop: 2,
        fontWeight: '600',
    },
    accordionHeaderBtn: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    accordionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.emerald,
    },
    accordionSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    accordionArrowBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8F5F2',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
