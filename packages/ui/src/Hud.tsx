import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

export function Hud({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        {typeof left === 'string' ? <Text style={styles.txt}>{left}</Text> : left}
      </View>
      {right ? (
        <View style={styles.cell}>
          {typeof right === 'string' ? <Text style={styles.txt}>{right}</Text> : right}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  cell: {
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius,
  },
  txt: { color: theme.text, fontVariant: ['tabular-nums'], fontWeight: '600' },
});
