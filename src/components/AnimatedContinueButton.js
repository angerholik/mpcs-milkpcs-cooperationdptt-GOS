import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Platform, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Recreates the classic "Learn More" hover button (codepen.io/kathykato/pen/rZRaNe):
// a small circle sits at the left of the pill; on hover/press it expands to fill
// the button, the icon slides right, and the label inverts color — all in 0.45s.
//
// Two color roles: `circleColor`/`activeTextColor` describe what the button looks
// like once the circle has expanded to fill it; `baseBg` (or `gradientColors`) and
// `baseTextColor` describe the resting state. Works either direction (light pill
// with dark fill, or dark pill with light fill).
const EASE = Easing.bezier(0.65, 0, 0.076, 1);

export default function AnimatedContinueButton({
  label = 'Save & Continue',
  icon = 'arrow-right',
  onPress,
  style,
  height = 56,
  radius = 28,
  fontSize = 13,
  baseBg = '#f3f8fa',
  gradientColors,
  baseTextColor = '#1b1b1d',
  circleColor = '#282936',
  activeTextColor = '#ffffff',
  iconColor = '#ffffff',
}) {
  const [width, setWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue) => {
    Animated.timing(anim, { toValue, duration: 450, easing: EASE, useNativeDriver: false }).start();
  };

  // The circle is always as tall as it is wide at rest (a true circle, not a
  // rounded square) — its diameter is derived from the button's own height so
  // it scales with `height` instead of a fixed constant. A huge borderRadius
  // (999) is used instead of trying to interpolate it: CSS/RN both clamp a
  // radius that exceeds half the box's own size, so the same value renders as
  // a full circle at rest and a stadium-pill once expanded — the same trick
  // the original CodePen uses with a single oversized border-radius.
  const circleSize = height - 12;
  const expandedWidth = Math.max(circleSize, width - 12);

  return (
    <Pressable
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      onHoverIn={Platform.OS === 'web' ? () => animateTo(1) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => animateTo(0) : undefined}
      onPress={onPress}
      style={[styles.btn, { height, borderRadius: radius, backgroundColor: baseBg, paddingHorizontal: 14 }, style]}
    >
      {gradientColors && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circle,
          {
            backgroundColor: circleColor,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: [circleSize, expandedWidth] }),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.iconWrap,
          { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) }] },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.text,
          {
            fontSize,
            color: anim.interpolate({ inputRange: [0, 1], outputRange: [baseTextColor, activeTextColor] }),
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 999,
  },
  iconWrap: {
    position: 'absolute',
    left: 17,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
