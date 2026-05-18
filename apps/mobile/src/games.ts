import type { GameModule } from '@mgf/game-core';
import blockPuzzle from '@mgf/block-puzzle';
import mahjong from '@mgf/mahjong';
import match3 from '@mgf/match-3';
import idleRestaurant from '@mgf/idle-restaurant';
import hillClimb from '@mgf/hill-climb';
import endlessRunner from '@mgf/endless-runner';
import virtualPet from '@mgf/virtual-pet';
import ludo from '@mgf/ludo';
import poolLite from '@mgf/pool-lite';

export const games = {
  'block-puzzle': blockPuzzle,
  mahjong,
  'match-3': match3,
  'idle-restaurant': idleRestaurant,
  'hill-climb': hillClimb,
  'endless-runner': endlessRunner,
  'virtual-pet': virtualPet,
  ludo,
  'pool-lite': poolLite,
} satisfies Record<string, GameModule>;

export type GameKey = keyof typeof games;
