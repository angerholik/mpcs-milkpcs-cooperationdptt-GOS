import { useEffect, useRef, useState } from 'react';
import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';

const CATEGORIES = [
  { label: 'Milk PCS Master', icon: 'drop', ink: COLOR.amber, tint: COLOR.amberTint },
  { label: 'MPCS Master', icon: 'home', ink: COLOR.green, tint: COLOR.greenTint },
  { label: 'MPCS Member List', icon: 'users', ink: COLOR.blue, tint: COLOR.blueTint },
  { label: 'Milk PCS Member List', icon: 'users', ink: COLOR.amber, tint: COLOR.amberTint },
  { label: 'Audit & Compliance Audit Log', icon: 'shieldCheck', ink: COLOR.maroon, tint: COLOR.roseTint },
  { label: 'Official Inspectors Registry', icon: 'bank', ink: COLOR.green, tint: COLOR.greenTint },
  { label: 'CSC Transactions', icon: 'monitor', ink: COLOR.blue, tint: COLOR.blueTint },
  { label: 'MPCS Daily Transactions', icon: 'book', ink: COLOR.maroon, tint: COLOR.roseTint },
];

// Builds a YYYY-MM-DD string from the date's LOCAL components — d.toISOString()
// converts to UTC first, which rolls back to the previous day for any
// timezone behind UTC (e.g. local midnight Sep 1 becomes "2026-08-31" once
// converted to UTC), silently shifting every quick-range chip by a day.
const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const QUICK_RANGES = [
  {
    label: 'This month',
    apply: () => {
      const now = new Date();
      return { start: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), end: toISODate(now) };
    },
  },
  {
    label: 'This quarter',
    apply: () => {
      const now = new Date();
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { start: toISODate(new Date(now.getFullYear(), qStartMonth, 1)), end: toISODate(now) };
    },
  },
  {
    label: 'Financial year',
    apply: () => {
      const now = new Date();
      const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return { start: toISODate(new Date(fyStartYear, 3, 1)), end: toISODate(now) };
    },
  },
];

const fmtDisplayDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export default function ReportsScreen({
  reportCategory, setReportCategory, reportEntity, setReportEntity,
  reportEntityOptions, reportStartDate, setReportStartDate, reportEndDate, setReportEndDate,
  generatedReport, generateReport, downloadReportCSV,
}) {
  const [downloading, setDownloading] = useState(false);
  const pendingDownloadRef = useRef(false);

  useEffect(() => {
    if (pendingDownloadRef.current && generatedReport) {
      downloadReportCSV(generatedReport.columns, generatedReport.rows, generatedReport.title.replace(/\s+/g, '_'));
      pendingDownloadRef.current = false;
      setDownloading(false);
    }
  }, [generatedReport, downloadReportCSV]);

  const handleDownload = () => {
    setDownloading(true);
    pendingDownloadRef.current = true;
    generateReport();
  };

  const selected = CATEGORIES.find((c) => c.label === reportCategory) || CATEGORIES[0];
  const notApplicable = reportCategory === 'Official Inspectors Registry';
  const resultCount = generatedReport && generatedReport.title === reportCategory ? generatedReport.rows.length : null;

  return (
    <>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', color: COLOR.green }}>OFFICIAL OVERSIGHT REPORTS</div>
        <div style={{ fontFamily: FONT.heading, fontSize: 24, fontWeight: 600, color: COLOR.ink900, letterSpacing: '-.015em', marginTop: 8 }}>
          Reports &amp; Export Center
        </div>
        <div style={{ fontSize: 13, color: COLOR.muted, marginTop: 7, lineHeight: 1.45, textWrap: 'pretty' }}>
          Generate and download official district co-operative oversight reports
        </div>
      </div>

      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: COLOR.mutedLight }}>REPORT CATEGORY</div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CATEGORIES.map((c) => {
            const on = c.label === reportCategory;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => { setReportCategory(c.label); setReportEntity(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left',
                  background: on ? COLOR.selectedSurface : COLOR.inset,
                  border: `1px solid ${on ? COLOR.selectedBorder : COLOR.hairline}`,
                  borderRadius: 12, padding: 13, minHeight: 44,
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: on ? c.tint : COLOR.barTrack, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  {iconEl(c.icon, on ? c.ink : COLOR.faintLight, 16)}
                </div>
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONT.heading, fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? COLOR.ink900 : COLOR.ink700, lineHeight: 1.3 }}>
                  {c.label}
                </span>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${on ? COLOR.maroon : COLOR.radioRing}`, background: on ? COLOR.maroon : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  {on && iconEl('check', '#fff', 11, 3)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: COLOR.mutedLight }}>SOCIETY / CENTER</div>
          <select
            value={reportEntity}
            disabled={notApplicable}
            onChange={(e) => setReportEntity(e.target.value)}
            style={{
              width: '100%', marginTop: 8, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`,
              borderRadius: 12, padding: 13, fontSize: 13, fontWeight: 500, color: COLOR.ink800,
              opacity: notApplicable ? 0.5 : 1, fontFamily: FONT.body,
            }}
          >
            <option value="">All societies &amp; centres ({reportEntityOptions.length})</option>
            {reportEntityOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: COLOR.mutedLight }}>START DATE</div>
            <input
              type="date"
              value={reportStartDate}
              disabled={notApplicable}
              onChange={(e) => setReportStartDate(e.target.value)}
              style={{
                width: '100%', marginTop: 8, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`,
                borderRadius: 12, padding: '13px 12px', fontFamily: FONT.heading, fontSize: 13, fontWeight: 500,
                color: COLOR.ink900, opacity: notApplicable ? 0.5 : 1,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: COLOR.mutedLight }}>END DATE</div>
            <input
              type="date"
              value={reportEndDate}
              disabled={notApplicable}
              onChange={(e) => setReportEndDate(e.target.value)}
              style={{
                width: '100%', marginTop: 8, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`,
                borderRadius: 12, padding: '13px 12px', fontFamily: FONT.heading, fontSize: 13, fontWeight: 500,
                color: COLOR.ink900, opacity: notApplicable ? 0.5 : 1,
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              disabled={notApplicable}
              onClick={() => { const { start, end } = r.apply(); setReportStartDate(start); setReportEndDate(end); }}
              style={{
                background: COLOR.inset, border: `1px solid ${COLOR.hairline}`, borderRadius: 999,
                padding: '8px 12px', fontSize: 11.5, fontWeight: 500, color: COLOR.ink800,
                whiteSpace: 'nowrap', opacity: notApplicable ? 0.5 : 1,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR.roseTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            {iconEl('doc', COLOR.maroon, 19)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT.heading, fontSize: 14.5, fontWeight: 600, color: COLOR.ink900, lineHeight: 1.3 }}>{selected.label}</div>
            <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 4 }}>
              {notApplicable ? 'Full roster · Not date-scoped' : `${fmtDisplayDate(reportStartDate)} – ${fmtDisplayDate(reportEndDate)} · ${reportEntity || 'All centres'}`}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          style={{
            marginTop: 14, width: '100%', background: COLOR.maroon, border: 'none', borderRadius: 12,
            padding: 15, fontFamily: FONT.heading, fontSize: 13.5, fontWeight: 600, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: downloading ? 0.7 : 1,
          }}
        >
          {iconEl('download', '#fff', 16)}
          {downloading ? 'Generating…' : 'Download CSV'}
        </button>
        <div style={{ fontSize: 11.5, color: COLOR.mutedLight, marginTop: 10, textAlign: 'center' }}>
          {resultCount === null
            ? 'CSV is generated from live records and downloaded to this device.'
            : resultCount === 0
              ? 'No records found for this range — nothing was downloaded.'
              : `${resultCount} record${resultCount === 1 ? '' : 's'} exported.`}
        </div>
      </Card>
    </>
  );
}
