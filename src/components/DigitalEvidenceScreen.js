import React, { useState, useEffect } from 'react';
import MpcsWizardHeader from './mpcs/MpcsWizardHeader';
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
  bg: '#F4F5F7',
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
  maroon: '#7B1420',
  ink: '#1E1B18',
  border: '#E7E2DA',
  pillBg: '#F6E3E5',
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

      <MpcsWizardHeader
        module="MILK PCS"
        total={4}
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Digital Evidence"
        step={1}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {imageUri ? (
          <>
            <View style={styles.photoBox}>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            </View>

            <View style={styles.confirmCard}>
              <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.emerald700} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.confirmTitle}>Location and time recorded</Text>
                <Text style={styles.confirmLine}>
                  {gpsDisplay || 'Not captured yet'}
                </Text>
                <Text style={styles.confirmLine}>{timeDisplay || 'Not captured yet'}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Pressable style={styles.backOutlineBtn} onPress={handleCapturePhoto}>
                <Text style={styles.backOutlineText}>Retake</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                onPress={handleSaveAndNext}
              >
                <Text style={styles.primaryBtnText}>Save and continue</Text>
              </Pressable>
            </View>
            <Pressable onPress={async () => { await handleSave(); onBack && onBack(); }} hitSlop={8}>
              <Text style={styles.draftLink}>Save as draft</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.uploadBox, pressed && { opacity: 0.85 }]}
              onPress={handleCapturePhoto}
            >
              <View style={styles.uploadIconCircle}>
                <MaterialCommunityIcons name="camera-outline" size={26} color={COLORS.maroon} />
              </View>
              <Text style={styles.uploadTitle}>
                {isCapturing ? 'Capturing photo…' : 'Take the site photo'}
              </Text>
              <Text style={styles.uploadDesc}>
                The camera records your location and the time automatically. Photos from the gallery cannot be used.
              </Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Pressable style={styles.backOutlineBtn} onPress={onBack}>
                <Text style={styles.backOutlineText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                onPress={handleCapturePhoto}
              >
                <MaterialCommunityIcons name="camera" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Open camera</Text>
              </Pressable>
            </View>
            <Text style={styles.hintText}>Continue is available once the photo is taken</Text>
          </>
        )}
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  uploadBox: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 8,
  },
  uploadDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
    textAlign: 'center',
    lineHeight: 18,
  },

  photoBox: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoPreview: {
    width: '100%',
    height: 260,
  },

  confirmCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  confirmTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  confirmLine: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
  },

  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backOutlineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOutlineText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  hintText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },
  draftLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate500,
    textAlign: 'center',
  },
});
