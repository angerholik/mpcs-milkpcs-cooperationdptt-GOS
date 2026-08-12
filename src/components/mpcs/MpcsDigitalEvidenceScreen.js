import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6B1212',
  primaryLight: '#FEF2F2',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

export default function MpcsDigitalEvidenceScreen({
  reportingMonth = "",
  imageUri,
  setImageUri,
  timestamp = "",
  setTimestamp,
  latitude = "",
  setLatitude,
  longitude = "",
  setLongitude,
  notes = "",
  setNotes,
  onSaveNext,
  onBack
}) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapturePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setTimestamp(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      setIsCapturing(false);
    }, 400);
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Digital Evidence</Text>
        </View>
        <Text style={styles.stepIndicator}>1 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Month Indicator Card */}
        <View style={styles.monthCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Month & Year</Text>
            <Text style={styles.monthTitleText}>{reportingMonth}</Text>
          </View>
          <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
        </View>

        {/* Photo Evidence Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="photo-camera" size={18} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Photo Evidence</Text>
          </View>

          {imageUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.retakeBtn} onPress={handleCapturePhoto} activeOpacity={0.8}>
                <MaterialIcons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retakeText}>RETAKE PHOTO</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureBox} onPress={handleCapturePhoto} activeOpacity={0.8}>
              <View style={styles.captureCircle}>
                <MaterialIcons name="camera-alt" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.captureTitle}>Tap to capture or upload</Text>
              <Text style={styles.captureSub}>JPG, PNG up to 5MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* GPS Location Details */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>GPS Location</Text>
          </View>

          <View style={styles.gpsRow}>
            <View style={styles.gpsItem}>
              <Text style={styles.fieldLabel}>Latitude</Text>
              <TextInput style={styles.gpsInput} value={latitude} onChangeText={setLatitude} placeholder="27.4400" />
            </View>
            <View style={styles.gpsItem}>
              <Text style={styles.fieldLabel}>Longitude</Text>
              <TextInput style={styles.gpsInput} value={longitude} onChangeText={setLongitude} placeholder="88.5900" />
            </View>
          </View>

          <View style={styles.timestampBox}>
            <Text style={styles.fieldLabel}>Captured On</Text>
            <Text style={styles.timestampValue}>{timestamp || "Not captured yet"}</Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter any additional notes..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navNextBtn} onPress={onSaveNext} activeOpacity={0.85}>
          <Text style={styles.buttonTextPrimary}>SAVE & NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  backBtn: { padding: 4 },
  moduleTag: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  screenTitleHeader: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  stepIndicator: { color: 'rgba(255,255,255,0.85)', fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '600' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 14 },
  monthCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  monthTitleText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    gap: 10,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  captureBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  captureCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  captureTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  captureSub: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  photoPreviewContainer: { borderRadius: 12, overflow: 'hidden', height: 180, position: 'relative' },
  photoPreview: { width: '100%', height: '100%' },
  retakeBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  retakeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  gpsRow: { flexDirection: 'row', gap: 10 },
  gpsItem: { flex: 1 },
  gpsInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, height: 40, fontFamily: FONT_FAMILY, fontSize: 13, color: COLORS.textPrimary, marginTop: 4, outlineStyle: 'none' },
  timestampBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 4 },
  timestampValue: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  notesInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, height: 60, fontFamily: FONT_FAMILY, fontSize: 13, color: COLORS.textPrimary, marginTop: 4, outlineStyle: 'none', textAlignVertical: 'top' },
  bottomBar: { flexDirection: 'row', padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  navBackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  buttonTextSecondary: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  navNextBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center' },
  buttonTextPrimary: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
});
