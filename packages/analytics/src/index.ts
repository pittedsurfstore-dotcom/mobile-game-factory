export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export interface Analytics {
  identify(userId: string, props?: AnalyticsProps): void;
  track(event: string, props?: AnalyticsProps): void;
  screen(name: string, props?: AnalyticsProps): void;
}

class NoopAnalytics implements Analytics {
  identify(userId: string, props?: AnalyticsProps) {
    if (__DEV__) console.log('[analytics] identify', userId, props);
  }
  track(event: string, props?: AnalyticsProps) {
    if (__DEV__) console.log('[analytics] track', event, props);
  }
  screen(name: string, props?: AnalyticsProps) {
    if (__DEV__) console.log('[analytics] screen', name, props);
  }
}

declare const __DEV__: boolean;

let impl: Analytics = new NoopAnalytics();

export function setAnalytics(a: Analytics) {
  impl = a;
}

export function analytics(): Analytics {
  return impl;
}
