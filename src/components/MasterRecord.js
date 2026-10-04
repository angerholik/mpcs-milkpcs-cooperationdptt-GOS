import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Building blocks for the Master Data screens: read-only record cards, a
// chip selector, a date field, and the Update / Cancel-Save footers — the
// same view-then-update pattern as the MPCS master data list.
const F = 'Manrope';
const C = { maroon: '#7B1420', ink: '#1E1B18', border: '#E7E2DA', s500: '#78716C', s600: '#57534E', pill: '#F6E3E5' };

export function ReadCard({ title, icon, rows, children, inline }) {
  if (inline) {
    return (
      <View style={s.inCard}>
        <Text style={s.inTitle}>{title}</Text>
        {(rows || []).map((r) => (
          <View key={r.label}>
            <Text style={s.inLabel}>{r.label.toUpperCase()}</Text>
            <Text style={[s.inValue, r.large && s.inValueLg, r.color && { color: r.color }]}>{r.value || '—'}</Text>
          </View>
        ))}
        {children}
      </View>
    );
  }
  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        {icon ? (
          <View style={s.cardIcon}><MaterialCommunityIcons name={icon} size={18} color={C.maroon} /></View>
        ) : null}
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {(rows || []).map((r) => (
        <View key={r.label} style={s.row}>
          <Text style={s.label}>{r.label.toUpperCase()}</Text>
          <Text style={[s.value, r.color && { color: r.color }]}>{r.value || '—'}</Text>
        </View>
      ))}
      {children}
    </View>
  );
}

export function ChipSelect({ label, options, value, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.chipRow}>
        {options.map((o) => {
          const active = value === o;
          return (
            <Pressable key={o} style={[s.chip, active && s.chipActive]} onPress={() => onChange(o)}>
              <Text style={[s.chipText, active && { color: '#fff' }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// valueIso is YYYY-MM-DD; web uses the native date input, native falls back
// to a plain text entry in the same format.
export function DateField({ label, valueIso, onChangeIso, required }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabelGrey}>{label}{required ? <Text style={{ color: '#DC2626', fontWeight: '700' }}> *</Text> : null}</Text>
      <View style={[s.box, { backgroundColor: '#F2F3F7', borderRadius: 14, height: 48 }]}>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={valueIso || ''}
            onChange={(e) => onChangeIso(e.target.value)}
            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: F, fontSize: 16, fontWeight: 700, color: C.ink }}
          />
        ) : (
          <TextInput style={s.native} value={valueIso || ''} onChangeText={onChangeIso} placeholder="YYYY-MM-DD" />
        )}
      </View>
    </View>
  );
}

export function ViewFooter({ onUpdate, updateLabel = 'Update', onBack, onNext, nextLabel = 'Save and continue' }) {
  return (
    <View style={{ gap: 12 }}>
      <Pressable style={s.updateBtn} onPress={onUpdate}>
        <MaterialCommunityIcons name="pencil-outline" size={16} color={C.maroon} />
        <Text style={s.updateText}>{updateLabel}</Text>
      </Pressable>
      {onNext ? (
        <View style={s.footerRow}>
          <Pressable style={s.backBtn} onPress={onBack}><Text style={s.backText}>Back</Text></Pressable>
          <Pressable style={s.primary} onPress={onNext}><Text style={s.primaryText}>{nextLabel}</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function EditFooter({ onCancel, onSave, saveLabel = 'Save' }) {
  return (
    <View style={s.footerRow}>
      <Pressable style={s.backBtn} onPress={onCancel}><Text style={s.backText}>Cancel</Text></Pressable>
      <Pressable style={s.primary} onPress={onSave}><Text style={s.primaryText}>{saveLabel}</Text></Pressable>
    </View>
  );
}

export const masterStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 16 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E7F3EA', borderRadius: 12, padding: 12 },
  toastText: { flex: 1, fontFamily: F, fontSize: 13, fontWeight: '700', color: '#15803D' },
});

const s = StyleSheet.create({
  inCard: { backgroundColor: '#F4F5F7', borderRadius: 14, padding: 14 },
  inTitle: { fontFamily: F, fontSize: 15, fontWeight: '800', color: C.ink },
  inLabel: { fontFamily: F, fontSize: 11, fontWeight: '800', color: C.s500, letterSpacing: 0.6, marginTop: 10 },
  inValue: { fontFamily: F, fontSize: 15, fontWeight: '700', color: C.ink, marginTop: 2 },
  inValueLg: { fontFamily: F, fontSize: 20, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.pill, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: F, fontSize: 16, fontWeight: '800', color: C.ink },
  row: { gap: 2 },
  label: { fontFamily: F, fontSize: 11, fontWeight: '700', color: C.s500, letterSpacing: 0.6 },
  value: { fontFamily: F, fontSize: 16, fontWeight: '700', color: C.ink },
  fieldLabelGrey: { fontFamily: F, fontSize: 15, fontWeight: '500', color: C.s600 },
  fieldLabel: { fontFamily: F, fontSize: 15, fontWeight: '700', color: C.ink },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: C.maroon, borderColor: C.maroon },
  chipText: { fontFamily: F, fontSize: 13, fontWeight: '700', color: C.s600 },
  box: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  native: { fontFamily: F, fontSize: 18, fontWeight: '700', color: C.ink },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: C.maroon, backgroundColor: '#fff' },
  updateText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: C.maroon },
  footerRow: { flexDirection: 'row', gap: 10 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: C.ink },
  primary: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#fff' },
});
