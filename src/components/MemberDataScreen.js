import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Pressable, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchMembers, saveMember, deleteMember } from '../supabase';

const COLORS = {
  surface: '#ffffff',
  bg: '#F8F5F2',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#7a1a1f',
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald50: '#ecfdf5',
  amber900: '#78350f',
  amber50: '#fffbeb',
};

const FONT_FAMILY = 'Manrope';

const emptyForm = { memberName: '', aadhaarNumber: '', mobileNumber: '', wardName: '', address: '' };

// RN's Alert.alert is a silent no-op on web — without this, a failed save
// or delete looked like nothing happened at all, with no visible feedback.
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function MemberDataScreen({
  societyName = '',
  societyType = 'MPCS',
  inspectorEmail = '',
  onBack,
  onMemberDataChanged
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchMembers(societyName, societyType);
    setMembers(data || []);
    setLoading(false);
  }, [societyName, societyType]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const setField = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }));

  const canSave = form.memberName.trim().length > 0 && form.aadhaarNumber.replace(/\s+/g, '').length === 12;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const { error } = await saveMember({
      societyName,
      societyType,
      memberName: form.memberName.trim(),
      aadhaarNumber: form.aadhaarNumber,
      mobileNumber: form.mobileNumber.trim(),
      wardName: form.wardName.trim(),
      address: form.address.trim(),
      addedBy: inspectorEmail,
    });
    setSaving(false);
    if (error) {
      console.error('[CORE] saveMember failed:', error);
      notify('Save Failed', error.message || 'Could not save member. Please try again.');
      return;
    }
    setForm(emptyForm);
    loadMembers();
    if (onMemberDataChanged) onMemberDataChanged();
  };

  const handleDelete = (member) => {
    const doDelete = async () => {
      const { error } = await deleteMember(member.id);
      if (error) {
        console.error('[CORE] deleteMember failed:', error);
        notify('Delete Failed', error.message || 'Could not delete member.');
        return;
      }
      setMembers(prev => prev.filter(m => m.id !== member.id));
      if (onMemberDataChanged) onMemberDataChanged();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${member.member_name} from the member registry?`)) doDelete();
    } else {
      Alert.alert('Remove Member', `Remove ${member.member_name} from the member registry?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>{societyType}</Text>
          <Text style={styles.screenTitleHeader}>Member Data</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Society Indicator Card — auto-filled, not editable here */}
        <View style={styles.societyCard}>
          <LinearGradient
            colors={['rgba(122,26,31,0.06)', 'rgba(122,26,31,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.societyIconBox}>
            <MaterialCommunityIcons name="domain" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.societyLabel}>Registered To</Text>
            <Text style={styles.societyValue}>{societyName || 'Unknown Society'}</Text>
          </View>
        </View>

        {/* ── Add Member Form ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="account-plus-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Add New Member</Text>
              <Text style={styles.cardHeaderSub}>Aadhaar is hashed on-device — never stored or sent in plain text</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Member Name *</Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="account-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={form.memberName}
                onChangeText={setField('memberName')}
                placeholder="e.g. Karma Bhutia"
                placeholderTextColor={COLORS.slate300}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aadhaar Number * <Text style={styles.inputHint}>(12 digits, hashed before saving)</Text></Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="shield-key-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={form.aadhaarNumber}
                onChangeText={(v) => setField('aadhaarNumber')(v.replace(/[^0-9]/g, '').slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
                secureTextEntry
                maxLength={12}
              />
            </View>
          </View>

          <View style={styles.inputRowHalf}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="phone-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.mobileNumber}
                  onChangeText={setField('mobileNumber')}
                  placeholder="+91 98000 00000"
                  placeholderTextColor={COLORS.slate300}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Ward Name</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.wardName}
                  onChangeText={setField('wardName')}
                  placeholder="e.g. Ward 3"
                  placeholderTextColor={COLORS.slate300}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={[styles.inputBox, { height: 64, alignItems: 'flex-start', paddingTop: 10 }]}>
              <MaterialCommunityIcons name="home-outline" size={15} color={COLORS.slate400} style={{ marginRight: 6, marginTop: 2 }} />
              <TextInput
                style={[styles.textInput, { height: '100%' }]}
                value={form.address}
                onChangeText={setField('address')}
                placeholder="House no., locality..."
                placeholderTextColor={COLORS.slate300}
                multiline
              />
            </View>
          </View>

          <View style={styles.btnWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                !canSave && styles.addBtnDisabled,
                pressed && canSave && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleSave}
              disabled={!canSave || saving}
            >
              {canSave && (
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              {saving ? (
                <ActivityIndicator size="small" color={canSave ? '#ffffff' : COLORS.slate400} />
              ) : (
                <MaterialCommunityIcons name="content-save-outline" size={17} color={canSave ? '#ffffff' : COLORS.slate400} />
              )}
              <Text style={[styles.addBtnText, !canSave && { color: COLORS.slate400 }]}>
                {saving ? 'SAVING...' : 'SAVE TO REGISTRY'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Registered Members Section ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Registered Members</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{members.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-group-outline" size={32} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No members registered yet</Text>
            <Text style={styles.emptySubtitle}>
              Members added here stay on record permanently — they aren't part of the monthly return.
            </Text>
          </View>
        ) : (
          members.map((m) => (
            <View key={m.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {(m.member_name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.member_name}</Text>
                <Text style={styles.memberMeta}>
                  {[m.ward_name, m.mobile_number].filter(Boolean).join(' · ') || 'No additional details'}
                </Text>
                {m.address ? <Text style={styles.memberAddress}>{m.address}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(m)}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    overflow: 'hidden',
  },
  backBtn: { padding: 4, zIndex: 1 },
  topBarTitleContainer: { flex: 1, marginLeft: 12 },
  moduleTag: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  screenTitleHeader: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 32, gap: 14 },

  societyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 14,
    overflow: 'hidden',
  },
  societyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  societyLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  societyValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.2,
    marginTop: 1,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  cardHeaderSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 1,
  },

  inputRowHalf: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1, gap: 5 },
  inputGroup: { gap: 5 },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.2,
  },
  inputHint: {
    fontWeight: '500',
    color: COLORS.slate400,
    textTransform: 'none',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: { marginRight: 6 },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  btnWrapper: { borderRadius: 12, overflow: 'hidden' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.slate200,
  },
  addBtnDisabled: { backgroundColor: COLORS.slate100 },
  addBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  memberName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  memberMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 2,
  },
  memberAddress: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.slate400,
    marginTop: 2,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
