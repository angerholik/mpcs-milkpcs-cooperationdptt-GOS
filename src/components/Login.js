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
import { MountainSilhouette, RhododendronCluster, PagodaSilhouette } from './LoginBackgroundArt';

const { width } = Dimensions.get('window');

// Design tokens pinned to the exact hex values in the design spec, not the
// nearest Tailwind slate shade — this screen is meant to match a specific
// mockup pixel-for-pixel, unlike the rest of the app's screens.
const COLORS = {
  bgStart: "#3b080b",
  bgMid: "#7D2427",       // Secondary
  bgMid2: "#6D0F14",      // Primary Maroon
  bgEnd: "#1c0406",
  gold: "#F4E1B5",        // Gold Accent
  goldDark: "#b45309",
  surface: "#FFFFFF",     // Card Background
  onSurface: "#1F1F1F",   // Primary Text
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#6B7280",    // Secondary Text
  slate400: "#9CA3AF",    // Placeholder
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#F8F9FB",     // Input Background
  primary: "#6D0F14",     // Primary Maroon
  primaryHover: "#A31D24",// Button Hover
  primaryDark: "#4a0d10",
  secondary: "#7D2427",
  linkAccent: "#DC2626",  // Link / Accent
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

  const [showPassword, setShowPassword] = useState(false);

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
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        // Without this, Supabase falls back to the project's default Site
        // URL, which may not point at this app at all — the reset link
        // would land somewhere with no code to handle it.
        redirectTo: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined,
      });
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

      {/* Mountain range up top, per the design spec's "Assets You'll Need"
          list — sits behind the header, which is always at the top of the
          scroll content so a fixed absolute position works here. The
          rhododendron/pagoda motifs are NOT fixed the same way: this screen's
          content (especially the Register tab) is often taller than the
          viewport, and an absolutely-positioned "bottom" would land mid-scroll
          under the white card instead of at the true bottom of the page — so
          those render inline at the end of the ScrollView content instead. */}
      <View style={styles.mountainArt} pointerEvents="none">
        <MountainSilhouette />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerArea}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerSideCol}>
                <Text style={styles.headerTagline}>People</Text>
                <Text style={styles.headerTagline}>Cooperation</Text>
                <Text style={styles.headerTagline}>Progress</Text>
              </View>

              <View style={styles.headerCenterCol}>
                <View style={styles.emblemContainer}>
                  <SikkimEmblem />
                </View>
                <Text style={styles.govTitle}>CORE</Text>
              </View>

              <View style={[styles.headerSideCol, styles.headerSideColRight]}>
                <Text style={[styles.headerTagline, styles.headerTaglineItalic]}>Stronger</Text>
                <Text style={[styles.headerTagline, styles.headerTaglineItalic]}>Cooperatives</Text>
                <Text style={[styles.headerTagline, styles.headerTaglineItalic, styles.headerTaglineUnderline]}>A Brighter Sikkim</Text>
              </View>
            </View>

            <Text style={styles.fullNameSub}>Cooperative Oversight & Reporting Engine</Text>
            <View style={styles.headerGoldDivider} />
            <Text style={styles.deptSubtitle}>Department of Cooperation</Text>
            <Text style={styles.govSubtitle}>Government of Sikkim</Text>
          </View>

          {/* Form Card Container */}
          <View style={styles.cardWrapper}>
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
                            colors={[COLORS.primary, COLORS.primaryDark]}
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
                            colors={[COLORS.primary, COLORS.primaryDark]}
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
                            colors={[COLORS.primary, COLORS.primaryDark]}
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
                        colors={[COLORS.primary, COLORS.primaryDark]}
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

                  <View style={styles.switchModeDivider} />
                  <View style={styles.switchModeRow}>
                    <Text style={styles.switchModeText}>Already registered? </Text>
                    <TouchableOpacity onPress={() => setTab('signin')} activeOpacity={0.7}>
                      <Text style={styles.switchModeLink}>Sign in →</Text>
                    </TouchableOpacity>
                  </View>
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
                        colors={[COLORS.primary, COLORS.primaryDark]}
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
                  <Text style={styles.welcomeHeading}>Welcome back</Text>
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
                      {email ? (
                        <TouchableOpacity
                          style={styles.inputClearBtn}
                          onPress={() => { setEmail(''); setResetEmail(''); }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="close" size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      ) : null}
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
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeToggleBtn}
                        onPress={() => setShowPassword((v) => !v)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.slate500} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => { setForgotMode(true); setResetEmail(email); setResetMsg(''); setResetErr(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

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
                        colors={[COLORS.primary, COLORS.primaryDark]}
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
                            <Text style={styles.ctaText}>SIGN IN</Text>
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

                  <View style={styles.switchModeDivider} />
                  <View style={styles.switchModeRow}>
                    <Text style={styles.switchModeText}>New Inspector? </Text>
                    <TouchableOpacity onPress={() => setTab('register')} activeOpacity={0.7}>
                      <Text style={styles.switchModeLink}>Register here →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerIconRow}>
              <View style={styles.footerIconItem}>
                <View style={styles.footerIconCircle}>
                  <MaterialCommunityIcons name="shield-check-outline" size={26} color={COLORS.gold} />
                </View>
                <Text style={styles.footerIconLabel}>Secure{'\n'}Access</Text>
              </View>
              <View style={styles.footerIconItem}>
                <View style={styles.footerIconCircle}>
                  <MaterialCommunityIcons name="account-group-outline" size={26} color={COLORS.gold} />
                </View>
                <Text style={styles.footerIconLabel}>For a Stronger{'\n'}Cooperative Ecosystem</Text>
              </View>
              <View style={styles.footerIconItem}>
                <View style={styles.footerIconCircle}>
                  <MaterialCommunityIcons name="leaf" size={26} color={COLORS.gold} />
                </View>
                <Text style={styles.footerIconLabel}>Government{'\n'}of Sikkim</Text>
              </View>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerVersionRow}>
              <Text style={styles.footerVersionText}>Version 2.0.4</Text>
              <MaterialCommunityIcons name="lock-outline" size={11} color="rgba(255,255,255,0.4)" style={{ marginHorizontal: 6 }} />
              <Text style={styles.footerVersionText}>Secure government system</Text>
            </View>
          </View>

          {/* Rhododendron / monastery motifs — see the comment above the
              mountain art for why these live in the scroll flow instead of
              as a fixed absolute background layer. */}
          <View style={styles.bottomArtRow} pointerEvents="none">
            <RhododendronCluster size={130} />
            <PagodaSilhouette width={155} height={96} />
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

  // Decorative Sikkim Motifs
  mountainArt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomArtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    maxWidth: 540,
    marginTop: 24,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 225, 181, 0.4)',
    padding: 12,
    marginBottom: 12,
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

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  headerSideCol: {
    width: 78,
    alignItems: 'flex-start',
  },
  headerSideColRight: {
    alignItems: 'flex-end',
  },
  headerTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 15,
  },
  headerTaglineItalic: {
    fontStyle: 'italic',
    color: 'rgba(253, 230, 138, 0.75)',
  },
  headerTaglineUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
    paddingBottom: 3,
  },
  headerCenterCol: {
    alignItems: 'center',
  },
  govTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 8,
    textAlign: 'center',
  },
  fullNameSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerGoldDivider: {
    width: 48,
    height: 1.5,
    backgroundColor: COLORS.gold,
    marginBottom: 10,
  },
  deptSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
    textAlign: 'center',
  },
  govSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Card Container
  cardWrapper: {
    width: '100%',
    maxWidth: 540,
    marginTop: 32,
  },

  // White Form Body
  whiteFormCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  welcomeHeading: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: COLORS.slate500,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '400',
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
    letterSpacing: 0.5,
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
    height: 52,
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
  inputClearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.slate400,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  eyeToggleBtn: {
    padding: 4,
    marginLeft: 4,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 10,
  },
  forgotText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: COLORS.linkAccent,
    fontWeight: '500',
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
    minHeight: 52,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Switch Mode (sign in ↔ register), replaces the old top tab bar
  switchModeDivider: {
    height: 1,
    backgroundColor: COLORS.slate200,
    marginTop: 22,
    marginBottom: 16,
  },
  switchModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  switchModeLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.linkAccent,
  },

  // Footer
  footer: {
    marginTop: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 540,
  },
  footerIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  footerIconItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  footerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(244, 225, 181, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  footerIconLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 15,
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    width: '80%',
    marginTop: 20,
    marginBottom: 14,
  },
  footerVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerVersionText: {
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10.5,
    fontWeight: '600',
  },
});

export default Login;
