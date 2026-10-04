import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';

// Smooth press depth (scale) for tappable cards/rows/buttons. Drop-in for a
// plain `<Pressable style={({pressed}) => [...]}>` — `style` carries the
// full visual style (static + pressed-state) and is applied to the inner
// animated view; `outerStyle` is for layout-only props (e.g. flex: 1) that
// the Pressable wrapper itself needs to participate in a parent's layout.
export default function PressScale({ style, outerStyle, children, scaleTo = 0.97, onPress, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={outerStyle} {...rest}>
      {(state) => (
        <Animated.View style={[typeof style === 'function' ? style(state) : style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
