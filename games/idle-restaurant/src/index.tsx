import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Hud, theme } from '@mgf/ui';
import { useGameLoop, type GameModule } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';

const meta = {
  id: 'idle-restaurant' as const,
  title: 'Idle Restaurant',
  blurb: 'Cook, earn, hire. Watch it grow.',
  emoji: '🍳',
};

type Upgrade = { name: string; cost: number; cps: number; owned: number; growth: number };

const INITIAL_UPGRADES: Upgrade[] = [
  { name: 'Line cook', cost: 25, cps: 1, owned: 0, growth: 1.15 },
  { name: 'Sous chef', cost: 250, cps: 8, owned: 0, growth: 1.17 },
  { name: 'Chef', cost: 2000, cps: 50, owned: 0, growth: 1.2 },
  { name: 'Franchise', cost: 20000, cps: 350, owned: 0, growth: 1.22 },
];

function fmt(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1_000_000) return (n / 1000).toFixed(1) + 'k';
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  return (n / 1_000_000_000).toFixed(2) + 'B';
}

function Game() {
  const [coins, setCoins] = useState(0);
  const [perTap, setPerTap] = useState(1);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => INITIAL_UPGRADES.map((u) => ({ ...u })));
  const cpsRef = useRef(0);

  useGameLoop(
    (dt) => {
      if (cpsRef.current <= 0) return;
      setCoins((c) => c + cpsRef.current * dt);
    },
    { running: true, fps: 10 },
  );

  const cook = () => setCoins((c) => c + perTap);

  const buy = useCallback(
    (i: number) => {
      setUpgrades((curr) => {
        const u = curr[i]!;
        if (coins < u.cost) return curr;
        setCoins((c) => c - u.cost);
        const owned = u.owned + 1;
        const cost = Math.floor(u.cost * u.growth);
        const next = curr.slice();
        next[i] = { ...u, owned, cost };
        cpsRef.current = next.reduce((sum, x) => sum + x.cps * x.owned, 0);
        analytics().track('upgrade_buy', { id: meta.id, name: u.name, owned });
        return next;
      });
    },
    [coins],
  );

  const buyTap = () => {
    const cost = perTap * 10;
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setPerTap((p) => p + 1);
    analytics().track('upgrade_tap', { id: meta.id, perTap: perTap + 1 });
  };

  return (
    <View style={{ flex: 1 }}>
      <Hud left={`$${fmt(coins)}`} right={`+${fmt(cpsRef.current)}/s`} />
      <View style={styles.stage}>
        <Text style={styles.emoji}>🍔</Text>
        <Text style={styles.tap}>+{perTap} per tap</Text>
      </View>
      <Button label="Cook" onPress={cook} />
      <View style={{ height: 12 }} />
      <View style={styles.upgrades}>
        <Text style={styles.h2}>Upgrades</Text>
        <UpgradeRow label={`Faster hands (+1/tap)`} cost={perTap * 10} canBuy={coins >= perTap * 10} onBuy={buyTap} />
        {upgrades.map((u, i) => (
          <UpgradeRow
            key={u.name}
            label={`${u.name} ×${u.owned} (+${u.cps}/s)`}
            cost={u.cost}
            canBuy={coins >= u.cost}
            onBuy={() => buy(i)}
          />
        ))}
      </View>
    </View>
  );
}

function UpgradeRow({
  label,
  cost,
  canBuy,
  onBuy,
}: {
  label: string;
  cost: number;
  canBuy: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={styles.urow}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text }}>{label}</Text>
        <Text style={{ color: theme.mute, fontSize: 12 }}>${fmt(cost)}</Text>
      </View>
      <Button label="Buy" variant={canBuy ? 'primary' : 'ghost'} onPress={onBuy} disabled={!canBuy} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 180,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emoji: { fontSize: 80 },
  tap: { color: theme.mute, marginTop: 6 },
  upgrades: { gap: 10, marginTop: 14 },
  h2: { color: theme.text, fontSize: 16, fontWeight: '700' },
  urow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

const mod: GameModule = { meta, Screen: Game };
export default mod;
