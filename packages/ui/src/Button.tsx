import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from './theme';

type Variant = 'primary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[styles.label, variant === 'ghost' && { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: theme.accent },
  ghost: { backgroundColor: theme.surface },
  danger: { backgroundColor: theme.danger },
  label: { color: '#0b0d10', fontWeight: '700', fontSize: 16 },
});
