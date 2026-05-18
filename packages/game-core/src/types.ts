import type { ComponentType } from 'react';

export type GameId =
  | 'block-puzzle'
  | 'mahjong'
  | 'match-3'
  | 'idle-restaurant'
  | 'hill-climb'
  | 'endless-runner'
  | 'virtual-pet'
  | 'ludo'
  | 'pool-lite';

export type GameMeta = {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
};

export type GameModule = {
  meta: GameMeta;
  Screen: ComponentType;
};

export type GameStatus = 'idle' | 'playing' | 'paused' | 'over';
