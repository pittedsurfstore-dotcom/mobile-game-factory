import { createClient } from '@supabase/supabase-js';
import type { CloudHighScore, CloudHighScoreSubmission } from '@mgf/game-core';

/**
 * Expected Supabase table:
 *
 *   create table public.high_scores (
 *     id bigserial primary key,
 *     device_id text not null,
 *     game_id text not null,
 *     score integer not null,
 *     created_at timestamptz default now()
 *   );
 *   create index high_scores_game_score on public.high_scores (game_id, score desc);
 *
 *   -- Optional RLS for anon-only writes:
 *   alter table public.high_scores enable row level security;
 *   create policy "anon insert" on public.high_scores
 *     for insert to anon with check (true);
 *   create policy "anon read"   on public.high_scores
 *     for select to anon using (true);
 */

const TABLE = 'high_scores';

export function createSupabaseCloudHighScore(url: string, anonKey: string, deviceId: string): CloudHighScore {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async fetch(gameId: string): Promise<number | null> {
      const { data, error } = await client
        .from(TABLE)
        .select('score')
        .eq('game_id', gameId)
        .eq('device_id', deviceId)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        if (__DEV__) console.warn('[cloud-score] fetch failed', error.message);
        return null;
      }
      return data?.score ?? null;
    },

    async submit(submission: CloudHighScoreSubmission) {
      const { error } = await client.from(TABLE).insert({
        device_id: deviceId,
        game_id: submission.gameId,
        score: submission.score,
      });
      if (error && __DEV__) {
        console.warn('[cloud-score] submit failed', error.message);
      }
    },
  };
}

declare const __DEV__: boolean;
