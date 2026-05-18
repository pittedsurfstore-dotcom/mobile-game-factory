import React, { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@mgf/ui';
import { analytics } from '@mgf/analytics';
import { games } from '../games';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameHostScreen({ route }: Props) {
  const mod = games[route.params.id];
  useEffect(() => {
    analytics().screen('game', { id: route.params.id });
  }, [route.params.id]);
  const Game = mod.Screen;
  return (
    <Screen>
      <Game />
    </Screen>
  );
}
