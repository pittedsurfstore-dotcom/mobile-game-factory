import React, { useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '@mgf/ui';
import { feedback } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import { games, GameKey } from '../games';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const entries = (Object.keys(games) as GameKey[]).map((id) => ({ ...games[id].meta, id }));

// One stable colour per game so the card backgrounds form a recognisable
// rainbow grid rather than a wall of identical surfaces.
const CARD_TINTS: Record<GameKey, [string, string]> = {
  'block-puzzle': ['#1e3a8a', '#7cf8ff'],
  mahjong: ['#7c2d12', '#ffd34d'],
  'match-3': ['#831843', '#ff5572'],
  'idle-restaurant': ['#365314', '#7fdc7f'],
  'hill-climb': ['#1e293b', '#7cf8ff'],
  'endless-runner': ['#1e1b4b', '#c779ff'],
  'virtual-pet': ['#5b21b6', '#ffd34d'],
  ludo: ['#9d174d', '#7fdc7f'],
  'pool-lite': ['#064e3b', '#7cf8ff'],
};

export function HomeScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          hitSlop={12}
          onPress={() => {
            feedback().haptic('select');
            navigation.navigate('Settings');
          }}
        >
          <Text style={styles.gear}>⚙</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <LinearGradient colors={['#0b0d10', '#161a20', '#0b0d10']} style={styles.bg}>
      <View style={styles.root}>
        <Text style={styles.h1}>Pick a game</Text>
        <Text style={styles.sub}>Nine quick games, no signup.</Text>
        <FlatList
          data={entries}
          keyExtractor={(it) => it.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ gap: 14, paddingBottom: 32, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const tint = CARD_TINTS[item.id];
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => {
                  feedback().haptic('tap');
                  analytics().track('game_open', { id: item.id });
                  navigation.navigate('Game', { id: item.id });
                }}
              >
                <LinearGradient
                  colors={tint}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardBg}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.blurb} numberOfLines={2}>
                    {item.blurb}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  root: { flex: 1, paddingHorizontal: 14, paddingTop: 4 },
  h1: { color: theme.text, fontSize: 28, fontWeight: '800', paddingTop: 8 },
  sub: { color: theme.mute, fontSize: 13, paddingBottom: 14, paddingTop: 2 },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.15,
  },
  cardBg: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  emoji: { fontSize: 40 },
  title: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 8 },
  blurb: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  gear: { color: theme.text, fontSize: 22, paddingRight: 4 },
});
