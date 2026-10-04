import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StatusBar, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import PressScale from './PressScale';

// Shared page header for the app's top-level screens: diagonal brand-maroon
// gradient, layered wave shapes for depth, a vignette, rounded bottom
// corners, and frosted-glass icon buttons. Two variants so every screen
// reads as the same app:
//   - "hero":    taller, brand wordmark row + title + free-form `children`
//                (Home: society name, location chip, status line)
//   - "compact": one row — optional back arrow, title (+ subtitle), avatar
//                (Records, Profile, More, and sub-screens)

const BRAND = {
  brand500: '#9B1C1C',
  brand700: '#641B1B',
  brand800: '#4D1414',
  brand900: '#380F0F',
  amber200: '#FDE68A',
};
const FONT_FAMILY = 'Manrope';

// Web-only effects — React Native has no blur primitives, and on native the
// plain translucent fills underneath still read fine without them.
const blurStyle = (px) => (Platform.OS === 'web' ? { filter: `blur(${px}px)` } : {});
const glassStyle = (px) => (Platform.OS === 'web' ? { backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)` } : {});

// Layered organic wave bands in the maroon ramp — depth and movement
// without a photo.
function HeaderWaves() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFillObject}>
      <Path d="M-20,40 C60,-10 120,90 210,55 C300,20 340,90 420,70 L420,-20 L-20,-20 Z" fill="rgba(255,255,255,0.06)" />
      <Path d="M-20,120 C70,70 140,170 230,120 C310,78 360,150 420,115 L420,-20 L-20,-20 Z" fill={BRAND.brand500} fillOpacity={0.35} />
      <Path d="M-20,190 C80,140 150,230 240,185 C320,145 370,205 420,175 L420,320 L-20,320 Z" fill={BRAND.brand800} fillOpacity={0.55} />
      <Path d="M-20,250 C90,210 170,290 260,245 C330,210 380,260 420,235 L420,320 L-20,320 Z" fill={BRAND.brand900} fillOpacity={0.6} />
    </Svg>
  );
}

function BellButton({ onPress, showDot, dotStyle }) {
  return (
    <PressScale
      onPress={onPress}
      hitSlop={8}
      scaleTo={0.88}
      style={({ pressed }) => [styles.iconBtn, glassStyle(10), pressed && { backgroundColor: 'rgba(255,255,255,0.2)' }]}
    >
      <MaterialCommunityIcons name="bell-outline" size={18} color="rgba(255,255,255,0.9)" />
      {showDot ? <Animated.View style={[styles.dot, dotStyle]} /> : null}
    </PressScale>
  );
}

function AvatarButton({ initials, onPress }) {
  return (
    <PressScale onPress={onPress} hitSlop={8} scaleTo={0.9} style={[styles.avatar, glassStyle(10)]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </PressScale>
  );
}

export default function ScreenHeader({
  variant = 'compact',
  title,
  subtitle,
  brand = 'CORE',
  onBrandPress,
  onBack,
  initials = 'CI',
  onAvatarPress,
  onNotifyPress,
  showAlertDot = false,
  alertDotStyle,
  children,
}) {
  const hero = variant === 'hero';
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.brand900} />
      <LinearGradient
        colors={[BRAND.brand500, BRAND.brand700, BRAND.brand900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, hero ? styles.headerHero : styles.headerCompact]}
      >
        <HeaderWaves />
        <LinearGradient
          colors={['rgba(79,17,17,0.55)', 'rgba(79,17,17,0)', 'rgba(79,17,17,0.5)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={[styles.blobTop, blurStyle(28)]} pointerEvents="none" />
        <View style={[styles.blobBottom, blurStyle(20)]} pointerEvents="none" />

        {hero ? (
          <>
            <View style={styles.heroTopRow}>
              <Pressable onPress={onBrandPress} hitSlop={8}>
                <Text style={styles.wordmark}>{brand}</Text>
              </Pressable>
              <View style={styles.actions}>
                {onNotifyPress ? <BellButton onPress={onNotifyPress} showDot={showAlertDot} dotStyle={alertDotStyle} /> : null}
                <AvatarButton initials={initials} onPress={onAvatarPress} />
              </View>
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>{title}</Text>
            {children}
          </>
        ) : (
          <View style={styles.compactRow}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
              </Pressable>
            ) : null}
            <View style={styles.compactTitleWrap}>
              <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={styles.compactSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            <View style={styles.actions}>
              {onNotifyPress ? <BellButton onPress={onNotifyPress} showDot={showAlertDot} dotStyle={alertDotStyle} /> : null}
              <AvatarButton initials={initials} onPress={onAvatarPress} />
            </View>
          </View>
        )}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerHero: { paddingTop: 14, paddingBottom: 24 },
  headerCompact: { paddingTop: Platform.OS === 'ios' ? 44 : 14, paddingBottom: 18 },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -64,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -48,
    left: '22%',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(244,63,94,0.1)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wordmark: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 28, height: 28, justifyContent: 'center' },
  compactTitleWrap: { flex: 1 },
  compactTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  compactSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(254,205,211,0.9)',
    letterSpacing: 0.6,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.amber200,
    borderWidth: 2,
    borderColor: '#5C1313',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
