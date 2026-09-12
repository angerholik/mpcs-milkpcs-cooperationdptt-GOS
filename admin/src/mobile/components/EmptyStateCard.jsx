import { COLOR, FONT, RADIUS } from '../tokens';
import { iconEl } from '../icons';
import Card from './Card';

export default function EmptyStateCard({ icon, title, body, actionLabel, onAction }) {
  return (
    <Card style={{ padding: '40px 24px 36px', textAlign: 'center' }}>
      <div style={{ width: 62, height: 62, borderRadius: RADIUS.emptyTile, background: COLOR.inset, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        {iconEl(icon, COLOR.faintLight, 27, 1.7)}
      </div>
      <div style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink700, marginTop: 16 }}>{title}</div>
      <div style={{ fontSize: 13, color: COLOR.mutedLight, marginTop: 8, lineHeight: 1.5, textWrap: 'pretty' }}>{body}</div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.control, padding: '12px 18px', fontFamily: FONT.heading, fontWeight: 600, fontSize: 13, color: COLOR.maroon }}
        >
          {iconEl('refresh', COLOR.maroon, 14, 2)}
          {actionLabel}
        </button>
      )}
    </Card>
  );
}
