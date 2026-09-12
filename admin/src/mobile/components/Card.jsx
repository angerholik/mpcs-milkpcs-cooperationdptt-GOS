import { COLOR, RADIUS, SHADOW } from '../tokens';

export default function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: COLOR.surface,
        borderRadius: RADIUS.card,
        padding: 18,
        boxShadow: SHADOW.card,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
