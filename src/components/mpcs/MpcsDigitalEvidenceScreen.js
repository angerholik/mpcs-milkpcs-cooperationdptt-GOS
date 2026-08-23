import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  ScrollView, Platform, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';

const COLORS = {
  surface: '#ffffff',
  bg: '#F8F5F2',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#7a1a1f',
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  amber900: '#78350f',
  amber50: '#fffbeb',
  red50: '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

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
  onBack,
  activeTab,
  onTabPress
}) {
  const [isCapturing, setIsCapturing] = useState(false);

  // Real camera + GPS capture, matching the Milk PCS Digital Evidence
  // screen — this previously just set a hardcoded stock photo URL and fake
  // coordinates (27.4400, 88.5900) on a timer regardless of what was
  // actually in front of the inspector or where they actually were.
  const applyCaptureResult = async (result) => {
    if (result.canceled) return;
    setImageUri && setImageUri(result.assets[0].uri);

    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    setTimestamp && setTimestamp(formattedTime);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLatitude && setLatitude(String(loc.coords.latitude));
        setLongitude && setLongitude(String(loc.coords.longitude));
      }
    } catch (e) {
      console.warn('Location capture failed:', e);
    }
  };

  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      await applyCaptureResult(result);
    } catch (e) {
      console.warn('Camera failed:', e);
    }
    setIsCapturing(false);
  };

  // Previously the button wired directly to `onPress={onSaveNext}`, so the
  // press event object (not a real date) was what App.js received as
  // `validUntil` — comparing "now < new Date(pressEvent)" is always false,
  // so evidence showed as EXPIRED immediately after every single capture,
  // regardless of when it actually happened. Compute a real 24-hour expiry
  // here, matching the Milk PCS Digital Evidence screen.
  const handleSaveAndNext = () => {
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (onSaveNext) onSaveNext(validUntil);
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Digital Evidence</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Month Indicator Card */}
        <View style={styles.monthCard}>
          <LinearGradient
            colors={['rgba(122,26,31,0.06)', 'rgba(122,26,31,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.monthIconBox}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.monthLabel}>Reporting Period</Text>
            <Text style={styles.monthValue}>{reportingMonth || 'Current Month'}</Text>
          </View>
          <View style={styles.draftChip}>
            <Text style={styles.draftChipText}>DRAFT</Text>
          </View>
        </View>

        {/* ── Photo Evidence Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Photo Evidence</Text>
              <Text style={styles.cardHeaderSub}>Upload geo-tagged operational photo</Text>
            </View>
            {imageUri && (
              <View style={styles.capturedBadge}>
                <MaterialCommunityIcons name="check-circle" size={13} color={COLORS.emerald700} />
                <Text style={styles.capturedBadgeText}>CAPTURED</Text>
              </View>
            )}
          </View>

          {imageUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              <View style={styles.photoOverlayGradient}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleCapturePhoto} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#7a1a1f', '#4a1017']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <MaterialCommunityIcons name="camera-retake-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.retakeText}>RETAKE PHOTO</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.captureBox,
                pressed && { backgroundColor: COLORS.slate100 }
              ]}
              onPress={handleCapturePhoto}
            >
              <View style={styles.captureCircle}>
                <MaterialCommunityIcons name="camera-plus-outline" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.captureTitle}>
                {isCapturing ? "Capturing photo..." : "Tap to capture operational photo"}
              </Text>
              <Text style={styles.captureSub}>Geo-tagged PNG/JPG • Auto timestamped • Live capture only</Text>
            </Pressable>
          )}
        </View>

        {/* ── GPS & Location Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Location & Timestamp</Text>
              <Text style={styles.cardHeaderSub}>Auto-filled via GPS telemetry</Text>
            </View>
          </View>

          <View style={styles.inputRowHalf}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="crosshairs-gps" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="27.4400"
                  placeholderTextColor={COLORS.slate300}
                />
              </View>
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="crosshairs-gps" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="88.5900"
                  placeholderTextColor={COLORS.slate300}
                />
              </View>
            </View>
          </View>

          {/* Timestamp Box */}
          <View style={styles.timestampCard}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.timestampLabel}>Captured Timestamp</Text>
              <Text style={styles.timestampValue}>{timestamp || "Not captured yet"}</Text>
            </View>
          </View>

          {/* Notes Input */}
          <View style={{ gap: 5, marginTop: 4 }}>
            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
            <View style={[styles.inputBox, { height: 74, alignItems: 'flex-start', paddingTop: 10 }]}>
              <MaterialCommunityIcons name="notebook-outline" size={15} color={COLORS.slate400} style={{ marginRight: 6, marginTop: 2 }} />
              <TextInput
                style={[styles.textInput, { height: '100%' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any operational remarks or evidence description..."
                placeholderTextColor={COLORS.slate300}
                multiline
              />
            </View>
          </View>
        </View>
      {/* Wizard navigation actions now scroll with the content
          instead of sitting in a fixed footer, which competed with the
          floating BottomNav pill for the same strip at the bottom. */}
        <View style={[{ flexDirection: 'row', flex: 1, gap: 10 }, webCapWidth]}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <Pressable
          style={({ pressed }) => [styles.navNextBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={handleSaveAndNext}
        >
          <LinearGradient
            colors={['#7a1a1f', '#4a1017']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.buttonTextPrimary}>SAVE & NEXT</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
        </Pressable>
        </View>

      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    overflow: 'hidden',
  },
  backBtn: { padding: 4, zIndex: 1 },
  topBarTitleContainer: { flex: 1, marginLeft: 12 },
  moduleTag: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  screenTitleHeader: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },

  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  // Month Card
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 14,
    overflow: 'hidden',
  },
  monthIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  draftChip: {
    backgroundColor: COLORS.amber50,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  draftChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.amber900,
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  cardHeaderSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 1,
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  capturedBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.emerald700,
    letterSpacing: 0.4,
  },

  // Photo Box
  captureBox: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.slate50,
    gap: 8,
  },
  captureCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  captureSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.slate400,
  },
  photoPreviewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  photoOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  retakeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Inputs
  inputRowHalf: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1, gap: 5 },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: { marginRight: 6 },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  // Timestamp
  timestampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(122, 26, 31, 0.15)',
  },
  timestampLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timestampValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 1,
  },

  // Bottom Bar
  navBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: COLORS.slate500,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  navNextBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
