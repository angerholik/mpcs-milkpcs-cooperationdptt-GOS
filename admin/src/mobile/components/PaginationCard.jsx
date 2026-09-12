import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from './Card';

// Matches the handoff's pagination card (screens 2, 3, 7): "Showing 1-N of M"
// plus prev/next + numbered pages, optional page-size row below.
export default function PaginationCard({ page, totalPages, total, pageSize, onPageChange, showingLabel }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <Card style={{ padding: '15px 16px' }}>
      {showingLabel && (
        <div style={{ fontSize: 12, color: COLOR.muted, marginBottom: 12 }}>{showingLabel}</div>
      )}
      <div className="hide-sb" style={{ display: 'flex', alignItems: 'center', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{ width: 32, height: 32, borderRadius: 10, background: COLOR.inset, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
        >
          {iconEl('left', page <= 1 ? COLOR.faintLight : COLOR.muted, 14, 2.3)}
        </button>
        {pages.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            style={{
              width: 32, height: 32, borderRadius: 10, border: 'none', flex: '0 0 auto',
              background: n === page ? COLOR.maroon : COLOR.inset,
              color: n === page ? '#FFFFFF' : COLOR.ink700,
              fontFamily: FONT.heading, fontSize: 13, fontWeight: 600,
            }}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ width: 32, height: 32, borderRadius: 10, background: COLOR.inset, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
        >
          {iconEl('right', page >= totalPages ? COLOR.faintLight : COLOR.muted, 14, 2.3)}
        </button>
      </div>
    </Card>
  );
}
