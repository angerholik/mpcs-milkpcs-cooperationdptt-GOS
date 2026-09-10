import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

// Decorative line-art background for the Sign In screen — a Kanchenjunga-style
// mountain range up top and rhododendron/monastery motifs at the bottom,
// matching the Sikkim government branding in the design spec. Built with
// react-native-svg (not raw <svg> tags) so it renders on native builds too,
// not just the web preview.

export function MountainSilhouette({ width = '100%', height = 160, opacity = 0.5, color = '#F4E1B5' }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice">
      <Path
        d="M0 160 L40 90 L70 120 L110 55 L150 100 L190 40 L200 30 L210 40 L250 100 L290 60 L330 115 L360 85 L400 160 Z"
        fill={color}
        fillOpacity={opacity * 0.18}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={opacity}
      />
      <Path
        d="M170 55 L200 30 L230 55 L215 60 L200 50 L185 60 Z"
        fill={color}
        fillOpacity={opacity}
      />
    </Svg>
  );
}

export function RhododendronCluster({ size = 130, opacity = 0.65 }) {
  const bloom = (cx, cy, r, fill) => (
    <G key={`${cx}-${cy}`} opacity={opacity}>
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + Math.cos(rad) * r * 0.7;
        const py = cy + Math.sin(rad) * r * 0.7;
        return <Circle key={angle} cx={px} cy={py} r={r * 0.55} fill={fill} />;
      })}
      <Circle cx={cx} cy={cy} r={r * 0.35} fill="#F4E1B5" opacity={0.9} />
    </G>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 130 130">
      {bloom(30, 95, 16, '#EC4899')}
      {bloom(60, 70, 20, '#DB2777')}
      {bloom(95, 100, 14, '#F472B6')}
      <Path
        d="M0 130 Q30 100 20 60"
        stroke="#4a7c59"
        strokeWidth={2}
        fill="none"
        opacity={opacity * 0.7}
      />
      <Path
        d="M10 130 Q55 90 50 45"
        stroke="#4a7c59"
        strokeWidth={2}
        fill="none"
        opacity={opacity * 0.7}
      />
    </Svg>
  );
}

export function PagodaSilhouette({ width = 90, height = 90, opacity = 0.3, color = '#FFFFFF' }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 90 90">
      <G opacity={opacity} stroke={color} strokeWidth={1.2} fill="none">
        <Path d="M45 10 L52 22 L38 22 Z" />
        <Path d="M30 22 L60 22 L65 30 L25 30 Z" />
        <Path d="M35 30 L55 30 L55 55 L35 55 Z" />
        <Path d="M22 55 L68 55 L74 65 L16 65 Z" />
        <Path d="M28 65 L62 65 L62 90 L28 90 Z" />
        <Path d="M40 90 L40 75 L50 75 L50 90" />
      </G>
    </Svg>
  );
}
