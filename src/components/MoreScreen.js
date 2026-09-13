import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Image, Platform, Linking } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import HeaderNav from './HeaderNav';
import BottomNav from './BottomNav';

// Same Kanchenjunga photo used in every header, at a much lower opacity so
// it reads as a faint page watermark behind the (mostly white/card-covered)
// scroll content rather than competing with it.
const pageBgPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.05, filter: 'grayscale(1) contrast(1.1)' }
  : { opacity: 0.035 };

// STITCH Design Tokens (Matching Dashboard Overview)
const COLORS = {
  background: "#fcf8fa",
  surface: "#ffffff",
  primary: "#7a1a1f",
  primaryDark: "#4a1017",
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
  amber50: "#fffbeb",
  amber100: "#fef3c7",
  amber600: "#d97706",
  amber700: "#b45309",
  emerald50: "#ecfdf5",
  emerald100: "#d1fae5",
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald700: "#047857",
  red50: "#fef2f2",
  red100: "#fee2e2",
  red600: "#dc2626",
};

const FONT_FAMILY = Platform.select({
  web: 'Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

const ROLE_LABELS = {
  CI: 'Cooperative Inspector',
  ACI: 'Assistant Inspector',
  PA: 'Project Assistant',
};

// Same Supabase auth backend as the field app, so a CI's existing officer
// login works here too — no separate account. Only a CI (never ACI/PA) can
// actually get past the admin dashboard's own canAccessDashboard gate, so
// the link is hidden rather than shown as a dead end for other roles.
const ADMIN_DASHBOARD_URL = 'https://admin-ten-rho-87.vercel.app/';

export default function MoreScreen({
  activeTab = 'more',
  onTabPress,
  onNavigateScreen,
  onOpenBulletins,
  onSignOut,
  user,
  role,
  displayName,
  activeModule = 'MILK',
  selectedSociety,
  institutionsList = [],
  onSelectSociety,
  onManageInstitutions,
  onSwitchModule,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0
}) {
  // Screen keys diverge between the two apps (MPCS prefixes its master data
  // screens with MPCS_; Milk PCS doesn't), so this menu can't use one fixed
  // set of ids for both — navigating with the wrong id sets
  // currentMobileScreen to a key nothing renders, producing a blank screen.
  const menuOptions = [
    // Institutional Profile, Demographics Breakdown, and Compliance & Audit
    // Details used to be listed here too, each opening the exact same screen
    // Master Data's own directory already links to — three+ separate
    // doorways into one screen, which is exactly what let their navigation
    // wiring drift out of sync with each other over time. All three are
    // dropped from this menu entirely; Master Data Directory is the one
    // place to reach them now.
    {
      id: 'BULLETINS',
      label: 'Departmental Bulletins',
      sub: 'View official directives & notifications',
      icon: 'bell-ring-outline',
      color: '#b45309',
      bgColor: '#fffbeb',
    },
    {
      id: 'SYNC_STATUS',
      label: 'Offline Engine Status',
      sub: 'Realtime cloud database sync status',
      icon: 'cloud-sync-outline',
      color: '#0284c7',
      bgColor: '#f0f9ff',
    },
    // Admin dashboard is a separate web app (same Supabase project), so this
    // opens it in the device browser rather than navigating in-app — only a
    // CI can actually sign into it (canAccessDashboard on the admin side),
    // so ACI/PA never see a link that would just dead-end for them.
    ...(role === 'CI' ? [{
      id: 'ADMIN_DASHBOARD',
      label: 'Open Admin Dashboard',
      sub: 'District oversight & reporting, in your browser',
      icon: 'open-in-new',
      color: '#7a1a1f',
      bgColor: '#fdf1f1',
    }] : []),
  ];

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CI';

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/core/kanchenjunga.jpg')}
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, pageBgPhotoFilter]}
        resizeMode="cover"
        pointerEvents="none"
      />
      <HeaderNav
        activeModule={activeModule}
        selectedSociety={selectedSociety}
        institutionsList={institutionsList}
        onSelectSociety={onSelectSociety}
        onManageInstitutions={onManageInstitutions}
        onSwitchModule={onSwitchModule}
        onMenuPress={onManageInstitutions}
        onNotifyPress={onNotifyPress}
        onProfilePress={onProfilePress}
        unreadCount={unreadCount}
        role={role}
      />

      {/* Ambient Decorative Background Blobs (Matches Dashboard Overview) */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
        {/* Officer Profile Card with Gradient */}
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.officerCard}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.officerMeta}>
            <Text style={styles.officerName}>{displayName || 'Cooperative Inspector'}</Text>
            <Text style={styles.officerRole}>
              {ROLE_LABELS[role] || 'Cooperative Inspector'}
              {user?.district ? ` • ${user.district}` : ''}
            </Text>
            <View style={styles.statusChip}>
              <View style={styles.activeDot} />
              <Text style={styles.statusChipText}>System Online • Supabase Sync Active</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Options Group */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>MODULE & SYSTEM OPTIONS</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuOptions.map((opt, index) => (
            <Pressable
              key={opt.id}
              style={({ hovered }) => [
                styles.menuRow,
                index === menuOptions.length - 1 && { borderBottomWidth: 0 },
                Platform.OS === 'web' && { transition: 'all 0.25s ease' },
                hovered && { backgroundColor: COLORS.slate50 }
              ]}
              onPress={() => {
                if (opt.id === 'BULLETINS') {
                  if (onOpenBulletins) onOpenBulletins();
                } else if (opt.id === 'ADMIN_DASHBOARD') {
                  Linking.openURL(ADMIN_DASHBOARD_URL);
                } else if (onNavigateScreen) {
                  onNavigateScreen(opt.id);
                }
              }}
            >
              {({ hovered }) => (
                <>
                  <View style={[styles.iconBox, { backgroundColor: opt.bgColor }]}>
                    <MaterialCommunityIcons name={opt.icon} size={22} color={opt.color} />
                  </View>
                  <View style={styles.menuTextGroup}>
                    <Text style={[styles.menuLabel, hovered && { color: COLORS.primary }]}>{opt.label}</Text>
                    <Text style={styles.menuSub}>{opt.sub}</Text>
                  </View>
                  <View style={[
                    styles.chevronCircle,
                    hovered && { backgroundColor: COLORS.primary, borderColor: 'transparent' }
                  ]}>
                    <MaterialCommunityIcons 
                      name="arrow-right" 
                      size={16} 
                      color={hovered ? '#ffffff' : COLORS.slate400} 
                      style={hovered && Platform.OS === 'web' ? { transform: [{ translateX: 2 }] } : null}
                    />
                  </View>
                </>
              )}
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footerBlock}>
          <Text style={styles.footerLine}>Department of Cooperation • Government of Sikkim</Text>
          <Text style={styles.footerLineMuted}>CORE Engine v2.0.4 • Encrypted Secure Portal</Text>
        </View>

        {/* Sign Out Button */}
        <Pressable
          style={({ hovered, pressed }) => [
            styles.signOutBtn,
            pressed && { transform: [{ scale: 0.98 }] },
            hovered && { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }
          ]}
          onPress={onSignOut}
        >
          <MaterialCommunityIcons name="logout" size={18} color={COLORS.red600} />
          <Text style={styles.signOutText}>SIGN OUT OF CORE ENGINE</Text>
        </Pressable>

        {/* Padding for BottomNav */}
        <View style={{ height: 60 }} />
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Ambient Blobs (Matches Dashboard Overview)
  bgBlobTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(122, 26, 31, 0.06)',
    zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(180, 83, 9, 0.05)',
    zIndex: -1,
  },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 14, gap: 14 },

  officerCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '800', color: COLORS.primary },
  officerMeta: { marginLeft: 14, flex: 1 },
  officerName: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  officerRole: { fontFamily: FONT_FAMILY, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.emerald500,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusChipText: { fontFamily: FONT_FAMILY, fontSize: 10, color: '#FFFFFF', fontWeight: '700' },

  sectionHeaderRow: { paddingHorizontal: 2, marginTop: 4 },
  sectionHeading: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate700,
    letterSpacing: 1.2,
  },
  
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextGroup: { flex: 1, marginLeft: 14 },
  menuLabel: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.onSurface },
  menuSub: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate500, marginTop: 2, fontWeight: '500' },
  
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerBlock: { alignItems: 'center', paddingTop: 8, paddingBottom: 16, gap: 4 },
  footerLine: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '500', color: COLORS.slate400 },
  footerLineMuted: { fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '400', color: 'rgba(148,163,184,0.8)' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.red50,
    borderWidth: 1,
    borderColor: COLORS.red100,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  signOutText: { fontFamily: FONT_FAMILY, color: COLORS.red600, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
});
