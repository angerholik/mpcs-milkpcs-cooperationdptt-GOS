import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, StatusBar, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  headerBg: '#6B1212',
  textHeader: '#FFFFFF',
  gold: '#FDE68A',
  badgeRed: '#EF4444',
  primary: '#6B1212',
};

// Same subtle Kanchenjunga treatment used across every header (MyInstitutionsScreen
// originated this) — kept web-only since RN has no CSS filter/blend-mode, and
// react-native-web passes unrecognized style keys straight to the DOM.
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.4, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.28 };

const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

export default function HeaderNav({
  title = "CORE",
  subtitle = "Cooperative Oversight Engine",
  activeModule = "MILK",
  selectedSociety,
  institutionsList = [],
  onSelectSociety,
  onManageInstitutions,
  onSwitchModule,
  onMenuPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
  role
}) {
  const isCi = role === 'CI';
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displaySocietyName = selectedSociety?.name || (activeModule === 'MILK' ? 'Milk PCS' : 'MPCS');

  const handleChooseSociety = (item) => {
    if (onSelectSociety) onSelectSociety(item);
    setDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      <Image
        source={require('../../assets/core/kanchenjunga.jpg')}
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, headerPhotoFilter]}
        resizeMode="cover"
      />
      <View style={styles.headerContent}>
        {/* Left Branding */}
        <View style={styles.leftBrandGroup}>
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <MaterialIcons name="menu" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.mainTitle}>{title}</Text>
        </View>

        {/* Right Actions & Dynamic Society Dropdown Trigger */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.societySwitcherBadge}
            onPress={() => setDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.societySwitcherText} numberOfLines={1}>
              {displaySocietyName}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={18} color={COLORS.gold} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.notifyBtn} onPress={onNotifyPress} activeOpacity={0.7}>
            <MaterialIcons name="notifications-none" size={20} color="#FFFFFF" />
            {unreadCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress} activeOpacity={0.8}>
            <Text style={styles.avatarText}>CI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-Screen Portal Society Selector Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setDropdownOpen(false)} />
          <View style={styles.dropdownCard}>
            <View style={styles.dropdownHeaderRow}>
              <View>
                <Text style={styles.dropdownTitle}>Select Institution</Text>
                <Text style={styles.dropdownSub}>Switch between registered MPCS & Milk PCS units</Text>
              </View>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setDropdownOpen(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dropdownListScroll} showsVerticalScrollIndicator={false}>
              {institutionsList.length === 0 ? (
                <View style={styles.emptyNotice}>
                  <Text style={styles.emptyText}>No registered institutions yet.</Text>
                </View>
              ) : (
                institutionsList.map((item) => {
                  const isSelected = selectedSociety?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.societyItemRow, isSelected && styles.selectedSocietyItemRow]}
                      onPress={() => handleChooseSociety(item)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.typeTagPill, item.type === 'MPCS' ? styles.mpcsPill : styles.milkPill]}>
                        <Text style={styles.typeTagText}>{item.type}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.itemSocietyName, isSelected && styles.selectedItemText]}>{item.name}</Text>
                        <Text style={styles.itemSocietyCode}>{item.code} • {item.district}</Text>
                      </View>
                      {isSelected && <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Manage Institutions Link */}
              <TouchableOpacity
                style={styles.manageInstBtn}
                onPress={() => {
                  setDropdownOpen(false);
                  if (onManageInstitutions) onManageInstitutions();
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name={isCi ? 'add-business' : 'domain'} size={16} color={COLORS.primary} />
                <Text style={styles.manageInstBtnText}>{isCi ? '+ Add / Manage My Institutions' : 'View My Institutions'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // position:'relative' + overflow:'hidden' give the absolutely-positioned
    // photo layer above a real containing block to stretch against — without
    // it the image renders at its own raw intrinsic size instead of filling
    // the header (a production-only web-export bug found and fixed the hard
    // way on MyInstitutionsScreen's header first).
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.headerBg,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 10),
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  // Matches HomeScreen's "CORE" wordmark exactly — the app-wide reference
  // style, rather than each header inventing its own size/tracking.
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    letterSpacing: 3.6,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  societySwitcherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    maxWidth: 160,
  },
  societySwitcherText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.3,
  },
  notifyBtn: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: COLORS.badgeRed,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.headerBg,
  },
  avatarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },

  // Modal Portal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  dropdownCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
  },
  dropdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  dropdownTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  dropdownSub: { fontFamily: FONT_FAMILY, fontSize: 10, color: '#64748B', marginTop: 1 },
  closeBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownListScroll: { maxHeight: 280 },
  emptyNotice: { padding: 14, alignItems: 'center' },
  emptyText: { fontFamily: FONT_FAMILY, fontSize: 12, color: '#64748B' },
  societyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    backgroundColor: '#FAFAFA',
  },
  selectedSocietyItemRow: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.primary,
  },
  typeTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mpcsPill: { backgroundColor: COLORS.primary },
  milkPill: { backgroundColor: '#1D4ED8' },
  typeTagText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  itemSocietyName: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: '#0F172A' },
  selectedItemText: { color: COLORS.primary },
  itemSocietyCode: { fontFamily: FONT_FAMILY, fontSize: 10, color: '#64748B', marginTop: 1 },
  manageInstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  manageInstBtnText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
