import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../utils/webStyles';
import HeaderNav from './HeaderNav';
import BottomNav from './BottomNav';

// Same palette as MpcsMasterDataListScreen / the redesigned Profile screen —
// flat maroon/cream, no gradients, no photo, no shadowed cards. This screen
// used to run its own gradient officer card + page-watermark photo +
// decorative blobs + slate/emerald scale left over from an earlier design
// pass; brought in line so More doesn't look like a different app from
// Master Data/Cash Book/CSC/Profile. (HeaderNav above this screen still
// carries its own photo — it's shared with Home/Records and out of scope
// here.)
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  green700: '#15803D',
  amber50: '#FFF7ED',
  amber700: '#B45309',
  blue50: '#EFF6FF',
  blue700: '#0369A1',
  red600: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FEE2E2',
};

const FONT_FAMILY = 'Manrope';

const ROLE_LABELS = {
  CI: 'Cooperative Inspector',
  ACI: 'Assistant Inspector',
  PA: 'Project Assistant',
};

// Same Supabase auth backend as the field app, so a CI's existing officer
// login works here too — no separate account. Only a CI (never ACI/PA) can
// actually get past the admin dashboard's own canAccessDashboard gate, so
// the link is hidden rather than shown as a dead end for other roles.
//
// ?relogin=1 tells the admin dashboard to sign out any session already
// cached in that browser before showing itself — without it, a CI tapping
// this on a shared/device browser that still has another officer's admin
// session saved would land straight in THAT officer's dashboard instead of
// a login screen.
const ADMIN_DASHBOARD_URL = 'https://admin-ten-rho-87.vercel.app/?relogin=1';

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
    //
    // Cash Book and CSC Transactions are different: they're not master
    // records, they're day-to-day ledgers with no fixed spot in the
    // monthly wizard. The redesigned MPCS Home dropped the Quick Actions
    // shortcut grid that used to be their only entry point, so this menu
    // is now the one place to reach them.
    ...(activeModule === 'MPCS' ? [
      {
        id: 'MPCS_DAILY_TRANS',
        label: 'Cash Book',
        sub: 'Record day-to-day cash entries',
        icon: 'notebook-outline',
        color: COLORS.maroon,
        bgColor: COLORS.amber50,
      },
      {
        id: 'MPCS_CSC_TRANS',
        label: 'CSC Transactions',
        sub: 'Log Common Service Center transactions',
        icon: 'laptop',
        color: COLORS.blue700,
        bgColor: COLORS.blue50,
      },
    ] : []),
    {
      id: 'BULLETINS',
      label: 'Departmental Bulletins',
      sub: 'View official directives & notifications',
      icon: 'bell-ring-outline',
      color: COLORS.amber700,
      bgColor: COLORS.amber50,
    },
    {
      id: 'SYNC_STATUS',
      label: 'Offline Engine Status',
      sub: 'Realtime cloud database sync status',
      icon: 'cloud-sync-outline',
      color: COLORS.blue700,
      bgColor: COLORS.blue50,
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
      color: COLORS.maroon,
      bgColor: COLORS.amber50,
    }] : []),
  ];

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CI';

  return (
    <View style={styles.container}>
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

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
        <View style={styles.officerCard}>
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
        </View>

        {/* Menu Options Group */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Module & system options</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuOptions.map((opt, index) => (
            <Pressable
              key={opt.id}
              style={({ hovered }) => [
                styles.menuRow,
                index === menuOptions.length - 1 && { borderBottomWidth: 0 },
                Platform.OS === 'web' && { transition: 'all 0.25s ease' },
                hovered && { backgroundColor: COLORS.bg }
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
                    <Text style={[styles.menuLabel, hovered && { color: COLORS.maroon }]}>{opt.label}</Text>
                    <Text style={styles.menuSub}>{opt.sub}</Text>
                  </View>
                  <View style={[
                    styles.chevronCircle,
                    hovered && { backgroundColor: COLORS.maroon, borderColor: 'transparent' }
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
            hovered && { backgroundColor: COLORS.redBorder, borderColor: '#fca5a5' }
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
    backgroundColor: COLORS.bg,
  },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, gap: 14 },

  officerCard: {
    backgroundColor: COLORS.maroon,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '800', color: COLORS.maroon },
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
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green700 },
  statusChipText: { fontFamily: FONT_FAMILY, fontSize: 10, color: '#FFFFFF', fontWeight: '700' },

  sectionHeaderRow: { paddingHorizontal: 2, marginTop: 4 },
  sectionHeading: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextGroup: { flex: 1, marginLeft: 14 },
  menuLabel: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.ink },
  menuSub: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate500, marginTop: 2, fontWeight: '500' },

  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerBlock: { alignItems: 'center', paddingTop: 8, paddingBottom: 16, gap: 4 },
  footerLine: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '500', color: COLORS.slate400 },
  footerLineMuted: { fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '400', color: COLORS.slate400 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redBg,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  signOutText: { fontFamily: FONT_FAMILY, color: COLORS.red600, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
});
