import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Pressable, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import { fetchMembers, saveMember, updateMember, deleteMember, resolveMemberFlag } from '../supabase';

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

const formatAadhaar = (num) => {
  const digits = (num || '').replace(/\D/g, '');
  if (digits.length !== 12) return digits || '—';
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
};

// Stacked up/down carets — a lightweight sortable-column indicator, matching
// the header glyph used next to sortable columns without pulling in an icon
// font that doesn't have a matching double-caret glyph at this size.
const SortGlyph = () => (
  <View style={styles.sortGlyph}>
    <Text style={styles.sortGlyphArrow}>▲</Text>
    <Text style={[styles.sortGlyphArrow, { marginTop: 1 }]}>▼</Text>
  </View>
);

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
  const [showReview, setShowReview] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [resolvingMember, setResolvingMember] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchMembers(societyName, societyType);
    setMembers(data || []);
    setLoading(false);
  }, [societyName, societyType]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const setField = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }));

  const canSave = form.memberName.trim().length > 0 && form.aadhaarNumber.replace(/\s+/g, '').length === 12;
  const flaggedCount = members.filter(m => m.flagged).length;

  const handleConfirmSave = async () => {
    if (!canSave || saving) return;
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
      : await saveMember({ societyName, societyType, addedBy: inspectorEmail, ...payload });
    setSaving(false);
    if (error) {
      console.error('[CORE] saveMember failed:', error);
      notify('Save Failed', error.message || 'Could not save member. Please try again.');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowReview(false);
    loadMembers();
    if (onMemberDataChanged) onMemberDataChanged();
  };

  const handleEditClick = (member) => {
    setEditingId(member.id);
    setForm({
      memberName: member.member_name || '',
      aadhaarNumber: member.aadhaar_number || '',
      mobileNumber: member.mobile_number || '',
      wardName: member.ward_name || '',
      address: member.address || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
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
      if (editingId === member.id) handleCancelEdit();
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

  const handleOpenResolve = (member) => {
    setResolvingMember(member);
    setResolutionNote('');
  };

  const handleCancelResolve = () => {
    setResolvingMember(null);
    setResolutionNote('');
  };

  // The CI's reply to a district-admin flag: not a deletion, just a record
  // that this member was checked and is a valid registration (or whatever
  // note the CI leaves) — the flag clears but admin's original reason and
  // this resolution both stay on the row as history.
  const handleConfirmResolve = async () => {
    if (!resolvingMember || resolving) return;
    setResolving(true);
    const { error } = await resolveMemberFlag(resolvingMember.id, {
      resolvedBy: inspectorEmail,
      resolutionNote,
    });
    setResolving(false);
    if (error) {
      notify('Could Not Resolve', error.message || 'Could not mark this member as reviewed.');
      return;
    }
    setMembers(prev => prev.map(m => m.id === resolvingMember.id ? { ...m, flagged: false } : m));
    setResolvingMember(null);
    setResolutionNote('');
    if (onMemberDataChanged) onMemberDataChanged();
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
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
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

        {/* ── Add / Edit Member Form ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name={editingId ? 'account-edit-outline' : 'account-plus-outline'} size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>{editingId ? 'Edit Member' : 'Add New Member'}</Text>
              <Text style={styles.cardHeaderSub}>Aadhaar number is stored on record for identity verification</Text>
            </View>
            {editingId ? (
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditBtn} activeOpacity={0.7}>
                <Text style={styles.cancelEditBtnText}>CANCEL</Text>
              </TouchableOpacity>
            ) : null}
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
            <Text style={styles.inputLabel}>Aadhaar Number * <Text style={styles.inputHint}>(12 digits)</Text></Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="shield-key-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={form.aadhaarNumber}
                onChangeText={(v) => setField('aadhaarNumber')(v.replace(/[^0-9]/g, '').slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
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
              onPress={() => setShowReview(true)}
              disabled={!canSave}
            >
              {canSave && (
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <MaterialCommunityIcons name="clipboard-text-outline" size={17} color={canSave ? '#ffffff' : COLORS.slate400} />
              <Text style={[styles.addBtnText, !canSave && { color: COLORS.slate400 }]}>
                {editingId ? 'REVIEW & UPDATE MEMBER' : 'REVIEW & SAVE TO DATABASE'}
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

        {flaggedCount > 0 ? (
          <View style={styles.flaggedBanner}>
            <MaterialCommunityIcons name="flag-outline" size={16} color={COLORS.amber900} />
            <Text style={styles.flaggedBannerText}>
              {flaggedCount} member{flaggedCount > 1 ? 's' : ''} flagged by district admin for review — check below and remove if not a valid registration.
            </Text>
          </View>
        ) : null}

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <View style={[styles.th, styles.colSrNo]}>
                  <Text style={styles.thText}>SR. NO</Text>
                </View>
                <View style={[styles.th, styles.colMember]}>
                  <Text style={styles.thText}>MEMBER NAME</Text>
                  <SortGlyph />
                </View>
                <View style={[styles.th, styles.colMobile]}>
                  <Text style={styles.thText}>MOBILE NUMBER</Text>
                </View>
                <View style={[styles.th, styles.colAadhaar]}>
                  <Text style={styles.thText}>AADHAAR NO</Text>
                </View>
                <View style={[styles.th, styles.colWard]}>
                  <Text style={styles.thText}>WARD</Text>
                  <SortGlyph />
                </View>
                <View style={[styles.th, styles.colAddress]}>
                  <Text style={styles.thText}>ADDRESS</Text>
                </View>
                <View style={[styles.th, styles.colAction]} />
              </View>

              {members.map((m, idx) => (
                <View
                  key={m.id}
                  style={[styles.tr, idx % 2 === 1 && styles.trAlt, m.flagged && styles.trFlagged]}
                >
                  <View style={[styles.td, styles.colSrNo]}>
                    <Text style={styles.tdText}>{idx + 1}</Text>
                  </View>
                  <View style={[styles.td, styles.colMember]}>
                    <Text style={styles.tdMemberName} numberOfLines={1}>{m.member_name}</Text>
                    {m.flagged ? (
                      <>
                        <Text style={styles.flaggedBadge} numberOfLines={1}>
                          🚩 Flagged{m.flag_reason ? `: ${m.flag_reason}` : ''}
                        </Text>
                        <TouchableOpacity onPress={() => handleOpenResolve(m)} activeOpacity={0.7}>
                          <Text style={styles.markReviewedLink}>Mark as Reviewed</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                  <View style={[styles.td, styles.colMobile]}>
                    <Text style={styles.tdText}>{m.mobile_number || '—'}</Text>
                  </View>
                  <View style={[styles.td, styles.colAadhaar]}>
                    <Text style={styles.tdText} numberOfLines={1}>{m.aadhaar_number ? formatAadhaar(m.aadhaar_number) : '—'}</Text>
                  </View>
                  <View style={[styles.td, styles.colWard]}>
                    {m.ward_name ? (
                      <View style={styles.wardPill}>
                        <Text style={styles.wardPillText} numberOfLines={1}>{m.ward_name}</Text>
                      </View>
                    ) : (
                      <Text style={styles.tdText}>—</Text>
                    )}
                  </View>
                  <View style={[styles.td, styles.colAddress]}>
                    <Text style={styles.tdText} numberOfLines={1}>{m.address || '—'}</Text>
                  </View>
                  <View style={[styles.td, styles.colAction]}>
                    <TouchableOpacity
                      onPress={() => handleEditClick(m)}
                      style={styles.editBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={15} color={COLORS.slate600} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(m)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      {/* ── Review & Confirm Sheet ── */}
      {showReview && (
        <View style={styles.reviewOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => !saving && setShowReview(false)} />
          <View style={styles.reviewSheet}>
            <View style={styles.reviewHeaderRow}>
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeaderTitle}>{editingId ? 'Review Before Updating' : 'Review Before Saving'}</Text>
                <Text style={styles.cardHeaderSub}>Confirm these details are correct before {editingId ? 'updating this record' : 'saving to the database'}.</Text>
              </View>
            </View>

            <View style={styles.reviewList}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Member Name</Text>
                <Text style={styles.reviewValue}>{form.memberName.trim() || '—'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Aadhaar Number</Text>
                <Text style={styles.reviewValue}>{form.aadhaarNumber ? formatAadhaar(form.aadhaarNumber) : '—'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Mobile Number</Text>
                <Text style={styles.reviewValue}>{form.mobileNumber.trim() || '—'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Ward Name</Text>
                <Text style={styles.reviewValue}>{form.wardName.trim() || '—'}</Text>
              </View>
              <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.reviewLabel}>Address</Text>
                <Text style={styles.reviewValue}>{form.address.trim() || '—'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.reviewBackBtn}
                onPress={() => setShowReview(false)}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.reviewBackBtnText}>BACK TO EDIT</Text>
              </TouchableOpacity>
              <Pressable
                style={({ pressed }) => [styles.reviewConfirmBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={handleConfirmSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialCommunityIcons name="database-check-outline" size={16} color="#ffffff" />
                )}
                <Text style={styles.addBtnText}>{saving ? (editingId ? 'UPDATING...' : 'SAVING...') : (editingId ? 'CONFIRM & UPDATE' : 'CONFIRM & SAVE')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ── Resolve Flag Sheet — the CI's reply to a district-admin flag ── */}
      {resolvingMember && (
        <View style={styles.reviewOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => !resolving && handleCancelResolve()} />
          <View style={styles.reviewSheet}>
            <View style={styles.reviewHeaderRow}>
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name="flag-checkered" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeaderTitle}>Mark as Reviewed</Text>
                <Text style={styles.cardHeaderSub}>{resolvingMember.member_name} was flagged by district admin{resolvingMember.flag_reason ? `: "${resolvingMember.flag_reason}"` : ''}.</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Note (Optional)</Text>
              <View style={[styles.inputBox, { height: 64, alignItems: 'flex-start', paddingTop: 10 }]}>
                <MaterialCommunityIcons name="pencil-outline" size={15} color={COLORS.slate400} style={{ marginRight: 6, marginTop: 2 }} />
                <TextInput
                  style={[styles.textInput, { height: '100%' }]}
                  value={resolutionNote}
                  onChangeText={setResolutionNote}
                  placeholder="e.g. Verified against Aadhaar, valid member"
                  placeholderTextColor={COLORS.slate300}
                  multiline
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.reviewBackBtn}
                onPress={handleCancelResolve}
                disabled={resolving}
                activeOpacity={0.7}
              >
                <Text style={styles.reviewBackBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <Pressable
                style={({ pressed }) => [styles.reviewConfirmBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={handleConfirmResolve}
                disabled={resolving}
              >
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {resolving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#ffffff" />
                )}
                <Text style={styles.addBtnText}>{resolving ? 'SAVING...' : 'CONFIRM REVIEWED'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, position: 'relative' },

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
  cancelEditBtn: {
    backgroundColor: COLORS.slate100,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelEditBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate600,
    letterSpacing: 0.4,
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
  flaggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.amber50,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  flaggedBannerText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber900,
    lineHeight: 16,
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

  tableScrollContent: {
    flexGrow: 1,
    minWidth: '100%',
  },
  table: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    minWidth: 640,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate50,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  th: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },
  thText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortGlyph: {
    marginLeft: 2,
  },
  sortGlyphArrow: {
    fontSize: 6,
    lineHeight: 7,
    color: COLORS.slate300,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  trAlt: {
    backgroundColor: COLORS.surface,
  },
  trFlagged: {
    backgroundColor: COLORS.amber50,
  },
  flaggedBadge: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.amber900,
    marginTop: 2,
  },
  markReviewedLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 3,
    textDecorationLine: 'underline',
  },
  td: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  colSrNo: { width: 56 },
  colMember: { width: 170 },
  colMobile: { width: 150 },
  colAadhaar: { width: 150 },
  colWard: { width: 110 },
  colAddress: { flex: 1, minWidth: 130, maxWidth: 260 },
  colAction: { width: 76, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  tdMemberName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  tdText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  wardPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.slate100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  wardPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Review Sheet
  reviewOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  reviewSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    maxHeight: '85%',
  },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewList: {
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    paddingHorizontal: 14,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    gap: 12,
  },
  reviewLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  reviewValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
    textAlign: 'right',
    flexShrink: 1,
  },
  reviewBackBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
  },
  reviewBackBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate600,
    letterSpacing: 0.5,
  },
  reviewConfirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
