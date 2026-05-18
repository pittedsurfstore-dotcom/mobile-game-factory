import React, { useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, theme } from '@mgf/ui';
import { analytics } from '@mgf/analytics';
import { games, GameKey } from '../games';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const entries = (Object.keys(games) as GameKey[]).map((id) => ({ ...games[id].meta, id }));

export function HomeScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable hitSlop={12} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.gear}>⚙</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <Screen>
      <Text style={styles.h1}>Pick a game</Text>
      <FlatList
        data={entries}
        keyExtractor={(it) => it.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              analytics().track('game_open', { id: item.id });
              navigation.navigate('Game', { id: item.id });
            }}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.blurb} numberOfLines={2}>
              {item.blurb}
            </Text>
          </Pressable>
        )}
      />
      <View style={{ height: 8 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { color: theme.text, fontSize: 22, fontWeight: '700', paddingBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    padding: 14,
    gap: 6,
    minHeight: 130,
  },
  emoji: { fontSize: 30 },
  title: { color: theme.text, fontSize: 16, fontWeight: '700' },
  blurb: { color: theme.mute, fontSize: 12 },
  gear: { color: theme.text, fontSize: 22 },
});
