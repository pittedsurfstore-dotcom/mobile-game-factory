import type { Ads, AdSlot } from '@mgf/monetization';
import type * as Rn from 'react-native-google-mobile-ads';

type AdMobConfig = {
  rewardedUnitId?: string;
  interstitialUnitId?: string;
};

let cached: typeof Rn | null = null;
function lib(): typeof Rn {
  if (!cached) {
    // Lazy require so Expo Go can load the bundle when AdMob is not activated by env.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-google-mobile-ads') as typeof Rn;
  }
  return cached;
}

export function createAdMobAds(config: AdMobConfig = {}): Ads {
  const a = lib();
  void a.default().initialize();

  const rewardedUnit = config.rewardedUnitId ?? a.TestIds.REWARDED;
  const interstitialUnit = config.interstitialUnitId ?? a.TestIds.INTERSTITIAL;

  return {
    async show(slot: AdSlot) {
      if (slot === 'banner') return { shown: false };
      if (slot === 'rewarded') return showRewarded(rewardedUnit);
      return showInterstitial(interstitialUnit);
    },
  };
}

function showRewarded(unitId: string): Promise<{ shown: boolean; rewarded: boolean }> {
  const a = lib();
  return new Promise((resolve) => {
    const ad = a.RewardedAd.createForAdRequest(unitId);
    let earned = false;
    let done = false;
    const finish = (shown: boolean) => {
      if (done) return;
      done = true;
      resolve({ shown, rewarded: earned });
    };
    ad.addAdEventListener(a.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    ad.addAdEventListener(a.AdEventType.LOADED, () => {
      ad.show();
    });
    ad.addAdEventListener(a.AdEventType.CLOSED, () => finish(true));
    ad.addAdEventListener(a.AdEventType.ERROR, () => finish(false));
    ad.load();
  });
}

function showInterstitial(unitId: string): Promise<{ shown: boolean }> {
  const a = lib();
  return new Promise((resolve) => {
    const ad = a.InterstitialAd.createForAdRequest(unitId);
    let done = false;
    const finish = (shown: boolean) => {
      if (done) return;
      done = true;
      resolve({ shown });
    };
    ad.addAdEventListener(a.AdEventType.LOADED, () => {
      ad.show();
    });
    ad.addAdEventListener(a.AdEventType.CLOSED, () => finish(true));
    ad.addAdEventListener(a.AdEventType.ERROR, () => finish(false));
    ad.load();
  });
}
