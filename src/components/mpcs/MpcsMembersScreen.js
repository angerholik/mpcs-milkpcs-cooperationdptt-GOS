import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';
import { fetchMembers, saveMember, updateMember, deleteMember, resolveMemberFlag } from '../../supabase';

// Redesign source: https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx,
// section "5 · Members", screen 7b "Roll and add sheet" — "List first;
// Aadhaar optional and sourced." The old shared MemberDataScreen.js
// required a 12-digit Aadhaar to save a member at all; this screen (MPCS
// only — Milk PCS keeps the original) makes it genuinely optional,
// matching what saveMember/updateMember already accepted (aadhaar_number
// was already nullable server-side, only the old UI's canSave forced it).
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  pillBg: '#F6E3E5',
  avatarBg: '#F6E3E5',
  amber50: '#FFF7ED',
  amber700: '#B45309',
};

const FONT_FAMILY = 'Manrope';
const emptyForm = { memberName: '', aadhaarNumber: '', mobileNumber: '', wardName: '', address: '' };

const formatAadhaar = (num) => {
  const digits = (num || '').replace(/\D/g, '');
  if (digits.length !== 12) return digits || '—';
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
};

const initialsOf = (name) => (name || '').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '—';

const joinedLabel = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const notify = (title, message) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

export default function MpcsMembersScreen({
  societyName = '',
  inspectorEmail = '',
  onBack,
  onMemberDataChanged,
  activeTab,
  onTabPress,
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [resolvingMember, setResolvingMember] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchMembers(societyName, 'MPCS');
    setMembers(data || []);
    setLoading(false);
  }, [societyName]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Aadhaar, if given at all, must be a real 12-digit number — but giving
  // none is fine (the reference's whole point: "Aadhaar optional").
  const canSave = form.memberName.trim().length > 0
    && (form.aadhaarNumber.length === 0 || form.aadhaarNumber.replace(/\s+/g, '').length === 12)
    && !saving;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      (m.member_name || '').toLowerCase().includes(q) || (m.ward_name || '').toLowerCase().includes(q)
    );
  }, [members, search]);

  const flaggedCount = members.filter((m) => m.flagged).length;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      memberName: form.memberName.trim(),
      aadhaarNumber: form.aadhaarNumber,
      mobileNumber: form.mobileNumber.trim(),
      wardName: form.wardName.trim(),
      address: form.address.trim(),
    };
    const { error } = editingId
      ? await updateMember(editingId, payload)
      : await saveMember({ societyName, societyType: 'MPCS', addedBy: inspectorEmail, ...payload });
    setSaving(false);
    if (error) {
      notify('Save Failed', error.message || 'Could not save this member. Please try again.');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    loadMembers();
    if (onMemberDataChanged) onMemberDataChanged();
  };

  const handleEdit = (m) => {
    setMenuOpenId(null);
    setEditingId(m.id);
    setForm({
      memberName: m.member_name || '',
      aadhaarNumber: m.aadhaar_number || '',
      mobileNumber: m.mobile_number || '',
      wardName: m.ward_name || '',
      address: m.address || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (m) => {
    setMenuOpenId(null);
    const doDelete = async () => {
      const { error } = await deleteMember(m.id);
      if (error) {
        notify('Delete Failed', error.message || 'Could not delete this member.');
        return;
      }
      if (editingId === m.id) handleCancelEdit();
      loadMembers();
      if (onMemberDataChanged) onMemberDataChanged();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${m.member_name} from the member registry?`)) doDelete();
    } else {
      Alert.alert('Remove Member', `Remove ${m.member_name} from the member registry?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolvingMember || resolving) return;
    setResolving(true);
    const { error } = await resolveMemberFlag(resolvingMember.id, { resolvedBy: inspectorEmail, resolutionNote });
    setResolving(false);
    if (error) {
      notify('Could Not Resolve', error.message || 'Could not mark this member as reviewed.');
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === resolvingMember.id ? { ...m, flagged: false } : m)));
    setResolvingMember(null);
    setResolutionNote('');
    if (onMemberDataChanged) onMemberDataChanged();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Members</Text>
        <Text style={styles.headerSubtitle}>{societyName || 'Unknown society'} · {members.length} on record</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.slate400} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or ward"
            placeholderTextColor={COLORS.slate500}
          />
        </View>

        {flaggedCount > 0 && (
          <View style={styles.flaggedBanner}>
            <MaterialCommunityIcons name="flag-outline" size={16} color={COLORS.amber700} />
            <Text style={styles.flaggedText}>
              {flaggedCount} member{flaggedCount > 1 ? 's' : ''} flagged by district admin for review.
            </Text>
          </View>
        )}

        {loading ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.maroon} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{members.length === 0 ? 'No members registered yet' : 'No matches'}</Text>
            <Text style={styles.emptyDesc}>
              {members.length === 0
                ? "Members added below stay on record permanently — they aren't part of the monthly return."
                : 'Try a different name or ward.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listCard}>
              {filtered.map((m) => (
                <View key={m.id} style={styles.listRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initialsOf(m.member_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listRowTitle} numberOfLines={1}>{m.member_name}</Text>
                    <Text style={styles.listRowSub}>
                      {m.ward_name || 'No ward'} · joined {joinedLabel(m.created_at)}
                    </Text>
                    {m.flagged && (
                      <Pressable onPress={() => { setResolvingMember(m); setResolutionNote(''); }} hitSlop={6}>
                        <Text style={styles.flagLink}>🚩 Flagged{m.flag_reason ? `: ${m.flag_reason}` : ''} — Mark reviewed</Text>
                      </Pressable>
                    )}
                  </View>
                  {!m.aadhaar_number && (
                    <View style={styles.incompletePill}>
                      <Text style={styles.incompletePillText}>INCOMPLETE</Text>
                    </View>
                  )}
                  <View>
                    <Pressable
                      hitSlop={8}
                      style={styles.rowMenuBtn}
                      onPress={() => setMenuOpenId((cur) => (cur === m.id ? null : m.id))}
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={18} color={COLORS.slate500} />
                    </Pressable>
                    {menuOpenId === m.id && (
                      <View style={styles.rowMenu}>
                        <Pressable style={styles.rowMenuItem} onPress={() => handleEdit(m)}>
                          <MaterialCommunityIcons name="pencil-outline" size={15} color={COLORS.ink} />
                          <Text style={styles.rowMenuItemText}>Edit</Text>
                        </Pressable>
                        <Pressable style={styles.rowMenuItem} onPress={() => handleDelete(m)}>
                          <MaterialCommunityIcons name="trash-can-outline" size={15} color={COLORS.maroon} />
                          <Text style={[styles.rowMenuItemText, { color: COLORS.maroon }]}>Delete</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.showingCaption}>Showing {filtered.length} of {members.length}</Text>
          </>
        )}

        <Text style={styles.sectionLabel}>{editingId ? 'EDIT MEMBER' : 'ADD MEMBER SHEET'}</Text>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={form.memberName}
                onChangeText={setField('memberName')}
                placeholder="e.g. Karma Bhutia"
                placeholderTextColor={COLORS.slate500}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Aadhaar number</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={form.aadhaarNumber}
                onChangeText={(v) => setField('aadhaarNumber')(v.replace(/[^0-9]/g, '').slice(0, 12))}
                placeholder="1234 5678 9012"
                placeholderTextColor={COLORS.slate500}
                keyboardType="numeric"
                maxLength={12}
              />
            </View>
            <Text style={styles.helperText}>
              Stored on the society record and visible to the registrar. Leave blank if the member does not have one.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Ward</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={form.wardName}
                  onChangeText={setField('wardName')}
                  placeholder="e.g. Ward 3"
                  placeholderTextColor={COLORS.slate500}
                />
              </View>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Mobile</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={form.mobileNumber}
                  onChangeText={setField('mobileNumber')}
                  placeholder="+91 98000 00000"
                  placeholderTextColor={COLORS.slate500}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              style={styles.textArea}
              value={form.address}
              onChangeText={setField('address')}
              placeholder="House no., locality…"
              placeholderTextColor={COLORS.slate500}
              multiline
            />
          </View>

          <View style={styles.row}>
            {editingId && (
              <Pressable style={styles.backOutlineBtn} onPress={handleCancelEdit}>
                <Text style={styles.backOutlineText}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.addBtn, !canSave && styles.addBtnDisabled, pressed && canSave && { opacity: 0.9 }, editingId && { flex: 2 }]}
              onPress={handleSave}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator color={canSave ? '#ffffff' : COLORS.slate500} size="small" />
              ) : (
                <Text style={[styles.addBtnText, !canSave && { color: COLORS.slate500 }]}>
                  {editingId ? 'Update member' : 'Save member'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {resolvingMember && (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => !resolving && setResolvingMember(null)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Mark as reviewed</Text>
            <Text style={styles.sheetDesc}>
              {resolvingMember.member_name} was flagged by district admin{resolvingMember.flag_reason ? `: "${resolvingMember.flag_reason}"` : ''}.
            </Text>
            <TextInput
              style={styles.textArea}
              value={resolutionNote}
              onChangeText={setResolutionNote}
              placeholder="Your note (optional) — e.g. Verified against Aadhaar, valid member"
              placeholderTextColor={COLORS.slate500}
              multiline
            />
            <View style={styles.row}>
              <Pressable style={styles.backOutlineBtn} onPress={() => setResolvingMember(null)} disabled={resolving}>
                <Text style={styles.backOutlineText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.addBtn, { flex: 2 }]} onPress={handleConfirmResolve} disabled={resolving}>
                {resolving ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.addBtnText}>Confirm</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 12 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  flaggedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.amber50,
    borderRadius: 14,
    padding: 12,
  },
  flaggedText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber700,
    lineHeight: 17,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  emptyDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },

  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  listRowTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  listRowSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    marginTop: 2,
  },
  flagLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.maroon,
    marginTop: 4,
  },
  incompletePill: {
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  incompletePillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.maroon,
    letterSpacing: 0.4,
  },
  rowMenuBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    minWidth: 110,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  rowMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowMenuItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  showingCaption: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },

  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
  },
  row: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1, gap: 6 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  textArea: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  helperText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
    lineHeight: 16,
  },

  addBtn: {
    flex: 1,
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#EDE8E0' },
  addBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  backOutlineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOutlineText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },

  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(30,27,24,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  sheetTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  sheetDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
    lineHeight: 18,
  },
});
