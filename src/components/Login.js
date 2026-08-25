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
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabase';

const { width } = Dimensions.get('window');

// STITCH Design Tokens (Matching Dashboard Overview)
const COLORS = {
  bgStart: "#3b080b",
  bgMid: "#7a1a1f",
  bgMid2: "#4a1017",
  bgEnd: "#1c0406",
  gold: "#fde68a",
  goldDark: "#b45309",
  surface: "#ffffff",
  onSurface: "#1b1b1d",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  primary: "#7a1a1f",
  primaryDark: "#4a1017",
};

const FONT_FAMILY = Platform.select({
  web: 'Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

// Official Sikkim Government Seal Emblem Component
function SikkimEmblem() {
  return (
    <Image
      source={require('../../assets/Seal_of_Sikkim_greyscale.png')}
      style={styles.emblemImage}
      resizeMode="contain"
    />
  );
}

const Login = ({ onLoginSuccess, onRegisterSuccess }) => {
  const [tab, setTab] = useState('register'); // 'signin' or 'register'
  const [role, setRole] = useState('CI'); // 'CI', 'ACI', or 'PA'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');

  const handleForgotPasswordSubmit = async () => {
    if (!resetEmail) {
      setResetErr('Please enter your Official Email ID.');
      return;
    }
    setResetLoading(true);
    setResetErr('');
    setResetMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
      setResetLoading(false);
      if (error) {
        setResetErr(error.message);
      } else {
        setResetMsg('✅ Password recovery email sent! Check your inbox for reset instructions.');
      }
    } catch (err) {
      setResetLoading(false);
      setResetErr(err.message || 'Failed to send recovery email.');
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      const msg = 'Required Fields: Please enter your Official Email ID and Password.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Required Fields', msg);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      setLoading(false);

      if (!error && data?.user) {
        // Pass the real Supabase auth user through, not a hand-rolled local
        // shape — App.js reads role/fullName off user_metadata on this
        // exact object (userProfile), so a reshaped object here silently
        // broke role-based rendering on first sign-in until the next
        // reload re-fetched the real session via getSession().
        if (onLoginSuccess) onLoginSuccess(data.user);
        return;
      }

      // Auth server responded but rejected the credentials. Previously this
      // fell through to a silent local-only "success" below, so a mistyped
      // password looked like a normal login while every save afterwards
      // failed quietly against Supabase (now enforced by RLS). Block entry
      // and say why instead.
      const msg = error?.message || 'Invalid email or password. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Sign In Failed', msg);
    } catch (e) {
      setLoading(false);
      // Could not reach the auth server at all (offline/no network), not a
      // rejected password. The app supports offline field work, so let the
      // inspector continue locally — but say so plainly instead of
      // pretending this was a normal sign-in, since their reports won't
      // actually sync until they sign in again with a connection.
      console.warn('Supabase sign in network error, continuing offline:', e);
      const msg = "No network connection. Continuing in offline mode — please sign in again once you're back online so your reports can sync.";
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Offline Mode', msg);

      const user = {
        fullName: fullName || (email.includes('aci') ? 'Assistant Inspector' : 'Cooperative Inspector'),
        email: email.trim(),
        role: role,
        district: 'Gyalshing',
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!fullName || !email || !password || !mobile) {
      const msg = 'Please fill out all required inspector registration fields.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Incomplete Registration', msg);
      return;
    }

    setLoading(true);
    const roleTitle = role === 'CI' ? 'Cooperative Inspector (CI)' : role === 'ACI' ? 'Assistant CI (ACI)' : 'Project Assistant (PA)';
    let signedUpUser = null;

    try {
      try {
        const { data: signUpData, error: authErr } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              fullName: fullName.trim(),
              mobile: mobile.trim(),
              role: role,
              roleTitle: roleTitle,
            }
          }
        });
        // A rejected signUp (e.g. duplicate email, weak password) used to be
        // ignored entirely — the code below would still create an
        // officer_registry profile row, so the inspector looked registered
        // but had no real login and could never actually sign in or save
        // data. Stop here and say why instead.
        if (authErr) {
          setLoading(false);
          const msg = authErr.message || 'Failed to create your login. Please try again.';
          if (Platform.OS === 'web') alert('Registration Failed: ' + msg);
          else Alert.alert('Registration Failed', msg);
          return;
        }
        signedUpUser = signUpData?.user || null;
      } catch (authErr) {
        // Could not reach the auth server at all (offline/no network), not
        // a rejected signup. Let the inspector continue so they aren't
        // stranded in the field, but say so plainly — this profile row
        // won't have a working login until they register again online.
        console.warn('Auth sign up network error, continuing offline:', authErr);
        const msg = "No network connection. Your registration will be saved locally — please register again once you're back online so your login actually works.";
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Offline Mode', msg);
      }

      const officerRecord = {
        name: fullName.trim(),
        email: email.trim(),
        subdivision: mobile.trim(),
        role: roleTitle,
      };

      const { error: dbErr } = await supabase.from('officer_registry').insert([officerRecord]);
      if (dbErr) {
        // supabase.auth.signUp() above already creates a real session the
        // instant it succeeds, and App.js listens for that independently
        // (onAuthStateChange) — it doesn't wait for this function to return
        // or check whether officer_registry insert below succeeded. So
        // without signing back out here, a failed profile insert still logs
        // the inspector into the app: a "ghost" account with a working
        // login but no name/role/mobile on record, invisible to the admin
        // Users & Roles page. Sign out so App.js's listener reverts to the
        // login screen instead of leaving them stranded mid-app.
        try { await supabase.auth.signOut(); } catch (e) {}
        setLoading(false);
        const errorMsg = dbErr.message.includes('duplicate') ? 'This email is already registered.' : dbErr.message;
        if (Platform.OS === 'web') alert('Registration failed: ' + errorMsg);
        else Alert.alert('Registration Failed', errorMsg);
        return;
      }
      console.log('[CORE Auth] Registered new inspector in officer_registry:', fullName.trim());
    } catch (err) {
      setLoading(false);
      console.error('Inspector registration exception:', err);
      if (Platform.OS === 'web') alert('Error: ' + err.message);
      else Alert.alert('Error', err.message);
      return;
    }

    setLoading(false);

    // Prefer the real Supabase auth user (has user_metadata.role/fullName,
    // which is what App.js's role-based rendering actually reads) — this
    // hand-rolled shape is only a fallback for the fully-offline signup
    // path above, where signUp never reached the server and no real user
    // object exists yet.
    const registeredUser = signedUpUser || {
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      role: role,
      district: 'Gyalshing',
    };

    if (onRegisterSuccess) {
      onRegisterSuccess(registeredUser);
    }
  };

  return (
    <View style={styles.container}>
      {/* Rich Background Gradient */}
      <LinearGradient
        colors={[COLORS.bgStart, COLORS.bgMid, COLORS.bgMid2, COLORS.bgEnd]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.background}
      />

      {/* Ambient Glow Blobs (Matches Dashboard Overview) */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerArea}>
            <View style={styles.emblemContainer}>
              <SikkimEmblem />
            </View>

            <Text style={styles.govTitle}>CORE</Text>
            <Text style={styles.fullNameSub}>COOPERATIVE OVERSIGHT & REPORTING ENGINE</Text>
            <Text style={styles.deptSubtitle}>DEPARTMENT OF COOPERATION • GOVERNMENT OF SIKKIM</Text>
          </View>

          {/* Form Card Container */}
          <View style={styles.cardWrapper}>
            {/* Top Tab Bar */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, tab === 'signin' && styles.activeTabBtn]}
                onPress={() => setTab('signin')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabBtnText, tab === 'signin' && styles.activeTabText]}>SIGN IN</Text>
                {tab === 'signin' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, tab === 'register' && styles.activeTabBtn]}
                onPress={() => setTab('register')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabBtnText, tab === 'register' && styles.activeTabText]}>REGISTER INSPECTOR</Text>
                {tab === 'register' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            </View>

            {/* White Form Card Body */}
            <View style={styles.whiteFormCard}>
              {tab === 'register' ? (
                <>
                  <Text style={styles.cardSubtitle}>
                    Create Inspector Credentials (CI / ACI / PA) for Cooperative Portal Access
                  </Text>

                  {/* Role Selector Toggle */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>SELECT INSPECTOR DESIGNATION / ROLE</Text>
                    <View style={styles.roleToggleContainer}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => setRole('CI')}
                        activeOpacity={0.85}
                      >
                        {role === 'CI' ? (
                          <LinearGradient
                            colors={['#7a1a1f', '#4a1017']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.activeRoleGradient}
                          >
                            <MaterialCommunityIcons name="shield-check" size={16} color="#FFFFFF" />
                            <Text style={styles.activeRoleText}>CI (Cooperative Inspector)</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.inactiveRoleContent}>
                            <MaterialCommunityIcons name="shield-check-outline" size={16} color={COLORS.slate500} />
                            <Text style={styles.inactiveRoleText}>CI (Cooperative Inspector)</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => setRole('ACI')}
                        activeOpacity={0.85}
                      >
                        {role === 'ACI' ? (
                          <LinearGradient
                            colors={['#7a1a1f', '#4a1017']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.activeRoleGradient}
                          >
                            <MaterialCommunityIcons name="shield-account" size={16} color="#FFFFFF" />
                            <Text style={styles.activeRoleText}>ACI (Assistant CI)</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.inactiveRoleContent}>
                            <MaterialCommunityIcons name="shield-account-outline" size={16} color={COLORS.slate500} />
                            <Text style={styles.inactiveRoleText}>ACI (Assistant CI)</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => setRole('PA')}
                        activeOpacity={0.85}
                      >
                        {role === 'PA' ? (
                          <LinearGradient
                            colors={['#7a1a1f', '#4a1017']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.activeRoleGradient}
                          >
                            <MaterialCommunityIcons name="account-hard-hat" size={16} color="#FFFFFF" />
                            <Text style={styles.activeRoleText}>PA (Project Assistant)</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.inactiveRoleContent}>
                            <MaterialCommunityIcons name="account-hard-hat-outline" size={16} color={COLORS.slate500} />
                            <Text style={styles.inactiveRoleText}>PA (Project Assistant)</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Full Name Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>FULL NAME</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Full Name"
                        placeholderTextColor={COLORS.slate400}
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFICIAL EMAIL ID</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="officer@sikkim.gov.in"
                        placeholderTextColor={COLORS.slate400}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {/* Mobile Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="+91 Mobile Number"
                        placeholderTextColor={COLORS.slate400}
                        value={mobile}
                        onChangeText={setMobile}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>CREATE ACCESS PASSWORD</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Minimum 8 characters"
                        placeholderTextColor={COLORS.slate400}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  {/* PROCEED Divider */}
                  <View style={styles.proceedDividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>PROCEED</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Submit CTA Button */}
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.primaryCtaBtnWrapper,
                      pressed && { transform: [{ scale: 0.98 }] },
                      hovered && { opacity: 0.95 }
                    ]}
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                  >
                    {({ hovered }) => (
                      <LinearGradient
                        colors={['#7a1a1f', '#4a1017']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.ctaGradient,
                          hovered && Platform.OS === 'web' && { shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.ctaText}>CREATE ACCOUNT & ADD INSTITUTIONS</Text>
                            <MaterialCommunityIcons 
                              name="arrow-right" 
                              size={18} 
                              color="#FFFFFF" 
                              style={hovered && Platform.OS === 'web' ? { transform: [{ translateX: 4 }] } : null}
                            />
                          </>
                        )}
                      </LinearGradient>
                    )}
                  </Pressable>
                </>
              ) : forgotMode ? (
                <>
                  <Text style={styles.cardSubtitle}>
                    Enter your official registered email ID to receive a password reset link
                  </Text>

                  {/* Reset Email Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>REGISTERED OFFICIAL EMAIL ID</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="officer@sikkim.gov.in"
                        placeholderTextColor={COLORS.slate400}
                        value={resetEmail || email}
                        onChangeText={setResetEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {resetMsg ? (
                    <View style={{ backgroundColor: '#ecfdf5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0', marginBottom: 14 }}>
                      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: '#047857', textAlign: 'center' }}>
                        {resetMsg}
                      </Text>
                    </View>
                  ) : null}

                  {resetErr ? (
                    <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 14 }}>
                      <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: '#dc2626', textAlign: 'center' }}>
                        ⚠️ {resetErr}
                      </Text>
                    </View>
                  ) : null}

                  {/* Reset CTA Button */}
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.primaryCtaBtnWrapper,
                      pressed && { transform: [{ scale: 0.98 }] },
                      hovered && { opacity: 0.95 }
                    ]}
                    onPress={handleForgotPasswordSubmit}
                    disabled={resetLoading}
                  >
                    {({ hovered }) => (
                      <LinearGradient
                        colors={['#7a1a1f', '#4a1017']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.ctaGradient,
                          hovered && Platform.OS === 'web' && { shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
                        ]}
                      >
                        {resetLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.ctaText}>SEND PASSWORD RESET EMAIL</Text>
                            <MaterialCommunityIcons 
                              name="email-send-outline" 
                              size={18} 
                              color="#FFFFFF" 
                            />
                          </>
                        )}
                      </LinearGradient>
                    )}
                  </Pressable>

                  <TouchableOpacity
                    style={{ alignSelf: 'center', marginTop: 16, padding: 8 }}
                    onPress={() => { setForgotMode(false); setResetMsg(''); setResetErr(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.primary }}>
                      ← Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardSubtitle}>
                    Sign in to access the Cooperative Portal
                  </Text>

                  {/* Email Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFICIAL EMAIL ID</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="officer@sikkim.gov.in"
                        placeholderTextColor={COLORS.slate400}
                        value={email}
                        onChangeText={(txt) => { setEmail(txt); setResetEmail(txt); }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>PASSWORD</Text>
                    <View style={styles.inputInner}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={COLORS.slate400}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.forgotBtn} 
                    onPress={() => { setForgotMode(true); setResetEmail(email); setResetMsg(''); setResetErr(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* PROCEED Divider */}
                  <View style={styles.proceedDividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>PROCEED</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Sign In CTA Button */}
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.primaryCtaBtnWrapper,
                      pressed && { transform: [{ scale: 0.98 }] },
                      hovered && { opacity: 0.95 }
                    ]}
                    onPress={handleSignIn}
                    disabled={loading}
                  >
                    {({ hovered }) => (
                      <LinearGradient
                        colors={['#7a1a1f', '#4a1017']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.ctaGradient,
                          hovered && Platform.OS === 'web' && { shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.ctaText}>SIGN IN TO PORTAL</Text>
                            <MaterialCommunityIcons 
                              name="arrow-right" 
                              size={18} 
                              color="#FFFFFF" 
                              style={hovered && Platform.OS === 'web' ? { transform: [{ translateX: 4 }] } : null}
                            />
                          </>
                        )}
                      </LinearGradient>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SECURE GOVERNMENT ASSETS • v2.0.4-beta</Text>
            <Text style={styles.footerSubtext}>System generated access tokens are cryptographically monitored.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgEnd,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },

  // Glow Blobs (Matches Dashboard Overview)
  bgBlobTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 600,
    height: 350,
    borderRadius: 300,
    backgroundColor: 'rgba(122, 26, 31, 0.25)',
    zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(74, 16, 23, 0.35)',
    zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    zIndex: -1,
  },

  content: { flex: 1 },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 24 : 36,
    paddingBottom: 36,
    alignItems: 'center',
  },

  // Header Area
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emblemContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 230, 138, 0.4)',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    tintColor: '#FFFFFF',
  },

  govTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 4,
  },
  fullNameSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  deptSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Card & Tabs Container
  cardWrapper: {
    width: '100%',
    maxWidth: 540,
    marginTop: 8,
  },

  // Tabs Header
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28, 4, 6, 0.65)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTabBtn: {
    backgroundColor: 'rgba(122, 26, 31, 0.25)',
  },
  tabBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: '#ffffff',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: COLORS.gold,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // White Form Body
  whiteFormCard: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    fontWeight: '500',
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // Segmented Role Selector (CI vs ACI)
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  // Icon-above-label (column) instead of side-by-side — three flex:1 cells
  // sharing a narrow phone width don't leave room for icon + "ACI (Assistant
  // CI)" on one line, so it used to wrap mid-word with no center alignment.
  activeRoleGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  activeRoleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inactiveRoleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  inactiveRoleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.slate600,
    textAlign: 'center',
  },

  // Input Field Box
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    paddingHorizontal: 14,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.onSurface,
    outlineStyle: 'none',
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 10,
  },
  forgotText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // PROCEED Divider
  proceedDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.slate200,
  },
  dividerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  // Primary CTA Button
  primaryCtaBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // Footer
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  footerSubtext: {
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  }
});

export default Login;
