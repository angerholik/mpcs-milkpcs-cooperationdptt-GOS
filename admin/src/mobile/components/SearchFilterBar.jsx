import { COLOR, RADIUS } from '../tokens';
import { iconEl } from '../icons';
import Card from './Card';

// `filters`: [{ label, value, selected, options: [{value,label}], onChange }]
// Each pill is a real native <select> (transparent, stretched over the
// visual pill) so tapping opens the OS picker sheet — no custom overlay UI
// to build for phase 1, and it's fully accessible/keyboard-usable for free.
export default function SearchFilterBar({ searchValue, onSearchChange, searchPlaceholder, filters, onClear, showClear }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.control, padding: '12px 13px' }}>
        {iconEl('search', COLOR.mutedLight, 16, 1.9)}
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 13, color: COLOR.ink900, outline: 'none' }}
        />
      </div>
      <div className="hide-sb" style={{ display: 'flex', gap: 9, overflowX: 'auto', margin: '12px -16px 0', padding: '0 16px', scrollbarWidth: 'none' }}>
        {filters.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'relative', flex: '0 0 auto', width: 'max-content',
              background: f.selected ? COLOR.selectedSurface : COLOR.inset,
              border: `1px solid ${f.selected ? COLOR.selectedBorder : COLOR.hairline}`,
              borderRadius: 999, padding: '9px 13px',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: f.selected ? COLOR.maroon : COLOR.mutedLight }}>{f.label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: f.selected ? COLOR.maroon : COLOR.ink800 }}>{f.value}</span>
            {iconEl('down', f.selected ? COLOR.maroon : COLOR.muted, 11, 2.4)}
            <select
              value={f.rawValue ?? ''}
              onChange={(e) => f.onChange(e.target.value)}
              aria-label={f.label}
              style={{ position: 'absolute', inset: 0, opacity: 0, border: 'none', width: '100%', height: '100%' }}
            >
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      {showClear && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${COLOR.hairline}` }}>
          <button type="button" onClick={onClear} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: COLOR.maroon, padding: 0 }}>
            Clear all
          </button>
        </div>
      )}
    </Card>
  );
}
