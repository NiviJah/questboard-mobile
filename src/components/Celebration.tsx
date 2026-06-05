import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  message: string;
  visible: boolean;
  onHide?: () => void;
}

export default function Celebration({ message, visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(1);
    translateY.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(800),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onHide?.());
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  text: {
    color: colors.gold,
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    backgroundColor: colors.overlay,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
