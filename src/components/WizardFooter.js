import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// Back / Save-and-continue / Save-as-draft footer shared by the monthly
// return wizard screens — same look as the MPCS wizard footer.
export default function WizardFooter({ onBack, onSaveNext, onDraft, nextLabel = 'Save and continue' }) {
  return (
    <>
      <View style={styles.row}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={onSaveNext}>
          <Text style={styles.primaryText}>{nextLabel}</Text>
        </Pressable>
      </View>
      {onDraft ? (
        <Pressable onPress={onDraft} hitSlop={8}>
          <Text style={styles.draftLink}>Save as draft</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E7E2DA', alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Manrope', fontSize: 14, fontWeight: '800', color: '#1E1B18' },
  primaryBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7B1420', alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: 'Manrope', fontSize: 14, fontWeight: '800', color: '#ffffff' },
  draftLink: { fontFamily: 'Manrope', fontSize: 13, fontWeight: '700', color: '#78716C', textAlign: 'center' },
});
