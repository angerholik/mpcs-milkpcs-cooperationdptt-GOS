import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Platform, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Recreates the classic "Learn More" hover button (codepen.io/kathykato/pen/rZRaNe):
// a small dark circle sits at the left of a light pill; on hover/press it expands
// to fill the button, the arrow slides right, and the label inverts to white.
const EASE = Easing.bezier(0.65, 0, 0.076, 1);
const CIRCLE = 44;

export default function AnimatedContinueButton({ label = 'Save & Continue', onPress, style }) {
  const [width, setWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue) => {
    Animated.timing(anim, { toValue, duration: 450, easing: EASE, useNativeDriver: false }).start();
  };

  const expandedWidth = Math.max(CIRCLE, width - 12);

  return (
    <Pressable
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      onHoverIn={Platform.OS === 'web' ? () => animateTo(1) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => animateTo(0) : undefined}
      onPress={onPress}
      style={[styles.btn, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circle,
          { width: anim.interpolate({ inputRange: [0, 1], outputRange: [CIRCLE, expandedWidth] }) },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.iconWrap,
          { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) }] },
        ]}
      >
        <MaterialCommunityIcons name="arrow-right" size={18} color="#ffffff" />
      </Animated.View>
      <Animated.Text
        style={[
          styles.text,
          { color: anim.interpolate({ inputRange: [0, 1], outputRange: ['#1b1b1d', '#ffffff'] }) },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e4ed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 22,
    backgroundColor: '#282936',
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
