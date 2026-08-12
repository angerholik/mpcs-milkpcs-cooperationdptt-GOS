import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C1C1C',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
};

const DEFAULT_BUILDING_IMAGE = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80';

export default function DigitalEvidenceScreen({
  imageUri,
  location,
  timestamp,
  reportedBy,
  setReportedBy,
  onTakePic,
  onPickGallery,
  onNext,
  onBack
}) {
  const displayImage = imageUri || DEFAULT_BUILDING_IMAGE;
  const gpsDisplay = location 
    ? (typeof location === 'string' ? location : `${location.latitude ? location.latitude.toFixed(4) : (location.coords?.latitude?.toFixed(4) || '')} N, ${location.longitude ? location.longitude.toFixed(4) : (location.coords?.longitude?.toFixed(4) || '')} E`)
    : '';

  const timeDisplay = timestamp || '';
  const officerValue = reportedBy !== undefined && reportedBy !== null ? reportedBy : '';

  return (
    <View style={styles.container}>
      {/* Deep Burgundy Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Digital Evidence</Text>
        <Text style={styles.stepIndicator}>1 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        <Text style={styles.instructionText}>
          Capture a clear photo of the society premises. GPS location and timestamp will be recorded automatically.
        </Text>

        {/* Photo Viewport */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: displayImage }} style={styles.capturedImage} resizeMode="cover" />
          <View style={styles.expandIconBox}>
            <MaterialIcons name="open-in-full" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Primary Action Buttons */}
        <TouchableOpacity style={styles.captureBtn} onPress={onTakePic} activeOpacity={0.85}>
          <MaterialIcons name="photo-camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.captureBtnText}>CAPTURE PHOTO</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or</Text>

        <TouchableOpacity style={styles.galleryBtn} onPress={onPickGallery} activeOpacity={0.7}>
          <MaterialIcons name="crop-free" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.galleryBtnText}>CHOOSE FROM GALLERY</Text>
        </TouchableOpacity>

        {/* Verification Check Cards */}
        <View style={styles.verificationSection}>
          <View style={styles.verifCard}>
            <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
            <View style={styles.verifTextCol}>
              <Text style={styles.verifLabel}>GPS Location</Text>
              <Text style={styles.verifValue}>{gpsDisplay}</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
          </View>

          <View style={styles.verifCard}>
            <MaterialIcons name="access-time" size={20} color={COLORS.primary} />
            <View style={styles.verifTextCol}>
              <Text style={styles.verifLabel}>Timestamp</Text>
              <Text style={styles.verifValue}>{timeDisplay}</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
          </View>

          <View style={styles.verifCard}>
            <MaterialIcons name="person-outline" size={20} color={COLORS.primary} />
            <View style={styles.verifTextCol}>
              <Text style={styles.verifLabel}>Captured By</Text>
              <TextInput
                style={styles.officerInput}
                value={officerValue}
                onChangeText={setReportedBy}
                placeholder="CI Gyalshing District"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
          </View>

          <View style={styles.verifCard}>
            <MaterialIcons name="smartphone" size={20} color={COLORS.primary} />
            <View style={styles.verifTextCol}>
              <Text style={styles.verifLabel}>Device</Text>
              <Text style={styles.verifValue}>Redmi Note 11 Pro</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
          </View>
        </View>
      </ScrollView>

      {/* Nav Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.navBackText}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navNextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.navNextText}>NEXT</Text>
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
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
  },
  backBtn: { padding: 4 },
  screenTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  stepIndicator: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16 },
  instructionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    fontWeight: '500',
  },
  photoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  capturedImage: { width: '100%', height: '100%' },
  expandIconBox: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 6,
  },
  captureBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 2,
  },
  captureBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  orText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginVertical: 8, fontWeight: '600' },
  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  galleryBtnText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  verificationSection: { gap: 10, marginBottom: 20 },
  verifCard: {
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifTextCol: { flex: 1, marginLeft: 12 },
  verifLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  verifValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '800', marginTop: 1 },
  officerInput: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '800', padding: 0, marginTop: 1 },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  navBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  navBackText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800' },
  navNextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  navNextText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
