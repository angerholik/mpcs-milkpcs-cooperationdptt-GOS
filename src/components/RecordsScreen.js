import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderNav from './HeaderNav';
import BottomNav from './BottomNav';
import { supabase } from '../supabase';

const COLORS = {
  primary: '#7C1C1C',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#ECFDF5',
  amber: '#D97706',
};

export default function RecordsScreen({
  activeTab = 'records',
  onTabPress,
  onViewPdf,
  onNavigateHome,
  records = []
}) {
  const [searchQ, setSearchQ] = useState('');
  const [dbRecords, setDbRecords] = useState([]);

  useEffect(() => {
    if (!records || records.length === 0) {
      (async () => {
        try {
          const [resMilk, resMpcs] = await Promise.all([
            supabase.from('milk_pcs_submissions').select('*').order('created_at', { ascending: false }),
            supabase.from('mpcs_submissions').select('*').order('created_at', { ascending: false })
          ]);

          const list = [];
          (resMilk.data || []).forEach(r => {
            let actObj = r.activities;
            if (typeof actObj === 'string') {
              try { actObj = JSON.parse(actObj); } catch(e) {}
            }
            const isRev = !!(actObj?.is_updated || actObj?.updated_at || r.is_updated || r.isUpdated);
            list.push({
              id: r.id,
              month: r.reporting_month || 'Monthly',
              center: r.center_name,
              code: r.center_id || r.registration_number || 'MILK-PCS',
              officer: r.reported_by || 'Inspector',
              litres: `${r.litres || 0} L`,
              withdrawal: `₹${r.withdrawal || 0}`,
              balance: `₹${r.balance || 0}`,
              status: 'SUBMITTED',
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              isUpdated: isRev
            });
          });

          (resMpcs.data || []).forEach(r => {
            let fdObj = r.form_data;
            if (typeof fdObj === 'string') {
              try { fdObj = JSON.parse(fdObj); } catch(e) {}
            }
            const isRev = !!(fdObj?.is_updated || fdObj?.updated_at || r.is_updated || r.isUpdated);
            list.push({
              id: r.id,
              month: 'Monthly',
              center: r.society_name,
              code: r.registration_number || 'MPCS',
              officer: r.president_name || 'Inspector',
              litres: `${r.total_members || 0} Members`,
              withdrawal: `₹${r.annual_turnover || 0}`,
              balance: `₹${r.bank_balance || 0}`,
              status: 'SUBMITTED',
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              isUpdated: isRev
            });
          });

          setDbRecords(list);
        } catch (e) {
          console.warn('Failed to load records from Supabase:', e);
        }
      })();
    }
  }, [records]);

  const activeRecords = (records && records.length > 0) ? records : dbRecords;

  // Deduplicate records by center name + month (keeping latest)
  const uniqueRecordsMap = new Map();
  (activeRecords || []).forEach(r => {
    let fdObj = r.form_data || r.activities;
    if (typeof fdObj === 'string') {
      try { fdObj = JSON.parse(fdObj); } catch(e) {}
    }
    const isRev = !!(r.isUpdated || r.is_updated || fdObj?.is_updated || fdObj?.updated_at);
    const itemWithRev = { ...r, isUpdated: isRev };

    const key = `${(r.center || r.center_name || r.society_name || '').trim().toLowerCase()}_${(r.month || r.reporting_month || '').trim().toLowerCase()}`;
    if (!uniqueRecordsMap.has(key)) {
      uniqueRecordsMap.set(key, itemWithRev);
    }
  });
  const uniqueRecords = Array.from(uniqueRecordsMap.values());

  const filtered = uniqueRecords.filter(r => 
    r.month?.toLowerCase().includes(searchQ.toLowerCase()) ||
    r.center?.toLowerCase().includes(searchQ.toLowerCase()) ||
    r.officer?.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <HeaderNav />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* Screen Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenHeading}>Submission Records</Text>
            <Text style={styles.screenSub}>Official Monthly Audit & Inspection Logs</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{uniqueRecords.length} Archived</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search month, center, officer..."
            placeholderTextColor="#94A3B8"
          />
          {searchQ ? (
            <TouchableOpacity onPress={() => setSearchQ('')}>
              <MaterialIcons name="cancel" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 10 }}>
            <MaterialIcons name="folder-open" size={40} color="#94A3B8" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 }}>No Records Found</Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 }}>
              Completed monthly returns and audit logs will appear here once saved.
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
          <View key={item.id} style={styles.recordCard}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.monthTitle}>{item.month} Return</Text>
                <Text style={styles.centerSub}>{item.center} ({item.code})</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                {item.isUpdated && (
                  <View style={styles.updatedBadge}>
                    <MaterialIcons name="edit" size={12} color="#B45309" />
                    <Text style={styles.updatedBadgeText}>REVISED ✎</Text>
                  </View>
                )}
                <View style={styles.statusBadge}>
                  <MaterialIcons name="verified" size={14} color={COLORS.success} />
                  <Text style={styles.statusBadgeText}>{item.status || "SUBMITTED"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Litres Collected</Text>
                <Text style={[styles.statValue, { color: '#1E40AF' }]}>{item.litres}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Withdrawal</Text>
                <Text style={[styles.statValue, { color: '#C2410C' }]}>{item.withdrawal}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Bank Balance</Text>
                <Text style={[styles.statValue, { color: '#047857' }]}>{item.balance}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerMeta}>Submitted: {item.date} by {item.officer}</Text>
              <TouchableOpacity style={styles.pdfBtn} onPress={onViewPdf} activeOpacity={0.8}>
                <MaterialIcons name="picture-as-pdf" size={16} color={COLORS.primary} />
                <Text style={styles.pdfBtnText}>VIEW PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
          ))
        )}


      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  screenHeading: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  screenSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  countBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  countText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  recordCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  monthTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  centerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  updatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  updatedBadgeText: { fontSize: 10, fontWeight: '800', color: '#B45309' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCol: { flex: 1 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerMeta: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  pdfBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
});
