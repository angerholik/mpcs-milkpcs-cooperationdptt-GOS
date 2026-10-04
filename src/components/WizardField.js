import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';

// Label + bordered input (+ optional prefix/suffix and helper line) and the
// "calculated for you" card — the form primitives of the MPCS monthly
// wizard screens, shared so Milk's wizard forms match.
export function WizardField({ label, prefix, suffix, helper, required, grey, phone, ...inputProps }) {
  return (
    <View style={styles.group}>
      <Text style={grey ? styles.labelGrey : styles.label}>{label}{required ? <Text style={styles.star}> *</Text> : null}</Text>
      <View style={[styles.box, grey && styles.boxGrey, inputProps.multiline && styles.boxMulti]}>
        {phone ? (<><Text style={styles.cc}>+91</Text><View style={styles.ccDivider} /></>) : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput style={[styles.input, grey && styles.inputGrey]} placeholder="0" placeholderTextColor="#A8A29E" {...inputProps} />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

export function CalcCard({ rows }) {
  return (
    <View style={styles.calc}>
      <Text style={styles.calcLabel}>CALCULATED FOR YOU</Text>
      {rows.map((r, i) => (
        <React.Fragment key={r.label}>
          {i > 0 ? <View style={styles.calcDivider} /> : null}
          <View style={styles.calcRow}>
            <View>
              <Text style={styles.calcRowLabel}>{r.label}</Text>
              {r.sub ? <Text style={styles.calcRowSub}>{r.sub}</Text> : null}
            </View>
            {r.value ? <Text style={styles.calcRowValue}>{r.value}</Text> : <Text style={styles.calcRowPlaceholder}>{r.placeholder}</Text>}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const F = 'Manrope';
const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontFamily: F, fontSize: 15, fontWeight: '700', color: '#1E1B18' },
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7E2DA', borderRadius: 12, paddingHorizontal: 14, height: 52 },
  labelGrey: { fontFamily: F, fontSize: 15, fontWeight: '500', color: '#57534E' },
  star: { color: '#DC2626', fontWeight: '700' },
  inputGrey: { fontSize: 15, fontWeight: '600', minWidth: 0 },
  boxGrey: { backgroundColor: '#F2F3F7', borderRadius: 14, height: 48, paddingHorizontal: 12 },
  cc: { fontFamily: F, fontSize: 15, fontWeight: '500', color: '#1E1B18' },
  ccDivider: { width: 1, height: 18, backgroundColor: '#D6D3D1', marginHorizontal: 8 },
  boxMulti: { height: undefined, minHeight: 96, alignItems: 'flex-start', paddingVertical: 12 },
  prefix: { fontFamily: F, fontSize: 18, fontWeight: '700', color: '#7B1420', marginRight: 8 },
  suffix: { fontFamily: F, fontSize: 14, fontWeight: '700', color: '#78716C', marginLeft: 8 },
  input: { flex: 1, fontFamily: F, fontSize: 18, fontWeight: '700', color: '#1E1B18', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  helper: { fontFamily: F, fontSize: 12, fontWeight: '500', color: '#78716C' },
  calc: { backgroundColor: '#EDE8E0', borderRadius: 14, padding: 14, gap: 12 },
  calcLabel: { fontFamily: F, fontSize: 11, fontWeight: '800', color: '#78716C', letterSpacing: 1 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcDivider: { height: 1, backgroundColor: '#E7E2DA' },
  calcRowLabel: { fontFamily: F, fontSize: 15, fontWeight: '700', color: '#1E1B18' },
  calcRowSub: { fontFamily: F, fontSize: 11, fontWeight: '500', color: '#78716C' },
  calcRowValue: { fontFamily: F, fontSize: 17, fontWeight: '800', color: '#1E1B18' },
  calcRowPlaceholder: { fontFamily: F, fontSize: 13, fontWeight: '600', color: '#78716C' },
});
