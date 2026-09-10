import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Web-only in-page camera capture (getUserMedia + canvas snapshot), used
// instead of expo-image-picker's web fallback — that fallback hands off to
// the OS camera app via a hidden <input type="file" capture>, and on many
// Android devices the browser tab gets reclaimed/reloaded while that app is
// in the foreground, wiping all in-memory navigation state and dropping the
// inspector back on the dashboard instead of returning the captured photo.
// Keeping the camera live inside the page avoids that OS app-switch
// entirely. Native builds are unaffected — they keep using ImagePicker.
export default function LiveCameraCapture({ visible, onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    let cancelled = false;
    setError(null);

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((e) => setError(e?.message || 'Could not access the camera.'));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [visible]);

  if (Platform.OS !== 'web' || !visible) return null;

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCapture({ uri: dataUrl, base64: dataUrl.split(',')[1] });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {error ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="camera-off-outline" size={40} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={webVideoStyle} />
            <View style={styles.controlsRow}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={26} color="#fff" />
              </Pressable>
              <Pressable style={styles.snapBtn} onPress={handleSnap}>
                <View style={styles.snapBtnInner} />
              </Pressable>
              <View style={{ width: 50 }} />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const webVideoStyle = { width: '100%', height: '100%', objectFit: 'cover' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  controlsRow: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
  },
  cancelBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  snapBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  closeBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeBtnText: { color: '#fff', fontWeight: '700' },
});
