import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabase';

const COLORS = {
  bgStart: "#3b080b",
  bgMid: "#7a1a1f",
  bgMid2: "#4a1017",
  bgEnd: "#1c0406",
  primary: "#7a1a1f",
  slate500: "#64748b",
  slate400: "#94a3b8",
};

const FONT_FAMILY = Platform.select({
  web: 'Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

// Rendered when the app detects a Supabase password-recovery session (i.e.
// the user arrived via the "reset your password" email link), in place of
// the normal Login screen — see App.js's passwordRecoveryActive handling.
// Without this screen, resetPasswordForEmail() sent an email whose link had
// nowhere to land: no code anywhere called auth.updateUser() to actually
// set the new password.
export default function ResetPasswordScreen({ onDone }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    setErrMsg('');
    if (!newPassword || !confirmPassword) {
      setErrMsg('Please fill out both fields.');
      return;
    }
    if (newPassword.length < 8) {
      setErrMsg('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setLoading(false);
      if (error) {
        setErrMsg(error.message);
        return;
      }
      setSuccessMsg('✅ Password updated. Please sign in with your new password.');
      setTimeout(() => onDone && onDone(), 1800);
    } catch (e) {
      setLoading(false);
      setErrMsg(e.message || 'Failed to update password.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bgStart, COLORS.bgMid, COLORS.bgMid2, COLORS.bgEnd]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.background}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          <View style={styles.headerArea}>
            <Image
              source={require('../../assets/Seal_of_Sikkim_greyscale.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
            <Text style={styles.govTitle}>CORE</Text>
            <Text style={styles.deptSubtitle}>SET A NEW PASSWORD</Text>
          </View>

          <View style={styles.whiteFormCard}>
            <Text style={styles.cardSubtitle}>
              Choose a new password for your account.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
              <View style={styles.inputInner}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={COLORS.slate400}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.inputInner}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={COLORS.slate400}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {errMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errMsg}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.ctaBtnWrapper, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={handleSubmit}
              disabled={loading || !!successMsg}
            >
              <LinearGradient
                colors={['#7a1a1f', '#4a1017']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.ctaText}>UPDATE PASSWORD</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1 },
  scrollInner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerArea: { alignItems: 'center', marginBottom: 24 },
  emblemImage: { width: 64, height: 64, marginBottom: 12, opacity: 0.9 },
  govTitle: { fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  deptSubtitle: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: '#fde68a', letterSpacing: 1, marginTop: 6 },
  whiteFormCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24 },
  cardSubtitle: { fontFamily: FONT_FAMILY, fontSize: 13, color: '#475569', marginBottom: 18, textAlign: 'center' },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: '#334155', marginBottom: 6, letterSpacing: 0.5 },
  inputInner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 48, backgroundColor: '#f8fafc' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 14, color: '#1b1b1d' },
  successBox: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0', marginBottom: 14 },
  successText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: '#047857', textAlign: 'center' },
  errorBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 14 },
  errorText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: '#dc2626', textAlign: 'center' },
  ctaBtnWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  ctaGradient: { height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ctaText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
});
