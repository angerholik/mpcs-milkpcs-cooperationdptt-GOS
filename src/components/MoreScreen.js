import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderNav from './HeaderNav';
import BottomNav from './BottomNav';

const COLORS = {
  primary: '#7C1C1C',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
};

export default function MoreScreen({
  activeTab = 'more',
  onTabPress,
  onNavigateScreen,
  onOpenBulletins,
  onSignOut,
  user
}) {
  const menuOptions = [
    {
      id: 'PROFILE',
      label: 'Institutional Profile',
      sub: 'Manage center details & management team',
      icon: 'business',
      color: '#1E40AF',
    },
    {
      id: 'DEMOGRAPHICS',
      label: 'Demographics Breakdown',
      sub: 'SC/ST/OBC/GEN registered member counts',
      icon: 'people-alt',
      color: '#7C3AED',
    },
    {
      id: 'COMPLIANCE',
      label: 'Compliance & Audit Details',
      sub: 'Audit date, AGM records & active loan status',
      icon: 'verified-user',
      color: '#047857',
    },
    {
      id: 'BULLETINS',
      label: 'Departmental Bulletins',
      sub: 'View official directives & notifications',
      icon: 'notifications-active',
      color: '#B45309',
    },
    {
      id: 'SYNC',
      label: 'Offline Engine Status',
      sub: 'Realtime cloud database sync status',
      icon: 'cloud-done',
      color: '#0284C7',
    },
  ];

  const initials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'CI';

  return (
    <View style={styles.container}>
      <HeaderNav />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* Officer Profile Card */}
        <View style={styles.officerCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.officerMeta}>
            <Text style={styles.officerName}>{user?.fullName || 'Cooperative Inspector'}</Text>
            <Text style={styles.officerRole}>
              {user?.role === 'ACI' ? 'Assistant Inspector' : 'Cooperative Inspector'}
              {user?.district ? ` • ${user.district}` : ''}
            </Text>
            <View style={styles.statusChip}>
              <MaterialIcons name="circle" size={8} color={COLORS.success} />
              <Text style={styles.statusChipText}>System Online • Supabase Sync Active</Text>
            </View>
          </View>
        </View>

        {/* Menu Options Group */}
        <Text style={styles.sectionHeading}>MODULE & SYSTEM OPTIONS</Text>
        
        <View style={styles.menuContainer}>
          {menuOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.menuRow}
              onPress={() => {
                if (opt.id === 'BULLETINS') {
                  if (onOpenBulletins) onOpenBulletins();
                } else if (onNavigateScreen) {
                  onNavigateScreen(opt.id);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: `${opt.color}15` }]}>
                <MaterialIcons name={opt.icon} size={22} color={opt.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLabel}>{opt.label}</Text>
                <Text style={styles.menuSub}>{opt.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.signOutText}>SIGN OUT OF CORE ENGINE</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16 },
  officerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  officerMeta: { marginLeft: 14, flex: 1 },
  officerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  officerRole: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusChipText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  menuContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  menuSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1, fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  signOutText: { color: '#EF4444', fontSize: 13, fontWeight: '800' },
});
