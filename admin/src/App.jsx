import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase.js';
import sikkimEmblem from './sikkim-emblem-official.png';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const DISTRICT_COORDS = {
  'Gyalshing HQ / Geyzing': [27.2889, 88.2713],
  'Dentam Block': [27.2483, 88.1400],
  'Yuksom Block': [27.3750, 88.2215],
  'Tashiding Block': [27.3320, 88.2980],
  'Yangthang Block': [27.2833, 88.2333],
  'Pelling / Pemayangtse': [27.3015, 88.2435],
  'Legship / Bermiok': [27.2500, 88.2833],
};

const fmt  = (n) => {
  if (n == null || n === '' || n === '—') return '—';
  const num = Number(n.toString().replace(/,/g, '').trim());
  return isNaN(num) ? '—' : num.toLocaleString('en-IN');
};
const fmtL = (n) => {
  if (n == null || n === '' || n === '—') return '—';
  const num = Number(n.toString().replace(/,/g, '').trim());
  return isNaN(num) ? '—' : `${num.toLocaleString('en-IN')} L`;
};
const fmtRs = (n) => {
  if (n == null || n === '' || n === '—') return '—';
  const num = Number(n.toString().replace(/,/g, '').trim());
  return isNaN(num) ? '—' : `₹ ${num.toLocaleString('en-IN')}`;
};
const fmtAadhaar = (n) => {
  const digits = (n || '').toString().replace(/\D/g, '');
  if (digits.length !== 12) return digits || '—';
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
};

const EXPORT_LABELS = {
  // Common & Top-level
  'created_at': 'Submission Date',
  'reported_by': 'Officer Name',
  'total_members': 'Total Members',
  'has_loan': 'Active Loan Status',
  
  // Milk PCS Specific
  'center_id': 'Center ID',
  'center_name': 'Center Name',
  'district': 'District / Subdivision',
  'reporting_month': 'Report Month',
  'litres': 'Milk Litres',
  'withdrawal': 'Withdrawal Amount',
  'balance': 'Bank Balance',
  'gps_lat': 'Latitude',
  'gps_lng': 'Longitude',

  // MPCS Specific (Top Level)
  'society_name': 'Society Name',
  'registration_number': 'Registration No',
  'registration_authority': 'Authority / Division',
  'president_name': 'Official Name',
  'president_mobile': 'President Mobile (Cell)',
  'manager_mobile': 'Manager Mobile (Cell)',
  'audit_done': 'Audit Status',
  'audit_year': 'Audit Year',
  'audit_category': 'Audit Grade',
  'annual_turnover': 'Aggregate Turnover (FY)',
  'is_profit': 'Profit Status',
  'net_profit_loss': 'Net Profit/Loss (Amount)',
  'bank_name': 'Bank Name',
  'bank_balance': 'Current Bank Balance',
  'activities': 'Activities Log',

  // MPCS form_data (Numeric Mappings) - Only fields NOT mirrored in top-level
  '1.6': 'Registration Date',
  '1.8': 'PAN Card No',
  '2.2': 'Designation',
  '3.1': 'SC (Male)', '3.2': 'SC (Female)',
  '3.3': 'ST (Male)', '3.4': 'ST (Female)',
  '3.5': 'OBC (Male)', '3.6': 'OBC (Female)',
  '3.7': 'GEN (Male)', '3.8': 'GEN (Female)',
  '3.9': 'Aggregate Members (Form)',
  '3.10': 'Total Male (Form)', '3.11': 'Total Female (Form)',
  '4.4': 'Date of latest AGM conducted',
  '6.1': 'Dividend Declared?', '6.2': 'Dividend Rate (%)', '6.3': 'Dividend Amount Paid', '6.4': 'Dividend Distribution Date',
  '7.1': 'Primary Bank Type', '7.3': 'Bank A/c No', '7.4': 'Bank IFSC', '7.6': 'Balance As On Date',
  '7.69': 'Sales Deposit Year', '7.70': 'Sales Deposit Month', '7.71': 'Monthly Sales Volume', '7.72': 'Total Sales Till Date',
  '8.1': 'Loan Specifics', '8.2': 'Sanction Date', '8.3': 'No. of Beneficiaries', '8.4': 'Loan Extended (Last FY)', '8.5': 'Loan Recovered (Last FY)', '8.6': 'Loan Outstanding (Total)',
  '8.8': 'Authorised Cap', '8.9': 'Paid-Up Cap', '8.10': 'Paid-Up Date', '8.11': 'Total Institutional Deposit',
  '9.1': 'CSC Active?', '9.2': 'CSC ID', '9.3': 'CSC Registered PAN', '9.4': 'CSC Aadhaar No', '9.5': 'CSC Contact No', '9.6': 'CSC Bank Account', '9.7': 'CSC Email ID',
  '9.7z': 'CSC Monthly Transaction Done?', '9.7a': 'CSC Transaction Year', '9.8': 'CSC Transaction Month', '9.9': 'Monthly CSC Turnover', '9.10': 'Total CSC Volume'
};

const MPCS_FIELD_ORDER = [
  // A. Society Details
  'society_name', 'registration_number', 'fd_1.6', 'fd_1.8',
  // B. Office Bearers
  'president_name', 'manager_name', 'president_mobile', 'manager_mobile',
  // C. Demographics
  'fd_3.1', 'fd_3.2', 'fd_3.3', 'fd_3.4', 'fd_3.5', 'fd_3.6', 'fd_3.7', 'fd_3.8', 'fd_3.10', 'fd_3.11', 'total_members',
  // D. Audit
  'audit_done', 'audit_year', 'audit_category', 'fd_4.4',
  // E. Financial Performance
  'annual_turnover', 'is_profit', 'net_profit_loss',
  // F. Dividend
  'fd_6.1', 'fd_6.2', 'fd_6.3',
  // G. Bank
  'fd_7.1', 'bank_name', 'fd_7.3', 'fd_7.4', 'bank_balance', 'fd_7.6',
  // H. Deposits
  'fd_7.69', 'fd_7.70', 'fd_7.71', 'fd_7.72',
  // I. Credit/Loans
  'fd_8.0', 'fd_8.1', 'fd_8.2', 'fd_8.3', 'fd_8.4', 'fd_8.5', 'fd_8.6',
  // J. Revenue/Capital
  'fd_8.8', 'fd_8.9', 'fd_8.10', 'fd_8.11',
  // K. CSC
  'fd_9.1', 'fd_9.2', 'fd_9.3', 'fd_9.4', 'fd_9.5', 'fd_9.6', 'fd_9.7',
  // L. CSC Trans
  'fd_9.7z', 'fd_9.7a', 'fd_9.8', 'fd_9.9', 'fd_9.10',
  // M. Log
  'activities',
  // Info
  'created_at'
];

const MILK_FIELD_ORDER = [
  'created_at', 'center_name', 'center_id', 'reported_by', 'reporting_month',
  'litres', 'withdrawal', 'balance', 'total_members', 'has_loan', 'activities',
  'gps_lat', 'gps_lng'
];

// The app stores audit_done/agm_done as a descriptive string like "Yes (12 Aug 2026)",
// not a bare "Yes" — so every check in this file needs to match the prefix, not the
// exact value. Use this helper everywhere instead of `=== 'Yes'`.
function isYes(val) {
  return typeof val === 'string' && val.trim().toLowerCase().startsWith('yes');
}

// Helper to parse Milk Audit & AGM details. audit_done/agm_done are stored
// as "Yes (12 Aug 2026)" / "No" strings (the date is embedded, not its own
// column) — this pulls the date back out and derives a plain
// Completed/Pending status alongside the raw year, so the admin UI can show
// them as separate fields instead of one combined sentence.
function getMilkAuditAgm(row) {
  if (!row) return { audit_done: 'No', audit_year: '—', audit_date: '—', audit_status: 'Pending', agm_done: 'No', agm_year: '—', agm_date: '—', agm_status: 'Pending' };
  let audit_done = row.audit_done;
  let audit_year = row.audit_year;
  let agm_done = row.agm_done;
  let agm_year = row.agm_year;
  let agm_date = row.agm_date || '—';

  if (row.activities && typeof row.activities === 'string' && row.activities.startsWith('{')) {
    try {
      const parsed = JSON.parse(row.activities);
      let innerParsed = parsed;
      if (parsed.raw && typeof parsed.raw === 'string' && parsed.raw.startsWith('{')) {
        innerParsed = JSON.parse(parsed.raw);
      }
      if (innerParsed.audit_done) audit_done = innerParsed.audit_done;
      if (innerParsed.audit_year) audit_year = innerParsed.audit_year;
      if (innerParsed.agm_done) agm_done = innerParsed.agm_done;
      if (innerParsed.agm_year) agm_year = innerParsed.agm_year;
      if (innerParsed.agm_date) agm_date = innerParsed.agm_date;
    } catch(e) {}
  }
  if (!audit_done) audit_done = '—';
  if (!agm_done) agm_done = '—';
  if (!audit_year) audit_year = '—';
  if (!agm_year) agm_year = '—';

  const auditDateMatch = typeof audit_done === 'string' ? audit_done.match(/\(([^)]+)\)/) : null;
  const agmDateFromDone = typeof agm_done === 'string' ? agm_done.match(/\(([^)]+)\)/) : null;

  return {
    audit_done,
    audit_year,
    audit_date: auditDateMatch ? auditDateMatch[1] : '—',
    audit_status: isYes(audit_done) ? 'Completed' : 'Pending',
    agm_done,
    agm_year,
    agm_date: agm_date !== '—' ? agm_date : (agmDateFromDone ? agmDateFromDone[1] : '—'),
    agm_status: isYes(agm_done) ? 'Completed' : 'Pending'
  };
}

// The MPCS Compliance & Financial Performance screens in the mobile app write
// the inspector's actual answers into form_data.complianceData.auditStatus and
// form_data.financialsData.profitOrLoss — the top-level audit_done/is_profit
// columns are a separate, historically unreliable derivation (one submission
// path silently defaulted audit_done to "No" and is_profit to "PROFIT"
// regardless of what was entered, before that was fixed at the source). Once
// complianceData/financialsData exist on a row they are the authoritative
// answer, so prefer them outright rather than only filling gaps — that also
// keeps already-submitted records (e.g. Bermiok MPCS) correct without needing
// a resubmission or a database backfill.
function normalizeMpcsAuditFields(row) {
  let fd = row.form_data || {};
  if (typeof fd === 'string') {
    try { fd = JSON.parse(fd); } catch (e) { fd = {}; }
  }
  const compliance = fd.complianceData || {};
  const financials = fd.financialsData || {};
  const loan = fd.loanData || {};
  let audit_done = row.audit_done;
  if (compliance.auditStatus) {
    audit_done = compliance.auditStatus === 'Completed'
      ? `Yes${compliance.auditDate ? ` (${compliance.auditDate})` : ''}`
      : 'No';
  }
  const audit_year = compliance.auditYear || row.audit_year || fd['4.2'] || null;
  const audit_category = row.audit_category || fd['4.3'] || null;
  const is_profit = financials.profitOrLoss || row.is_profit;
  const net_profit_loss = financials.profitOrLoss === 'NO_PROFIT_NO_LOSS'
    ? null
    : (financials.netProfit || row.net_profit_loss);
  const has_loan = loan.hasLoan !== undefined ? !!(loan.hasLoan && !loan.loanCleared) : !!row.has_loan;
  return { ...row, audit_done, audit_year, audit_category, is_profit, net_profit_loss, has_loan };
}

// Helper to parse MPCS Audit & AGM details
function getMpcsAuditAgm(row) {
  if (!row) return { audit_done: 'No', audit_year: '—', audit_category: '—', audit_status: 'Not Completed', agm_done: 'No', agm_date: '—' };
  const fd = row.form_data || {};
  let audit_done = row.audit_done || (fd['4.1'] || 'No');
  let audit_year = row.audit_year || fd['4.2'] || '—';
  let audit_category = row.audit_category || fd['4.3'] || '—';
  let agm_date = fd['4.4'] || row.agm_date || '—';
  let agm_done = (fd['4.4'] || row.agm_done || (fd['4.1'] === 'Yes' ? 'Yes' : 'No'));
  if (agm_done !== 'No' && agm_done !== 'Yes') agm_done = 'Yes';

  return { audit_done, audit_year, audit_category, audit_status: isYes(audit_done) ? 'Completed' : 'Not Completed', agm_done, agm_date };
}

const downloadCSV = (rows, filename) => {
  if (!rows || !rows.length) return;

  // 1. Detect which order to use
  const isMpcs = !!rows[0].society_name;
  const fieldOrder = isMpcs ? MPCS_FIELD_ORDER : MILK_FIELD_ORDER;

  // 2. Prepare Headers using our explicit order
  const headers = fieldOrder.map(k => {
    const lookupKey = k.startsWith('fd_') ? k.replace('fd_', '') : k;
    return EXPORT_LABELS[lookupKey] || k;
  }).join(',');

  // 3. Create Body Rows
  const csvBody = rows.map(row => {
    // Flatten the row for lookup
    const flat = { ...row };
    if (row.form_data && typeof row.form_data === 'object') {
      Object.entries(row.form_data).forEach(([k, v]) => {
        flat[`fd_${k}`] = v;
      });
    }

    return fieldOrder.map(k => {
      let v = flat[k];
      if (v === null || v === undefined) {
        v = '';
      } else if (k === 'created_at') {
        v = new Date(v).toLocaleString('en-IN');
      } else if (typeof v === 'boolean') {
        v = v ? 'Yes' : 'No';
      }
      
      const str = String(v);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\n');

  // Trigger Download
  const blob = new Blob([headers + '\n' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Inline SVG ───────────────────────────────────────────────────────────────
const Icon = ({ d, size=18, color='currentColor', sw=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const I = {
  menu:    'M4 6h16M4 12h16M4 18h16',
  lock:    'M12 17v-6m0 0a3 3 0 100-6 3 3 0 000 6zM5 10V8a7 7 0 0114 0v2M3 10h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2v-8a2 2 0 012-2z',
  logout:  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1',
  submit:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z',
  litres:  'M12 2C8 6 5 10 5 14a7 7 0 0014 0c0-4-3-8-7-12z',
  members: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  money:   'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  search:  'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  refresh: 'M1 4v6h6M23 20v-6h-6M3.51 9A9 9 0 0120.49 15M20.49 9A9 9 0 013.51 15',
  close:   'M18 6L6 18M6 6l12 12',
  image:   'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 22h12a2 2 0 002-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2v16a2 2 0 002 2zm10-10.5a.5.5 0 11-1 0 .5.5 0 011 0z',
  domain:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  cow:     'M12 2a10 10 0 100 20A10 10 0 0012 2z',
  chart:   'M3 3v18h18M7 16l4-4 4 4 5-5',
  download:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  location:'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  user:    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  key:     'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z',
  map:     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 11a4 4 0 100-8 4 4 0 000 8z',
  chevronsLeft: 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
  alert:   'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
};

// ─── LoginPage ────────────────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pw) { setErr('Email and password required.'); return; }
    setLoading(true);
    setErr('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
    }
    // Session listener in App will handle the UI switch
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background: 'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)', padding:'20px'
    }}>
      <div style={{position:'fixed',top:'-100px',left:'-100px',width:'350px',height:'350px',
        borderRadius:'50%',background:'rgba(212,175,55,0.08)',pointerEvents:'none'}}/>
      <div className="fade-in" style={{
        width:'100%', maxWidth:'420px',
        background:'rgba(255,255,255,0.97)', borderRadius:'24px',
        boxShadow:'0 30px 80px rgba(0,0,0,0.25)', overflow:'hidden',
      }}>
        <div style={{background:'linear-gradient(135deg,#7F1D1D,#450A0A)',padding:'32px 36px 28px',textAlign:'center'}}>
          <div style={{width:'80px',height:'80px',borderRadius:'50%',
            background:'rgba(255,255,255,0.15)',
            display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',
            border:'1px solid rgba(255,255,255,0.2)', padding:'10px'}}>
            <img src={sikkimEmblem} alt="Sikkim Emblem" style={{width:'100%',height:'100%',objectFit:'contain', filter:'brightness(0) invert(1)'}}/>
          </div>
          <h1 style={{fontFamily:'Cinzel,serif',fontSize:'28px',color:'#fff',letterSpacing:'4px',fontWeight:900,margin:'0 0 4px'}}>
            CORE</h1>
          <p style={{fontSize:'10px',color:'rgba(255,255,255,0.7)',margin:'0 0 10px',letterSpacing:'1.5px',fontWeight:700}}>
            COOPERATIVE OVERSIGHT & REPORTING ENGINE</p>
          <p style={{fontSize:'9px',color:'var(--gold-light)',letterSpacing:'1px',fontWeight:800,margin:0}}>
            DEPARTMENT OF COOPERATION • GOVERNMENT OF SIKKIM</p>
        </div>
        <form onSubmit={handleSubmit} style={{padding:'32px 36px'}}>
          <div style={{marginBottom:'8px',fontSize:'13px',color:'#6B7280',textAlign:'center'}}>
            Official Gatekeeper Portal. Authorised personnel only.</div>
          
          <div className="field-group" style={{marginTop:'24px',marginBottom:'16px'}}>
            <label className="field-label">Officer Email</label>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--emerald)',opacity:0.6}}>
                <Icon d={I.user} size={16}/>
              </div>
              <input type="email" className="field-input"
                placeholder="officer@sikkim.gov.in" value={email}
                onChange={e=>{setEmail(e.target.value);setErr('');}}
                style={{fontSize:'14px', paddingLeft:'40px'}}/>
            </div>
          </div>

          <div className="field-group" style={{marginBottom:'20px'}}>
            <label className="field-label">Access Key</label>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--emerald)',opacity:0.6}}>
                <Icon d={I.key} size={16}/>
              </div>
              <input id="admin-password" type="password" className="field-input"
                placeholder="••••••••" value={pw}
                onChange={e=>{setPw(e.target.value);setErr('');}}
                style={{fontSize:'15px',letterSpacing:'2px', paddingLeft:'40px'}}/>
            </div>
            {err && <div style={{fontSize:'12px',color:'#EF4444',marginTop:'8px',background:'#FEF2F2',padding:'8px',borderRadius:'8px',border:'1px solid #FECACA'}}>⚠️ {err}</div>}
          </div>
          <button id="login-submit" type="submit" className="btn-primary" disabled={loading}
            style={{width:'100%',padding:'13px',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            {loading ? <div className="spinner" style={{width:'18px',height:'18px',borderWidth:'2px'}}/> : null}
            {loading ? 'Verifying...' : 'Access Dashboard →'}
          </button>
          
          <p style={{fontSize:'11px',color:'#9CA3AF',textAlign:'center',marginTop:'20px'}}>
            FOR OFFICIAL USE ONLY • UNAUTHORIZED ACCESS PROHIBITED • v2.0.4-beta</p>
        </form>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color='#7F1D1D', bg='#FEF2F2', sub, onClick, active, breakdown, popoverAlign='left', entityLabel='MPCS', entityNoun='society', entityNounPlural='societies' }) {
  const [hovered, setHovered] = useState(false);
  const hasBreakdown = Array.isArray(breakdown) && breakdown.length > 0;

  return (
    <div
      className={`kpi-card ${active?'active':''}`}
      onClick={onClick}
      onMouseEnter={() => hasBreakdown && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? color : '#E2E8F0',
        background: active ? bg : '#FFFFFF',
        boxShadow: active ? `0 0 0 2px ${color}20` : 'var(--shadow-subtle)',
        borderLeft: `4px solid ${color}`,
        padding: '14px 16px',
        borderRadius: '6px',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px'}}>
        <span className="kpi-title" style={{fontSize:'10px', color: active ? color : '#64748B'}}>{label}</span>
        <div className="kpi-icon-box" style={{background:bg, width:'30px', height:'30px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon d={icon} size={15} color={color}/>
        </div>
      </div>
      <div className="kpi-val" style={{fontSize:'20px', fontWeight:800, color: active ? color : '#0F172A', lineHeight:1.1}}>{value}</div>
      {sub && <div className="kpi-sub" style={{fontSize:'10px', color:'#94A3B8', marginTop:'4px'}}>{sub}</div>}

      {hasBreakdown && hovered && (() => {
        const magnitudes = breakdown.map(item => {
          const n = parseFloat(String(item.value).replace(/[^0-9.]/g, ''));
          return isNaN(n) ? 0 : n;
        });
        const maxMag = Math.max(...magnitudes, 0);
        const rankColors = ['#B45309', '#94A3B8', '#B45309'];
        const initialsOf = (name) => (name || '?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();

        return (
          <div
            className="fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)',
              ...(popoverAlign === 'right' ? { right: 0 } : { left: 0 }),
              width: '360px',
              maxHeight: '380px', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: '14px', boxShadow: '0 20px 40px -12px rgba(15,23,42,0.3), 0 0 0 1px rgba(15,23,42,0.02)',
              zIndex: 50, padding: '0'
            }}
          >
            <div style={{
              display:'flex', alignItems:'center', gap:'10px', padding:'16px 18px',
              background: `linear-gradient(135deg, ${bg}, #FFFFFF)`, borderBottom: '1px solid #F1F5F9',
              borderRadius: '14px 14px 0 0'
            }}>
              <div style={{width:'32px', height:'32px', borderRadius:'9px', background:color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 10px -2px ${color}66`}}>
                <Icon d={icon} size={16} color="#fff"/>
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:'13px', fontWeight:800, color:'#0F172A', lineHeight:1.2}}>{label}</div>
                <div style={{fontSize:'10.5px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                  Breakdown by {entityLabel} · {breakdown.length} {breakdown.length===1?entityNoun:entityNounPlural}
                </div>
              </div>
            </div>

            <div style={{padding:'8px 10px'}}>
              {breakdown.map((item, i) => {
                const pct = maxMag > 0 ? Math.max(4, (magnitudes[i] / maxMag) * 100) : 0;
                return (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:'12px', padding:'10px 8px',
                    borderRadius:'10px', transition:'background 0.12s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width:'26px', height:'26px', borderRadius:'8px', flexShrink:0,
                      background: i < 3 ? `${rankColors[i]}1A` : '#F1F5F9',
                      color: i < 3 ? rankColors[i] : '#94A3B8',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'10px', fontWeight:900
                    }}>
                      {i+1}
                    </div>
                    <div style={{
                      width:'30px', height:'30px', borderRadius:'50%', flexShrink:0,
                      background: `${color}14`, color, border:`1.5px solid ${color}33`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'10.5px', fontWeight:800
                    }}>
                      {initialsOf(item.name)}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:'8px'}}>
                        <span style={{color:'#1E293B', fontWeight:700, fontSize:'12.5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.name}</span>
                        <span style={{color, fontWeight:800, fontSize:'13px', whiteSpace:'nowrap'}}>{item.value}</span>
                      </div>
                      {maxMag > 0 && (
                        <div style={{marginTop:'6px', height:'4px', borderRadius:'3px', background:'#F1F5F9', overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${pct}%`, borderRadius:'3px', background:`linear-gradient(90deg, ${color}, ${color}99)`, transition:'width 0.4s ease'}}/>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Fetches the persistent member roster for a society from member_registry —
// a separate table from mpcs_submissions/milk_pcs_submissions, since members
// aren't part of any monthly return (see MemberDataScreen on the mobile app).
function useSocietyMembers(societyName, societyType) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!societyName || !societyType) { setMembers([]); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('member_registry')
      .select('id, member_name, mobile_number, ward_name, address, created_at')
      .eq('society_type', societyType)
      .ilike('society_name', societyName.trim())
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setMembers(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [societyName, societyType]);

  return { members, loading };
}

function MemberRosterSection({ members, loading }) {
  if (loading) return <div style={{fontSize:'12px', color:'#94A3B8'}}>Loading members…</div>;
  if (!members || members.length === 0) {
    return <div style={{fontSize:'12px', color:'#94A3B8', fontStyle:'italic'}}>No members registered yet.</div>;
  }
  return (
    <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
      {members.map(m => (
        <div key={m.id} style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', padding:'10px 12px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0'}}>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:800, fontSize:'13px', color:'#0F172A'}}>{m.member_name}</div>
            <div style={{fontSize:'11px', color:'#64748B', marginTop:'2px'}}>{[m.ward_name, m.mobile_number].filter(Boolean).join(' · ') || '—'}</div>
            {m.address && <div style={{fontSize:'11px', color:'#94A3B8', marginTop:'2px'}}>{m.address}</div>}
          </div>
          <div style={{fontSize:'10px', color:'#94A3B8', whiteSpace:'nowrap'}}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : ''}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MilkDetailModal ──────────────────────────────────────────────────────────
function MilkDetailModal({ row, onClose, submitter }) {
  const { members, loading: membersLoading } = useSocietyMembers(row?.center_name, 'MILK');
  if (!row) return null;
  const totalMale   = [row.m_sc,row.m_st,row.m_obc,row.m_gen].reduce((s,v)=>s+(parseInt(v)||0),0);
  const totalFemale = [row.f_sc,row.f_st,row.f_obc,row.f_gen].reduce((s,v)=>s+(parseInt(v)||0),0);
  const auditAgm = getMilkAuditAgm(row);

  const Sec = ({ title, children }) => (
    <div style={{marginBottom:'20px'}}>
      <div style={{fontSize:'11px',fontWeight:700,color:'#7F1D1D',textTransform:'uppercase',
        letterSpacing:'1px',borderBottom:'1.5px solid #FEF2F2',paddingBottom:'6px',marginBottom:'12px'}}>{title}</div>
      {children}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in">
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px',color:'#9CA3AF',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Milk PCS Submission</div>
            <h2 style={{fontSize:'18px',fontWeight:800}}>{row.center_name||row.center_id||'Unknown Center'}</h2>
            <div style={{marginTop:'4px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <span className="badge badge-green">{row.reporting_month||'—'}</span>
              {row.has_loan && <span className="badge badge-gold">Active Loan</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={16}/></button>
        </div>
        <div className="modal-body">
          {/* Photo */}
          {row.photo_url && (
            <Sec title="📸 Field Evidence">
              <div style={{borderRadius:'12px',overflow:'hidden',border:'2px solid #FEF2F2',marginBottom:'4px'}}>
                <img src={row.photo_url} alt="Field evidence" style={{width:'100%',maxHeight:'280px',objectFit:'cover'}}/>
              </div>
              <div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'4px'}}>GPS-timestamped field photo</div>
            </Sec>
          )}
          <Sec title="I. Institutional Profile">
            <div className="detail-grid">
              <div className="detail-item"><span className="lbl">Center Name</span><span className="val">{row.center_name||'—'}</span></div>
              <div className="detail-item"><span className="lbl">Registration Number</span><span className="val">{row.registration_number||'—'}</span></div>
              <div className="detail-item"><span className="lbl">Reporting Month</span><span className="val">{row.reporting_month||'—'}</span></div>
              <div className="detail-item"><span className="lbl">Reported By</span><span className="val">{submitter||row.reported_by||'—'}</span></div>
              <div className="detail-item"><span className="lbl">President Name</span><span className="val">{row.president_name||'—'}</span></div>
              <div className="detail-item"><span className="lbl">President Mobile</span><span className="val">{row.president_mobile||'—'}</span></div>
              <div className="detail-item"><span className="lbl">Manager Name</span><span className="val">{row.manager_name||'—'}</span></div>
              <div className="detail-item"><span className="lbl">Manager Mobile</span><span className="val">{row.manager_mobile||'—'}</span></div>
              <div className="detail-item"><span className="lbl">Submitted At</span><span className="val">{row.created_at?new Date(row.created_at).toLocaleString('en-IN'):'—'}</span></div>
            </div>
          </Sec>
          <Sec title="II. Audit / AGM Details">
            <div className="detail-grid">
              <div className="detail-item"><span className="lbl">Last Audit Conducted Year</span><span className="val">{auditAgm.audit_year}</span></div>
              <div className="detail-item"><span className="lbl">Last Audit Conducted Date</span><span className="val">{auditAgm.audit_date}</span></div>
              <div className="detail-item"><span className="lbl">Audit Status</span><span className="val">{auditAgm.audit_status}</span></div>
              <div className="detail-item"><span className="lbl">Last AGM Conducted Year</span><span className="val">{auditAgm.agm_year}</span></div>
              <div className="detail-item"><span className="lbl">Last AGM Conducted Date</span><span className="val">{auditAgm.agm_date}</span></div>
              <div className="detail-item"><span className="lbl">AGM Status</span><span className="val">{auditAgm.agm_status}</span></div>
            </div>
          </Sec>
          <Sec title="III. Operations Ledger">
            <div className="detail-grid">
              <div className="detail-item"><span className="lbl">Litres</span><span className="val" style={{color:'var(--emerald)',fontWeight:800}}>{fmtL(row.litres)}</span></div>
              <div className="detail-item"><span className="lbl">Bank Balance</span><span className="val val-money">{fmtRs(row.balance)}</span></div>
              <div className="detail-item"><span className="lbl">Withdrawal</span><span className="val val-money">{fmtRs(row.withdrawal)}</span></div>
            </div>
          </Sec>
          <Sec title="IV. Registered Caste Demographics">
            <div style={{overflowX: 'auto', marginBottom: '10px'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
                <thead>
                  <tr style={{background: '#F8FAFC'}}>
                    <th style={{textAlign:'left', padding: '8px 12px', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 800}}>Category</th>
                    <th style={{padding: '8px 12px', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 800, textAlign: 'center'}}>Male</th>
                    <th style={{padding: '8px 12px', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 800, textAlign: 'center'}}>Female</th>
                    <th style={{padding: '8px 12px', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 800, textAlign: 'center'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {lbl: 'SC', m: parseInt(row.m_sc)||0, f: parseInt(row.f_sc)||0},
                    {lbl: 'ST', m: parseInt(row.m_st)||0, f: parseInt(row.f_st)||0},
                    {lbl: 'OBC', m: parseInt(row.m_obc)||0, f: parseInt(row.f_obc)||0},
                    {lbl: 'GEN', m: parseInt(row.m_gen)||0, f: parseInt(row.f_gen)||0}
                  ].map(cat => (
                    <tr key={cat.lbl}>
                      <td style={{padding: '8px 12px', border: '1px solid #E2E8F0', fontWeight:700, color: '#0F172A'}}>{cat.lbl}</td>
                      <td style={{padding: '8px 12px', border: '1px solid #E2E8F0', textAlign:'center', color: '#334155'}}>{cat.m}</td>
                      <td style={{padding: '8px 12px', border: '1px solid #E2E8F0', textAlign:'center', color: '#334155'}}>{cat.f}</td>
                      <td style={{padding: '8px 12px', border: '1px solid #E2E8F0', textAlign:'center', background: '#F0FDF4', fontWeight:800, color: '#047857'}}>
                        {cat.m + cat.f}
                      </td>
                    </tr>
                  ))}
                  <tr style={{background: '#ECFDF5', fontWeight: 900}}>
                    <td style={{padding: '8px 12px', border: '1px solid #A7F3D0', color: '#065F46'}}>GRAND TOTAL</td>
                    <td style={{padding: '8px 12px', border: '1px solid #A7F3D0', textAlign:'center', color: '#065F46'}}>{totalMale}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #A7F3D0', textAlign:'center', color: '#065F46'}}>{totalFemale}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #A7F3D0', textAlign:'center', color: '#047857', fontSize: '13px'}}>{row.total_members || (totalMale + totalFemale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Sec>
          {row.activities && (
            <Sec title="V. Activities">
              <div style={{fontSize:'13px',color:'#374151',lineHeight:'1.7',background:'#F8FAFC',borderRadius:'8px',padding:'12px 16px',whiteSpace:'pre-wrap',border:'1px solid #E5E7EB'}}>
                {(() => {
                  if (typeof row.activities === 'string' && row.activities.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(row.activities);
                      let innerParsed = parsed;
                      if (parsed.raw && typeof parsed.raw === 'string' && parsed.raw.startsWith('{')) {
                        innerParsed = JSON.parse(parsed.raw);
                      }
                      // Milk PCS activity log shape: { activityList: [...], isCompleted }
                      if (Array.isArray(innerParsed.activityList) && innerParsed.activityList.length > 0) {
                        return innerParsed.activityList.map((item, idx) => (
                          <div key={item.id || idx} style={{marginBottom: idx < innerParsed.activityList.length - 1 ? '10px' : 0}}>
                            <span style={{fontWeight: 800, color: '#0F172A'}}>{idx + 1}. {item.title || item.type || 'Activity'}</span>
                            {(item.count || item.participants) && (
                              <span style={{color: '#64748B'}}>
                                {' '}({item.count ? `${item.count} sessions` : ''}{item.count && item.participants ? ', ' : ''}{item.participants ? `${item.participants} participants` : ''})
                              </span>
                            )}
                            {item.desc && <div style={{color: '#475569', marginTop: '2px'}}>{item.desc}</div>}
                          </div>
                        ));
                      }
                      return innerParsed.user_notes || innerParsed.raw || '—';
                    } catch(e) {
                      return row.activities;
                    }
                  }
                  return row.activities;
                })()}
              </div>
            </Sec>
          )}
          {row.has_loan && (
            <Sec title="VI. Loan">
              <div className="detail-grid">
                <div className="detail-item"><span className="lbl">Loan Name</span><span className="val">{row.loan_name||'—'}</span></div>
                <div className="detail-item"><span className="lbl">Loan Amount</span><span className="val val-money">{fmtRs(row.loan_amount)}</span></div>
                <div className="detail-item"><span className="lbl">Paid</span><span className="val val-money">{fmtRs(row.paid_amount)}</span></div>
                <div className="detail-item"><span className="lbl">Remaining Due</span><span className="val" style={{color:'#EF4444',fontWeight:800}}>{fmtRs(row.remaining_due)}</span></div>
              </div>
            </Sec>
          )}
          <Sec title="VII. Verification">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="lbl">Field Visit Timestamp</span>
                <span className="val">{row.captured_at ? new Date(row.captured_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not captured'}</span>
              </div>
              <div className="detail-item">
                <span className="lbl">GPS Location</span>
                <span className="val">{row.gps_lat && row.gps_lng ? `${Number(row.gps_lat).toFixed(5)}°N, ${Number(row.gps_lng).toFixed(5)}°E` : 'Not captured'}</span>
              </div>
            </div>
            {row.gps_lat && row.gps_lng ? (
              <div style={{marginTop:'12px', borderRadius:'12px', overflow:'hidden', border:'1.5px solid var(--border)'}}>
                <iframe 
                  title="Location Preview"
                  width="100%" 
                  height="180" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight="0" 
                  marginWidth="0" 
                  src={`https://maps.google.com/maps?q=${row.gps_lat},${row.gps_lng}&z=15&output=embed`}
                />
                <a href={`https://maps.google.com/?q=${row.gps_lat},${row.gps_lng}`} target="_blank" rel="noreferrer" 
                   style={{display:'block', padding:'10px', background:'var(--emerald-pale)', color:'var(--emerald)', textAlign:'center', fontSize:'12px', fontWeight:800, textDecoration:'none', borderTop:'1.5px solid var(--border)'}}>
                   View Full Map ↗
                </a>
              </div>
            ) : (
              <div style={{marginTop:'12px', padding:'12px 16px', borderRadius:'10px', background:'#F8FAFC', border:'1px solid #E2E8F0', fontSize:'12px', color:'#64748B', fontStyle:'italic'}}>
                No GPS coordinates were captured for this submission's Digital Evidence photo.
              </div>
            )}
          </Sec>
          {/* Registered Members — persistent roster from member_registry, not
              part of this monthly submission (see MemberDataScreen on mobile) */}
          <Sec title={`VIII. Registered Members (${members.length})`}>
            <MemberRosterSection members={members} loading={membersLoading} />
          </Sec>
        </div>
      </div>
    </div>
  );
}

// ─── MPCSDetailModal ──────────────────────────────────────────────────────────
function MPCSDetailModal({ row, onClose }) {
  const { members, loading: membersLoading } = useSocietyMembers(row?.society_name, 'MPCS');
  if (!row) return null;
  let fd = row.form_data || {};
  if (typeof fd === 'string') {
    try { fd = JSON.parse(fd); } catch (e) { fd = {}; }
  }
  const auditAgm = getMpcsAuditAgm(row);
  
  const Sec = ({ title, children }) => (
    <div style={{marginBottom:'24px', borderLeft: '3px solid var(--emerald)', paddingLeft: '16px'}}>
      <div style={{fontSize:'12px', fontWeight:800, color:'var(--emerald-deep)', textTransform:'uppercase',
        letterSpacing:'1.5px', marginBottom:'14px', background: 'var(--emerald-pale)', padding: '6px 10px', borderRadius: '4px', width: 'fit-content'}}>{title}</div>
      {children}
    </div>
  );
  
  const D = ({ l, v, money, mono }) => (
    <div className="detail-item">
      <span className="lbl" style={{fontSize:'11px'}}>{l}</span>
      <span className={`val ${money?'val-money':''}`} style={{fontSize:'13px', fontFamily: mono ? 'monospace' : 'inherit'}}>{money ? fmtRs(v) : (v || '—')}</span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth: '800px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px',color:'var(--emerald)',fontWeight:800,textTransform:'uppercase',letterSpacing:'2px',marginBottom:'4px'}}>Official MPCS Registry</div>
            <h2 style={{fontSize:'22px',fontWeight:900,color:'var(--text-primary)'}}>{row.society_name || 'Society Name Missing'}</h2>
            <div style={{marginTop:'8px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {row.is_profit === 'Yes' ? <span className="badge badge-green">PROFITABLE</span> : <span className="badge badge-red">LOSS MAKING</span>}
              {isYes(row.audit_done) && <span className="badge badge-gold">AUDITED: {row.audit_year}</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        
        <div className="modal-body" style={{maxHeight:'75vh', overflowY:'auto', padding: '32px'}}>

          {/* A. Cooperative Society Details */}
          <Sec title="A. Cooperative Society Details">
            <div className="detail-grid">
              <D l="Society Name" v={row.society_name} />
              <D l="Registration Number" v={row.registration_number} />
              <D l="Date of Registration" v={fd['1.6'] || fd.regDate || fd.reg_date || fd.date_of_registration} />
              <D l="PAN Card" v={fd['1.8'] || fd.panCard || fd.pan_card} mono />
            </div>
          </Sec>

          {/* B. Office Bearers */}
          <Sec title="B. Office Bearers">
            <div className="detail-grid">
              <D l="President Name" v={row.president_name} />
              <D l="Manager Name" v={row.manager_name || fd.managerName || fd.secretaryName || fd['2.3'] || fd['2.2']} />
              <D l="President Mobile" v={row.president_mobile} />
              <D l="Manager Mobile" v={row.manager_mobile || fd.managerMobile || fd.secretaryMobile || fd['2.4']} />
            </div>
          </Sec>

          {/* C. Registered Caste Demographics */}
          <Sec title="C. Registered Caste Demographics">
            <div style={{overflowX: 'auto', marginBottom: '10px'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
                <thead>
                  <tr style={{background: '#F8FAFC'}}>
                    <th style={{textAlign:'left', padding: '8px', border: '1px solid #E2E8F0'}}>Category</th>
                    <th style={{padding: '8px', border: '1px solid #E2E8F0'}}>Male</th>
                    <th style={{padding: '8px', border: '1px solid #E2E8F0'}}>Female</th>
                    <th style={{padding: '8px', border: '1px solid #E2E8F0'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // The mobile app's demographics screen labels the 4th caste row
                    // "Others", not "GEN" — match on any alias so that data entered
                    // as "Others" in the app still lands in the General row here.
                    const categories = [
                      {lbl: 'SC', mKey: '3.1', fKey: '3.2', aliases: ['SC']},
                      {lbl: 'ST', mKey: '3.3', fKey: '3.4', aliases: ['ST']},
                      {lbl: 'OBC', mKey: '3.5', fKey: '3.6', aliases: ['OBC']},
                      {lbl: 'GEN', mKey: '3.7', fKey: '3.8', aliases: ['GEN', 'GENERAL', 'OTHERS', 'OTHER']}
                    ];
                    let sumMale = 0;
                    let sumFemale = 0;

                    const rowsHtml = categories.map(cat => {
                      let mVal = parseInt(fd[cat.mKey]) || 0;
                      let fVal = parseInt(fd[cat.fKey]) || 0;
                      if (!mVal && !fVal && Array.isArray(fd.demographicsData)) {
                        const item = fd.demographicsData.find(d => {
                          const c = (d.casteCategory || d.category || '').toUpperCase();
                          return cat.aliases.some(a => c === a || c.startsWith(a));
                        });
                        if (item) {
                          mVal = parseInt(item.male || item.maleMembers) || 0;
                          fVal = parseInt(item.female || item.femaleMembers) || 0;
                        }
                      }
                      sumMale += mVal;
                      sumFemale += fVal;
                      const rowTotal = mVal + fVal;
                      return (
                        <tr key={cat.lbl}>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', fontWeight:700}}>{cat.lbl}</td>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign:'center'}}>{mVal}</td>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign:'center'}}>{fVal}</td>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign:'center', background: '#F0FDF4', fontWeight:800}}>
                            {rowTotal}
                          </td>
                        </tr>
                      );
                    });

                    const grandTotal = sumMale + sumFemale || fd['3.9'] || row.total_members || 0;
                    return (
                      <>
                        {rowsHtml}
                        <tr style={{background: 'var(--emerald-pale)', fontWeight: 900}}>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0'}}>GRAND TOTAL</td>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign:'center'}}>{sumMale || fd['3.10'] || 0}</td>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign:'center'}}>{sumFemale || fd['3.11'] || 0}</td>
                          <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign:'center', color: 'var(--emerald-deep)'}}>{grandTotal}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* D. Audit / AGM Details */}
          <Sec title="D. Audit / AGM Details">
            {(() => {
              const rawAuditStatus = fd.complianceData?.auditStatus || row.audit_status;
              let auditStatusStr = 'Pending';
              if (rawAuditStatus) {
                auditStatusStr = (rawAuditStatus.toLowerCase() === 'completed' || rawAuditStatus.toLowerCase() === 'yes') ? 'Completed' : 'Pending';
              } else if (isYes(auditAgm.audit_done) || fd['4.1']) {
                auditStatusStr = 'Completed';
              }

              const rawAgmStatus = fd.complianceData?.agmStatus || row.agm_status;
              let agmStatusStr = 'Pending';
              if (rawAgmStatus) {
                agmStatusStr = (rawAgmStatus.toLowerCase() === 'completed' || rawAgmStatus.toLowerCase() === 'yes') ? 'Completed' : 'Pending';
              } else if (isYes(auditAgm.agm_done) || fd['4.4']) {
                agmStatusStr = 'Completed';
              }

              const auditYearVal = fd.complianceData?.auditYear || auditAgm.audit_year || fd['4.2'] || '—';
              const auditDateVal = fd.complianceData?.auditDate || fd['4.1'] || '—';
              const agmYearVal = fd.complianceData?.agmYear || '—';
              const agmDateVal = fd.complianceData?.agmDate || (auditAgm.agm_date !== '—' ? auditAgm.agm_date : '') || fd['4.4'] || '—';

              return (
                <div className="detail-grid">
                  <D l="Audit Status" v={auditStatusStr} />
                  <D l="Audit Year" v={auditYearVal} />
                  <D l="Audit Date" v={auditDateVal} />
                  <D l="AGM Status" v={agmStatusStr} />
                  <D l="AGM Year" v={agmYearVal} />
                  <D l="AGM Date" v={agmDateVal} />
                </div>
              );
            })()}
          </Sec>

          {/* E. Financial Performance */}
          <Sec title="E. Financial Performance">
            {(() => {
              const fin = fd.financialsData || {};
              const turnover = fin.annualTurnover || row.annual_turnover || fd['5.1'];
              const grossIncome = fin.totalIncome || fd.totalIncome || fd['5.1'];
              const totalExpenses = fin.totalExpenses || fd.totalExpenses;
              
              let resultStatus = '—';
              if (fin.profitOrLoss) {
                resultStatus = fin.profitOrLoss === 'PROFIT' ? 'Profit Making' : (fin.profitOrLoss === 'LOSS' ? 'Loss Making' : 'No Profit / No Loss');
              } else if (fin.profitability || row.is_profit || fd['5.2']) {
                resultStatus = fin.profitability || row.is_profit || fd['5.2'];
              }

              const netProfitLoss = (fin.netProfit !== undefined && fin.netProfit !== '') ? fin.netProfit : (row.net_profit_loss || fd['5.3']);
              const margin = fin.profitability;

              return (
                <div className="detail-grid">
                  <D l="Annual Turnover" v={turnover} money />
                  <D l="Gross Income / Revenue" v={grossIncome} money />
                  <D l="Total Expenses" v={totalExpenses} money />
                  <D l="Financial Result Status" v={resultStatus} />
                  <D l="Net Profit / Loss Amount" v={netProfitLoss} money />
                  <D l="Profitability Margin" v={margin} />
                </div>
              );
            })()}
          </Sec>

          {/* F. Active Loan Status */}
          <Sec title="F. Active Loan Status">
            {(() => {
              const loan = fd.loanData || {};
              const isActive = loan.hasLoan !== undefined ? (loan.hasLoan && !loan.loanCleared) : !!row.has_loan;
              return (
                <div className="detail-grid">
                  <D l="Active Loan?" v={isActive ? 'Yes' : (loan.hasLoan && loan.loanCleared ? 'Cleared' : 'No')} />
                  {(loan.hasLoan || row.has_loan) && (
                    <>
                      <D l="Loan Type" v={loan.loanType || row.loan_name} />
                      <D l="Sanction Date" v={loan.sanctionDate} />
                      <D l="No. of Beneficiaries" v={loan.beneficiaries} />
                      <D l="Loan Extended" v={loan.loanExtended || row.loan_amount || fd['8.4']} money />
                      <D l="Loan Recovered" v={fd['8.5']} money />
                      <D l="Loan Outstanding" v={fd['8.6']} money />
                    </>
                  )}
                </div>
              );
            })()}
          </Sec>

          {/* G. Dividend Details */}
          <Sec title="G. Dividend Details">
            <div className="detail-grid">
              <D l="Dividend Paid?" v={fd['6.1'] || fd.dividendData?.dividendPolicy || 'No'} />
              {(fd['6.1'] === 'Yes' || fd.dividendData?.dividendPolicy === 'Paid' || fd.dividendData?.dividendRate) && (
                <>
                  <D l="Dividend Rate" v={fd['6.2'] || fd.dividendData?.dividendRate ? `${fd['6.2'] || fd.dividendData?.dividendRate}%` : null} />
                  <D l="Dividend Amount" v={fd['6.3'] || fd.dividendData?.dividendAmount} money />
                  <D l="Distribution Date" v={fd['6.4'] || fd.dividendData?.distributionDate} />
                </>
              )}
            </div>
          </Sec>

          {/* H. Monthly Sales / Deposits */}
          <Sec title="H. Monthly Sales / Deposits">
            {(() => {
              const reportingPeriod = fd.reportingMonth || fd['7.70'] || (fd['7.69'] ? `${fd['7.70'] || ''} ${fd['7.69']}` : null);
              const salesVal = fd.sales || fd.withdrawal || row.withdrawal || fd['7.71'];
              const depositVal = fd.deposit || fd.balance || fd.bank_balance || row.bank_balance || fd['7.72'];
              const turnoverVal = fd.totalTurnover || fd.sales || fd.withdrawal;

              return (
                <div className="detail-grid">
                  <D l="Reporting Period" v={reportingPeriod} />
                  <D l="Monthly Sales" v={salesVal} money />
                  <D l="Bank Deposit" v={depositVal} money />
                  <D l="Monthly Turnover" v={turnoverVal} money />
                </div>
              );
            })()}
          </Sec>

          {/* Business Performance */}
          <Sec title="Business Performance">
            {(() => {
              const bizPerf = fd.businessPerformanceData || {};
              
              // 1. Gross Income / Revenue (strictly from User App → P&L Performance Ledger)
              const grossIncomeVal = (bizPerf.totalIncome !== undefined && bizPerf.totalIncome !== '')
                ? bizPerf.totalIncome
                : (fd.totalIncome !== undefined && fd.totalIncome !== '' ? fd.totalIncome : null);
              
              // 2. Total Expenses (strictly from User App → P&L Performance Ledger)
              const expensesVal = (bizPerf.totalExpenses !== undefined && bizPerf.totalExpenses !== '')
                ? bizPerf.totalExpenses
                : (fd.totalExpenses !== undefined && fd.totalExpenses !== '' ? fd.totalExpenses : null);

              // 3. Net Surplus / Deficit Amount (strictly from User App → P&L Performance Ledger)
              let netSurplusNum = 0;
              let hasNetNum = false;
              let netSurplusVal = (bizPerf.netSurplusDeficit !== undefined && bizPerf.netSurplusDeficit !== '')
                ? bizPerf.netSurplusDeficit
                : (fd.netSurplusDeficit !== undefined && fd.netSurplusDeficit !== '' ? fd.netSurplusDeficit : null);

              if (netSurplusVal !== undefined && netSurplusVal !== '' && netSurplusVal !== null) {
                const parsed = parseFloat(netSurplusVal.toString().replace(/,/g, ''));
                if (!isNaN(parsed)) {
                  netSurplusNum = parsed;
                  hasNetNum = true;
                }
              } else if (grossIncomeVal != null || expensesVal != null) {
                const inc = parseFloat((grossIncomeVal || '0').toString().replace(/,/g, '')) || 0;
                const exp = parseFloat((expensesVal || '0').toString().replace(/,/g, '')) || 0;
                netSurplusNum = inc - exp;
                netSurplusVal = netSurplusNum.toString();
                hasNetNum = true;
              }

              // 4. Business Performance Status (Surplus / Deficit / Breakeven)
              let bizStatus = null;
              if (hasNetNum) {
                if (netSurplusNum > 0) {
                  bizStatus = 'Surplus';
                } else if (netSurplusNum < 0) {
                  bizStatus = 'Deficit';
                } else {
                  bizStatus = 'Breakeven';
                }
              }

              // 5. Total Active Members (strictly from User App → P&L Performance Ledger)
              const membersVal = (bizPerf.totalMembers !== undefined && bizPerf.totalMembers !== '')
                ? bizPerf.totalMembers
                : (fd.totalMembers !== undefined && fd.totalMembers !== '' ? fd.totalMembers : null);

              // 6. Remarks (strictly from User App → P&L Performance Ledger)
              const remarksVal = (bizPerf.remarks !== undefined && bizPerf.remarks !== '')
                ? bizPerf.remarks
                : (fd.remarks !== undefined && fd.remarks !== '' ? fd.remarks : null);

              return (
                <div className="detail-grid">
                  <D l="Gross Income / Revenue" v={grossIncomeVal} money />
                  <D l="Total Expenses" v={expensesVal} money />
                  <D l="Net Surplus / Deficit Amount" v={netSurplusVal} money />
                  <D l="Business Performance Status" v={bizStatus} />
                  <D l="Total Active Members" v={membersVal} />
                  <D l="Remarks" v={remarksVal} />
                </div>
              );
            })()}
          </Sec>

          {/* I. Revenue & Share Capital */}
          <Sec title="I. Revenue & Share Capital">
            <div className="detail-grid">
              <D l="Authorised Share Capital" v={fd['8.8'] || fd.shareCapitalData?.authorizedCapital} money />
              <D l="Paid-Up Share Capital" v={fd['8.9'] || fd.shareCapitalData?.paidUpCapital} money />
              <D l="Total Member Deposits" v={fd['8.11'] || fd.shareCapitalData?.totalDeposits} money />
              <D l="As On Date" v={fd['8.10'] || fd.shareCapitalData?.asOfDate} />
            </div>
          </Sec>

          {/* J. CSC Details */}
          <Sec title="J. CSC Details">
            <div className="detail-grid">
              <D l="Has CSC?" v={fd['9.1'] || (fd.cscDetailsData?.cscOperatorName ? 'Yes' : 'No')} />
              {(fd['9.1'] === 'Yes' || fd.cscDetailsData?.cscOperatorName) && (
                <>
                  <D l="Operator Name" v={fd.cscDetailsData?.cscOperatorName} />
                  <D l="CSC ID / VLE ID" v={fd['9.2'] || fd.cscDetailsData?.cscId} mono />
                  <D l="Center Name" v={fd.cscDetailsData?.cscCenterName} />
                  <D l="Registered Mobile" v={fd['9.5'] || fd.cscDetailsData?.mobileNumber} />
                  <D l="CSC Email" v={fd['9.7'] || fd.cscDetailsData?.emailId} />
                  <D l="Active Services Count" v={fd.cscDetailsData?.activeServicesCount} />
                </>
              )}
            </div>
          </Sec>

          {/* K. CAC Monthly Transactions */}
          <Sec title="K. CAC Monthly Transactions">
            {(() => {
              const cscObj = fd.cscTransData || {};
              const isCscActive = cscObj.isCscActive !== undefined ? cscObj.isCscActive : (fd['9.7z'] === 'Yes');
              const txList = Array.isArray(cscObj.transactions) ? cscObj.transactions : (Array.isArray(fd.transactions) ? fd.transactions : []);

              if (txList.length > 0) {
                const totalCount = txList.reduce((acc, t) => acc + (parseInt(t.count) || 0), 0);
                const totalVolume = txList.reduce((acc, t) => acc + (parseFloat((t.amount || '0').toString().replace(/,/g, '')) || 0), 0);
                const totalComm = txList.reduce((acc, t) => acc + (parseFloat((t.commission || '0').toString().replace(/,/g, '')) || 0), 0);
                const grandIncome = totalVolume + totalComm;

                return (
                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', fontWeight: '700', color: '#1E293B'}}>
                      <span>CAC Status: <strong style={{color: isCscActive ? '#047857' : '#DC2626'}}>{isCscActive ? 'ACTIVE' : 'INACTIVE'}</strong></span>
                      <span>Total Submissions: <strong>{txList.length} Entries</strong></span>
                    </div>
                    <div style={{overflowX: 'auto'}}>
                      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '12px'}}>
                        <thead>
                          <tr style={{background: '#F8FAFC'}}>
                            <th style={{textAlign: 'left', padding: '8px', border: '1px solid #E2E8F0'}}>Date</th>
                            <th style={{textAlign: 'left', padding: '8px', border: '1px solid #E2E8F0'}}>Service Category</th>
                            <th style={{textAlign: 'center', padding: '8px', border: '1px solid #E2E8F0'}}>Count</th>
                            <th style={{textAlign: 'right', padding: '8px', border: '1px solid #E2E8F0'}}>Amount (₹)</th>
                            <th style={{textAlign: 'right', padding: '8px', border: '1px solid #E2E8F0'}}>Commission (₹)</th>
                            <th style={{textAlign: 'right', padding: '8px', border: '1px solid #E2E8F0'}}>Total Income (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txList.map((tx, idx) => {
                            const amt = parseFloat((tx.amount || '0').toString().replace(/,/g, '')) || 0;
                            const comm = parseFloat((tx.commission || '0').toString().replace(/,/g, '')) || 0;
                            const inc = tx.totalIncome ? parseFloat((tx.totalIncome || '0').toString().replace(/,/g, '')) : (amt + comm);
                            return (
                              <tr key={tx.id || idx}>
                                <td style={{padding: '8px', border: '1px solid #E2E8F0'}}>{tx.date || '—'}</td>
                                <td style={{padding: '8px', border: '1px solid #E2E8F0', fontWeight: '600'}}>{tx.type || '—'}</td>
                                <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'center'}}>{tx.count || 0}</td>
                                <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'right'}}>₹ {amt.toLocaleString('en-IN')}</td>
                                <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'right'}}>₹ {comm.toLocaleString('en-IN')}</td>
                                <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'right', fontWeight: '700', color: '#047857'}}>
                                  ₹ {inc.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                          <tr style={{background: 'var(--emerald-pale)', fontWeight: '900'}}>
                            <td colSpan={2} style={{padding: '8px', border: '1px solid #E2E8F0'}}>TOTAL CAC TRANSACTIONS</td>
                            <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'center'}}>{totalCount}</td>
                            <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'right'}}>₹ {totalVolume.toLocaleString('en-IN')}</td>
                            <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'right'}}>₹ {totalComm.toLocaleString('en-IN')}</td>
                            <td style={{padding: '8px', border: '1px solid #E2E8F0', textAlign: 'right', color: 'var(--emerald-deep)'}}>
                              ₹ {grandIncome.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <div className="detail-grid">
                  <D l="CSC Status" v={isCscActive ? 'Yes' : 'No'} />
                  {isCscActive && (
                    <>
                      <D l="Year" v={fd['9.7a']} />
                      <D l="Month" v={fd['9.8']} />
                      <D l="Monthly Transaction" v={fd['9.9']} money />
                      <D l="Total Transactions" v={fd['9.10']} money />
                    </>
                  )}
                </div>
              );
            })()}
          </Sec>

          {/* M. Activities / Events Log */}
          {/* MPCS submissions have no `activities` column (unlike Milk PCS
              submissions, which do) — entries logged via MpcsActivitiesLogScreen
              land in form_data.activityItems as an array of
              {id, type, title, count, participants, desc} objects instead. */}
          <Sec title="M. Activities / Events Log">
            {Array.isArray(fd.activityItems) && fd.activityItems.length > 0 ? (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {fd.activityItems.map((item, i) => (
                  <div key={item.id || i} style={{
                    fontSize: '13px', color: '#1E293B', lineHeight: '1.6',
                    background: '#F8FAFC', borderRadius: '12px', padding: '14px 16px',
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                      <span style={{fontWeight:800, color:'var(--emerald-deep)'}}>{item.title || item.type || 'Activity'}</span>
                      {item.type && <span className="badge badge-green" style={{fontSize:'10px'}}>{item.type}</span>}
                    </div>
                    {item.desc && <div style={{color:'#334155'}}>{item.desc}</div>}
                    {(item.count || item.participants) && (
                      <div style={{fontSize:'11px', color:'#64748B', marginTop:'6px'}}>
                        {item.count && <>Count: {item.count} </>}
                        {item.participants && <>· Participants: {item.participants}</>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '13px', color: '#1E293B', lineHeight: '1.6',
                background: '#F8FAFC', borderRadius: '12px', padding: '16px',
                whiteSpace: 'pre-wrap', border: '1px solid #E2E8F0', fontStyle: row.activities ? 'normal' : 'italic'
              }}>
                {row.activities || "No activities logged for this period."}
              </div>
            )}
          </Sec>

          {/* Registered Members — persistent roster from member_registry, not
              part of this monthly return (see MemberDataScreen on mobile) */}
          <Sec title={`N. Registered Members (${members.length})`}>
            <MemberRosterSection members={members} loading={membersLoading} />
          </Sec>

          <div style={{marginTop:'32px', textAlign:'center', paddingTop: '20px', borderTop: '1px solid #E2E8F0'}}>
            <p style={{fontSize:'10px', color:'#94A3B8', fontWeight:700, letterSpacing:'1px'}}>
              LOG TIMESTAMP: {row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : 'N/A'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}


function GlobalBroadcast({ activeTab, userRole }) {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  // District-wide broadcast is a System Admin action — a scoped CI login
  // shouldn't be able to message every field officer in the district.
  if (activeTab !== 'DASHBOARD' || userRole !== 'System Admin') return null;
  
  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('broadcast_alerts')
        .insert([{ 
          message: msg.trim(), 
          type: 'urgent', 
          sender: 'HQ Admin' 
        }]);
      
      if (error) throw error;
      
      alert('Universal Departmental Broadcast Sent to all field units!');
      setMsg('');
    } catch (err) {
      console.error('Broadcast failed:', err);
      alert('Transmission Failure: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card fade-in" style={{
      marginBottom: '16px',
      padding: '14px 16px',
      background: 'rgba(255, 255, 255, 0.4)',
      border: '1px solid var(--border-hard)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position:'absolute', top:0, left:0, bottom:0, width:'4px',
        background:'linear-gradient(to bottom, var(--emerald-light), var(--gold))'
      }} />

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{
            width:'26px', height:'26px', borderRadius:'8px',
            background:'var(--emerald-deep)', display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:'14px'
          }}>
            <Icon d={I.logout} size={13} color="#fff" />
          </div>
          <div>
            <h4 style={{fontSize:'11px', fontWeight:900, color:'var(--emerald)', textTransform:'uppercase', letterSpacing:'1.2px'}}>
              Emergency Comm Terminal
            </h4>
            <p style={{fontSize:'9px', color:'var(--text-muted)', fontWeight:600}}>
              Push encrypted notifications to all active field officers
            </p>
          </div>
        </div>
        <div className="badge badge-gold" style={{fontSize:'8px'}}>ENCRYPTED CHANNEL</div>
      </div>

      <div style={{display:'flex', gap:'10px', alignItems:'flex-end'}}>
        <div className="field-group" style={{flex:1, marginBottom: 0}}>
          <label className="field-label" style={{fontSize:'8px'}}>Broadcast Payload</label>
          <input
             className="field-input"
             placeholder="Synchronize directive with all stations (e.g. Audit Window Closing)..."
             value={msg}
             onChange={e=>setMsg(e.target.value)}
             style={{
               background:'rgba(255,255,255,0.7)',
               borderColor:'var(--border-hard)',
               fontSize: '12px',
               fontWeight: 600,
               padding: '8px 12px',
               height: '34px'
             }}
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={sending || !msg.trim()}
          style={{
            height: '34px',
            padding: '0 16px',
            display:'flex',
            alignItems:'center',
            gap:'8px',
            opacity: !msg.trim() ? 0.6 : 1
          }}
        >
          {sending ? (
            <div className="spinner" style={{width:'13px', height:'13px', borderWidth:'2px', borderTopColor:'#fff'}}/>
          ) : (
            <Icon d={I.submit} size={13} color="#fff" />
          )}
          <span style={{fontWeight:800, textTransform:'uppercase', fontSize:'10px', letterSpacing:'0.8px'}}>
            {sending ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
          </span>
        </button>
      </div>
    </div>
  );
}

function DistrictPerformance({ milkRows = [], mpcsRows = [] }) {
  const mpcsAuditAgmList = useMemo(() => mpcsRows.map(r => getMpcsAuditAgm(r)), [mpcsRows]);
  const milkAuditAgmList = useMemo(() => milkRows.map(r => getMilkAuditAgm(r)), [milkRows]);

  const mpcsTotal = mpcsRows.length || 1;
  const mpcsCscCount = useMemo(() => mpcsRows.filter(r => r.form_data?.['9.1'] === 'Yes' || r.form_data?.['9.7z'] === 'Yes').length, [mpcsRows]);
  const mpcsMonthlyDeposit = useMemo(() => mpcsRows.reduce((s, r) => s + (parseFloat(r.form_data?.['7.71'] || r.bank_balance) || 0), 0), [mpcsRows]);
  const mpcsTotalTurnover = useMemo(() => mpcsRows.reduce((s, r) => s + (parseFloat(r.annual_turnover) || 0), 0), [mpcsRows]);
  const mpcsAgmCompletedCount = useMemo(() => mpcsAuditAgmList.filter(x => isYes(x.agm_done)).length, [mpcsAuditAgmList]);
  const mpcsAuditedCount = useMemo(() => mpcsAuditAgmList.filter(x => isYes(x.audit_done)).length, [mpcsAuditAgmList]);

  const milkTotal = milkRows.length || 1;
  const milkTotalLitres = useMemo(() => milkRows.reduce((s, r) => s + (parseFloat(r.litres) || 0), 0), [milkRows]);
  const milkAgmCompletedCount = useMemo(() => milkAuditAgmList.filter(x => isYes(x.agm_done)).length, [milkAuditAgmList]);
  const milkAuditedCount = useMemo(() => milkAuditAgmList.filter(x => isYes(x.audit_done)).length, [milkAuditAgmList]);

  return (
    <div className="fade-in">
      {/* Benchmark Header */}
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px'}}>
        <div style={{width:'4px', height:'24px', background:'var(--emerald-light)', borderRadius:'2px'}} />
        <div>
          <h3 style={{fontSize:'18px', fontWeight:900, color:'#0F172A', lineHeight:1.2}}>Cooperative Sector Benchmarks & KPI Index</h3>
          <p style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:600, marginTop:'2px'}}>Dynamically pulled audit, AGM, financial, and operational indicators from User App submissions</p>
        </div>
      </div>

      {/* MPCS Sector Benchmarks */}
      <div style={{marginBottom:'24px'}}>
        <div style={{fontSize:'12px', fontWeight:800, color:'#92400E', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', background:'#FFFBEB', padding:'6px 12px', borderRadius:'6px', display:'inline-block', border:'1px solid #FDE68A'}}>
          🏛️ MPCS Societies Benchmarks
        </div>
        <div className="kpi-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))'}}>
          <div className="kpi-card">
            <div className="kpi-title">CSC TRANSACTIONS</div>
            <div className="kpi-val" style={{color:'#047857'}}>{mpcsCscCount}</div>
            <div className="kpi-sub">Active CSC centers</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">MONTHLY DEPOSIT</div>
            <div className="kpi-val" style={{color:'#7F1D1D'}}>{fmtRs(mpcsMonthlyDeposit)}</div>
            <div className="kpi-sub">Aggregate sales deposit</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">MPCS AGM COMPLETED</div>
            <div className="kpi-val" style={{color:'#1D4ED8'}}>{mpcsAgmCompletedCount} / {mpcsRows.length}</div>
            <div className="kpi-sub">{Math.round((mpcsAgmCompletedCount / mpcsTotal) * 100)}% AGM compliance</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">MPCS AGM AUDITED</div>
            <div className="kpi-val" style={{color:'#B45309'}}>{mpcsAuditedCount} / {mpcsRows.length}</div>
            <div className="kpi-sub">{Math.round((mpcsAuditedCount / mpcsTotal) * 100)}% audit compliance</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">TOTAL TURNOVER</div>
            <div className="kpi-val" style={{color:'#065F46'}}>{fmtRs(mpcsTotalTurnover)}</div>
            <div className="kpi-sub">Aggregate annual turnover</div>
          </div>
        </div>
      </div>

      {/* Milk Sector Benchmarks */}
      <div style={{marginBottom:'28px'}}>
        <div style={{fontSize:'12px', fontWeight:800, color:'#991B1B', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', background:'#FEF2F2', padding:'6px 12px', borderRadius:'6px', display:'inline-block', border:'1px solid #FECACA'}}>
          🥛 Milk PCS Benchmarks
        </div>
        <div className="kpi-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))'}}>
          <div className="kpi-card">
            <div className="kpi-title">LITERS COLLECTED</div>
            <div className="kpi-val" style={{color:'#0F172A'}}>{fmtL(milkTotalLitres)}</div>
            <div className="kpi-sub">Total milk volume</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">MILK AGM COMPLETED</div>
            <div className="kpi-val" style={{color:'#047857'}}>{milkAgmCompletedCount} / {milkRows.length}</div>
            <div className="kpi-sub">{Math.round((milkAgmCompletedCount / milkTotal) * 100)}% AGM compliance</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">MILK AGM AUDITED</div>
            <div className="kpi-val" style={{color:'#7C3AED'}}>{milkAuditedCount} / {milkRows.length}</div>
            <div className="kpi-sub">{Math.round((milkAuditedCount / milkTotal) * 100)}% audit compliance</div>
          </div>
        </div>
      </div>

    </div>
  );
}

function TerritoryMap({ milkRows }) {
  const center = [27.2889, 88.2713]; // Gyalshing District Center
  
  return (
    <div className="fade-in" style={{height:'600px', borderRadius:'20px', overflow:'hidden', border:'4px solid #fff', boxShadow:'var(--shadow)'}}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {milkRows.map((r, idx) => r.gps_lat && (
            <Marker key={idx} position={[r.gps_lat, r.gps_lng]}>
              <Popup>
                <div style={{padding:'5px'}}>
                   <strong style={{color:'#7F1D1D'}}>{r.center_name}</strong>
                   <p style={{margin:'4px 0', fontSize:'11px'}}>Subdivision/District: {r.district || 'Gyalshing'}</p>
                   <p style={{margin:'4px 0', fontSize:'11px'}}>Report: {r.reporting_month}</p>
                   <p style={{margin:0, fontSize:'11px'}}>Vol: <b>{r.litres} L</b></p>
                </div>
              </Popup>
            </Marker>
        ))}
         {Object.entries(DISTRICT_COORDS).map(([name, coords]) => (
            <Circle 
                key={name}
                center={coords}
                pathOptions={{ color: '#7F1D1D', fillColor: '#92400E', fillOpacity: 0.15 }}
                radius={3500}
            />
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Audit & Compliance Management ──────────────────────────────────────────
function AuditOverview({ mpcsRows, onSelectSociety }) {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGrade, setFilterGrade]   = useState('');
  const [filterYear, setFilterYear]     = useState('');
  const [searchQ, setSearchQ]           = useState('');

  const stats = useMemo(() => {
    const total = mpcsRows.length;
    const audited = mpcsRows.filter(r => isYes(r.audit_done)).length;
    const pending = mpcsRows.filter(r => r.audit_done !== 'Yes').length;
    const gradeA = mpcsRows.filter(r => r.audit_category === 'A').length;
    const gradeB = mpcsRows.filter(r => r.audit_category === 'B').length;
    const gradeC = mpcsRows.filter(r => r.audit_category === 'C').length;
    const gradeD = mpcsRows.filter(r => r.audit_category === 'D').length;
    const rate = total > 0 ? Math.round((audited / total) * 100) : 0;

    return { total, audited, pending, gradeA, gradeB, gradeC, gradeD, rate };
  }, [mpcsRows]);

  const filtered = useMemo(() => {
    return mpcsRows.filter(r => {
      if (filterStatus && (r.audit_done || 'No') !== filterStatus) return false;
      if (filterGrade && r.audit_category !== filterGrade) return false;
      if (filterYear && String(r.audit_year) !== filterYear) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const matchName = (r.society_name || '').toLowerCase().includes(q);
        const matchReg  = (r.registration_number || '').toLowerCase().includes(q);
        const matchAuth = (r.registration_authority || '').toLowerCase().includes(q);
        const matchOfficer = (r.president_name || '').toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchAuth && !matchOfficer) return false;
      }
      return true;
    });
  }, [mpcsRows, filterStatus, filterGrade, filterYear, searchQ]);

  const gradeChartData = useMemo(() => {
    return [
      { name: 'Grade A (Excellent)', value: stats.gradeA, fill: '#10B981' },
      { name: 'Grade B (Good)',      value: stats.gradeB, fill: '#3B82F6' },
      { name: 'Grade C (Average)',   value: stats.gradeC, fill: '#F59E0B' },
      { name: 'Grade D (Deficient)', value: stats.gradeD, fill: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const yearOptions = useMemo(() => {
    const years = mpcsRows.map(r => r.audit_year).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  }, [mpcsRows]);

  return (
    <div className="fade-in">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <div>
          <h2 style={{fontSize:'18px', fontWeight:900, color:'#0F172A', lineHeight:1.2}}>Financial Audit & Regulatory Compliance Ledger</h2>
          <p style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:600, marginTop:'4px'}}>
            Statutory Financial Audit Monitoring • Department of Cooperation, Gyalshing District
          </p>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <button className="btn-primary" onClick={() => downloadCSV(filtered, 'Gyalshing_MPCS_Audit_Report')} style={{padding:'8px 16px', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px'}}>
            <Icon d={I.download} size={14} color="#fff"/> Export Audit Report (CSV)
          </button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'16px', marginBottom:'24px'}}>
        <StatCard icon={I.submit} label="Total MPCS Societies" value={fmt(stats.total)} color="#7C1C1C" bg="#FEF2F2" />
        <StatCard icon={I.chart}  label="Audits Completed" value={`${stats.audited} (${stats.rate}%)`} color="#047857" bg="#ECFDF5" />
        <StatCard icon={I.lock}   label="Audit Pending / Overdue" value={fmt(stats.pending)} color="#B91C1C" bg="#FEF2F2" />
        <StatCard icon={I.members} label="Grade A & B Compliant" value={fmt(stats.gradeA + stats.gradeB)} color="#1D4ED8" bg="#EFF6FF" />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'20px', marginBottom:'24px'}}>
        <div className="card" style={{padding:'20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
            <div style={{width:'4px', height:'20px', background:'var(--emerald)', borderRadius:'2px'}} />
            <h4 style={{fontSize:'14px', fontWeight:800, color:'#0F172A'}}>Audit Classification Breakdown</h4>
          </div>
          <div style={{height:'220px'}}>
            <ResponsiveContainer>
              <BarChart data={gradeChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:10}} />
                <Tooltip contentStyle={{borderRadius:'10px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" name="Societies Count" radius={[6, 6, 0, 0]} barSize={32}>
                  {gradeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{padding:'20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
            <div style={{width:'4px', height:'20px', background:'var(--gold)', borderRadius:'2px'}} />
            <h4 style={{fontSize:'14px', fontWeight:800, color:'#0F172A'}}>Regulatory Audit Summary</h4>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'12px', marginTop:'10px'}}>
            <div style={{display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#F8FAFC', borderRadius:'10px'}}>
              <span style={{fontSize:'12px', color:'#475569', fontWeight:600}}>Annual Audit Compliance Rate</span>
              <strong style={{fontSize:'13px', color: stats.rate >= 70 ? '#047857' : '#B91C1C'}}>{stats.rate}% Compliant</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#F8FAFC', borderRadius:'10px'}}>
              <span style={{fontSize:'12px', color:'#475569', fontWeight:600}}>Grade A (Highest Rating)</span>
              <strong style={{fontSize:'13px', color:'#047857'}}>{stats.gradeA} Societies</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#F8FAFC', borderRadius:'10px'}}>
              <span style={{fontSize:'12px', color:'#475569', fontWeight:600}}>Grade B (Satisfactory)</span>
              <strong style={{fontSize:'13px', color:'#1D4ED8'}}>{stats.gradeB} Societies</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#F8FAFC', borderRadius:'10px'}}>
              <span style={{fontSize:'12px', color:'#475569', fontWeight:600}}>Grade C & D (Under Review)</span>
              <strong style={{fontSize:'13px', color:'#D97706'}}>{stats.gradeC + stats.gradeD} Societies</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginBottom:'20px', padding:'18px 22px'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'14px', alignItems:'end'}}>
          <div className="field-group">
            <label className="field-label">Search Audit Records</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)'}}>
                <Icon d={I.search} size={14} color="#9CA3AF"/>
              </span>
              <input type="text" className="field-input" placeholder="Society, Reg No, Officer..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{paddingLeft:'32px'}} />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Audit Status</label>
            <select className="field-input" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Yes">Audited (Compliant)</option>
              <option value="No">Pending Audit</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Audit Grade</label>
            <select className="field-input" value={filterGrade} onChange={e=>setFilterGrade(e.target.value)}>
              <option value="">All Grades</option>
              <option value="A">Grade A (Excellent)</option>
              <option value="B">Grade B (Good)</option>
              <option value="C">Grade C (Average)</option>
              <option value="D">Grade D (Deficient)</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Audit Year</label>
            <select className="field-input" value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{display:'flex', gap:'8px'}}>
            <button className="btn-ghost" onClick={() => {setFilterStatus(''); setFilterGrade(''); setFilterYear(''); setSearchQ('');}} style={{padding:'10px', width:'100%'}}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{overflow:'hidden', padding:0}}>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Society Name</th>
                <th>Reg. Number</th>
                <th>Audit Status</th>
                <th>Audit Year</th>
                <th>Audit Grade</th>
                <th>Latest AGM Date</th>
                <th>Annual Turnover</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const isAudited = isYes(row.audit_done);
                  const grade = row.audit_category || 'N/A';
                  const gradeColor = grade === 'A' ? '#047857' : grade === 'B' ? '#1D4ED8' : grade === 'C' ? '#D97706' : grade === 'D' ? '#B91C1C' : '#64748B';
                  const agmDate = row.form_data && row.form_data['4.4'] ? row.form_data['4.4'] : '—';

                  return (
                    <tr key={row.id || idx}>
                      <td>
                        <strong style={{color:'#0F172A', display:'block'}}>{row.society_name || 'Unnamed Society'}</strong>
                        <span style={{fontSize:'11px', color:'var(--text-muted)'}}>President: {row.president_name || 'N/A'}</span>
                      </td>
                      <td><code style={{fontSize:'12px', color:'#475569'}}>{row.registration_number || 'N/A'}</code></td>
                      <td>
                        <span className={`badge ${isAudited ? 'badge-green' : 'badge-red'}`} style={{fontSize:'11px', fontWeight:800}}>
                          {isAudited ? '✓ AUDITED' : '⚠ PENDING'}
                        </span>
                      </td>
                      <td style={{fontSize:'12px', fontWeight:700}}>{row.audit_year || '—'}</td>
                      <td>
                        <span style={{display:'inline-block', padding:'2px 8px', borderRadius:'6px', background:`${gradeColor}15`, color: gradeColor, fontWeight:800, fontSize:'11px', border:`1px solid ${gradeColor}30`}}>
                          Grade {grade}
                        </span>
                      </td>
                      <td style={{fontSize:'12px'}}>{agmDate}</td>
                      <td style={{fontSize:'12px', fontWeight:700, color:'#0F172A'}}>{fmtRs(row.annual_turnover)}</td>
                      <td>
                        <button className="btn-ghost" onClick={() => onSelectSociety(row)} style={{padding:'4px 10px', fontSize:'11px', color:'var(--emerald)'}}>
                          Inspect Record
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout, session }) {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'MILK' | 'MPCS' | 'AUDIT' | 'STATS' | 'OFFICERS'
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('mpcs_admin_sidebar_collapsed') === 'true');

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('mpcs_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // MILK PCS state
  const [milkRows, setMilkRows]   = useState([]);
  const [milkFiltered, setMilkFiltered] = useState([]);
  const [milkSelected, setMilkSelected] = useState(null);

  // MPCS state
  const [mpcsRows, setMpcsRows]   = useState([]);
  const [mpcsFiltered, setMpcsFiltered] = useState([]);
  const [mpcsSelected, setMpcsSelected] = useState(null);

  // Member Registry state — persistent roster, separate from monthly submissions
  const [memberRows, setMemberRows] = useState([]);
  const [memberSearchQ, setMemberSearchQ] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('');
  const [memberSocietyFilter, setMemberSocietyFilter] = useState('');
  const [memberWardFilter, setMemberWardFilter] = useState('');

  // Modal & Interactive states
  const [showAddMilkModal, setShowAddMilkModal] = useState(false);
  const [showAddMpcsModal, setShowAddMpcsModal] = useState(false);
  const [showScheduleAuditModal, setShowScheduleAuditModal] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [yearFilter, setYearFilter] = useState('This Year');

  // 🌲 Hierarchy & ACI Assignment State — loaded from the unit_assignments
  // table in fetchAll(); starts empty rather than seeded with fictional
  // delegations, since this now reflects real, persisted assignments.
  const [showAssignAciModal, setShowAssignAciModal] = useState(false);
  const [assignAciPrefillUnit, setAssignAciPrefillUnit] = useState(null);
  const [showHierarchyTree, setShowHierarchyTree] = useState(true);
  const [hierarchyMapping, setHierarchyMapping] = useState({});

  const handleAssignAci = async (unitName, aciName) => {
    const ciName = session?.user?.user_metadata?.fullName || session?.user?.email || 'System Admin';
    const { error } = await supabase.from('unit_assignments').upsert({
      unit_name: unitName,
      ci_name: ciName,
      aci_name: aciName,
      district: (() => {
        const r = mpcsRows.find(r => r.society_name === unitName);
        return r?.district || r?.form_data?.gpu || r?.form_data?.gpu_name || r?.form_data?.district || null;
      })(),
      updated_at: new Date().toISOString()
    });
    if (error) {
      alert('Failed to save delegation: ' + error.message);
      return;
    }
    setHierarchyMapping(prev => ({
      ...prev,
      [unitName]: { ci: ciName, aci: aciName, district: prev[unitName]?.district }
    }));
    setShowAssignAciModal(false);
    setAssignAciPrefillUnit(null);
    // alert() blocks the main thread synchronously, before the browser gets a
    // chance to paint the modal-closed state — without the defer, the alert
    // popped up in front of the modal still showing "Updating Delegation...",
    // making it look stuck even though the save had already succeeded.
    setTimeout(() => alert(`Delegation Updated: ${aciName} has been assigned to manage ${unitName}.`), 0);
  };

  const handleRevokeAci = async (unitName) => {
    const confirmed = window.confirm(`Revoke the delegation for ${unitName}? It will show as unassigned until a CI delegates it again.`);
    if (!confirmed) return;
    const { error } = await supabase.from('unit_assignments').delete().eq('unit_name', unitName);
    if (error) {
      alert('Failed to revoke delegation: ' + error.message);
      return;
    }
    setHierarchyMapping(prev => {
      const next = { ...prev };
      delete next[unitName];
      return next;
    });
  };

  const openReassignAci = (unitName) => {
    setAssignAciPrefillUnit(unitName);
    setShowAssignAciModal(true);
  };

  // Declared here (not down with the rest of "Officer state") because the
  // RBAC derivation right below needs it, and scopedMilkRows/scopedMpcsRows
  // right after that need userRole/assignedUnits — officers has to exist
  // before any of that runs or it's a temporal-dead-zone ReferenceError
  // that crashes the whole dashboard render immediately after login.
  const [officers, setOfficers] = useState([]);

  // 🛡️ Role-Based Access Control (RBAC) & Entity Assignment Scoping State —
  // derived from who is actually logged in (session), not a manual toggle.
  // A real CI account only ever sees the MPCS/Milk units an admin has
  // explicitly assigned them via "Assign Scope"; System Admin sees
  // everything. myOfficerRecord is looked up once officer_registry has
  // loaded, matching this session's email against a real registered officer.
  const myOfficerRecord = useMemo(
    () => officers.find(o => (o.email || '').toLowerCase() === (session?.user?.email || '').toLowerCase()),
    [officers, session]
  );
  const userRole = isSystemAdmin(session) ? 'System Admin' : 'Inspector'; // 'System Admin' | 'Inspector'
  const assignedUnits = userRole === 'System Admin' ? [] : (myOfficerRecord?.assigned_units || []);

  // 🔍 Scoped Data Calculation based on User Role & Entity Assignments
  const scopedMilkRows = useMemo(() => {
    if (userRole === 'System Admin') return milkRows;
    return milkRows.filter(r => {
      const name = (r.center_name || r.society_name || '').toLowerCase();
      return assignedUnits.some(u => name.includes(u.toLowerCase()) || u.toLowerCase().includes(name));
    });
  }, [milkRows, userRole, assignedUnits]);

  const scopedMpcsRows = useMemo(() => {
    if (userRole === 'System Admin') return mpcsRows;
    return mpcsRows.filter(r => {
      const name = (r.society_name || '').toLowerCase();
      return assignedUnits.some(u => name.includes(u.toLowerCase()) || u.toLowerCase().includes(name));
    });
  }, [mpcsRows, userRole, assignedUnits]);

  const scopedMemberRows = useMemo(() => {
    if (userRole === 'System Admin') return memberRows;
    return memberRows.filter(r => {
      const name = (r.society_name || '').toLowerCase();
      return assignedUnits.some(u => name.includes(u.toLowerCase()) || u.toLowerCase().includes(name));
    });
  }, [memberRows, userRole, assignedUnits]);

  // Derived from the SCOPED rows, not the raw fetch — these used to be
  // computed once in fetchAll from the full district-wide dataset and
  // stored as plain state, so every KPI card fed by them (turnover,
  // litres, member counts, audit/profit breakdowns, etc.) showed
  // district-wide numbers to a scoped CI regardless of their jurisdiction.
  const milkStats = useMemo(() => {
    const d = scopedMilkRows;
    return {
      total: d.length,
      litres: d.reduce((s,r)=>s+(parseFloat(r.litres)||0),0),
      withdrawal: d.reduce((s,r)=>s+(parseFloat(r.withdrawal)||0),0),
      members: d.reduce((s,r)=>s+(parseInt(r.total_members)||0),0),
      balance: d.reduce((s,r)=>s+(parseFloat(r.balance)||0),0),
      loans: d.filter(r=>r.has_loan).length,
    };
  }, [scopedMilkRows]);

  const mpcsStats = useMemo(() => {
    const d = scopedMpcsRows;
    return {
      total: d.length,
      turnover: d.reduce((s,r)=>s+(parseFloat(r.annual_turnover)||0),0),
      members: d.reduce((s,r)=>s+(parseInt(r.total_members)||0),0),
      societies: new Set(d.map(r=>r.registration_authority).filter(Boolean)).size,
      profits: d.filter(r=>r.is_profit==='PROFIT'||r.is_profit==='Yes').length,
      losses: d.filter(r=>r.is_profit==='LOSS'||r.is_profit==='No').length,
      neutral: d.filter(r=>r.is_profit==='NO_PROFIT_NO_LOSS').length,
      audits: d.filter(r=>isYes(r.audit_done)).length,
      cscs: d.filter(r=>r.form_data?.['9.1']==='Yes').length,
      loans: d.filter(r=>r.has_loan).length,
    };
  }, [scopedMpcsRows]);

  // Per-MPCS contributions behind each Registry KPI card, for the hover breakdown popover
  const mpcsBreakdowns = useMemo(() => {
    const d = scopedMpcsRows;
    const nameOf = r => r.society_name || r.registration_number || 'Unknown Society';

    return {
      turnover: d
        .filter(r => (parseFloat(r.annual_turnover) || 0) > 0)
        .map(r => ({ name: nameOf(r), value: fmtRs(r.annual_turnover), _n: parseFloat(r.annual_turnover) || 0 }))
        .sort((a, b) => b._n - a._n),
      members: d
        .filter(r => (parseInt(r.total_members) || 0) > 0)
        .map(r => ({ name: nameOf(r), value: fmt(r.total_members), _n: parseInt(r.total_members) || 0 }))
        .sort((a, b) => b._n - a._n),
      loans: d
        .filter(r => r.has_loan)
        .map(r => ({ name: nameOf(r), value: 'Active' })),
      audits: d
        .filter(r => isYes(r.audit_done))
        .map(r => ({ name: nameOf(r), value: r.audit_year ? `FY ${r.audit_year}` : 'Done' })),
      profits: d
        .filter(r => r.is_profit === 'PROFIT' || r.is_profit === 'Yes')
        .map(r => ({ name: nameOf(r), value: r.net_profit_loss ? fmtRs(r.net_profit_loss) : 'Profit' })),
    };
  }, [scopedMpcsRows]);

  // Per-center contributions behind each Milk Units KPI card, for the hover breakdown popover
  const milkBreakdowns = useMemo(() => {
    const d = scopedMilkRows;
    const nameOf = r => r.center_name || r.center_id || 'Unknown Center';

    return {
      litres: d
        .filter(r => (parseFloat(r.litres) || 0) > 0)
        .map(r => ({ name: nameOf(r), value: fmtL(r.litres), _n: parseFloat(r.litres) || 0 }))
        .sort((a, b) => b._n - a._n),
      withdrawal: d
        .filter(r => (parseFloat(r.withdrawal) || 0) > 0)
        .map(r => ({ name: nameOf(r), value: fmtRs(r.withdrawal), _n: parseFloat(r.withdrawal) || 0 }))
        .sort((a, b) => b._n - a._n),
      balance: d
        .filter(r => (parseFloat(r.balance) || 0) > 0)
        .map(r => ({ name: nameOf(r), value: fmtRs(r.balance), _n: parseFloat(r.balance) || 0 }))
        .sort((a, b) => b._n - a._n),
      members: d
        .filter(r => (parseInt(r.total_members) || 0) > 0)
        .map(r => ({ name: nameOf(r), value: fmt(r.total_members), _n: parseInt(r.total_members) || 0 }))
        .sort((a, b) => b._n - a._n),
      loans: d
        .filter(r => r.has_loan)
        .map(r => ({ name: nameOf(r), value: 'Active' })),
    };
  }, [scopedMilkRows]);

  // Mutation Handlers
  const handleSaveMilkReport = async (newRecord) => {
    const { error } = await supabase.from('milk_pcs_submissions').insert([newRecord]);
    if (error) {
      alert('Error recording milk report: ' + error.message);
    } else {
      fetchAll();
      setShowAddMilkModal(false);
      // Deferred: alert() blocks synchronously, before the browser paints the
      // modal-closed state, so it used to pop up in front of the modal still
      // showing its "Saving..." button — looked stuck even though it worked.
      setTimeout(() => alert('Milk collection record saved successfully!'), 0);
    }
  };

  const handleSaveMpcsSociety = async (newRecord) => {
    const { error } = await supabase.from('mpcs_submissions').insert([newRecord]);
    if (error) {
      alert('Error registering society: ' + error.message);
    } else {
      fetchAll();
      setShowAddMpcsModal(false);
      setTimeout(() => alert('MPCS Society registered successfully!'), 0);
    }
  };

  const handleScheduleAudit = async (societyId, updates) => {
    const { error } = await supabase.from('mpcs_submissions').update(updates).eq('id', societyId);
    if (error) {
      alert('Error updating audit status: ' + error.message);
    } else {
      fetchAll();
      setShowScheduleAuditModal(false);
      setTimeout(() => alert('Audit status and grade updated successfully!'), 0);
    }
  };

  // Officer state
  const [officerSelected, setOfficerSelected] = useState(null);
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [scopeOfficer, setScopeOfficer] = useState(null); // officer row being scoped, or null

  const handleUpdateOfficerScope = async (officerId, unitNames) => {
    const { error } = await supabase.from('officer_registry').update({ assigned_units: unitNames }).eq('id', officerId);
    if (error) {
      alert('Failed to update scope: ' + error.message);
      return;
    }
    setOfficers(prev => prev.map(o => o.id === officerId ? { ...o, assigned_units: unitNames } : o));
    setScopeOfficer(null);
    setTimeout(() => alert('Jurisdiction scope updated.'), 0);
  };

  // Interaction State
  const [activeFilter, setActiveFilter] = useState(null); // 'loan' | 'profit' | etc
  const [showCharts, setShowCharts]     = useState(true);

  // Shared filter state
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [searchQ, setSearchQ]     = useState('');

  // MPCS Specific Filters
  const [filterMpcsAuthority, setFilterMpcsAuthority] = useState('');
  const [filterMpcsAuditStatus, setFilterMpcsAuditStatus] = useState('');
  const [filterMpcsProfitStatus, setFilterMpcsProfitStatus] = useState('');
  const [filterMpcsAuditGrade, setFilterMpcsAuditGrade] = useState('');

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Submissions only ever recorded a generic role string ("Cooperative Inspector")
  // as reported_by, never the actual officer — the one thing that reliably
  // identifies who submitted a return is the inspector's login email, captured
  // on MPCS returns as form_data.inspectorEmail. Resolve that against the
  // officer_registry (CI/ACI/PA directory) to surface the real name + role.
  const officerByEmail = useMemo(() => {
    const map = {};
    officers.forEach(o => {
      if (o.email) map[o.email.trim().toLowerCase()] = o;
    });
    return map;
  }, [officers]);

  const resolveSubmitter = useCallback((row, fallback = 'Field Inspector') => {
    const email = row?.form_data?.inspectorEmail;
    const officer = email ? officerByEmail[email.trim().toLowerCase()] : null;
    if (officer?.name) {
      const roleAbbrev = /\(([^)]+)\)/.exec(officer.role || '')?.[1];
      return roleAbbrev ? `${officer.name} (${roleAbbrev})` : officer.name;
    }
    const rb = (row?.reported_by || '').trim();
    const isGenericPlaceholder = ['cooperative inspector', 'field inspector', 'inspector', ''].includes(rb.toLowerCase());
    return isGenericPlaceholder ? fallback : rb;
  }, [officerByEmail]);

  const recentActivities = useMemo(() => {
    // saveMpcsSubmission/saveMilkPcsSubmission UPDATE an existing row on every
    // resubmission rather than inserting a new one — created_at never moves,
    // so a society autosaved or resubmitted an hour ago can rank below one
    // that was merely created later and never touched since. Prefer each
    // row's actual last-write timestamp (stamped into form_data.updated_at
    // for MPCS, or into the activities JSON blob for Milk) over created_at.
    const latestMpcsTime = (r) => r.form_data?.updated_at || r.created_at;
    const latestMilkTime = (r) => {
      if (typeof r.activities === 'string' && r.activities.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(r.activities);
          if (parsed.updated_at) return parsed.updated_at;
        } catch (e) {}
      }
      return r.captured_at || r.created_at;
    };

    const items = [];
    (scopedMpcsRows || []).forEach(r => {
      items.push({
        id: `mpcs-${r.id || Math.random()}`,
        title: `Official MPCS Return: ${r.society_name || 'Cooperative Society'}`,
        sub: `Reported by ${resolveSubmitter(r)} • ${r.district || 'Sikkim'}`,
        timeStr: latestMpcsTime(r),
        badgeText: 'MPCS',
        badgeBg: '#ECFDF5',
        badgeColor: '#065F46',
        icon: I.submit,
        iconColor: '#059669',
        row: r,
        isMpcs: true
      });
    });
    (scopedMilkRows || []).forEach(r => {
      items.push({
        id: `milk-${r.id || Math.random()}`,
        title: `Milk Collection: ${r.center_name || 'Collection Center'} (${r.litres || 0} L)`,
        sub: `Reported by ${resolveSubmitter(r, 'Inspector')} • Balance ₹${parseFloat(r.balance || 0).toLocaleString('en-IN')}`,
        timeStr: latestMilkTime(r),
        badgeText: 'MILK',
        badgeBg: '#FEF3C7',
        badgeColor: '#92400E',
        icon: I.litres,
        iconColor: '#D97706',
        row: r,
        isMpcs: false
      });
    });
    return items.sort((a, b) => new Date(b.timeStr || 0) - new Date(a.timeStr || 0)).slice(0, 6);
  }, [scopedMpcsRows, scopedMilkRows, resolveSubmitter]);

  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    const [milkRes, mpcsRes] = await Promise.all([
      supabase.from('milk_pcs_submissions').select('*').order('created_at',{ascending:false}),
      supabase.from('mpcs_submissions').select('*').order('created_at',{ascending:false}),
    ]);
    if (milkRes.error) { setError(milkRes.error.message); }
    else {
      setMilkRows(milkRes.data || []);
    }
    if (!mpcsRes.error) {
      setMpcsRows((mpcsRes.data || []).map(normalizeMpcsAuditFields));
    }
    const { data: memberRes } = await supabase.from('member_registry').select('*').order('created_at', { ascending: false });
    if (memberRes) setMemberRows(memberRes);

    const { data: offRes } = await supabase.from('officer_registry').select('*').order('created_at', { ascending: false });
    if (offRes) setOfficers(offRes);

    const { data: assignRes } = await supabase.from('unit_assignments').select('*');
    if (assignRes) {
      const mapping = {};
      assignRes.forEach(a => {
        mapping[a.unit_name] = { ci: a.ci_name, aci: a.aci_name, district: a.district };
      });
      setHierarchyMapping(mapping);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll(true);
    // 1. Silent Live 10-second Auto-Polling Interval (No UI Blinking)
    const interval = setInterval(() => {
      fetchAll(false);
    }, 10000);

    // 2. Supabase Live Realtime DB Subscription (Silent)
    const channel = supabase
      .channel('admin-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milk_pcs_submissions' }, () => {
        fetchAll(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpcs_submissions' }, () => {
        fetchAll(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'officer_registry' }, () => {
        fetchAll(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_registry' }, () => {
        fetchAll(false);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // Filter MILK rows
  useEffect(()=>{
    let d = [...scopedMilkRows];
    if (filterMonth) d = d.filter(r=>r.reporting_month===filterMonth);
    if (filterDistrict) d = d.filter(r=>r.district===filterDistrict);
    if (filterCenter) d = d.filter(r=>(r.center_name||'').toLowerCase() === filterCenter.toLowerCase());
    if (activeFilter === 'loan') d = d.filter(r => r.has_loan);
    const q = searchQ.toLowerCase().trim();
    if (q) d = d.filter(r=>
      (r.reported_by||'').toLowerCase().includes(q)||
      (r.center_id||'').toLowerCase().includes(q)||
      (r.center_name||'').toLowerCase().includes(q)||
      (r.district||'').toLowerCase().includes(q)
    );
    setMilkFiltered(d);
  },[scopedMilkRows,filterMonth,filterCenter,filterDistrict,searchQ,activeFilter]);

  // Filter MPCS rows
  useEffect(()=>{
    let d = [...scopedMpcsRows];
    const q = searchQ.toLowerCase().trim();
    if (q) d = d.filter(r=>(r.society_name||'').toLowerCase().includes(q)||(r.registration_authority||'').toLowerCase().includes(q)||(r.president_name||'').toLowerCase().includes(q));
    
    if (filterMpcsAuthority) d = d.filter(r => r.registration_authority === filterMpcsAuthority);
    // audit_done is stored as "Yes (28 Jul 2026)", not a bare "Yes" — an exact-match
    // filter against the "Audit Done" option never matched a real record.
    if (filterMpcsAuditStatus) d = d.filter(r => filterMpcsAuditStatus === 'Yes' ? isYes(r.audit_done) : !isYes(r.audit_done));
    if (filterMpcsProfitStatus) d = d.filter(r => r.is_profit === filterMpcsProfitStatus);
    if (filterMpcsAuditGrade) d = d.filter(r => r.audit_category === filterMpcsAuditGrade);

    if (activeFilter === 'audit') d = d.filter(r => isYes(r.audit_done));
    if (activeFilter === 'profit') d = d.filter(r => r.is_profit === 'PROFIT' || r.is_profit === 'Yes');
    if (activeFilter === 'loan') d = d.filter(r => r.has_loan);
    setMpcsFiltered(d);
  },[scopedMpcsRows,searchQ,activeFilter,filterMpcsAuthority,filterMpcsAuditStatus,filterMpcsProfitStatus,filterMpcsAuditGrade]);

  const centerOptions = [...new Set(scopedMilkRows.map(r=>r.center_name).filter(Boolean))].sort();
  const districtOptions = [...new Set(scopedMilkRows.map(r=>r.district).filter(Boolean))].sort();
  const mpcsAuthorityOptions = [...new Set(scopedMpcsRows.map(r=>r.registration_authority).filter(Boolean))].sort();

  const memberSocietyOptions = [...new Set(scopedMemberRows.map(r=>r.society_name).filter(Boolean))].sort();
  const memberWardOptions = [...new Set(scopedMemberRows.map(r=>r.ward_name).filter(Boolean))].sort();

  const memberFiltered = useMemo(() => {
    let d = [...scopedMemberRows];
    if (memberTypeFilter) d = d.filter(r => r.society_type === memberTypeFilter);
    if (memberSocietyFilter) d = d.filter(r => r.society_name === memberSocietyFilter);
    if (memberWardFilter) d = d.filter(r => r.ward_name === memberWardFilter);
    const q = memberSearchQ.toLowerCase().trim();
    if (q) d = d.filter(r =>
      (r.member_name||'').toLowerCase().includes(q) ||
      (r.society_name||'').toLowerCase().includes(q) ||
      (r.mobile_number||'').toLowerCase().includes(q) ||
      (r.ward_name||'').toLowerCase().includes(q)
    );
    return d;
  }, [scopedMemberRows, memberTypeFilter, memberSocietyFilter, memberWardFilter, memberSearchQ]);

  const memberStats = useMemo(() => ({
    total: scopedMemberRows.length,
    mpcs: scopedMemberRows.filter(r => r.society_type === 'MPCS').length,
    milk: scopedMemberRows.filter(r => r.society_type === 'MILK').length,
    societies: new Set(scopedMemberRows.map(r => r.society_name).filter(Boolean)).size,
  }), [scopedMemberRows]);

  // Admin doesn't have first-hand knowledge of whether a member record is a
  // duplicate, fraudulent, or genuinely registered — only the CI who
  // verified that person in the field does. So admin can flag a record for
  // that CI to review instead of deleting it outright; actual removal stays
  // in the mobile app's Member Data screen.
  const handleFlagMember = async (member) => {
    const reason = window.prompt(`Flag ${member.member_name} for review by the responsible CI. Add a reason (optional):`, '');
    if (reason === null) return; // cancelled
    const flaggedBy = session?.user?.user_metadata?.fullName || session?.user?.email || 'Admin';
    const { error } = await supabase.from('member_registry').update({
      flagged: true,
      flag_reason: reason.trim() || null,
      flagged_by: flaggedBy,
      flagged_at: new Date().toISOString(),
    }).eq('id', member.id).select();
    if (error) {
      alert('Could not flag member: ' + error.message);
      return;
    }
    setMemberRows(prev => prev.map(r => r.id === member.id
      ? { ...r, flagged: true, flag_reason: reason.trim() || null, flagged_by: flaggedBy, flagged_at: new Date().toISOString() }
      : r));
  };

  const handleUnflagMember = async (member) => {
    const { error } = await supabase.from('member_registry').update({
      flagged: false, flag_reason: null, flagged_by: null, flagged_at: null,
    }).eq('id', member.id).select();
    if (error) {
      alert('Could not unflag member: ' + error.message);
      return;
    }
    setMemberRows(prev => prev.map(r => r.id === member.id
      ? { ...r, flagged: false, flag_reason: null, flagged_by: null, flagged_at: null }
      : r));
  };

  // Chart Calculations — sourced from scoped rows so a CI's district/regional
  // breakdowns don't reveal figures from outside their assigned jurisdiction.
  const chartData_MilkMonth = useMemo(() => {
    return MONTHS.map(m => {
      const rows = scopedMilkRows.filter(r => r.reporting_month === m);
      return {
        name: m.substring(0,3),
        litres: rows.reduce((s,r) => s + (parseFloat(r.litres)||0), 0),
        count: rows.length
      };
    }).filter(d => d.count > 0 || d.name === 'Jan'); // show at least Jan
  }, [scopedMilkRows]);

  const chartData_District = useMemo(() => {
    const districts = {};
    scopedMilkRows.forEach(r => {
      if (!r.district) return;
      const cleanName = r.district.replace(/Cooperation\s+Department\s+|ARCS\s+/gi, '').trim();
      if (!districts[cleanName]) {
        districts[cleanName] = { name: cleanName, centers: 0, members: 0 };
      }
      districts[cleanName].centers += 1;
      districts[cleanName].members += (parseInt(r.total_members) || 0);
    });
    return Object.values(districts).sort((a, b) => b.members - a.members);
  }, [scopedMilkRows]);

  // MPCS Calculations
  const chartData_MpcsProfit = useMemo(() => {
    const profits = scopedMpcsRows.filter(r => r.is_profit === 'Yes').length;
    const losses = scopedMpcsRows.filter(r => r.is_profit === 'No').length;
    return [
      { name: 'Profitable', value: profits, color: 'var(--emerald-light)' },
      { name: 'Loss Making', value: losses, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [scopedMpcsRows]);

  const chartData_MpcsAudit = useMemo(() => {
    const grades = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
    scopedMpcsRows.forEach(r => { if (r.audit_category && grades[r.audit_category] !== undefined) grades[r.audit_category]++; });
    return Object.keys(grades).map(k => ({ name: `Grade ${k}`, value: grades[k] }));
  }, [scopedMpcsRows]);

  const chartData_MpcsRegional = useMemo(() => {
    const data = {};
    scopedMpcsRows.forEach(r => {
      const auth = (r.registration_authority || 'Unknown').replace('Cooperation Department ', '');
      if (!data[auth]) data[auth] = { name: auth, turnover: 0, balance: 0 };
      data[auth].turnover += (parseFloat(r.annual_turnover) || 0);
      data[auth].balance += (parseFloat(r.bank_balance) || 0);
    });
    return Object.values(data).sort((a,b) => b.turnover - a.turnover);
  }, [scopedMpcsRows]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-hard)',
          padding: '12px 16px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: 'var(--emerald)', marginBottom: '4px' }}>{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || p.fill }} />
              <span>{p.name}: <strong style={{ color: 'var(--text-primary)' }}>{p.value.toLocaleString()}</strong></span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const DashboardCharts = () => (
    <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px'}}>
      <div className="card" style={{height:'340px', padding: '24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h3 style={{fontSize:'14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems:'center', gap: '8px'}}>
            <Icon d={I.chart} size={16} color="var(--emerald-light)"/> Monthly Performance
          </h3>
          <span style={{fontSize:'10px', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px'}}>Volume Trend</span>
        </div>
        <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData_MilkMonth}>
            <defs>
              <linearGradient id="colorLitre" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7F1D1D" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#7F1D1D" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(127,29,29,0.05)" />
            <XAxis dataKey="name" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={10} tick={{fill: 'var(--text-muted)'}} />
            <YAxis fontSize={10} fontWeight={600} tickLine={false} axisLine={false} tick={{fill: 'var(--text-muted)'}} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="litres" name="Litres Collected" stroke="#7F1D1D" strokeWidth={3} fillOpacity={1} fill="url(#colorLitre)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{height:'340px', padding: '24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h3 style={{fontSize:'14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems:'center', gap: '8px'}}>
            <Icon d={I.domain} size={16} color="var(--emerald-light)"/> Regional Engagement
          </h3>
          <span style={{fontSize:'10px', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px'}}>Members vs Units</span>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData_District} layout="vertical" margin={{left: 10}}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(127,29,29,0.05)" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={10} fontWeight={700} width={90} tickLine={false} axisLine={false} tick={{fill: 'var(--text-secondary)'}} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(127,29,29,0.02)'}} />
            <Bar dataKey="members" name="Live Members" fill="#7F1D1D" radius={[0, 10, 10, 0]} barSize={14} animationDuration={1200} />
            <Bar dataKey="centers" name="Active Centers" fill="#92400E" radius={[0, 10, 10, 0]} barSize={10} animationDuration={1800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const MpcsCharts = () => (
    <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '32px'}}>
      
      {/* 1. Economic Health Donut */}
      <div className="card" style={{height:'360px', padding: '24px', position: 'relative', overflow: 'hidden'}}>
        <div style={{position:'absolute', top:0, right:0, width:'150px', height:'150px', background:'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents:'none'}}/>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
          <div>
            <h3 style={{fontSize:'15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems:'center', gap: '8px'}}>
              <Icon d={I.money} size={18} color="var(--gold)"/> Economic Sustainability
            </h3>
            <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px', fontWeight:600}}>Profitability Ratio</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="70%">
          <PieChart>
            <defs>
              <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7F1D1D" stopOpacity={1}/>
                <stop offset="100%" stopColor="#7F1D1D" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="gradLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={1}/>
                <stop offset="100%" stopColor="#991B1B" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <Pie 
              data={chartData_MpcsProfit} 
              innerRadius={75} 
              outerRadius={95} 
              paddingAngle={8} 
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
            >
              {chartData_MpcsProfit.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Profitable' ? 'url(#gradProfit)' : 'url(#gradLoss)'} stroke="rgba(255,255,255,0.2)" strokeWidth={2}/>
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:'flex', justifyContent:'center', gap:'24px', marginTop:'4px'}}>
           {chartData_MpcsProfit.map(d => (
             <div key={d.name} style={{display:'flex', alignItems:'center', gap:'8px'}}>
               <div style={{width:'10px', height:'10px', borderRadius:'3px', background: d.name === 'Profitable' ? 'var(--emerald)' : '#EF4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}/>
               <span style={{fontSize:'12px', fontWeight:700, color:'var(--text-secondary)'}}>{d.name}</span>
             </div>
           ))}
        </div>
      </div>

      {/* 2. Audit Grade Bar */}
      <div className="card" style={{height:'360px', padding: '24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
          <div>
            <h3 style={{fontSize:'15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems:'center', gap: '8px'}}>
              <Icon d={I.submit} size={18} color="var(--emerald)"/> Compliance Audit
            </h3>
            <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px', fontWeight:600}}>Grade Distribution Overview</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData_MpcsAudit} margin={{top: 10, bottom: 20}}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="name" fontSize={11} fontWeight={800} axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}}/>
            <Bar dataKey="value" name="Societies" radius={[8, 8, 8, 8]} barSize={40}>
              {chartData_MpcsAudit.map((entry, index) => {
                 const colors = { 'Grade A': '#7F1D1D', 'Grade B': '#92400E', 'Grade C': '#F59E0B', 'Grade D': '#EF4444' };
                 return <Cell key={`cell-${index}`} fill={colors[entry.name] || 'var(--emerald-light)'} fillOpacity={0.9} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Regional Financial Index */}
      <div className="card" style={{height:'360px', padding: '24px', gridColumn: 'span 1'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
          <div>
            <h3 style={{fontSize:'15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems:'center', gap: '8px'}}>
              <Icon d={I.domain} size={18} color="var(--emerald)"/> Financial Authority Index
            </h3>
            <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px', fontWeight:600}}>Capital Capacity by Region</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={chartData_MpcsRegional} margin={{left: -20, right: 10}}>
            <defs>
              <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--emerald)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="turnover" name="Aggregate Turnover" stroke="var(--emerald)" strokeWidth={3} fillOpacity={1} fill="url(#colorTurnover)" />
            <Area type="monotone" dataKey="balance" name="Cash Liquidity" stroke="var(--gold)" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );



  const TabBtn = ({id, label, icon, count}) => (
    <button onClick={()=>setActiveTab(id)} style={{
      display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',
      borderRadius:'8px',fontWeight:700,fontSize:'13px',cursor:'pointer',
      transition:'all 0.15s ease',
      background: activeTab===id ? 'var(--brand-burgundy)' : '#FFFFFF',
      color: activeTab===id ? '#FFF' : '#475569',
      border: activeTab===id ? '1px solid var(--brand-burgundy)' : '1px solid #CBD5E1',
    }}>
      <Icon d={icon} size={15} color={activeTab===id ? '#FFF' : '#64748B'} sw={2}/>
      <span>{label}</span>
      {count !== undefined && (
        <span style={{padding:'2px 6px',borderRadius:'99px',fontSize:'10px',fontWeight:800,
          background:activeTab===id?'rgba(255,255,255,0.2)':'#F1F5F9',
          color:activeTab===id?'#FFF':'#64748B'}}>{count}</span>
      )}
    </button>
  );

  return (
    <div style={{minHeight:'100vh', background:'#F8FAFC'}}>
      {/* 🏛️ Top Header Bar */}
      <header className="app-header">
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileNavOpen(prev => !prev)}
            title="Toggle Navigation"
          >
            <Icon d={I.menu} size={20} color="#FFFFFF"/>
          </button>

          <div style={{width:'36px', height:'36px', background:'rgba(255,255,255,0.15)', borderRadius:'8px', padding:'5px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
            <img src={sikkimEmblem} alt="Sikkim Crest" style={{maxHeight:'100%', maxWidth:'100%', objectFit:'contain'}}/>
          </div>
          <div>
            <div style={{fontFamily:'Cinzel, serif', fontSize:'15px', fontWeight:900, color:'#FFFFFF', letterSpacing:'0.8px', lineHeight:1.1, whiteSpace:'nowrap'}}>
              GYALSHING DISTRICT CORE
            </div>
            <div className="hide-mobile" style={{fontSize:'10px', color:'rgba(255,255,255,0.85)', letterSpacing:'0.4px', fontWeight:600, marginTop:'3px'}}>
              District Co-operative Oversight & Reporting Engine • Government of Sikkim
            </div>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div className="hide-mobile" style={{display:'flex', alignItems:'center', gap:'8px', background: userRole==='System Admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', border: userRole==='System Admin' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)', padding:'6px 14px', borderRadius:'99px', cursor:'pointer'}} onClick={()=>setShowProfileModal(true)}>
            <span style={{width:'8px', height:'8px', borderRadius:'50%', background: userRole==='System Admin' ? '#10B981' : '#F59E0B', boxShadow: userRole==='System Admin' ? '0 0 10px #10B981' : '0 0 10px #F59E0B'}}/>
            <span style={{fontSize:'11px', fontWeight:700, color:'#FFFFFF', letterSpacing:'0.4px'}}>
              {userRole==='System Admin' ? '🔓 ADMIN: All Gyalshing District' : `🔒 INSPECTOR: ${assignedUnits.length} Assigned MPCS Units`}
            </span>
          </div>

          <div className="hide-mobile" style={{fontSize:'12px', color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer'}} onClick={fetchAll}>
            <Icon d={I.refresh} size={14} color="rgba(255,255,255,0.7)"/>
            <span>Last Sync: {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          </div>

          <button style={{position:'relative', background:'rgba(255,255,255,0.1)', border:'none', padding:'8px', borderRadius:'10px', cursor:'pointer'}} onClick={()=>setShowNotificationsDrawer(true)}>
            <Icon d={I.alert} size={18} color="#FFFFFF"/>
            <span style={{position:'absolute', top:'-2px', right:'-2px', background:'#EF4444', color:'#FFF', fontSize:'9px', fontWeight:900, width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>3</span>
          </button>

          <div style={{display:'flex', alignItems:'center', gap:'10px', borderLeft:'1px solid rgba(255,255,255,0.2)', paddingLeft:'12px', cursor:'pointer'}} onClick={()=>setShowProfileModal(true)}>
            <div style={{width:'34px', height:'34px', borderRadius:'50%', background:'#FFFFFF', color:'#7F1D1D', fontWeight:800, fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid rgba(255,255,255,0.3)', flexShrink:0}}>
              {(session?.user?.user_metadata?.fullName || session?.user?.email || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div className="hide-mobile">
              <div style={{fontSize:'12px', fontWeight:700, color:'#FFFFFF'}}>{session?.user?.user_metadata?.fullName || session?.user?.email}</div>
              <div style={{fontSize:'10px', color:'rgba(255,255,255,0.7)'}}>{userRole==='System Admin' ? 'System Administrator' : 'Cooperative Inspector'}</div>
            </div>
          </div>

          <button id="logout-btn" onClick={onLogout} style={{background:'rgba(239, 68, 68, 0.15)', border:'1px solid rgba(239, 68, 68, 0.3)', color:'#FFFFFF', padding:'7px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:700, display:'flex', alignItems:'center', gap:'6px'}}>
            <Icon d={I.logout} size={14} color="#FFFFFF"/> <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </header>

      <div className="app-container">
        {/* Backdrop for Mobile Navigation */}
        <div 
          className={`sidebar-backdrop ${mobileNavOpen ? 'active' : ''}`}
          onClick={() => setMobileNavOpen(false)}
        />

        {/* 🗂️ Left Sidebar */}
        {(() => {
          // A collapsed state persisted from a desktop session shouldn't hide
          // labels when the sidebar is opened as the mobile hamburger overlay
          // (which is always full-width) — only actually collapse on desktop.
          const showCollapsedUI = sidebarCollapsed && !mobileNavOpen;
          return (
        <aside className={`app-sidebar ${mobileNavOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div>
            {!showCollapsedUI && (
              <div style={{fontSize:'10px', fontWeight:800, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', paddingLeft:'12px'}}>
                Main Operations
              </div>
            )}
            {[
              { id: 'DASHBOARD', label: 'Dashboard', icon: I.dashboard },
              { id: 'MPCS', label: 'MPCS Societies', icon: I.domain },
              { id: 'MILK', label: 'Milk Units', icon: I.litres },
              { id: 'MEMBERS', label: 'Member Registry', icon: I.user },
              { id: 'STATS', label: 'Benchmarks', icon: I.chart },
              { id: 'OFFICERS', label: 'Official Registry', icon: I.members },
              { id: 'REPORTS', label: 'Reports', icon: I.download },
              // Users & Roles (provisioning, ACI/scope assignment) and Settings
              // are district-wide administrative actions — a scoped CI login
              // shouldn't see or reach them, even though the tab list itself
              // doesn't otherwise restrict what activeTab can be set to.
              ...(userRole === 'System Admin' ? [
                { id: 'USERS', label: 'Users & Roles', icon: I.user },
                { id: 'SETTINGS', label: 'Settings', icon: I.search },
              ] : []),
            ].map(item => (
              <div
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'MPCS') setActiveFilter(null);
                  setMobileNavOpen(false);
                }}
                title={showCollapsedUI ? item.label : undefined}
              >
                <Icon d={item.icon} size={18} color={activeTab === item.id ? '#FFFFFF' : '#64748B'} sw={2}/>
                {!showCollapsedUI && <span>{item.label}</span>}
              </div>
            ))}
          </div>

          <div>
            {!showCollapsedUI && (
              <div className="support-card" style={{cursor:'pointer', marginBottom:'10px'}} onClick={() => { setShowSupportModal(true); setMobileNavOpen(false); }}>
                <Icon d={I.info} size={20} color="#7F1D1D"/>
                <div>
                  <div style={{fontSize:'12px', fontWeight:700, color:'#0F172A'}}>Need Help?</div>
                  <div style={{fontSize:'10px', color:'#64748B'}}>Contact Support</div>
                </div>
              </div>
            )}
            <div
              className="sidebar-collapse-toggle hide-mobile"
              onClick={toggleSidebarCollapsed}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span style={{display:'inline-flex', transform: sidebarCollapsed ? 'rotate(180deg)' : 'none'}}>
                <Icon d={I.chevronsLeft} size={16} color="#64748B" sw={2}/>
              </span>
              {!sidebarCollapsed && <span>Collapse</span>}
            </div>
          </div>
        </aside>
          );
        })()}

        {/* 🖥️ Main Workspace Canvas */}
        <main className={`app-workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {error && (
            <div style={{background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', color:'#991B1B', fontSize:'13px', display:'flex', gap:'8px', alignItems:'center'}}>
              ⚠️ <strong>Error:</strong> {error}
            </div>
          )}

          {/* New Global Broadcast System */}
          <GlobalBroadcast activeTab={activeTab} userRole={userRole} />

          {/* 🏠 DASHBOARD MAIN OVERVIEW */}
          {activeTab === 'DASHBOARD' && (
            <div className="fade-in">
              {/* Header actions */}
              <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', marginBottom:'24px'}}>
                <button className="btn-ghost" onClick={fetchAll}>
                  <Icon d={I.refresh} size={14} color="#334155"/> Refresh
                </button>
              </div>

              {/* Module Filter Tab Pill Bar */}
              <div style={{display:'flex', gap:'8px', marginBottom:'24px'}}>
                <TabBtn id="MPCS" label="MPCS Societies" icon={I.domain} count={scopedMpcsRows.length}/>
                <TabBtn id="MILK" label="Milk Units" icon={I.litres} count={scopedMilkRows.length}/>
                <TabBtn id="STATS" label="Benchmarks" icon={I.chart} count={new Set([...scopedMilkRows, ...scopedMpcsRows].map(r=>r.district||r.registration_authority).filter(Boolean)).size}/>
                <TabBtn id="OFFICERS" label="Official Registry" icon={I.members} count={officers.length}/>
              </div>

              {/* Dual Analytics Chart Row */}
              <div className="analytics-grid">
                {/* Monthly Performance Bar Chart */}
                <div className="card" style={{marginBottom:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
                    <div>
                      <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px'}}>
                        <Icon d={I.chart} size={18} color="#7F1D1D"/> Monthly Performance
                      </h3>
                      <p style={{fontSize:'11px', color:'#64748B', marginTop:'2px'}}>Total litres collected over time ({yearFilter})</p>
                    </div>
                    <select className="field-input" style={{padding:'4px 8px', fontSize:'12px'}} value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
                      <option value="This Year">This Year (2026)</option>
                      <option value="Last Year">Last Year (2025)</option>
                    </select>
                  </div>
                  <div style={{height:'180px', display:'flex', alignItems:'flex-end', gap:'8px', padding:'10px 0', borderBottom:'1px solid #E2E8F0'}}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => {
                      const heights = yearFilter==='This Year'
                        ? [60, 75, 65, 80, 90, 100, 85, 70, 65, 60, 55, 50]
                        : [50, 65, 55, 70, 80, 85, 75, 60, 55, 50, 45, 40];
                      return (
                        <div key={m} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px'}}>
                          <div style={{width:'100%', height:`${heights[i]}%`, background:'#7F1D1D', borderRadius:'2px 2px 0 0'}}/>
                          <span style={{fontSize:'10px', color:'#64748B', fontWeight:600}}>{m}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', paddingTop:'14px', fontSize:'12px'}}>
                    <div><span style={{color:'#64748B'}}>Total (YTD):</span> <strong>{yearFilter==='This Year'?'405,230 L':'360,500 L'}</strong></div>
                    <div><span style={{color:'#64748B'}}>Avg. Monthly:</span> <strong>{yearFilter==='This Year'?'33,769 L':'30,041 L'}</strong></div>
                    <div style={{color:'#059669', fontWeight:700}}>{yearFilter==='This Year'?'Growth: ↑ 12.4% vs last year':'Growth: Baseline Period'}</div>
                  </div>
                </div>

                {/* Regional Engagement Dual Bar Chart */}
                <div className="card" style={{marginBottom:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
                    <div>
                      <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px'}}>
                        <Icon d={I.domain} size={18} color="#059669"/> Regional Engagement
                      </h3>
                      <p style={{fontSize:'11px', color:'#64748B', marginTop:'2px'}}>Members vs Units across Gyalshing sub-regions</p>
                    </div>
                    <div style={{display:'flex', gap:'12px', fontSize:'11px', fontWeight:700}}>
                      <span style={{color:'#7F1D1D'}}>● Members</span>
                      <span style={{color:'#059669'}}>● Units</span>
                    </div>
                  </div>
                  <div style={{height:'180px', display:'flex', alignItems:'flex-end', gap:'12px', padding:'10px 0', borderBottom:'1px solid #E2E8F0'}}>
                    {[
                      { name: 'Gyalshing', m: 180, u: 24 },
                      { name: 'Pelling', m: 142, u: 20 },
                      { name: 'Yuksom', m: 115, u: 18 },
                      { name: 'Soreng', m: 130, u: 16 },
                      { name: 'Dentam', m: 98, u: 14 },
                      { name: 'Sang', m: 76, u: 12 },
                      { name: 'Martam', m: 68, u: 10 },
                    ].map(reg => (
                      <div key={reg.name} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px'}}>
                        <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'100%', width:'100%'}}>
                          <div style={{flex:1, height:`${(reg.m/200)*100}%`, background:'#7F1D1D', borderRadius:'2px 2px 0 0'}}/>
                          <div style={{flex:1, height:`${(reg.u/200)*100}%`, background:'#059669', borderRadius:'2px 2px 0 0'}}/>
                        </div>
                        <span style={{fontSize:'10px', color:'#64748B', fontWeight:600}}>{reg.name}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{paddingTop:'14px', textAlign:'right'}}>
                    <a href="#stats" onClick={(e)=>{e.preventDefault(); setActiveTab('STATS');}} style={{fontSize:'12px', color:'#7F1D1D', fontWeight:700, textDecoration:'none'}}>
                      View detailed regional report →
                    </a>
                  </div>
                </div>
              </div>

              {/* Two-Column Operational Grid */}
              <div className="operational-grid">
                {/* Col 1: Live Recent Activity Stream */}
                <div className="card" style={{marginBottom:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
                    <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px'}}>
                      <Icon d={I.history} size={16} color="#2563EB"/> Recent Activity Stream
                    </h3>
                    <span style={{fontSize:'11px', color:'#059669', fontWeight:800, background:'#ECFDF5', padding:'2px 8px', borderRadius:'12px', letterSpacing:'0.5px'}}>● REALTIME LIVE</span>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {recentActivities.length === 0 ? (
                      <div style={{padding:'20px', textAlign:'center', color:'#94A3B8', fontSize:'12px', fontStyle:'italic'}}>
                        No recent activity recorded yet. Field inspection returns will appear here in real time.
                      </div>
                    ) : (
                      recentActivities.map((act) => (
                        <div 
                          key={act.id} 
                          style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'6px', cursor:'pointer', transition:'all 0.15s ease'}}
                          onClick={() => {
                            if (act.isMpcs) {
                              setMpcsSelected(act.row);
                            } else {
                              setMilkSelected(act.row);
                            }
                          }}
                        >
                          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <span style={{padding:'8px', borderRadius:'6px', background: act.badgeBg, display:'flex', alignItems:'center', justifyContent:'center'}}>
                              <Icon d={act.icon} size={16} color={act.iconColor}/>
                            </span>
                            <div>
                              <div style={{fontSize:'13px', fontWeight:700, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px'}}>
                                <span>{act.title}</span>
                                <span style={{fontSize:'10px', fontWeight:800, padding:'1px 6px', borderRadius:'4px', background: act.badgeBg, color: act.badgeColor}}>{act.badgeText}</span>
                              </div>
                              <div style={{fontSize:'11px', color:'#64748B', marginTop:'2px'}}>{act.sub}</div>
                            </div>
                          </div>
                          <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'2px'}}>
                            <span style={{fontSize:'11px', color:'#475569', fontWeight:700}}>{formatTimeAgo(act.timeStr)}</span>
                            <span style={{fontSize:'10px', color:'#2563EB', fontWeight:600}}>Click to view →</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 2: System Overview */}
                <div className="card" style={{marginBottom:0}}>
                  <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px'}}>
                    <Icon d={I.shield} size={16} color="#059669"/> System Overview
                  </h3>
                  <div style={{display:'flex', flexDirection:'column', gap:'8px', fontSize:'13px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F1F5F9', cursor:'pointer'}} onClick={() => setActiveTab('OFFICERS')}>
                      <span style={{color:'#64748B', fontWeight:600}}>Field Officers Active</span>
                      <strong style={{color:'#059669', fontWeight:800}}>{officers.length}</strong>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F1F5F9', cursor:'pointer'}} onClick={() => setActiveTab('AUDIT')}>
                      <span style={{color:'#64748B', fontWeight:600}}>Pending Audits</span>
                      <strong style={{color:'#D97706', fontWeight:800}}>{scopedMpcsRows.filter(r=>!isYes(r.audit_done)).length}</strong>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F1F5F9', cursor:'pointer'}} onClick={() => setActiveTab('MILK')}>
                      <span style={{color:'#64748B', fontWeight:600}}>Total Milk Submissions</span>
                      <strong style={{color:'#2563EB', fontWeight:800}}>{milkStats.total}</strong>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0'}}>
                      <span style={{color:'#64748B', fontWeight:600}}>Data Sync Engine</span>
                      <strong style={{color:'#059669', fontWeight:800}}>● Live 10s Poll</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Table: Latest Submissions */}
              <div className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
                  <h3 style={{fontSize:'16px', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px'}}>
                    <Icon d={I.submit} size={18} color="#7F1D1D"/> Latest Submissions
                  </h3>
                  <button className="btn-ghost" style={{fontSize:'12px', padding:'4px 10px'}} onClick={() => setActiveTab('MILK')}>View all →</button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Entity Name</th>
                        <th>Type</th>
                        <th>Submitted By</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.slice(0, 5).map((act, idx) => (
                        <tr key={act.id || idx}>
                          <td>{idx + 1}</td>
                          <td><strong>{act.row.center_name || act.row.society_name || 'Society Unit'}</strong></td>
                          <td><span className={`badge ${act.isMpcs ? 'badge-green' : 'badge-gold'}`}>{act.isMpcs ? 'MPCS Report' : 'Milk Report'}</span></td>
                          <td>{resolveSubmitter(act.row)}</td>
                          <td>{act.timeStr ? new Date(act.timeStr).toLocaleString() : 'Recent'}</td>
                          <td><span className="badge badge-green">Verified</span></td>
                          <td>
                            <button className="btn-ghost" style={{padding:'4px 10px', fontSize:'11px'}} onClick={() => act.isMpcs ? setMpcsSelected(act.row) : setMilkSelected(act.row)}>
                              👁 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Module Views */}
          {activeTab === 'STATS' && <DistrictPerformance milkRows={scopedMilkRows} mpcsRows={scopedMpcsRows} />}

          {/* 📄 REPORTS & EXPORT CENTER */}
          {activeTab === 'REPORTS' && (
            <div className="fade-in card" style={{padding:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                  <h2 style={{fontSize:'20px', fontWeight:900, color:'#0F172A'}}>📄 Reports & Export Center</h2>
                  <p style={{fontSize:'12px', color:'#64748B', marginTop:'2px'}}>Generate and download official district co-operative oversight reports</p>
                </div>
                <button className="btn-primary" onClick={() => downloadCSV(scopedMilkRows, 'Gyalshing_District_Master_Report')}>
                  <Icon d={I.download} size={14} color="#FFF"/> Download Master CSV
                </button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px', marginBottom:'24px'}}>
                <div className="field-group">
                  <label className="field-label">Report Category</label>
                  <select className="field-input">
                    <option>Milk Submissions Master</option>
                    <option>MPCS Societies Directory</option>
                    <option>Audit & Compliance Audit Log</option>
                    <option>Official Inspectors Registry</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Start Date</label>
                  <input type="date" className="field-input" defaultValue="2026-01-01"/>
                </div>
                <div className="field-group">
                  <label className="field-label">End Date</label>
                  <input type="date" className="field-input" defaultValue="2026-08-07"/>
                </div>
              </div>
              <button className="btn-primary" onClick={() => downloadCSV(scopedMpcsRows, 'Filtered_MPCS_Report')}>
                Generate & Export Filtered Report
              </button>
            </div>
          )}

          {/* 👤 USERS & ROLES */}
          {activeTab === 'USERS' && (
            <div className="fade-in card" style={{padding:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                  <h2 style={{fontSize:'20px', fontWeight:900, color:'#0F172A'}}>👤 Governance Hierarchy & User Roles Portal</h2>
                  <p style={{fontSize:'12px', color:'#64748B', marginTop:'2px'}}>Cooperative Inspector (CI) ➔ ACI ➔ PA</p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button className="btn-ghost" onClick={() => setShowHierarchyTree(!showHierarchyTree)}>
                    <Icon d={I.members} size={14}/> {showHierarchyTree ? 'Hide Governance Tree' : '🌲 View Governance Tree'}
                  </button>
                  <button className="btn-primary" onClick={() => { setAssignAciPrefillUnit(null); setShowAssignAciModal(true); }}>
                    <Icon d={I.plus} size={14}/> Assign ACI to Unit
                  </button>
                  <button className="btn-ghost" onClick={() => setShowAddOfficer(true)}>
                    + Provision Officer
                  </button>
                </div>
              </div>

              {/* Visual Governance Tree View */}
              {showHierarchyTree && (
                <OfficerHierarchyTree hierarchyMapping={hierarchyMapping} userRole={userRole} onRevoke={handleRevokeAci} onReassign={openReassignAci}/>
              )}

              {/* Officer Directory Table */}
              <div style={{marginTop:'20px'}}>
                <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', marginBottom:'12px'}}>📋 Registered District Officers</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Officer Name</th>
                        <th>Designation / Role</th>
                        <th>Assigned Inspector (CI)</th>
                        <th>Assigned MPCS & Milk Units</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {officers.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{textAlign:'center', padding:'32px', color:'#94A3B8'}}>
                            No officers have registered yet. Inspectors appear here once they sign up from the mobile app.
                          </td>
                        </tr>
                      ) : officers.map((off, idx) => {
                        // hierarchyMapping holds real unit_assignments delegations — reflects
                        // an actual assignment when one exists, and says so honestly when it
                        // doesn't, rather than showing a fabricated unit name for every officer.
                        const assignment = Object.entries(hierarchyMapping).find(([, m]) => m.aci === off.name);
                        const role = off.role || 'ACI / Field Officer';
                        return (
                          <tr key={off.id || idx}>
                            <td>{idx + 1}</td>
                            <td><strong>{off.name}</strong></td>
                            <td><span className={role.includes('Cooperative Inspector')?'badge badge-gold':role.includes('Project Assistant')?'badge badge-green':'badge badge-purple'}>{role}</span></td>
                            <td>{assignment ? assignment[1].ci : <span style={{color:'#94A3B8', fontStyle:'italic'}}>Not yet assigned</span>}</td>
                            <td>{assignment ? <span style={{fontSize:'12px', color:'#334155'}}>{assignment[0]}</span> : <span style={{color:'#94A3B8', fontStyle:'italic'}}>Not yet assigned</span>}</td>
                            <td><span className="badge badge-green">ACTIVE</span></td>
                            <td>
                              <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                                {role.includes('Cooperative Inspector') && (
                                  <button type="button" className="btn-ghost" style={{padding:'4px 8px', fontSize:'11px'}} onClick={() => setScopeOfficer(off)}>
                                    🗺️ Assign Scope{off.assigned_units?.length ? ` (${off.assigned_units.length})` : ''}
                                  </button>
                                )}
                                {assignment && (
                                  <>
                                    <button type="button" className="btn-ghost" style={{padding:'4px 8px', fontSize:'11px'}} onClick={() => openReassignAci(assignment[0])}>✎ Update</button>
                                    <button type="button" className="btn-ghost" style={{padding:'4px 8px', fontSize:'11px', color:'#B91C1C'}} onClick={() => handleRevokeAci(assignment[0])}>✕ Revoke</button>
                                  </>
                                )}
                                {!role.includes('Cooperative Inspector') && !assignment && (
                                  <span style={{color:'#CBD5E1', fontSize:'11px'}}>—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ⚙️ SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="fade-in card" style={{padding:'24px'}}>
              <h2 style={{fontSize:'20px', fontWeight:900, color:'#0F172A', marginBottom:'16px'}}>⚙️ System Configuration & Database Settings</h2>
              <div style={{display:'flex', flexDirection:'column', gap:'14px', fontSize:'13px'}}>
                <div style={{padding:'12px 16px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between'}}>
                  <span>Database Engine:</span> <strong>Supabase (Gyalshing District Core)</strong>
                </div>
                <div style={{padding:'12px 16px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between'}}>
                  <span>Assigned Jurisdiction:</span> <strong>Cooperation Department Geyzing HQ</strong>
                </div>
                <div style={{padding:'12px 16px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between'}}>
                  <span>Realtime Field Sync:</span> <strong style={{color:'#059669'}}>Active (30-second interval)</strong>
                </div>
              </div>
            </div>
          )}

          {/* 🥛 MILK PCS VIEW */}
          {activeTab === 'MILK' && (
            <div className="fade-in">
              {/* Header Banner */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', paddingBottom:'16px', borderBottom:'1px solid var(--border)'}}>
                 <div>
                    <div style={{fontSize:'11px', fontWeight:800, color:'var(--emerald)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Dairy Cooperative Operations</div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                       <h2 style={{fontSize:'22px', fontWeight:900, color: '#0F172A', lineHeight:1}}>Milk PCS Units Registry & Returns</h2>
                       <span className="badge badge-green" style={{padding:'4px 10px', fontSize:'11px', fontWeight:800}}>
                         {milkStats.total} Total Submissions
                       </span>
                    </div>
                 </div>
                 <div style={{display:'flex', gap: '8px'}}>
                    <button className="btn-primary" onClick={()=>downloadCSV(scopedMilkRows, 'Milk_PCS_Submissions')} style={{padding: '8px 14px', fontSize: '12px', height:'38px', display: 'flex', alignItems:'center', gap:'6px'}}>
                      <Icon d={I.download} size={14} color="#fff"/> Export CSV
                    </button>
                 </div>
              </div>

              {/* 5-Column Equal KPI Grid */}
              <div className="kpi-grid" style={{marginBottom:'24px'}}>
                <StatCard icon={I.litres} label="Total Litres" value={fmtL(milkStats.litres)} color="#991B1B" bg="#FEF2F2"
                  breakdown={milkBreakdowns.litres} entityLabel="Center" entityNoun="center" entityNounPlural="centers"/>
                <StatCard icon={I.money}  label="Total Withdrawal" value={fmtRs(milkStats.withdrawal)} color="#B45309" bg="#FEF3C7"
                  breakdown={milkBreakdowns.withdrawal} entityLabel="Center" entityNoun="center" entityNounPlural="centers"/>
                <StatCard icon={I.money}  label="Aggregate Balance" value={fmtRs(milkStats.balance)} color="#7F1D1D" bg="#FFFBEB"
                  breakdown={milkBreakdowns.balance} entityLabel="Center" entityNoun="center" entityNounPlural="centers"/>
                <StatCard icon={I.members} label="Total Members" value={fmt(milkStats.members)} color="#1E3A8A" bg="#EFF6FF"
                  breakdown={milkBreakdowns.members} entityLabel="Center" entityNoun="center" entityNounPlural="centers" popoverAlign="right"/>
                <StatCard icon={I.lock}    label="Active Loans" value={milkStats.loans} color="#7C3AED" bg="#F5F3FF"
                  onClick={() => setActiveFilter(activeFilter === 'loan' ? null : 'loan')} active={activeFilter === 'loan'}
                  breakdown={milkBreakdowns.loans} entityLabel="Center" entityNoun="center" entityNounPlural="centers" popoverAlign="right"/>
              </div>

              {/* Structured Filters */}
              <div className="card" style={{marginBottom:'20px', padding:'16px 20px', background:'#FFFFFF'}}>
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:'12px', alignItems:'end'}}>
                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Search Submissions</label>
                    <div style={{position:'relative'}}>
                      <span style={{position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)'}}>
                        <Icon d={I.search} size={14} color="#9CA3AF"/>
                      </span>
                      <input id="search-input" className="field-input" placeholder="Search officer, center name..."
                        value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{paddingLeft:'34px', height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}/>
                    </div>
                  </div>

                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Reporting Month</label>
                    <select id="filter-month" className="field-input" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                      <option value="">All Months</option>
                      {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Center Name</label>
                    <select id="filter-center" className="field-input" value={filterCenter} onChange={e=>setFilterCenter(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                      <option value="">All Centers</option>
                      {centerOptions.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <button className="btn-ghost" onClick={()=>{setFilterMonth('');setFilterCenter('');setSearchQ('');setActiveFilter(null);}} style={{height:'38px', padding:'0 16px', borderRadius:'6px', fontSize:'12px', fontWeight:700}}>
                    Clear All
                  </button>
                </div>
                {(filterMonth||filterCenter||filterDistrict||searchQ||activeFilter) && (
                  <div style={{marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #F1F5F9', fontSize:'12px', color:'#047857', fontWeight:700, display:'flex', alignItems:'center', gap:'6px'}}>
                    🔍 Showing <strong>{milkFiltered.length}</strong> of <strong>{scopedMilkRows.length}</strong> submitted Milk PCS records
                  </div>
                )}
              </div>

              {/* Table Card */}
              <div className="card" style={{padding:0, overflow:'hidden', borderRadius:'8px', border:'1px solid #E2E8F0', boxShadow:'var(--shadow-subtle)'}}>
                <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FAFAFA'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Icon d={I.litres} size={18} color="var(--emerald)"/>
                    <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', margin:0}}>Milk PCS Returns & Evidence Log</h3>
                  </div>
                  <span className="badge badge-green" style={{fontSize:'11px', fontWeight:800}}>{milkFiltered.length} Verified Submissions</span>
                </div>

                {loading ? (
                  <div style={{padding:'60px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
                    <div className="spinner" style={{width:'40px',height:'40px'}}/>
                    <div style={{fontSize:'13px',color:'#9CA3AF'}}>Loading...</div>
                  </div>
                ) : milkFiltered.length === 0 ? (
                  <div style={{padding:'60px',textAlign:'center',color:'#9CA3AF'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px'}}>📭</div>
                    <div style={{fontWeight:700}}>No Milk PCS submissions found</div>
                    <div style={{fontSize:'13px',marginTop:'4px'}}>{scopedMilkRows.length===0?'No records yet — submit a form from the Milk PCS app!':'Try adjusting your filters.'}</div>
                  </div>
                ) : (
                  <div style={{overflowX:'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{textAlign:'left', width:'110px'}}>Date</th>
                          <th style={{textAlign:'left', minWidth:'200px'}}>Center Name</th>
                          <th style={{textAlign:'left', width:'140px'}}>Officer</th>
                          <th style={{textAlign:'center', width:'100px'}}>Month</th>
                          <th style={{textAlign:'center', width:'80px'}}>Audit</th>
                          <th style={{textAlign:'center', width:'80px'}}>AGM</th>
                          <th style={{textAlign:'center', width:'80px'}}>Photo</th>
                          <th style={{textAlign:'right', width:'110px'}}>Litres</th>
                          <th style={{textAlign:'right', width:'130px'}}>Withdrawal</th>
                          <th style={{textAlign:'right', width:'130px'}}>Balance</th>
                          <th style={{textAlign:'center', width:'90px'}}>Members</th>
                          <th style={{textAlign:'center', width:'90px'}}>Loan</th>
                          <th style={{textAlign:'center', width:'100px'}}>GPS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milkFiltered.map((row,i)=>{
                          const mAuditAgm = getMilkAuditAgm(row);
                          return (
                            <tr key={row.id||i} onClick={()=>setMilkSelected(row)} style={{cursor:'pointer', transition:'background 0.15s ease'}}>
                              <td style={{whiteSpace:'nowrap', fontSize:'12px', color:'#64748B', fontWeight:600}}>{row.created_at?new Date(row.created_at).toLocaleDateString('en-IN'):'—'}</td>
                              <td>
                                <div style={{fontWeight:800, fontSize:'13px', color:'#0F172A'}}>{row.center_name||'—'}</div>
                              </td>
                              <td style={{fontSize:'13px', color:'#334155', fontWeight:600}}>{resolveSubmitter(row, '—')}</td>
                              <td style={{textAlign:'center'}}><span className="badge badge-green" style={{fontSize:'10px'}}>{row.reporting_month||'—'}</span></td>
                              <td style={{textAlign:'center'}}><span className={`badge ${isYes(mAuditAgm.audit_done)?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>{isYes(mAuditAgm.audit_done)?'Yes':'No'}</span></td>
                              <td style={{textAlign:'center'}}><span className={`badge ${isYes(mAuditAgm.agm_done)?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>{isYes(mAuditAgm.agm_done)?'Yes':'No'}</span></td>
                              <td style={{textAlign:'center'}}>
                                {row.photo_url
                                  ? <img src={row.photo_url} alt="Evidence" onClick={e=>{e.stopPropagation();window.open(row.photo_url,'_blank');}}
                                      style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'8px', cursor:'pointer', border:'1.5px solid #E2E8F0'}}/>
                                  : <span style={{color:'#9CA3AF', fontSize:'12px'}}>—</span>}
                              </td>
                              <td style={{textAlign:'right', fontWeight:800, color:'#991B1B', whiteSpace:'nowrap'}}>{fmtL(row.litres)}</td>
                              <td style={{textAlign:'right', fontWeight:800, color:'#B45309', whiteSpace:'nowrap'}}>{fmtRs(row.withdrawal)}</td>
                              <td style={{textAlign:'right', fontWeight:800, color:'#7F1D1D', whiteSpace:'nowrap'}}>{fmtRs(row.balance)}</td>
                              <td style={{textAlign:'center', fontWeight:800, color:'#0F172A'}}>{row.total_members||0}</td>
                              <td style={{textAlign:'center'}}>{row.has_loan?<span className="badge badge-gold">ACTIVE</span>:<span style={{color:'#9CA3AF', fontSize:'12px'}}>—</span>}</td>
                              <td style={{textAlign:'center'}}>{row.gps_lat&&row.gps_lng
                                ? <a href={`https://maps.google.com/?q=${row.gps_lat},${row.gps_lng}`} target="_blank" rel="noreferrer"
                                    onClick={e=>e.stopPropagation()} 
                                    style={{
                                      display:'inline-flex', alignItems:'center', gap:'4px',
                                      padding:'4px 8px', borderRadius:'6px', background:'#FFFBEB',
                                      color:'#991B1B', fontSize:'10px', fontWeight:'800', border:'1px solid #FEF2F2',
                                      textDecoration:'none', whiteSpace:'nowrap'
                                    }}>
                                    <Icon d={I.location} size={11} color="#991B1B"/> GEO-TAG
                                  </a>
                                : <span style={{color:'#9CA3AF', fontSize:'12px'}}>—</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MEMBER REGISTRY VIEW ── */}
          {activeTab === 'MEMBERS' && (
            <div className="fade-in">
              {/* Header Banner */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', paddingBottom:'16px', borderBottom:'1px solid var(--border)'}}>
                 <div>
                    <div style={{fontSize:'11px', fontWeight:800, color:'var(--emerald)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Persistent Society Rosters</div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                       <h2 style={{fontSize:'22px', fontWeight:900, color: '#0F172A', lineHeight:1}}>Member Registry</h2>
                       <span className="badge badge-green" style={{padding:'4px 10px', fontSize:'11px', fontWeight:800}}>
                         {memberStats.total} Registered Members
                       </span>
                    </div>
                 </div>
                 <div style={{display:'flex', gap: '8px'}}>
                    <button className="btn-primary" onClick={()=>downloadCSV(memberFiltered, 'Gyalshing_Member_Registry')} style={{padding: '8px 14px', fontSize: '12px', height:'38px', display: 'flex', alignItems:'center', gap:'6px'}}>
                      <Icon d={I.download} size={14} color="#fff"/> Export CSV
                    </button>
                 </div>
              </div>

              {/* KPI Grid */}
              <div className="kpi-grid" style={{marginBottom:'24px'}}>
                <StatCard icon={I.user} label="Total Members" value={fmt(memberStats.total)} color="#1E3A8A" bg="#EFF6FF"/>
                <StatCard icon={I.domain} label="MPCS Members" value={fmt(memberStats.mpcs)} color="#991B1B" bg="#FEF2F2"
                  onClick={() => setMemberTypeFilter(memberTypeFilter === 'MPCS' ? '' : 'MPCS')} active={memberTypeFilter === 'MPCS'}/>
                <StatCard icon={I.litres} label="Milk Unit Members" value={fmt(memberStats.milk)} color="#B45309" bg="#FEF3C7"
                  onClick={() => setMemberTypeFilter(memberTypeFilter === 'MILK' ? '' : 'MILK')} active={memberTypeFilter === 'MILK'}/>
                <StatCard icon={I.members} label="Societies Covered" value={fmt(memberStats.societies)} color="#047857" bg="#ECFDF5"/>
              </div>

              {/* Structured Filters */}
              <div className="card" style={{marginBottom:'20px', padding:'16px 20px', background:'#FFFFFF'}}>
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'12px', alignItems:'end'}}>
                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Search Members</label>
                    <div style={{position:'relative'}}>
                      <span style={{position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)'}}>
                        <Icon d={I.search} size={14} color="#9CA3AF"/>
                      </span>
                      <input className="field-input" placeholder="Search name, society, mobile, ward..."
                        value={memberSearchQ} onChange={e=>setMemberSearchQ(e.target.value)} style={{paddingLeft:'34px', height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}/>
                    </div>
                  </div>

                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Type</label>
                    <select className="field-input" value={memberTypeFilter} onChange={e=>setMemberTypeFilter(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                      <option value="">All Types</option>
                      <option value="MPCS">MPCS</option>
                      <option value="MILK">Milk Unit</option>
                    </select>
                  </div>

                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Society</label>
                    <select className="field-input" value={memberSocietyFilter} onChange={e=>setMemberSocietyFilter(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                      <option value="">All Societies</option>
                      {memberSocietyOptions.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="field-group" style={{marginBottom:0}}>
                    <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Ward</label>
                    <select className="field-input" value={memberWardFilter} onChange={e=>setMemberWardFilter(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                      <option value="">All Wards</option>
                      {memberWardOptions.map(w=><option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>

                  <button className="btn-ghost" onClick={()=>{setMemberSearchQ('');setMemberTypeFilter('');setMemberSocietyFilter('');setMemberWardFilter('');}} style={{height:'38px', padding:'0 16px', borderRadius:'6px', fontSize:'12px', fontWeight:700}}>
                    Clear All
                  </button>
                </div>
                {(memberSearchQ||memberTypeFilter||memberSocietyFilter||memberWardFilter) && (
                  <div style={{marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #F1F5F9', fontSize:'12px', color:'#047857', fontWeight:700, display:'flex', alignItems:'center', gap:'6px'}}>
                    🔍 Showing <strong>{memberFiltered.length}</strong> of <strong>{scopedMemberRows.length}</strong> registered members
                  </div>
                )}
              </div>

              {/* Table Card */}
              <div className="card" style={{padding:0, overflow:'hidden', borderRadius:'8px', border:'1px solid #E2E8F0', boxShadow:'var(--shadow-subtle)'}}>
                <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FAFAFA'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Icon d={I.user} size={18} color="var(--emerald)"/>
                    <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', margin:0}}>Registered Members</h3>
                  </div>
                  <span className="badge badge-green" style={{fontSize:'11px', fontWeight:800}}>{memberFiltered.length} Members</span>
                </div>

                {loading ? (
                  <div style={{padding:'60px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
                    <div className="spinner" style={{width:'40px',height:'40px'}}/>
                    <div style={{fontSize:'13px',color:'#9CA3AF'}}>Loading...</div>
                  </div>
                ) : memberFiltered.length === 0 ? (
                  <div style={{padding:'60px',textAlign:'center',color:'#9CA3AF'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px'}}>👤</div>
                    <div style={{fontWeight:700}}>No members found</div>
                    <div style={{fontSize:'13px',marginTop:'4px'}}>{scopedMemberRows.length===0?'No members registered yet — add one from the mobile app\'s Master Data → Member Data screen.':'Try adjusting your filters.'}</div>
                  </div>
                ) : (
                  <div style={{overflowX:'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{textAlign:'left', width:'110px'}}>Date Added</th>
                          <th style={{textAlign:'left', minWidth:'160px'}}>Member Name</th>
                          <th style={{textAlign:'left', minWidth:'180px'}}>Society</th>
                          <th style={{textAlign:'center', width:'90px'}}>Type</th>
                          <th style={{textAlign:'left', width:'110px'}}>Ward</th>
                          <th style={{textAlign:'left', width:'130px'}}>Mobile</th>
                          <th style={{textAlign:'left', width:'150px'}}>Aadhaar No</th>
                          <th style={{textAlign:'left', minWidth:'160px'}}>Address</th>
                          <th style={{textAlign:'center', width:'110px'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberFiltered.map((m,i)=>(
                          <tr key={m.id||i} style={m.flagged ? {background:'#FFFBEB'} : undefined}>
                            <td style={{whiteSpace:'nowrap', fontSize:'12px', color:'#64748B', fontWeight:600}}>{m.created_at?new Date(m.created_at).toLocaleDateString('en-IN'):'—'}</td>
                            <td style={{fontWeight:800, fontSize:'13px', color:'#0F172A'}}>
                              {m.member_name||'—'}
                              {m.flagged && (
                                <div title={[m.flag_reason, m.flagged_by ? `Flagged by ${m.flagged_by}` : null].filter(Boolean).join(' — ')}
                                  style={{marginTop:'3px', display:'inline-flex', alignItems:'center', gap:'4px', background:'#FEF3C7', color:'#92400E', fontSize:'9px', fontWeight:800, padding:'2px 6px', borderRadius:'10px', letterSpacing:'0.3px'}}>
                                  🚩 FLAGGED FOR REVIEW
                                </div>
                              )}
                            </td>
                            <td style={{fontSize:'13px', color:'#334155', fontWeight:600}}>{m.society_name||'—'}</td>
                            <td style={{textAlign:'center'}}>
                              <span className={`badge ${m.society_type==='MPCS'?'badge-green':'badge-gold'}`} style={{fontSize:'10px'}}>{m.society_type||'—'}</span>
                            </td>
                            <td style={{fontSize:'12px', color:'#475569'}}>{m.ward_name||'—'}</td>
                            <td style={{fontSize:'12px', color:'#475569'}}>{m.mobile_number||'—'}</td>
                            <td style={{fontSize:'12px', color:'#475569', fontFamily:'monospace'}}>{m.aadhaar_number ? fmtAadhaar(m.aadhaar_number) : '—'}</td>
                            <td style={{fontSize:'12px', color:'#64748B'}}>{m.address||'—'}</td>
                            <td style={{textAlign:'center'}}>
                              {m.flagged ? (
                                <button className="btn-ghost" onClick={()=>handleUnflagMember(m)} title="Unflag — clears the review flag"
                                  style={{padding:'6px 10px', fontSize:'11px', fontWeight:700, color:'#92400E'}}>
                                  Unflag
                                </button>
                              ) : (
                                <button className="btn-ghost" onClick={()=>handleFlagMember(m)} title="Flag for review by the responsible CI"
                                  style={{padding:'6px 10px', fontSize:'11px', fontWeight:700, color:'#B45309'}}>
                                  🚩 Flag
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ── MPCS VIEW ── */}
        {activeTab === 'MPCS' && (
          <div className="fade-in">
            {/* Header Banner */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', paddingBottom:'16px', borderBottom:'1px solid var(--border)'}}>
               <div>
                  <div style={{fontSize:'11px', fontWeight:800, color:'var(--emerald)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Cooperative Sector Oversight</div>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                     <h2 style={{fontSize:'22px', fontWeight:900, color: '#0F172A', lineHeight:1}}>MPCS Societies Registry & Returns</h2>
                     <span className="badge badge-green" style={{padding:'4px 10px', fontSize:'11px', fontWeight:800}}>
                       {mpcsStats.total} Total Returns
                     </span>
                  </div>
               </div>
               <div style={{display:'flex', gap: '8px'}}>
                  <button className="btn-ghost" onClick={()=>setShowCharts(!showCharts)} style={{padding: '8px 14px', fontSize: '12px', height:'38px'}}>
                    {showCharts ? 'Hide Analytics' : 'Show Analytics'}
                  </button>
                  <button className="btn-primary" onClick={()=>downloadCSV(scopedMpcsRows, 'MPCS_Returns')} style={{padding: '8px 14px', fontSize: '12px', height:'38px', display: 'flex', alignItems:'center', gap:'6px'}}>
                    <Icon d={I.download} size={14} color="#fff"/> Export CSV
                  </button>
               </div>
            </div>

            {showCharts && <MpcsCharts />}

            {/* 5-Column Equal Grid */}
            <div className="kpi-grid" style={{marginBottom:'24px'}}>
              <StatCard icon={I.money}   label="Total Turnover" value={fmtRs(mpcsStats.turnover)} color="#450A0A" bg="#FEF2F2"
                breakdown={mpcsBreakdowns.turnover}/>
              <StatCard icon={I.members} label="Total Members" value={fmt(mpcsStats.members)} color="#92400E" bg="#FFFBEB"
                breakdown={mpcsBreakdowns.members}/>
              <StatCard icon={I.lock}    label="Active Loans" value={mpcsStats.loans} color="#7F1D1D" bg="#FEF2F2"
                onClick={() => setActiveFilter(activeFilter === 'loan' ? null : 'loan')} active={activeFilter === 'loan'}
                breakdown={mpcsBreakdowns.loans}/>
              <StatCard icon={I.refresh} label="Audits Done" value={mpcsStats.audits} color="#991B1B" bg="#FEF2F2"
                onClick={() => setActiveFilter(activeFilter === 'audit' ? null : 'audit')} active={activeFilter === 'audit'}
                breakdown={mpcsBreakdowns.audits} popoverAlign="right"/>
              <StatCard icon={I.submit}  label="Active Profits" value={mpcsStats.profits} color="#B45309" bg="#FFFBEB"
                onClick={() => setActiveFilter(activeFilter === 'profit' ? null : 'profit')} active={activeFilter === 'profit'}
                breakdown={mpcsBreakdowns.profits} popoverAlign="right"/>
            </div>

            {/* Structured Filters */}
            <div className="card" style={{marginBottom:'20px', padding:'16px 20px', background:'#FFFFFF'}}>
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'12px', alignItems:'end'}}>
                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Quick Search</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)'}}><Icon d={I.search} size={14} color="#9CA3AF"/></span>
                    <input className="field-input" placeholder="Search society name, reg no..."
                      value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{paddingLeft:'34px', height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}/>
                  </div>
                </div>

                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Audit Status</label>
                  <select className="field-input" value={filterMpcsAuditStatus} onChange={e=>setFilterMpcsAuditStatus(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                    <option value="">All Statuses</option>
                    <option value="Yes">Audit Done</option>
                    <option value="No">Pending Audit</option>
                  </select>
                </div>

                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Profit Performance</label>
                  <select className="field-input" value={filterMpcsProfitStatus} onChange={e=>setFilterMpcsProfitStatus(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                    <option value="">All Statuses</option>
                    <option value="PROFIT">Profitable</option>
                    <option value="LOSS">Loss Making</option>
                    <option value="NO_PROFIT_NO_LOSS">No Profit / No Loss</option>
                  </select>
                </div>

                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label" style={{fontSize:'10px', fontWeight:800, textTransform:'uppercase', color:'#64748B', marginBottom:'4px'}}>Audit Grade</label>
                  <select className="field-input" value={filterMpcsAuditGrade} onChange={e=>setFilterMpcsAuditGrade(e.target.value)} style={{height:'38px', borderRadius:'6px', border:'1px solid #CBD5E1'}}>
                    <option value="">All Grades</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                  </select>
                </div>

                <button className="btn-ghost" onClick={()=>{
                  setSearchQ('');
                  setFilterMpcsAuditStatus('');
                  setFilterMpcsProfitStatus('');
                  setFilterMpcsAuditGrade('');
                  setActiveFilter(null);
                }} style={{height:'38px', padding:'0 16px', borderRadius:'6px', fontSize:'12px', fontWeight:700}}>Clear All</button>
              </div>

              {(searchQ || filterMpcsAuditStatus || filterMpcsProfitStatus || filterMpcsAuditGrade || activeFilter) && (
                <div style={{marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #F1F5F9', fontSize:'12px', color:'#047857', fontWeight:700, display:'flex', alignItems:'center', gap:'6px'}}>
                  🔍 Showing <strong>{mpcsFiltered.length}</strong> of <strong>{scopedMpcsRows.length}</strong> registered MPCS societies
                </div>
              )}
            </div>

            {/* Table Card */}
            <div className="card" style={{padding:0, overflow:'hidden', borderRadius:'8px', border:'1px solid #E2E8F0', boxShadow:'var(--shadow-subtle)'}}>
              <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FAFAFA'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <Icon d={I.domain} size={18} color="var(--emerald)"/>
                  <h3 style={{fontSize:'15px', fontWeight:800, color:'#0F172A', margin:0}}>Official MPCS Returns Registry</h3>
                </div>
                <span className="badge badge-green" style={{fontSize:'11px', fontWeight:800}}>{mpcsFiltered.length} Verified Records</span>
              </div>
              {loading ? (
                <div style={{padding:'60px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
                  <div className="spinner" style={{width:'40px',height:'40px'}}/><div style={{fontSize:'13px',color:'#9CA3AF'}}>Loading...</div>
                </div>
              ) : mpcsFiltered.length === 0 ? (
                <div style={{padding:'60px',textAlign:'center',color:'#9CA3AF'}}>
                  <div style={{fontSize:'40px',marginBottom:'12px'}}>🏛️</div>
                  <div style={{fontWeight:700}}>No MPCS returns found</div>
                  <div style={{fontSize:'13px',marginTop:'4px'}}>Submit via the MPCS tab in the Expo app</div>
                </div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table className="data-table">
                    <thead><tr>
                      <th style={{textAlign:'left', width:'110px'}}>Date</th>
                      <th style={{textAlign:'left', minWidth:'220px'}}>Society Name</th>
                      <th style={{textAlign:'left', width:'130px'}}>Reg. No.</th>
                      <th style={{textAlign:'center', width:'100px'}}>Audit</th>
                      <th style={{textAlign:'center', width:'90px'}}>Members</th>
                      <th style={{textAlign:'right', width:'140px'}}>Turnover</th>
                      <th style={{textAlign:'center', width:'110px'}}>Profit?</th>
                      <th style={{textAlign:'right', width:'140px'}}>Bank Balance</th>
                      <th style={{textAlign:'center', width:'100px'}}>Loan</th>
                    </tr></thead>
                    <tbody>
                      {mpcsFiltered.map((row,i)=>{
                        const auditAgm = getMpcsAuditAgm(row);
                        return (
                          <tr key={row.id||i} onClick={()=>setMpcsSelected(row)} style={{cursor:'pointer', transition:'background 0.15s ease'}}>
                            <td style={{whiteSpace:'nowrap', fontSize:'12px', color:'#64748B', fontWeight:600}}>{row.created_at?new Date(row.created_at).toLocaleDateString('en-IN'):'—'}</td>
                            <td>
                              <div style={{fontWeight:800, fontSize:'13px', color:'#0F172A'}}>{row.society_name||'—'}</div>
                              <div style={{fontSize:'11px', color:'#64748B'}}>{row.district || row.form_data?.gpu || row.form_data?.gpu_name || row.form_data?.district || ''}</div>
                            </td>
                            <td style={{fontSize:'12px', whiteSpace:'nowrap'}}>
                              <span style={{fontFamily:'monospace', background:'#F1F5F9', padding:'2px 6px', borderRadius:'4px', color:'#334155', fontWeight:700}}>{row.registration_number||'—'}</span>
                            </td>
                            <td style={{textAlign:'center'}}>
                              <span className={`badge ${isYes(auditAgm.audit_done) ? 'badge-green' : 'badge-red'}`} style={{fontSize:'10px'}}>
                                {auditAgm.audit_status}
                              </span>
                            </td>
                            <td style={{textAlign:'center', fontWeight:800, color:'#0F172A'}}>{row.total_members||0}</td>
                            <td style={{textAlign:'right', fontWeight:800, color:'#7F1D1D', whiteSpace:'nowrap'}}>{fmtRs(row.annual_turnover)}</td>
                            <td style={{textAlign:'center', whiteSpace:'nowrap'}}>
                              {row.is_profit === 'PROFIT' || row.is_profit === 'Yes' ? (
                                <span className="badge badge-green">PROFIT</span>
                              ) : row.is_profit === 'LOSS' || row.is_profit === 'No' ? (
                                <span className="badge badge-red">LOSS</span>
                              ) : row.is_profit === 'NO_PROFIT_NO_LOSS' ? (
                                <span className="badge badge-gold" style={{backgroundColor:'#FEF3C7', color:'#B45309'}}>NO PROFIT/LOSS</span>
                              ) : (
                                <span style={{color:'#9CA3AF',fontSize:'12px'}}>—</span>
                              )}
                            </td>
                            <td style={{textAlign:'right', fontWeight:800, color:'#047857', whiteSpace:'nowrap'}}>{fmtRs(row.bank_balance)}</td>
                            <td style={{textAlign:'center'}}>
                              {row.has_loan?<span className="badge badge-gold">ACTIVE</span>:<span style={{color:'#9CA3AF',fontSize:'12px'}}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── OFFICERS VIEW ── */}
        {activeTab === 'OFFICERS' && (
          <div className="fade-in">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '16px'}}>
               <h2 style={{fontSize:'18px', fontWeight: 800, color: '#111827'}}>Official Registry</h2>
               <button className="btn-primary" onClick={() => setShowAddOfficer(true)}>
                 + Provision Officer
               </button>
            </div>
            <div className="table-responsive card" style={{padding:0}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Officer Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((off, idx) => (
                    <tr key={off.id || idx}>
                      <td>{idx + 1}</td>
                      <td><strong>{off.name}</strong></td>
                      <td>{off.email}</td>
                      <td>{off.subdivision || off.mobile || off.phone || '—'}</td>
                      <td><span className="badge badge-gold">{off.role || 'Inspector'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{marginTop:'20px',fontSize:'11px',color:'#9CA3AF',textAlign:'center'}}>
          FOR OFFICIAL USE ONLY • DEPARTMENT OF COOPERATION, GOVERNMENT OF SIKKIM
        </div>
      </main>

      {milkSelected && <MilkDetailModal row={milkSelected} onClose={()=>setMilkSelected(null)} submitter={resolveSubmitter(milkSelected, '—')}/>}
      {mpcsSelected && <MPCSDetailModal row={mpcsSelected} onClose={()=>setMpcsSelected(null)}/>}
      {showAddMilkModal && <AddMilkReportModal onClose={()=>setShowAddMilkModal(false)} onSave={handleSaveMilkReport} />}
      {showAddMpcsModal && <AddMpcsSocietyModal onClose={()=>setShowAddMpcsModal(false)} onSave={handleSaveMpcsSociety} />}
      {showScheduleAuditModal && <ScheduleAuditModal mpcsRows={mpcsRows} onClose={()=>setShowScheduleAuditModal(false)} onSave={handleScheduleAudit} />}
      {showNotificationsDrawer && <NotificationsDrawerModal onClose={()=>setShowNotificationsDrawer(false)} />}
      {showProfileModal && (
        <InspectorProfileModal
          session={session}
          userRole={userRole}
          assignedUnits={assignedUnits}
          onClose={()=>setShowProfileModal(false)}
        />
      )}
      {showSupportModal && <SupportModal onClose={()=>setShowSupportModal(false)} />}
      {showAssignAciModal && (
        <AssignAciModal
          mpcsRows={mpcsRows}
          officers={officers}
          hierarchyMapping={hierarchyMapping}
          initialUnit={assignAciPrefillUnit}
          onClose={()=>{ setShowAssignAciModal(false); setAssignAciPrefillUnit(null); }}
          onSave={handleAssignAci}
        />
      )}
      {scopeOfficer && (
        <AssignScopeModal
          officer={scopeOfficer}
          mpcsRows={mpcsRows}
          onClose={()=>setScopeOfficer(null)}
          onSave={handleUpdateOfficerScope}
        />
      )}
      {showAddOfficer && (
        <AddOfficerModal 
          onClose={() => setShowAddOfficer(false)} 
          onSave={async (newOff) => {
            const { error } = await supabase.from('officer_registry').insert([newOff]);
            if (error) {
              alert('Error provisioning officer: ' + error.message);
            } else {
              fetchAll();
              setShowAddOfficer(false);
              setTimeout(() => alert(`Officer ${newOff.name} has been provisioned. \n\nIMPORTANT: Please ensure you run the SQL trigger script provided in the documentation to automatically create the Auth account.`), 0);
            }
          }}
        />
      )}
    </div>
  </div>
  );
}

// ─── AddMilkReportModal ───────────────────────────────────────────────────────
function AddMilkReportModal({ onClose, onSave }) {
  const [centerName, setCenterName] = useState('');
  const [district, setDistrict] = useState('Gyalshing');
  const [reportedBy, setReportedBy] = useState('Deepesh Pradhan (ACI)');
  const [reportingMonth, setReportingMonth] = useState('August');
  const [litres, setLitres] = useState('');
  const [fatContent, setFatContent] = useState('4.2');
  const [snfContent, setSnfContent] = useState('8.5');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!centerName || !litres) return alert('Center Name and Litres are mandatory.');
    setLoading(true);
    await onSave({
      center_name: centerName,
      district,
      reported_by: reportedBy,
      reporting_month: reportingMonth,
      total_litres: parseFloat(litres) || 0,
      litres: parseFloat(litres) || 0,
      fat_content: fatContent,
      snf_content: snfContent,
      captured_at: new Date().toISOString()
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'540px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Milk Operations Portal</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>Record Milk Collection Report</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{padding:'24px'}}>
          <div className="field-group" style={{marginBottom:'16px'}}>
            <label className="field-label">Center / MPCS Unit Name</label>
            <input type="text" className="field-input" placeholder="e.g. Sardong Lungzik MPCS" value={centerName} onChange={e=>setCenterName(e.target.value)} required />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div className="field-group">
              <label className="field-label">District</label>
              <input type="text" className="field-input" value={district} onChange={e=>setDistrict(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Inspector Name</label>
              <input type="text" className="field-input" value={reportedBy} onChange={e=>setReportedBy(e.target.value)} required />
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'24px'}}>
            <div className="field-group">
              <label className="field-label">Total Litres (L)</label>
              <input type="number" step="0.1" className="field-input" placeholder="e.g. 1250" value={litres} onChange={e=>setLitres(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Fat %</label>
              <input type="text" className="field-input" value={fatContent} onChange={e=>setFatContent(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">SNF %</label>
              <input type="text" className="field-input" value={snfContent} onChange={e=>setSnfContent(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:800}}>
            {loading ? 'Submitting Record...' : 'SUBMIT MILK COLLECTION RECORD'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── AddMpcsSocietyModal ──────────────────────────────────────────────────────
function AddMpcsSocietyModal({ onClose, onSave }) {
  const [societyName, setSocietyName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [presidentName, setPresidentName] = useState('');
  const [presidentMobile, setPresidentMobile] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerMobile, setManagerMobile] = useState('');
  const [turnover, setTurnover] = useState('');
  const [totalMembers, setTotalMembers] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!societyName) return alert('Society Name is mandatory.');
    setLoading(true);
    await onSave({
      society_name: societyName,
      registration_number: regNo || `MPCS/GYZ/${Math.floor(100+Math.random()*900)}`,
      president_name: presidentName,
      president_mobile: presidentMobile,
      manager_name: managerName,
      manager_mobile: managerMobile,
      registration_authority: 'Cooperation Department Geyzing',
      annual_turnover: parseFloat(turnover) || 0,
      total_members: parseInt(totalMembers) || 0,
      is_profit: 'Yes',
      audit_done: 'Yes',
      audit_year: '2025-26',
      audit_grade: 'Grade A'
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'600px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Institutional Registry</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>Register MPCS Society</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{padding:'24px'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div className="field-group">
              <label className="field-label">Society Legal Name</label>
              <input type="text" className="field-input" placeholder="e.g. Dentam Dairy MPCS" value={societyName} onChange={e=>setSocietyName(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Registration Number</label>
              <input type="text" className="field-input" placeholder="e.g. MPCS/GYZ/042" value={regNo} onChange={e=>setRegNo(e.target.value)} />
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div className="field-group">
              <label className="field-label">President Name</label>
              <input type="text" className="field-input" placeholder="e.g. Pempa Bhutia" value={presidentName} onChange={e=>setPresidentName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">President Mobile</label>
              <input type="text" className="field-input" placeholder="+91 98000 00000" value={presidentMobile} onChange={e=>setPresidentMobile(e.target.value)} />
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div className="field-group">
              <label className="field-label">Manager Name</label>
              <input type="text" className="field-input" placeholder="e.g. Birkha Subba" value={managerName} onChange={e=>setManagerName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Manager Mobile</label>
              <input type="text" className="field-input" placeholder="+91 97000 00000" value={managerMobile} onChange={e=>setManagerMobile(e.target.value)} />
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px'}}>
            <div className="field-group">
              <label className="field-label">Annual Turnover (₹)</label>
              <input type="number" className="field-input" placeholder="e.g. 1500000" value={turnover} onChange={e=>setTurnover(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Total Active Members</label>
              <input type="number" className="field-input" placeholder="e.g. 140" value={totalMembers} onChange={e=>setTotalMembers(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:800}}>
            {loading ? 'Registering Society...' : 'CONFIRM & REGISTER MPCS SOCIETY'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ScheduleAuditModal ───────────────────────────────────────────────────────
function ScheduleAuditModal({ mpcsRows, onClose, onSave }) {
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [auditYear, setAuditYear] = useState('2025-26');
  const [auditGrade, setAuditGrade] = useState('Grade A');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSocietyId) return alert('Please select a society to audit.');
    setLoading(true);
    await onSave(selectedSocietyId, {
      audit_done: 'Yes',
      audit_year: auditYear,
      audit_grade: auditGrade,
      updated_at: new Date().toISOString()
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'520px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Audit Governance</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>Schedule & Conduct Society Audit</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{padding:'24px'}}>
          <div className="field-group" style={{marginBottom:'16px'}}>
            <label className="field-label">Select MPCS Society</label>
            <select className="field-input" value={selectedSocietyId} onChange={e=>setSelectedSocietyId(e.target.value)} required>
              <option value="">-- Select Society --</option>
              {mpcsRows.map(s => (
                <option key={s.id} value={s.id}>{s.society_name} ({s.registration_number || 'N/A'})</option>
              ))}
            </select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div className="field-group">
              <label className="field-label">Audit Year</label>
              <select className="field-input" value={auditYear} onChange={e=>setAuditYear(e.target.value)}>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Assigned Audit Grade</label>
              <select className="field-input" value={auditGrade} onChange={e=>setAuditGrade(e.target.value)}>
                <option value="Grade A">Grade A (Excellent)</option>
                <option value="Grade B">Grade B (Satisfactory)</option>
                <option value="Grade C">Grade C (Requires Action)</option>
                <option value="Grade D">Grade D (Critical Review)</option>
              </select>
            </div>
          </div>
          <div className="field-group" style={{marginBottom:'24px'}}>
            <label className="field-label">Inspector Audit Observations</label>
            <textarea className="field-input" rows="3" placeholder="Enter remarks regarding books of accounts, AGM date, and liquidity..." value={inspectorNotes} onChange={e=>setInspectorNotes(e.target.value)}/>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:800}}>
            {loading ? 'Recording Audit...' : 'SAVE & VERIFY SOCIETY AUDIT'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── NotificationsDrawerModal ──────────────────────────────────────────────────
function NotificationsDrawerModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'500px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Field Command Terminal</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>District Notifications & Alerts</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <div className="modal-body" style={{padding:'24px', display:'flex', flexDirection:'column', gap:'12px'}}>
          {[
            { title: '🚨 Emergency Weather Advisory', desc: 'Heavy rainfall alert in Dentam subdivision. Field officers advised to verify milk tanker routes.', time: '10 mins ago', type: 'urgent' },
            { title: '📋 Quarterly Audit Clearance', desc: 'Gitan Karmatara MPCS audit clearance verified by ARCS Geyzing office.', time: '45 mins ago', type: 'info' },
            { title: '🥛 Peak Volume Threshold Met', desc: 'Sardong MPCS exceeded daily collection quota (1,450 L).', time: '2 hours ago', type: 'success' },
          ].map((n, i) => (
            <div key={i} style={{padding:'14px', borderRadius:'10px', background: n.type==='urgent'?'#FEF2F2':'#F8FAFC', border: n.type==='urgent'?'1px solid #FECACA':'1px solid #E2E8F0'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                <span style={{fontSize:'13px', fontWeight:800, color: n.type==='urgent'?'#991B1B':'#0F172A'}}>{n.title}</span>
                <span style={{fontSize:'10px', color:'#94A3B8'}}>{n.time}</span>
              </div>
              <p style={{fontSize:'12px', color:'#475569'}}>{n.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── InspectorProfileModal ─────────────────────────────────────────────────────
// Read-only profile of whoever is actually logged in — real name/email from
// the session, real role, and (for a CI) the real units an admin has
// assigned them. Scope is admin-managed only (via "Assign Scope" on the
// Registered District Officers table), so there's nothing to edit here.
function InspectorProfileModal({ session, userRole, assignedUnits, onClose }) {
  const displayName = session?.user?.user_metadata?.fullName || session?.user?.email || 'Unknown Officer';
  const roleTitle = session?.user?.user_metadata?.roleTitle || userRole;
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'540px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Authorization & Access Scope</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>My Profile & Permissions</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <div className="modal-body" style={{padding:'24px'}}>
          <div style={{textAlign:'center', marginBottom:'20px'}}>
            <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'#7F1D1D', color:'#FFF', fontWeight:900, fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px auto'}}>
              {initials}
            </div>
            <h3 style={{fontSize:'18px', fontWeight:900, color:'#0F172A'}}>{displayName}</h3>
            <span className="badge badge-gold" style={{marginTop:'4px'}}>{roleTitle}</span>
          </div>

          <div style={{background:'#F8FAFC', padding:'12px 16px', borderRadius:'6px', border:'1px solid #E2E8F0', marginBottom:'16px', fontSize:'12px'}}>
            <span style={{color:'#64748B'}}>Access Level:</span>{' '}
            <strong>{userRole === 'System Admin' ? 'Full District Access (all MPCS & Milk units)' : 'Scoped Cooperative Inspector Access'}</strong>
          </div>

          {/* Scoped units — read-only; only an admin can change this via
              "Assign Scope" on the Registered District Officers table. */}
          {userRole === 'Inspector' && (
            <div style={{background:'#F8FAFC', padding:'16px', borderRadius:'6px', border:'1px solid #E2E8F0', marginBottom:'16px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <span style={{fontSize:'12px', fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                  Assigned MPCS & Milk Units ({assignedUnits.length})
                </span>
                <span style={{fontSize:'11px', color:'#64748B'}}>Set by System Admin</span>
              </div>
              {assignedUnits.length === 0 ? (
                <p style={{fontSize:'12px', color:'#94A3B8', fontStyle:'italic'}}>
                  No units assigned yet. Contact a System Admin to have your jurisdiction set up.
                </p>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {assignedUnits.map(unit => (
                    <div key={unit} style={{fontSize:'12px', padding:'6px 10px', background:'#EFF6FF', border:'1px solid #93C5FD', borderRadius:'4px', fontWeight:700, color:'#1E40AF'}}>
                      {unit}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{fontSize:'12px', display:'flex', flexDirection:'column', gap:'8px', background:'#F8FAFC', padding:'14px', borderRadius:'6px', border:'1px solid #E2E8F0'}}>
            <div><span style={{color:'#64748B'}}>Email:</span> <strong>{session?.user?.email || '—'}</strong></div>
            <div><span style={{color:'#64748B'}}>Department:</span> <strong>Department of Cooperation, Govt. of Sikkim</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SupportModal ─────────────────────────────────────────────────────────────
function SupportModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'480px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Help Desk</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>District Support & Contact</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <div className="modal-body" style={{padding:'24px', fontSize:'13px', display:'flex', flexDirection:'column', gap:'12px'}}>
          <div style={{padding:'14px', background:'#F8FAFC', borderRadius:'10px', border:'1px solid #E2E8F0'}}>
            <strong>🏢 ARCS Office Geyzing</strong>
            <p style={{color:'#64748B', marginTop:'2px'}}>Phone: +91 3595 250123</p>
          </div>
          <div style={{padding:'14px', background:'#F8FAFC', borderRadius:'10px', border:'1px solid #E2E8F0'}}>
            <strong>📢 Emergency Broadcast Desk</strong>
            <p style={{color:'#64748B', marginTop:'2px'}}>Hotline: +91 94340 12345</p>
          </div>
          <div style={{padding:'14px', background:'#F8FAFC', borderRadius:'10px', border:'1px solid #E2E8F0'}}>
            <strong>💻 Technical Support Team</strong>
            <p style={{color:'#64748B', marginTop:'2px'}}>Email: support@sikkim.gov.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AssignAciModal ───────────────────────────────────────────────────────────
function AssignAciModal({ mpcsRows, officers, hierarchyMapping, initialUnit, onClose, onSave }) {
  const [selectedUnit, setSelectedUnit] = useState(initialUnit || '');
  const [selectedAci, setSelectedAci] = useState(initialUnit ? (hierarchyMapping[initialUnit]?.aci || '') : '');
  const [loading, setLoading] = useState(false);
  const isReassigning = !!initialUnit;

  const availableUnits = Array.from(new Set(mpcsRows.map(s => s.society_name).filter(Boolean)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnit || !selectedAci) return alert('Please select both an MPCS Unit and an ACI / Field Officer.');
    setLoading(true);
    await onSave(selectedUnit, selectedAci);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'500px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>CI Field Delegation</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>{isReassigning ? 'Reassign MPCS Unit' : 'Assign ACI / Field Officer to MPCS Unit'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{padding:'24px'}}>
          <div className="field-group" style={{marginBottom:'16px'}}>
            <label className="field-label">Select MPCS / Milk Unit</label>
            <select className="field-input" value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)} required disabled={isReassigning}>
              <option value="">-- Select MPCS / Milk Unit --</option>
              {availableUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="field-group" style={{marginBottom:'24px'}}>
            <label className="field-label">{isReassigning ? 'Reassign to ACI / Field Officer' : 'Assign ACI / Field Officer'}</label>
            <select className="field-input" value={selectedAci} onChange={e=>setSelectedAci(e.target.value)} required>
              <option value="">-- Select ACI / Field Officer --</option>
              {officers.map(o => (
                <option key={o.id || o.name} value={o.name}>{o.name} ({o.role || 'ACI / Field Officer'})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%', padding:'12px', borderRadius:'4px', fontSize:'13px', fontWeight:800}}>
            {loading ? 'Updating Delegation...' : 'CONFIRM ACI FIELD DELEGATION'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── AssignScopeModal ─────────────────────────────────────────────────────────
// Admin-only: sets which real MPCS societies a CI's dashboard login is
// scoped to. This is what actually drives their view when they log in —
// see the userRole/assignedUnits derivation in Dashboard.
function AssignScopeModal({ officer, mpcsRows, onClose, onSave }) {
  const [selected, setSelected] = useState(officer?.assigned_units || []);
  const [loading, setLoading] = useState(false);

  const availableUnits = Array.from(new Set(mpcsRows.map(s => s.society_name).filter(Boolean)));

  const toggleUnit = (unitName) => {
    setSelected(prev => prev.includes(unitName) ? prev.filter(u => u !== unitName) : [...prev, unitName]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(officer.id, selected);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'540px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'#7F1D1D', fontWeight:800, textTransform:'uppercase', letterSpacing:'1.5px'}}>Jurisdiction Scope</div>
            <h2 style={{fontSize:'18px', fontWeight:900}}>Assign Scope: {officer?.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{padding:'24px'}}>
          <p style={{fontSize:'12px', color:'#64748B', marginBottom:'14px'}}>
            When {officer?.name} logs into this dashboard with their own account, they will ONLY see records, reports, and statistics belonging to the checked units below.
          </p>
          <div className="field-group" style={{marginBottom:'20px'}}>
            <label className="field-label">Assigned MPCS Societies ({selected.length})</label>
            {availableUnits.length === 0 ? (
              <p style={{fontSize:'12px', color:'#94A3B8', fontStyle:'italic'}}>No MPCS societies registered yet.</p>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', maxHeight:'260px', overflowY:'auto'}}>
                {availableUnits.map(unit => {
                  const isChecked = selected.includes(unit);
                  return (
                    <label key={unit} style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', padding:'6px 10px', background: isChecked?'#EFF6FF':'#FFF', border: isChecked?'1px solid #93C5FD':'1px solid #CBD5E1', borderRadius:'4px', cursor:'pointer'}}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleUnit(unit)}/>
                      <span style={{fontWeight: isChecked?700:500, color: isChecked?'#1E40AF':'#334155'}}>{unit}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%', padding:'12px', borderRadius:'4px', fontSize:'13px', fontWeight:800}}>
            {loading ? 'Saving...' : 'SAVE JURISDICTION SCOPE'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── OfficerHierarchyTree ─────────────────────────────────────────────────────
function OfficerHierarchyTree({ hierarchyMapping, userRole, onRevoke, onReassign }) {
  // Built entirely from real unit_assignments delegations — no seeded
  // inspectors, so a CI only appears here once they've actually delegated
  // a unit to an ACI.
  const inspectors = {};

  Object.entries(hierarchyMapping).forEach(([unitName, mapping]) => {
    const ciName = mapping.ci || 'Unassigned CI';
    if (!inspectors[ciName]) {
      inspectors[ciName] = { role: 'Cooperative Inspector', jurisdiction: mapping.district || 'Gyalshing District', units: [] };
    }
    inspectors[ciName].units.push({ unitName, aci: mapping.aci, district: mapping.district });
  });

  return (
    <div style={{background:'#F8FAFC', padding:'20px', borderRadius:'6px', border:'1px solid #CBD5E1', marginBottom:'24px'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', borderBottom:'1px solid #E2E8F0', paddingBottom:'12px'}}>
        <div>
          <h3 style={{fontSize:'16px', fontWeight:900, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px'}}>
            <Icon d={I.members} size={18} color="#7F1D1D"/> District Governance Hierarchy Map
          </h3>
          <p style={{fontSize:'11px', color:'#64748B', marginTop:'2px'}}>
            Cooperative Inspector (CI) ➔ ACI ➔ PA
          </p>
        </div>
        <span className="badge badge-gold">Official Governance Tree</span>
      </div>

      {/* Root Node: System Admin */}
      <div style={{background:'#7F1D1D', color:'#FFFFFF', padding:'12px 18px', borderRadius:'4px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'16px'}}>👑</span>
          <div>
            <div style={{fontSize:'13px', fontWeight:800}}>System Admin (Full District Oversight)</div>
            <div style={{fontSize:'10px', color:'rgba(255,255,255,0.8)'}}>Department of Cooperation • Government of Sikkim • Gyalshing District HQ</div>
          </div>
        </div>
        <span style={{fontSize:'11px', fontWeight:700, background:'rgba(255,255,255,0.2)', padding:'3px 8px', borderRadius:'2px'}}>ALL JURISDICTIONS</span>
      </div>

      {/* Inspector Nodes */}
      <div style={{display:'flex', flexDirection:'column', gap:'16px', paddingLeft:'20px', borderLeft:'2px dashed #94A3B8'}}>
        {Object.keys(inspectors).length === 0 && (
          <div style={{padding:'16px', color:'#94A3B8', fontSize:'12px', fontStyle:'italic'}}>
            No delegations yet. Use "Assign ACI to Unit" to delegate an MPCS or Milk unit to a field officer.
          </div>
        )}
        {Object.entries(inspectors).map(([ciName, info]) => (
          <div key={ciName} style={{background:'#FFFFFF', border:'1px solid #CBD5E1', borderRadius:'4px', padding:'16px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', borderBottom:'1px solid #F1F5F9', paddingBottom:'8px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <span style={{fontSize:'16px'}}>🛡️</span>
                <div>
                  <div style={{fontSize:'13px', fontWeight:800, color:'#0F172A'}}>{ciName}</div>
                  <div style={{fontSize:'10px', color:'#64748B'}}>{info.role} • Scope: {info.jurisdiction}</div>
                </div>
              </div>
              <span className="badge badge-purple">{info.units.length} MPCS Units Assigned</span>
            </div>

            {/* Assigned Units & ACIs */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'10px', paddingLeft:'12px'}}>
              {info.units.map(u => (
                <div key={u.unitName} style={{background:'#F8FAFC', border:'1px solid #E2E8F0', padding:'10px 12px', borderRadius:'4px', display:'flex', flexDirection:'column', gap:'4px'}}>
                  <div style={{fontSize:'12px', fontWeight:800, color:'#7F1D1D'}}>🏛️ {u.unitName}</div>
                  <div style={{fontSize:'11px', color:'#334155', display:'flex', alignItems:'center', gap:'6px', background:'#EFF6FF', padding:'4px 8px', borderRadius:'2px', border:'1px solid #BFDBFE'}}>
                    <Icon d={I.user} size={12} color="#1E40AF"/>
                    <span>Assigned ACI: <strong>{u.aci || 'Unassigned'}</strong></span>
                  </div>
                  <div style={{display:'flex', gap:'6px', marginTop:'2px'}}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{flex:1, padding:'4px 8px', fontSize:'10px', fontWeight:700}}
                      onClick={() => onReassign && onReassign(u.unitName)}
                    >
                      ✎ Reassign
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{flex:1, padding:'4px 8px', fontSize:'10px', fontWeight:700, color:'#B91C1C'}}
                      onClick={() => onRevoke && onRevoke(u.unitName)}
                    >
                      ✕ Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AddOfficerModal ──────────────────────────────────────────────────────────
function AddOfficerModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('Assistant CI (ACI)');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert('Name and Email are mandatory.');
    setLoading(true);
    await onSave({ name, email, subdivision: mobile, role });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in" style={{maxWidth:'500px'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'11px', color:'var(--emerald)', fontWeight:800, textTransform:'uppercase', letterSpacing:'2px'}}>Provisioning Portal</div>
            <h2 style={{fontSize:'20px', fontWeight:900}}>Register New Officer</h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icon d={I.close} size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{padding:'32px'}}>
          <div className="field-group" style={{marginBottom:'20px'}}>
            <label className="field-label">Full Legal Name</label>
            <input type="text" className="field-input" placeholder="e.g. Tenzing Norbu" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="field-group" style={{marginBottom:'20px'}}>
            <label className="field-label">Official Govt. Email</label>
            <input type="email" className="field-input" placeholder="officer@sikkim.gov.in" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="field-group" style={{marginBottom:'20px'}}>
            <label className="field-label">Phone Number</label>
            <input type="text" className="field-input" placeholder="+91 Mobile Number" value={mobile} onChange={e=>setMobile(e.target.value)} />
          </div>
          <div className="field-group" style={{marginBottom:'32px'}}>
            <label className="field-label">Officer Role</label>
            <select className="field-input" value={role} onChange={e=>setRole(e.target.value)} style={{appearance:'none', background:`url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%236B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>') no-repeat right 12px center`, backgroundSize:'16px'}}>
              <option value="Cooperative Inspector (CI)">Cooperative Inspector (CI)</option>
              <option value="Assistant CI (ACI)">Assistant CI (ACI)</option>
              <option value="Project Assistant (PA)">Project Assistant (PA)</option>
              <option value="System Admin">System Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%', padding:'14px', borderRadius:'12px', fontSize:'14px', fontWeight:800}}>
            {loading ? 'Processing...' : 'CONFIRM & PROVISION ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}

// This portal is district-wide oversight (broadcasts, all societies' data,
// user management) — being logged in isn't enough to get in, the account
// must specifically carry the System Admin role. Any inspector can log in
// via Supabase Auth (the mobile app registers CI/ACI/PA accounts the same
// way), so without this check every field inspector could open the admin
// dashboard too.
const isSystemAdmin = (session) => session?.user?.user_metadata?.role === 'System Admin';
// A real CI account (registered via the mobile app's Register Inspector
// screen, which stores the short code 'CI' in user_metadata.role) also gets
// in, but scoped to only the MPCS/Milk units an admin has assigned them —
// see the RBAC state derivation in Dashboard. ACI/PA accounts are not
// granted dashboard access.
const isCiUser = (session) => session?.user?.user_metadata?.role === 'CI';
const canAccessDashboard = (session) => isSystemAdmin(session) || isCiUser(session);

// ─── AccessDenied ─────────────────────────────────────────────────────────────
function AccessDenied({ email, onLogout }) {
  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)', padding:'20px'}}>
      <div style={{width:'100%', maxWidth:'420px', background:'rgba(255,255,255,0.97)', borderRadius:'24px', boxShadow:'0 30px 80px rgba(0,0,0,0.25)', padding:'40px 36px', textAlign:'center'}}>
        <div style={{width:'64px', height:'64px', borderRadius:'50%', background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
          <Icon d={I.lock} size={28} color="#DC2626"/>
        </div>
        <h2 style={{fontSize:'18px', fontWeight:800, color:'#1E293B', margin:'0 0 8px'}}>Access Denied</h2>
        <p style={{fontSize:'13px', color:'#64748B', margin:'0 0 24px', lineHeight:1.5}}>
          {email} is signed in but isn't provisioned for portal access. This is restricted to System Admins and Cooperative Inspectors (CI) — ACI and PA accounts use the mobile field app instead.
        </p>
        <button onClick={onLogout} className="btn-primary" style={{width:'100%', padding:'13px', fontSize:'14px'}}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = () => supabase.auth.signOut();

  if (loading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC'}}>
        <div className="spinner" style={{width:'40px',height:'40px'}}/>
      </div>
    );
  }

  if (!session) return <LoginPage />;
  if (!canAccessDashboard(session)) return <AccessDenied email={session.user.email} onLogout={handleLogout}/>;
  return <Dashboard onLogout={handleLogout} session={session}/>;
}
