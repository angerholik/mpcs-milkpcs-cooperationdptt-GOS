import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import HeaderNav from './HeaderNav';
import BottomNav from './BottomNav';
import { supabase } from '../supabase';
import { webCapWidth } from '../utils/webStyles';

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

// The all-records PDF is assembled from field-entered strings (officer/center
// names) interpolated straight into HTML — escape them so a name containing
// `<`/`&` can't break the markup or inject content into the exported report.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export default function RecordsScreen({
  activeTab = 'records',
  onTabPress,
  onViewPdf,
  onNavigateHome,
  userProfile = null,
  records = [],
  reportType = null
}) {
  const [searchQ, setSearchQ] = useState('');
  const [dbRecords, setDbRecords] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!records || records.length === 0) {
      (async () => {
        try {
          // userProfile is the raw Supabase auth User object — fullName lives
          // under user_metadata (set at signUp), not as a top-level property.
          // Reading userProfile?.fullName directly always produced '', which
          // combined with milk_pcs_submissions/mpcs_submissions having no
          // inspector_email column (see officerEmail below) meant neither
          // match path could ever succeed — every officer saw "No Records
          // Found" regardless of what they'd actually submitted.
          const userEmail = (userProfile?.email || '').trim().toLowerCase();
          const userName = (
            userProfile?.user_metadata?.fullName ||
            userProfile?.user_metadata?.inspectorName ||
            userProfile?.fullName ||
            userProfile?.inspectorName ||
            ''
          ).trim().toLowerCase();

          // Records is rendered separately for the Milk PCS and MPCS sections of the
          // app (two call sites in App.js) — each must only ever show that section's
          // own submissions. Only query the table that matches, instead of always
          // fetching both and merging, so a Milk PCS return can never show up while
          // browsing MPCS records (and vice versa).
          const [resMilk, resMpcs] = await Promise.all([
            reportType === 'MPCS'
              ? Promise.resolve({ data: [] })
              : supabase.from('milk_pcs_submissions').select('*').order('created_at', { ascending: false }),
            reportType === 'MILK'
              ? Promise.resolve({ data: [] })
              : supabase.from('mpcs_submissions').select('*').order('created_at', { ascending: false })
          ]);

          const list = [];
          (resMilk.data || []).forEach(r => {
            let actObj = r.activities;
            if (typeof actObj === 'string') {
              try { actObj = JSON.parse(actObj); } catch(e) {}
            }
            const isRev = !!(actObj?.is_updated || actObj?.updated_at || r.is_updated || r.isUpdated);
            // milk_pcs_submissions doesn't capture the submitting officer's
            // email anywhere — only reported_by (a display name) — so this
            // table can only ever be isolated by name match.
            const officerEmail = (r.inspector_email || '').trim().toLowerCase();
            const officerName = (r.reported_by || '').trim().toLowerCase();

            // Strict user isolation filter
            if (userEmail || userName) {
              const matchEmail = userEmail && officerEmail && officerEmail === userEmail;
              const matchName = userName && officerName && officerName.includes(userName);
              if (!matchEmail && !matchName) return;
            }

            list.push({
              id: r.id,
              month: r.reporting_month || 'Monthly',
              center: r.center_name,
              code: r.center_id || r.registration_number || 'MILK-PCS',
              officer: r.reported_by || userProfile?.fullName || 'Inspector',
              litres: `${r.litres || 0} L`,
              withdrawal: `₹${r.withdrawal || 0}`,
              balance: `₹${r.balance || 0}`,
              status: 'SUBMITTED',
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              isUpdated: isRev,
              rawData: r,
            });
          });

          (resMpcs.data || []).forEach(r => {
            let fdObj = r.form_data;
            if (typeof fdObj === 'string') {
              try { fdObj = JSON.parse(fdObj); } catch(e) {}
            }
            const isRev = !!(fdObj?.is_updated || fdObj?.updated_at || r.is_updated || r.isUpdated);
            // mpcs_submissions has no inspector_email column — the app writes
            // it into form_data.inspectorEmail instead (see saveMpcsSubmission).
            const officerEmail = (fdObj?.inspectorEmail || r.inspector_email || '').trim().toLowerCase();
            const officerName = (r.reported_by || r.president_name || '').trim().toLowerCase();

            // Strict user isolation filter
            if (userEmail || userName) {
              const matchEmail = userEmail && officerEmail && officerEmail === userEmail;
              const matchName = userName && officerName && officerName.includes(userName);
              if (!matchEmail && !matchName) return;
            }

            list.push({
              id: r.id,
              month: r.reporting_month || 'Monthly',
              center: r.society_name || r.center_name,
              code: r.registration_number || 'MPCS',
              officer: r.reported_by || r.president_name || userProfile?.fullName || 'Inspector',
              litres: `${r.total_members || 0} Members`,
              withdrawal: `₹${r.annual_turnover || 0}`,
              balance: `₹${r.bank_balance || 0}`,
              status: 'SUBMITTED',
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              isUpdated: isRev,
              rawData: r,
            });
          });

          setDbRecords(list);
        } catch (e) {
          console.warn('Failed to load records from Supabase:', e);
        }
      })();
    }
  }, [records, userProfile, reportType]);

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

  // Consolidated PDF of every record currently listed (respects the active
  // search filter) — a tabular archive export, distinct from the single-
  // submission "sealed" certificate generated elsewhere (App.js generatePDF).
  const handleExportAllPdf = async () => {
    if (exporting || filtered.length === 0) return;
    setExporting(true);
    try {
      const rows = filtered.map(r => `
        <tr>
          <td>${escapeHtml(r.date || '—')}</td>
          <td>${escapeHtml(r.month || '—')}</td>
          <td>${escapeHtml(r.center || '—')}<br/><span class="code">${escapeHtml(r.code || '')}</span></td>
          <td>${escapeHtml(r.officer || '—')}</td>
          <td>${escapeHtml(r.litres || '—')}</td>
          <td>${escapeHtml(r.withdrawal || '—')}</td>
          <td>${escapeHtml(r.balance || '—')}</td>
        </tr>`).join('');

      const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { size: A4 landscape; margin: 14mm; }
              * { box-sizing: border-box; }
              body { font-family: Arial, Helvetica, sans-serif; color: #1E293B; margin: 0; }
              .hdr { text-align: center; border-bottom: 2px solid #7C1C1C; padding-bottom: 10px; margin-bottom: 14px; }
              .hdr h1 { font-size: 16px; color: #7C1C1C; margin: 0 0 2px; letter-spacing: 1px; }
              .hdr p { font-size: 10px; color: #64748B; margin: 0; }
              .meta { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
              th { background: #7C1C1C; color: #fff; text-align: left; padding: 6px 8px; }
              td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
              tr:nth-child(even) { background: #F8FAFC; }
              .code { color: #94A3B8; font-size: 8.5px; }
              .ftr { margin-top: 14px; font-size: 8.5px; color: #94A3B8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="hdr">
              <h1>DEPARTMENT OF COOPERATION — GOVERNMENT OF SIKKIM</h1>
              <p>Consolidated Monthly Submission Records</p>
            </div>
            <div class="meta">
              <span>Officer: ${escapeHtml(userProfile?.fullName || userProfile?.inspectorName || 'Cooperative Inspector')}</span>
              <span>Total Records: ${filtered.length}</span>
              <span>Generated: ${generatedAt}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Month</th>
                  <th>Center / Society</th>
                  <th>Officer</th>
                  <th>Litres / Members</th>
                  <th>Withdrawal / Turnover</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="ftr">Generated from the Milk PCS / MPCS Cooperative Reporting App — for official record-keeping only.</div>
          </body>
        </html>`;

      if (Platform.OS === 'web') {
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(htmlContent);
          printWin.document.close();
          setTimeout(() => { printWin.focus(); printWin.print(); }, 300);
        }
      } else {
        const printResult = await Print.printToFileAsync({ html: htmlContent });
        if (printResult?.uri && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(printResult.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      }
    } catch (e) {
      console.warn('Export all records PDF failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderNav />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]}>
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

        {/* Export All to PDF */}
        <TouchableOpacity
          style={[styles.exportAllBtn, (exporting || filtered.length === 0) && styles.exportAllBtnDisabled]}
          onPress={handleExportAllPdf}
          disabled={exporting || filtered.length === 0}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialIcons name="picture-as-pdf" size={16} color={filtered.length === 0 ? '#94A3B8' : COLORS.primary} />
          )}
          <Text style={[styles.exportAllBtnText, filtered.length === 0 && { color: '#94A3B8' }]}>
            {exporting ? 'Preparing PDF...' : `Export ${filtered.length !== uniqueRecords.length ? 'Filtered' : 'All'} Records to PDF`}
          </Text>
        </TouchableOpacity>

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
              <TouchableOpacity style={styles.pdfBtn} onPress={() => onViewPdf && onViewPdf(item)} activeOpacity={0.8}>
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
  exportAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 14,
  },
  exportAllBtnDisabled: { borderColor: '#E2E8F0' },
  exportAllBtnText: { fontSize: 12.5, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.3 },
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
