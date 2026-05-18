import PostHog from 'posthog-react-native';
import type { Analytics, AnalyticsProps } from '@mgf/analytics';

export function createPostHogAnalytics(apiKey: string, host = 'https://us.i.posthog.com'): Analytics {
  const client = new PostHog(apiKey, { host });

  return {
    identify(userId, props) {
      client.identify(userId, sanitize(props));
    },
    track(event, props) {
      client.capture(event, sanitize(props));
    },
    screen(name, props) {
      client.screen(name, sanitize(props));
    },
  };
}

type JsonScalar = string | number | boolean | null;

function sanitize(props: AnalyticsProps | undefined): Record<string, JsonScalar> | undefined {
  if (!props) return undefined;
  const out: Record<string, JsonScalar> = {};
  for (const k of Object.keys(props)) {
    const v = props[k];
    if (v != null) out[k] = v;
  }
  return out;
}
