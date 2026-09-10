import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

// Decorative line-art background for the Sign In screen — a Kanchenjunga-style
// mountain range spanning the header, rhododendron blooms bottom-left, and a
// Sikkim monastery complex bottom-right, matching reference/login-reference.png.
// Built with react-native-svg (not raw <svg> tags) so it renders on native
// builds too, not just the web preview.

export function MountainSilhouette({ width = '100%', height = 200, opacity = 1, color = '#F4E1B5' }) {
  // Peaks flank the center in a valley shape (x≈180-230 stays low) so the
  // CORE emblem sits in open sky between two ridgelines instead of a peak
  // colliding with it. Kept low-opacity even where it does cross behind the
  // side taglines, matching how subtly the reference's mountains sit behind
  // that text — background texture, not competing linework.
  return (
    <Svg width={width} height={height} viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
      {/* Back ridge — further away, lower contrast */}
      <Path
        d="M0 200 L0 145 L30 115 L60 132 L95 92 L130 122 L165 105 L200 135 L235 115 L270 132 L300 100 L340 128 L370 105 L400 122 L400 200 Z"
        fill={color}
        fillOpacity={0.06}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.18}
      />
      {/* Front ridge — nearer, valley at center for the emblem */}
      <Path
        d="M0 200 L0 152 L40 96 L80 130 L120 62 L160 113 L190 130 L210 130 L230 113 L270 62 L310 122 L350 88 L390 140 L400 122 L400 200 Z"
        fill={color}
        fillOpacity={0.09}
        stroke={color}
        strokeWidth={1.4}
        strokeOpacity={0.42}
      />
      {/* Snow-cap highlights on the two flanking peaks */}
      <Path d="M108 83 L120 62 L132 83 L125 86 L120 74 L115 86 Z" fill={color} fillOpacity={0.55} />
      <Path d="M258 83 L270 62 L282 83 L275 86 L270 74 L265 86 Z" fill={color} fillOpacity={0.55} />
    </Svg>
  );
}

export function RhododendronCluster({ size = 190, opacity = 0.85 }) {
  const petalColors = ['#E11D48', '#BE123C', '#F43F5E', '#9F1239'];
  const bloom = (cx, cy, r, fillIdx) => {
    const fill = petalColors[fillIdx % petalColors.length];
    return (
      <G key={`${cx}-${cy}`}>
        {[0, 72, 144, 216, 288].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const px = cx + Math.cos(rad) * r * 0.7;
          const py = cy + Math.sin(rad) * r * 0.7;
          return <Circle key={angle} cx={px} cy={py} r={r * 0.55} fill={fill} />;
        })}
        <Circle cx={cx} cy={cy} r={r * 0.35} fill="#F4E1B5" opacity={0.9} />
      </G>
    );
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 190 190" opacity={opacity}>
      {/* Stems / branches, drawn first so blooms sit on top */}
      <Path d="M0 190 Q35 150 25 95" stroke="#3f6b4a" strokeWidth={2.5} fill="none" />
      <Path d="M15 190 Q65 140 55 70" stroke="#3f6b4a" strokeWidth={2.5} fill="none" />
      <Path d="M40 190 Q95 155 100 100" stroke="#3f6b4a" strokeWidth={2} fill="none" />
      <Path d="M70 190 Q120 165 140 120" stroke="#3f6b4a" strokeWidth={2} fill="none" />
      {/* Leaves */}
      <Path d="M20 140 Q5 130 12 112 Q28 118 20 140 Z" fill="#3f6b4a" opacity={0.9} />
      <Path d="M55 120 Q38 112 44 92 Q62 98 55 120 Z" fill="#3f6b4a" opacity={0.9} />
      <Path d="M95 145 Q80 136 88 118 Q104 124 95 145 Z" fill="#3f6b4a" opacity={0.9} />
      {/* Bloom clusters, varied sizes */}
      {bloom(24, 92, 22, 0)}
      {bloom(56, 66, 26, 1)}
      {bloom(98, 96, 20, 2)}
      {bloom(132, 118, 18, 3)}
      {bloom(45, 130, 16, 2)}
    </Svg>
  );
}

export function PagodaSilhouette({ width = 210, height = 130, opacity = 0.9, color = '#FFFFFF' }) {
  // A small monastery complex — a tall central pagoda flanked by two lower
  // buildings, matching the reference's wider bottom-right architectural motif.
  return (
    <Svg width={width} height={height} viewBox="0 0 210 130">
      <G opacity={opacity} stroke={color} strokeWidth={1.1} fill="none">
        {/* Left low building */}
        <Path d="M0 130 L0 95 L28 95 L28 130 Z" />
        <Path d="M-4 95 L32 95 L26 84 L2 84 Z" />
        <Path d="M8 108 L14 108 L14 118 L8 118 Z" />
        <Path d="M18 108 L24 108 L24 118 L18 118 Z" />

        {/* Central tall pagoda */}
        <Path d="M85 20 L93 34 L77 34 Z" />
        <Path d="M68 34 L102 34 L109 44 L61 44 Z" />
        <Path d="M74 44 L96 44 L96 66 L74 66 Z" />
        <Path d="M80 50 L90 50 L90 60 L80 60 Z" fill={color} fillOpacity={0.15} />
        <Path d="M58 66 L112 66 L120 78 L50 78 Z" />
        <Path d="M65 78 L105 78 L105 130 L65 130 Z" />
        <Path d="M78 130 L78 110 L92 110 L92 130" />
        <Path d="M70 90 L78 90 L78 100 L70 100 Z" />
        <Path d="M92 90 L100 90 L100 100 L92 100 Z" />

        {/* Right low building */}
        <Path d="M150 130 L150 100 L182 100 L182 130 Z" />
        <Path d="M146 100 L186 100 L179 88 L153 88 Z" />
        <Path d="M158 112 L165 112 L165 123 L158 123 Z" />
        <Path d="M168 112 L175 112 L175 123 L168 123 Z" />

        {/* Boundary wall linking the buildings */}
        <Path d="M28 122 L65 122" />
        <Path d="M105 122 L150 122" />
      </G>
    </Svg>
  );
}
