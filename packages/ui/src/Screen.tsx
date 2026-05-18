import React from 'react';
import { SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from './theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.root, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  root: { flex: 1, padding: theme.pad },
});
