import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getMilkSectionData, saveMilkSectionData } from '../utils/monthlySyncManager';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  ScrollView, Platform, Pressable
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from './BottomNav';
import LiveCameraCapture from './LiveCameraCapture';
import { webCapWidth } from '../utils/webStyles';

// Same subtle Kanchenjunga treatment used on every header across the app.
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.4, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.28 };

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

const DEFAULT_BUILDING_IMAGE = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80';

export default function DigitalEvidenceScreen({
  societyName = "",
  reportingMonth = "",
  onSave,
  onSaveNext,
  onNext,
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [location, setLocation] = useState(null);
  const [timestamp, setTimestamp] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'evidence');
      if (data) {
        setImageUri(data.imageUri || null);
        setImageBase64(data.imageBase64 || null);
        setLocation(data.location || null);
        setTimestamp(data.timestamp || "");
        setReportedBy(data.reportedBy || "");
      }
    })();
  }, [societyName, reportingMonth]);

  const applyCaptureResult = async (result) => {
    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
    setImageBase64(result.assets[0].base64);

    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    setTimestamp(formattedTime);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      // getCurrentPositionAsync returns {coords: {latitude, longitude, ...},
      // timestamp}, not a flat {latitude, longitude} object. Storing it
      // as-is meant this screen's own display (which defensively checks
      // both location.latitude and location.coords?.latitude) showed the
      // real coordinates just fine, but every downstream reader — the
      // sealed PDF, the background cloud sync, the admin dashboard —
      // expects flat location.latitude and silently got undefined,
      // showing "Not captured" despite GPS having genuinely been read.
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } else {
      // Don't fabricate a location when permission is denied — leave it
      // unset so the evidence honestly shows "not captured" rather than
      // a fixed, fake coordinate pretending to be a real GPS reading.
      setLocation(null);
    }
  };

  const handleCapturePhoto = async () => {
    // On web, expo-image-picker hands off to the OS camera app via a hidden
    // file input — on many Android devices that backgrounds the browser tab
    // long enough for Chrome to reclaim/reload it, wiping all in-memory app
    // state. A live in-page camera keeps the tab foregrounded the whole time.
    if (Platform.OS === 'web') {
      setShowLiveCamera(true);
      return;
    }
    setIsCapturing(true);
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      await applyCaptureResult(result);
    } catch (e) {
      console.warn("Camera failed:", e);
    }
    setIsCapturing(false);
  };

  const handleLiveCameraCapture = async ({ uri, base64 }) => {
    setShowLiveCamera(false);
    await applyCaptureResult({ canceled: false, assets: [{ uri, base64 }] });
  };

  const handleSave = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'evidence', {
      imageUri, imageBase64, location, timestamp, reportedBy
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (onSave) onSave(validUntil);
  };

  const handleSaveAndNext = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'evidence', {
      imageUri, imageBase64, location, timestamp, reportedBy
    });
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (onSaveNext) {
      onSaveNext(validUntil);
    } else if (onNext) {
      onNext(validUntil);
    }
  };

  const displayImage = imageUri || DEFAULT_BUILDING_IMAGE;
  const gpsDisplay = location

    ? (typeof location === 'string' ? location : `${location.latitude ? location.latitude.toFixed(4) : (location.coords?.latitude?.toFixed(4) || '')} N, ${location.longitude ? location.longitude.toFixed(4) : (location.coords?.longitude?.toFixed(4) || '')} E`)
    : '';
  const timeDisplay = timestamp || '';
  const officerValue = reportedBy !== undefined && reportedBy !== null ? reportedBy : '';

  return (
    <View style={styles.container}>
      <LiveCameraCapture
        visible={showLiveCamera}
        onCapture={handleLiveCameraCapture}
        onClose={() => setShowLiveCamera(false)}
      />
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Image
          source={require('../../assets/core/kanchenjunga.jpg')}
          style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, headerPhotoFilter]}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MILK PCS</Text>
          <Text style={styles.screenTitleHeader}>Digital Evidence</Text>
        </View>
        <TouchableOpacity style={styles.notifyBtn} onPress={onNotifyPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#FFFFFF" />
          {unreadCount > 0 && <View style={styles.notifyBadge} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress} activeOpacity={0.8}>
          <Text style={styles.avatarText}>CI</Text>
        </TouchableOpacity>
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
            <Text style={styles.monthValue}>AUG 2024</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>MANDATORY</Text>
          </View>
        </View>

        {/* ── Image Capture Section ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Live Premise Photo</Text>
              <Text style={styles.cardHeaderSub}>Required for visual verification</Text>
            </View>
          </View>

          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: displayImage }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <View style={styles.verifiedTag}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color={COLORS.emerald500} />
                  <Text style={styles.verifiedText}>Geo-tagged</Text>
                </View>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleCapturePhoto}>
                  <MaterialCommunityIcons name="camera-retake-outline" size={16} color="#fff" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.captureArea, pressed && { backgroundColor: COLORS.slate50 }]}
              onPress={handleCapturePhoto}
            >
              <View style={styles.captureCircle}>
                <MaterialCommunityIcons name="camera-outline" size={26} color={COLORS.primary} />
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

          <View style={styles.inputBox}>
            <MaterialCommunityIcons name="crosshairs-gps" size={15} color={COLORS.slate400} style={styles.inputIcon} />
            <Text style={styles.textInput} numberOfLines={1} ellipsizeMode="tail">{gpsDisplay || "Not captured yet"}</Text>
          </View>

          {/* Timestamp Box */}
          <View style={styles.timestampCard}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.timestampLabel}>Captured Timestamp</Text>
              <Text style={styles.timestampValue}>{timeDisplay || "Not captured yet"}</Text>
            </View>
          </View>

          {/* Device / Captured By */}

        </View>
      {/* Wizard navigation actions now scroll with the content
          instead of sitting in a fixed footer, which competed with the
          floating BottomNav pill for the same strip at the bottom. */}
        <View style={[{ flexDirection: 'row', flex: 1, gap: 12 }, webCapWidth]}>
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
  topBar: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topBarTitleContainer: { flex: 1 },
  notifyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  moduleTag: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
    fontFamily: FONT_FAMILY,
  },
  screenTitleHeader: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 16 },

  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122,26,31,0.1)',
    overflow: 'hidden',
  },
  monthIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(122,26,31,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontSize: 11, color: COLORS.slate500, fontWeight: '600', fontFamily: FONT_FAMILY },
  monthValue: { fontSize: 14, color: COLORS.primary, fontWeight: '800', marginTop: 2, fontFamily: FONT_FAMILY },
  statusBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_FAMILY },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTitle: { fontSize: 15, fontWeight: '800', color: COLORS.slate800, fontFamily: FONT_FAMILY },
  cardHeaderSub: { fontSize: 12, color: COLORS.slate500, marginTop: 2, fontFamily: FONT_FAMILY },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    overflow: 'hidden',
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate800,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  timestampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(122,26,31,0.1)',
    marginTop: 12,
  },
  timestampLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '600', opacity: 0.8, fontFamily: FONT_FAMILY },
  timestampValue: { fontSize: 13, color: COLORS.primary, fontWeight: '800', marginTop: 2, fontFamily: FONT_FAMILY },

  captureArea: {
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  captureCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate700,
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  captureSub: {
    fontSize: 12,
    color: COLORS.slate400,
    fontFamily: FONT_FAMILY,
  },

  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  galleryBtnText: { color: COLORS.slate700, fontSize: 13, fontWeight: '700' },

  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.slate100,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.emerald700,
    marginLeft: 4,
    fontFamily: FONT_FAMILY,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  retakeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  navBackBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSaveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate300,
    backgroundColor: COLORS.slate50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navSaveBtnSuccess: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  navNextBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextSecondary: {
    color: COLORS.slate700,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  buttonTextSave: {
    color: COLORS.slate700,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
});
