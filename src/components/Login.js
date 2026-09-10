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

// Design tokens pinned to the reference spec's exact palette.
const COLORS = {
  maroon: "#5A0710",
  maroonDark: "#47050C",
  burgundy: "#7A0D18",
  gold: "#E3B94F",
  surface: "#FFFFFF",
  offWhite: "#FAFAFA",
  mutedBlue: "#71839B",
  darkNavy: "#26384F",
  onSurface: "#26384F",
  slate600: "#71839B",
  slate500: "#71839B",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  slate50: "#F8FAFC",
  primary: "#7A0D18",
};

// Body text uses the same Inter typeface as the admin dashboard's login
// (loaded there via a Google Fonts <link>). The previous FONT_FAMILY was
// only a CSS font-stack string — real "Inter" only on web, with iOS/Android
// silently falling back to their system fonts instead. Inter is now loaded
// for real via @expo-google-fonts/inter + useFonts() in App.js, so native
// builds render actual Inter too. React Native doesn't synthesize font
// weights the way a browser does — each weight is its own registered font
// family name, so callers pick the weight through this helper rather than
// pairing a generic fontFamily with a separate fontWeight.
const INTER_BY_WEIGHT = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
};
const interFont = (weight = '400') => INTER_BY_WEIGHT[String(weight)] || INTER_BY_WEIGHT['400'];

// Kept for the couple of spots (native Alert titles, etc.) that still want
// a platform-appropriate fallback stack rather than a specific weight.
const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

// The CORE wordmark uses the same Cinzel serif as the admin dashboard's
// login (loaded there via a Google Fonts <link>; here via the
// @expo-google-fonts/cinzel package + useFonts() in App.js, which
// registers this exact family name on both web and native builds).
const DISPLAY_FONT_FAMILY = 'Cinzel_700Bold';

// React Native has no CSS filter/mix-blend-mode/mask-image — grayscale,
// duotone photo treatment is approximated everywhere via opacity + a
// semi-transparent maroon overlay + a gradient fade into the background,
// which are genuinely supported on both native and web. On web specifically
// (React Native Web passes unrecognized style keys straight through to the
// DOM), a real CSS `filter` is layered on top for a closer duotone match —
// native builds fall back to the opacity/overlay approximation only.
const webPhotoFilter = Platform.OS === 'web' ? { filter: 'grayscale(0.4) brightness(0.6) contrast(1.25)' } : {};

// Official Sikkim Government Seal — the real emblem downloaded from Wikimedia
// Commons (Special:Redirect/file/Seal_of_Sikkim.svg), rasterized to PNG since
// this project has no SVG-via-Image transformer installed (see assets/core/).
function SikkimEmblem() {
  return (
    <Image
      source={require('../../assets/core/sikkim-emblem-official.png')}
      style={styles.emblemImage}
      resizeMode="contain"
    />
  );
}

const Login = ({ onLoginSuccess, onRegisterSuccess }) => {
  const [tab, setTab] = useState('signin'); // 'signin' or 'register'
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
      {/* Base maroon gradient */}
      <LinearGradient
        colors={[COLORS.maroon, COLORS.maroonDark]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      />

      {/* Kanchenjunga photo behind the header, duotone-treated and faded
          into the maroon background toward the card. */}
      <View style={styles.mountainPhotoWrap} pointerEvents="none">
        <Image
          source={require('../../assets/core/kanchenjunga.jpg')}
          style={[styles.mountainPhoto, webPhotoFilter]}
          resizeMode="cover"
        />
        <View style={styles.mountainTint} />
        <LinearGradient
          colors={['transparent', COLORS.maroon]}
          start={{ x: 0.5, y: 0.55 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Rhododendron (bottom-left) + Enchey Monastery (bottom-right),
          partially cropped by the viewport, faded into the background. */}
      <View style={styles.bottomPhotoStrip} pointerEvents="none">
        <View style={styles.bottomPhotoLeft}>
          <Image
            source={require('../../assets/core/rhododendron.jpg')}
            style={[styles.bottomPhotoImg, webPhotoFilter]}
            resizeMode="cover"
          />
          <View style={styles.bottomPhotoTint} />
        </View>
        <View style={styles.bottomPhotoRight}>
          <Image
            source={require('../../assets/core/enchey-monastery.jpg')}
            style={[styles.bottomPhotoImg, webPhotoFilter]}
            resizeMode="cover"
          />
          <View style={styles.bottomPhotoTint} />
        </View>
        <LinearGradient
          colors={[COLORS.maroon, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

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
                            colors={['#8B111C', '#650810']}
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
                            colors={['#8B111C', '#650810']}
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
                            colors={['#8B111C', '#650810']}
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
                        colors={['#8B111C', '#650810']}
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
                      <Text style={{ fontFamily: interFont('700'), fontSize: 12, color: '#047857', textAlign: 'center' }}>
                        {resetMsg}
                      </Text>
                    </View>
                  ) : null}

                  {resetErr ? (
                    <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 14 }}>
                      <Text style={{ fontFamily: interFont('700'), fontSize: 12, color: '#dc2626', textAlign: 'center' }}>
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
                        colors={['#8B111C', '#650810']}
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
                    <Text style={{ fontFamily: interFont('800'), fontSize: 12, color: COLORS.primary }}>
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
                          accessibilityLabel="Clear email"
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
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.darkNavy} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => { setForgotMode(true); setResetEmail(email); setResetMsg(''); setResetErr(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
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
                        colors={['#8B111C', '#650810']}
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
            <View style={styles.footerDivider} />
            <View style={styles.footerVersionRow}>
              <Text style={styles.footerVersionText}>Version 2.0.4</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.maroonDark,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },

  // Kanchenjunga photo behind the header
  mountainPhotoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 460,
    overflow: 'hidden',
  },
  mountainPhoto: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mountainTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(71, 5, 12, 0.45)',
  },

  // Rhododendron (left) + Enchey Monastery (right) at the very bottom
  bottomPhotoStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bottomPhotoLeft: { flex: 1, overflow: 'hidden' },
  bottomPhotoRight: { flex: 1, overflow: 'hidden' },
  bottomPhotoImg: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  bottomPhotoTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(71, 5, 12, 0.55)',
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
    marginBottom: 12,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    tintColor: '#FFFFFF',
    opacity: 0.6,
    ...(Platform.OS === 'web' ? { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' } : {}),
  },

  govTitle: {
    fontFamily: DISPLAY_FONT_FAMILY,
    fontSize: 34,
    color: '#ffffff',
    letterSpacing: 5,
    textAlign: 'center',
    marginBottom: 4,
  },
  fullNameSub: {
    fontFamily: interFont('500'),
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerGoldDivider: {
    width: 150,
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.8,
    marginBottom: 10,
  },
  deptSubtitle: {
    fontFamily: interFont('700'),
    fontSize: 15,
    color: COLORS.gold,
    textAlign: 'center',
  },
  govSubtitle: {
    fontFamily: interFont('400'),
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Card Container
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    marginTop: 8,
  },

  // White Form Body
  whiteFormCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
  },
  welcomeHeading: {
    fontFamily: interFont('800'),
    fontSize: 24,
    color: COLORS.darkNavy,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: interFont('400'),
    fontSize: 13.5,
    color: COLORS.mutedBlue,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 18,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: interFont('700'),
    fontSize: 12,
    color: COLORS.darkNavy,
    letterSpacing: 1,
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
    fontFamily: interFont('800'),
    fontSize: 10.5,
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
    fontFamily: interFont('700'),
    fontSize: 10.5,
    color: COLORS.slate600,
    textAlign: 'center',
  },

  // Input Field Box — matches the admin login's polished treatment (a
  // border light enough to blend into a light background read as
  // "undefined/flat" there, until it was darkened with an inset shadow).
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    paddingHorizontal: 14,
    height: 52,
    ...(Platform.OS === 'web' ? { boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)' } : {}),
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: interFont('500'),
    fontSize: 15,
    color: COLORS.onSurface,
    outlineStyle: 'none',
  },
  inputClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    marginBottom: 14,
  },
  forgotText: {
    fontFamily: interFont('600'),
    fontSize: 13.5,
    color: COLORS.burgundy,
  },

  // Primary CTA Button
  primaryCtaBtnWrapper: { borderRadius: 20, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    shadowColor: COLORS.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontFamily: interFont('800'),
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },

  // Switch Mode (sign in ↔ register), replaces the old top tab bar
  switchModeDivider: {
    height: 1,
    backgroundColor: COLORS.slate200,
    marginTop: 20,
    marginBottom: 16,
  },
  switchModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeText: {
    fontFamily: interFont('400'),
    fontSize: 14,
    color: COLORS.mutedBlue,
  },
  switchModeLink: {
    fontFamily: interFont('700'),
    fontSize: 14,
    color: COLORS.burgundy,
  },

  // Footer
  footer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  footerDivider: {
    height: 1,
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  footerVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerVersionText: {
    fontFamily: interFont('400'),
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
  },
});

export default Login;
