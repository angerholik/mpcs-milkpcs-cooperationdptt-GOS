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
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../supabase';

const { width } = Dimensions.get('window');

const COLORS = {
  emerald: '#064E3B',
  emeraldLight: '#047857',
  gold: '#D4AF37',
  goldLight: '#FBBF24',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

const Login = ({ onBypass }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        alert('Required Fields: Please enter both your Officer Email and Access Key.');
      } else {
        Alert.alert('Required Fields', 'Please enter both your Officer Email and Access Key.');
      }
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      if (Platform.OS === 'web') {
        alert('Access Denied: ' + error.message);
      } else {
        Alert.alert('Access Denied', error.message);
      }
    }
    setLoading(false);
  };

  const handleDevBypass = () => {
    // Direct call to bypass provided by App container
    if (onBypass) onBypass();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.emerald, '#022C22']}
        style={styles.background}
      />

      <View style={styles.bgBlobLeft} />
      <View style={styles.bgBlobRight} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerArea}>
          <View style={styles.emblemContainer}>
            <Image
              source={require('../../assets/Seal_of_Sikkim_greyscale.png')}
              style={styles.emblem}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.govTitle}>CORE</Text>
          <Text style={styles.fullName}>COOPERATIVE OVERSIGHT & REPORTING ENGINE</Text>
          <Text style={styles.deptSubitle}>DEPARTMENT OF COOPERATION • GOVERNMENT OF SIKKIM</Text>
        </View>

        <View style={styles.loginCard}>
          <Text style={styles.cardInfo}>Enter your official credentials to proceed with field verification.</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Officer Email ID</Text>
            <View style={styles.inputInner}>
              <MaterialIcons name="badge" size={20} color={COLORS.emerald} style={styles.inputIcon} />
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

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Access Key (Secret)</Text>
            <View style={styles.inputInner}>
              <MaterialIcons name="vpn-key" size={20} color={COLORS.emerald} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.emeraldLight, COLORS.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.surface} size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>VERIFY & ENTER</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={COLORS.gold} style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bypassBtn}
            onPress={handleDevBypass}
          >
            <Text style={styles.bypassText}>DEVELOPMENT BYPASS (INTERNAL USE ONLY)</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Government Assets • v2.0.4-beta</Text>
          <Text style={styles.footerSubtext}>System generated access tokens are cryptographically monitored.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022C22',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bgBlobLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  bgBlobRight: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emblemContainer: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 45,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  emblem: {
    width: '100%',
    height: '100%',
    tintColor: '#FFFFFF',
  },
  govTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Cinzel' : 'serif',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  fullName: {
    fontFamily: Platform.OS === 'ios' ? 'Cinzel' : 'serif',
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
  },
  deptSubitle: {
    fontFamily: Platform.OS === 'ios' ? 'Cinzel' : 'serif',
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.goldLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
    textAlign: 'center',
  },
  loginCard: {
    width: width * 0.85,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.emerald,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  loginBtn: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bypassBtn: {
    marginTop: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.1)',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  bypassText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginBtnGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
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
    marginTop: 5,
    paddingHorizontal: 40,
  }
});

export default Login;
