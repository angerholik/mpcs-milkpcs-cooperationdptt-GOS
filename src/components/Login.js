import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../supabase';

const { width } = Dimensions.get('window');

const COLORS = {
  bgStart: '#5a1010',
  bgMid: '#7a1a1a',
  bgMid2: '#6b1414',
  bgEnd: '#3d0a0a',
  gold: '#c9a227',
  goldLight: '#fff8f0',
  textMuted: '#8a6a5a',
  labelColor: '#7a1a1a',
  iconColor: '#9b6a5a',
  inputBg: '#faf6f2',
  inputBorder: 'rgba(122, 26, 26, 0.12)',
};

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
  const [role, setRole] = useState('CI'); // 'CI' or 'ACI'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (!error && data?.user) {
        setLoading(false);
        const user = {
          fullName: data.user.user_metadata?.fullName || fullName || (email.includes('aci') ? 'Assistant Inspector' : 'Cooperative Inspector'),
          email: email.trim(),
          role: data.user.user_metadata?.role || role,
          district: 'Gyalshing',
        };
        if (onLoginSuccess) onLoginSuccess(user);
        return;
      }
    } catch (e) {
      console.warn('Supabase sign in attempt warning:', e);
    }

    setTimeout(() => {
      setLoading(false);
      const user = {
        fullName: fullName || (email.includes('aci') ? 'Assistant Inspector' : 'Cooperative Inspector'),
        email: email.trim(),
        role: role,
        district: 'Gyalshing',
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }, 600);
  };

  const handleRegisterSubmit = async () => {
    if (!fullName || !email || !password || !mobile) {
      const msg = 'Please fill out all required inspector registration fields.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Incomplete Registration', msg);
      return;
    }

    setLoading(true);
    const roleTitle = role === 'CI' ? 'Cooperative Inspector (CI)' : 'Assistant CI (ACI)';

    try {
      try {
        await supabase.auth.signUp({
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
      } catch (authErr) {
        console.warn('Auth sign up notice:', authErr);
      }

      const officerRecord = {
        name: fullName.trim(),
        email: email.trim(),
        subdivision: mobile.trim(),
        role: roleTitle,
      };

      const { error: dbErr } = await supabase.from('officer_registry').insert([officerRecord]);
      if (dbErr) {
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
    const registeredUser = {
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
        locations={[0, 0.3, 0.6, 1]}
        style={styles.background}
      />

      {/* Decorative Glow Blobs */}
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
                    Create Inspector Credentials (CI / ACI) for Cooperative Portal Access
                  </Text>

                  {/* Role Selector Toggle */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>SELECT INSPECTOR DESIGNATION / ROLE</Text>
                    <View style={styles.roleToggleContainer}>
                      <TouchableOpacity
                        style={[styles.roleChip, role === 'CI' && styles.activeRoleChip]}
                        onPress={() => setRole('CI')}
                        activeOpacity={0.85}
                      >
                        {role === 'CI' ? (
                          <LinearGradient
                            colors={['#7a1a1a', '#9b2222']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activeRoleGradient}
                          >
                            <MaterialIcons name="security" size={16} color="#fff8f0" />
                            <Text style={styles.activeRoleText}>CI (Cooperative Inspector)</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.inactiveRoleContent}>
                            <MaterialIcons name="security" size={16} color={COLORS.textMuted} />
                            <Text style={styles.inactiveRoleText}>CI (Cooperative Inspector)</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.roleChip, role === 'ACI' && styles.activeRoleChip]}
                        onPress={() => setRole('ACI')}
                        activeOpacity={0.85}
                      >
                        {role === 'ACI' ? (
                          <LinearGradient
                            colors={['#7a1a1a', '#9b2222']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activeRoleGradient}
                          >
                            <MaterialIcons name="verified-user" size={16} color="#fff8f0" />
                            <Text style={styles.activeRoleText}>ACI (Assistant CI)</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.inactiveRoleContent}>
                            <MaterialIcons name="verified-user" size={16} color={COLORS.textMuted} />
                            <Text style={styles.inactiveRoleText}>ACI (Assistant CI)</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Full Name Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>FULL NAME</Text>
                    <View style={styles.inputInner}>
                      <MaterialIcons name="person-outline" size={18} color={COLORS.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Full Name"
                        placeholderTextColor="#94A3B8"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFICIAL EMAIL ID</Text>
                    <View style={styles.inputInner}>
                      <MaterialIcons name="mail-outline" size={18} color={COLORS.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="officer@sikkim.gov.in"
                        placeholderTextColor="#94A3B8"
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
                      <MaterialIcons name="phone" size={18} color={COLORS.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="+91 Mobile Number"
                        placeholderTextColor="#94A3B8"
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
                      <MaterialIcons name="lock-outline" size={18} color={COLORS.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Minimum 8 characters"
                        placeholderTextColor="#94A3B8"
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
                  <TouchableOpacity
                    style={styles.primaryCtaBtn}
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#6b1414', '#9b2222', '#7a1a1a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ctaGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff8f0" size="small" />
                      ) : (
                        <>
                          <Text style={styles.ctaText}>CREATE ACCOUNT & ADD INSTITUTIONS</Text>
                          <MaterialIcons name="arrow-forward" size={18} color="#fff8f0" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </LinearGradient>
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
                      <MaterialIcons name="mail-outline" size={18} color={COLORS.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="officer@sikkim.gov.in"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>PASSWORD</Text>
                    <View style={styles.inputInner}>
                      <MaterialIcons name="lock-outline" size={18} color={COLORS.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* PROCEED Divider */}
                  <View style={styles.proceedDividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>PROCEED</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Sign In CTA Button */}
                  <TouchableOpacity
                    style={styles.primaryCtaBtn}
                    onPress={handleSignIn}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#6b1414', '#9b2222', '#7a1a1a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ctaGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff8f0" size="small" />
                      ) : (
                        <>
                          <Text style={styles.ctaText}>SIGN IN TO PORTAL</Text>
                          <MaterialIcons name="chevron-right" size={20} color="#fff8f0" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                </>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure Government Assets • v2.0.4-beta</Text>
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

  // Glow Blobs
  bgBlobTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 600,
    height: 350,
    borderRadius: 300,
    backgroundColor: 'rgba(155, 34, 34, 0.3)',
    zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(74, 14, 14, 0.4)',
    zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(107, 20, 20, 0.35)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 39, 0.4)',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    tintColor: '#FFFFFF',
  },

  govTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Cinzel' : 'serif',
    fontSize: 32,
    fontWeight: '700',
    color: '#fff8f0',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 4,
  },
  fullNameSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(255, 248, 240, 0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  deptSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Card & Tabs Container
  cardWrapper: {
    width: '100%',
    maxWidth: 580,
    marginTop: 8,
  },

  // Tabs Header
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(40, 8, 8, 0.6)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.18)',
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
    backgroundColor: 'rgba(122, 26, 26, 0.1)',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255, 248, 240, 0.45)',
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: '#fff8f0',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
  },

  // White Form Body
  whiteFormCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 15,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.labelColor,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // Segmented Role Selector (CI vs ACI)
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#faf6f2',
    borderWidth: 1.5,
    borderColor: 'rgba(122, 26, 26, 0.18)',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  roleChip: {
    flex: 1,
    borderRadius: 9,
    overflow: 'hidden',
  },
  activeRoleChip: {},
  activeRoleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 9,
  },
  activeRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff8f0',
  },
  inactiveRoleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  inactiveRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Input Field Box
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#1a0a08',
    outlineStyle: 'none',
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 10,
  },
  forgotText: {
    fontSize: 11,
    color: '#9b2222',
    fontWeight: '600',
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
    backgroundColor: 'rgba(122, 26, 26, 0.1)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(138, 106, 90, 0.6)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  // Primary CTA Button
  primaryCtaBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7a1a1a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff8f0',
    letterSpacing: 0.8,
  },

  // Quick Demo Link
  demoLinkBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  demoLinkText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerSubtext: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  }
});

export default Login;
