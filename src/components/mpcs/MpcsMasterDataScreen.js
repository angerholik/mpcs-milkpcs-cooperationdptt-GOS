import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../../utils/webStyles';
import BottomNav from '../BottomNav';

// Redesign source: Claude Design canvas "Design improvements for task
// dashboard" (https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx), section
// "3 · Master data", screen 6a "All seven records" — one scrollable page
// instead of the 7 separate wizard screens' own view routes. Each card's
// "Edit"/"Add" button still opens the existing wizard screen (MPCS_*_VIEW)
// for that section; this screen is a read-only aggregate of state App.js
// already holds, not a new data source.
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  amber50: '#FFF7ED',
  amber700: '#B45309',
  amberBorder: '#FDE7C8',
};

const FONT_FAMILY = 'Manrope';

const fmt = (v) => (v === undefined || v === null || v === '' ? '—' : v);

export default function MpcsMasterDataScreen({
  societyName = '',
  panCard = '',
  regNumber = '',
  regDate = '',
  demographicsData = [],
  complianceData = {},
  financialsData = {},
  dividendData = {},
  shareCapitalData = {},
  loanData = {},
  onNavigateScreen,
  onBack,
  activeTab = 'home',
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const totalMale = demographicsData.reduce((acc, row) => acc + (parseInt(row.male) || 0), 0);
  const totalFemale = demographicsData.reduce((acc, row) => acc + (parseInt(row.female) || 0), 0);

  const sections = [
    {
      id: 'MPCS_PROFILE_VIEW',
      title: 'Society identification',
      filled: Boolean(societyName),
      emptyDesc: 'Society name and registration details have not been recorded.',
      addLabel: 'Add society details',
      render: () => (
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Society name</Text>
            <Text style={styles.fieldValue}>{fmt(societyName)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>PAN</Text>
            <Text style={styles.fieldValue}>{fmt(panCard)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Registration no.</Text>
            <Text style={styles.fieldValue}>{fmt(regNumber)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Registered on</Text>
            <Text style={styles.fieldValue}>{fmt(regDate)}</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'MPCS_DEMOGRAPHICS_VIEW',
      title: 'Registered demographics',
      filled: demographicsData.length > 0,
      emptyDesc: 'No member demographics have been recorded yet.',
      addLabel: 'Add demographics',
      render: () => (
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Category</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>Male</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>Female</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>Total</Text>
          </View>
          {demographicsData.map((row) => (
            <View style={styles.tableRow} key={row.category}>
              <Text style={[styles.tableCell, { flex: 1.4 }]}>{row.category}</Text>
              <Text style={[styles.tableCell, styles.tableCellCenter]}>{row.male || 0}</Text>
              <Text style={[styles.tableCell, styles.tableCellCenter]}>{row.female || 0}</Text>
              <Text style={[styles.tableCell, styles.tableCellCenter]}>{row.total || 0}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, styles.tableTotalRow]}>
            <Text style={[styles.tableTotalCell, { flex: 1.4 }]}>Total</Text>
            <Text style={[styles.tableTotalCell, styles.tableCellCenter]}>{totalMale}</Text>
            <Text style={[styles.tableTotalCell, styles.tableCellCenter]}>{totalFemale}</Text>
            <Text style={[styles.tableTotalCell, styles.tableCellCenter]}>{totalMale + totalFemale}</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'MPCS_COMPLIANCE_VIEW',
      title: 'Compliance and audit',
      filled: Boolean(complianceData?.auditYear || complianceData?.agmYear),
      emptyDesc: 'No audit or AGM has been recorded for this society.',
      addLabel: 'Add audit details',
      render: () => (
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Audit status</Text>
            <Text style={styles.fieldValue}>{fmt(complianceData?.auditStatus)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Audit year</Text>
            <Text style={styles.fieldValue}>{fmt(complianceData?.auditYear)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>AGM status</Text>
            <Text style={styles.fieldValue}>{fmt(complianceData?.agmStatus)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>AGM year</Text>
            <Text style={styles.fieldValue}>{fmt(complianceData?.agmYear)}</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'MPCS_FINANCIALS_VIEW',
      title: 'Financial performance',
      filled: Boolean(financialsData?.annualTurnover),
      emptyDesc: 'Annual turnover and profitability have not been reported.',
      addLabel: 'Add financials',
      render: () => (
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Annual turnover</Text>
            <Text style={styles.fieldValue}>₹{fmt(financialsData?.annualTurnover)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Net profit</Text>
            <Text style={styles.fieldValue}>₹{fmt(financialsData?.netProfit)}</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'MPCS_DIVIDEND_VIEW',
      title: 'Dividend details',
      filled: Boolean(dividendData?.dividendAnnounced || dividendData?.dividendAmount),
      emptyDesc: 'No dividend has been distributed yet.',
      addLabel: 'Add dividend details',
      render: () => (
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Rate</Text>
            <Text style={styles.fieldValue}>{fmt(dividendData?.dividendRate)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <Text style={styles.fieldValue}>₹{fmt(dividendData?.dividendAmount)}</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'MPCS_SHARE_CAPITAL_VIEW',
      title: 'Share capital',
      filled: Boolean(shareCapitalData?.authorizedCapital || shareCapitalData?.paidUpCapital),
      emptyDesc: 'Authorised and paid-up capital and member deposits have not been recorded.',
      addLabel: 'Add share capital',
      render: () => (
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Authorised capital</Text>
            <Text style={styles.fieldValue}>₹{fmt(shareCapitalData?.authorizedCapital)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Paid-up capital</Text>
            <Text style={styles.fieldValue}>₹{fmt(shareCapitalData?.paidUpCapital)}</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'MPCS_LOAN',
      title: 'Loan details',
      filled: loanData?.hasLoan !== undefined,
      emptyDesc: 'No loan has been recorded for this society.',
      addLabel: 'Add loan details',
      render: () => (
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <Text style={styles.fieldLabel}>Has active loan</Text>
            <Text style={styles.fieldValue}>{loanData?.hasLoan ? 'Yes' : 'No'}</Text>
          </View>
          {loanData?.hasLoan ? (
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Loan type</Text>
              <Text style={styles.fieldValue}>{fmt(loanData?.loanType)}</Text>
            </View>
          ) : null}
        </View>
      ),
    },
  ];

  const emptyCount = sections.filter((s) => !s.filled).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroon} />

      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Master data</Text>
        <Text style={styles.headerSubtitle}>
          {fmt(societyName)} · {emptyCount === 0 ? 'verified' : 'not yet verified'}
        </Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>

        {emptyCount > 0 && (
          <View style={styles.warningCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={COLORS.amber700} />
            <Text style={styles.warningText}>
              {emptyCount} of {sections.length} records are empty. Verification cannot start until they are filled.
            </Text>
          </View>
        )}

        {sections.map((s) => (
          <View style={styles.card} key={s.id}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              {s.filled && (
                <Pressable onPress={() => onNavigateScreen && onNavigateScreen(s.id)} hitSlop={8}>
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
              )}
            </View>
            {s.filled ? (
              s.render()
            ) : (
              <>
                <Text style={styles.emptyDesc}>{s.emptyDesc}</Text>
                <Pressable
                  style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => onNavigateScreen && onNavigateScreen(s.id)}
                >
                  <Text style={styles.addBtnText}>{s.addLabel}</Text>
                </Pressable>
              </>
            )}
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
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
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 10,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.amber50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.amber700,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  editLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.maroon,
  },
  emptyDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
    lineHeight: 18,
    marginBottom: 14,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.maroon,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  addBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCell: {
    width: '45%',
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  tableTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.ink,
    marginTop: 4,
  },
  tableTotalCell: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
});
