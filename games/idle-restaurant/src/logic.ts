export type Upgrade = {
  name: string;
  cost: number;
  cps: number;
  owned: number;
  growth: number;
};

export const INITIAL_UPGRADES: Upgrade[] = [
  { name: 'Line cook', cost: 25, cps: 1, owned: 0, growth: 1.15 },
  { name: 'Sous chef', cost: 250, cps: 8, owned: 0, growth: 1.17 },
  { name: 'Chef', cost: 2000, cps: 50, owned: 0, growth: 1.2 },
  { name: 'Franchise', cost: 20000, cps: 350, owned: 0, growth: 1.22 },
];

export function fmt(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1_000_000) return (n / 1000).toFixed(1) + 'k';
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  return (n / 1_000_000_000).toFixed(2) + 'B';
}

export function totalCps(upgrades: readonly Upgrade[]): number {
  return upgrades.reduce((sum, u) => sum + u.cps * u.owned, 0);
}
