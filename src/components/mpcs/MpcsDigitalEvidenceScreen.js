import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  View, Text, StyleSheet, Image,
  ScrollView, Platform, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import LiveCameraCapture from '../LiveCameraCapture';
import MpcsWizardHeader from './MpcsWizardHeader';
import { webCapWidth } from '../../utils/webStyles';

// Redesign source: https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx,
// section "2 · Monthly return", screens 6b "Evidence, before capture" and
// 6c "Evidence, after capture".
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  pillBg: '#F6E3E5',
  emerald700: '#047857',
};

const FONT_FAMILY = 'Manrope';

export default function MpcsDigitalEvidenceScreen({
  reportingMonth = "",
  imageUri,
  setImageUri,
  setImageBase64,
  timestamp = "",
  setTimestamp,
  latitude = "",
  setLatitude,
  longitude = "",
  setLongitude,
  onSaveNext,
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  // Real camera + GPS capture, matching the Milk PCS Digital Evidence
  // screen — this previously just set a hardcoded stock photo URL and fake
  // coordinates (27.4400, 88.5900) on a timer regardless of what was
  // actually in front of the inspector or where they actually were.
  const applyCaptureResult = async (result) => {
    if (result.canceled) return;
    setImageUri && setImageUri(result.assets[0].uri);
    // launchCameraAsync must be asked for base64 explicitly (not implied by
    // the URI) — without this, uploadEvidence() in saveMpcsSubmission always
    // had nothing to upload, so no MPCS submission ever actually got a photo
    // into Supabase Storage regardless of what the inspector captured here.
    setImageBase64 && setImageBase64(result.assets[0].base64 || null);

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
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      await applyCaptureResult(result);
    } catch (e) {
      console.warn('Camera failed:', e);
    }
    setIsCapturing(false);
  };

  const handleLiveCameraCapture = async ({ uri, base64 }) => {
    setShowLiveCamera(false);
    await applyCaptureResult({ canceled: false, assets: [{ uri, base64 }] });
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
      <LiveCameraCapture
        visible={showLiveCamera}
        onCapture={handleLiveCameraCapture}
        onClose={() => setShowLiveCamera(false)}
      />

      <MpcsWizardHeader
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Digital Evidence"
        step={2}
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
                  {latitude && longitude ? `${Number(latitude).toFixed(4)}° N, ${Number(longitude).toFixed(4)}° E` : 'Not captured yet'}
                </Text>
                <Text style={styles.confirmLine}>{timestamp || 'Not captured yet'}</Text>
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
            <Pressable onPress={onBack} hitSlop={8}>
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
