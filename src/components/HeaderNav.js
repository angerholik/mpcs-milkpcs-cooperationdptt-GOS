import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  headerBg: '#6B1212',
  textHeader: '#FFFFFF',
  gold: '#FDE68A',
  badgeRed: '#EF4444',
  primary: '#6B1212',
};

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
  unreadCount = 0
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displaySocietyName = selectedSociety?.name || (activeModule === 'MILK' ? 'Milk PCS' : 'MPCS');

  const handleChooseSociety = (item) => {
    if (onSelectSociety) onSelectSociety(item);
    setDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      <View style={styles.headerContent}>
        {/* Left Branding */}
        <View style={styles.leftBrandGroup}>
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <MaterialIcons name="menu" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <MaterialIcons name="shield" size={16} color={COLORS.gold} style={{ marginRight: 4 }} />
            <Text style={styles.mainTitle}>{title}</Text>
          </View>
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
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
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
                <MaterialIcons name="add-business" size={16} color={COLORS.primary} />
                <Text style={styles.manageInstBtnText}>+ Add / Manage My Institutions</Text>
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    letterSpacing: 0.8,
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
    top: 1,
    right: 1,
    backgroundColor: COLORS.badgeRed,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.headerBg,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
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
