export type AdSlot = 'banner' | 'interstitial' | 'rewarded';

export interface Ads {
  show(slot: AdSlot): Promise<{ shown: boolean; rewarded?: boolean }>;
}

export type Product = {
  id: string;
  priceString: string;
  title?: string;
};

/** Well-known entitlement identifier for the "remove ads" purchase. */
export const NOADS_ENTITLEMENT = 'no_ads';

export interface IAP {
  productIds(): readonly string[];
  getProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<{ purchased: boolean }>;
  restore(): Promise<void>;
  isEntitled(entitlement: string): boolean;
}

class NoopAds implements Ads {
  async show(slot: AdSlot) {
    if (__DEV__) console.log('[ads] show', slot);
    return { shown: false, rewarded: slot === 'rewarded' ? true : undefined };
  }
}

class NoopIAP implements IAP {
  productIds() {
    return [] as const;
  }
  async getProducts() {
    if (__DEV__) console.log('[iap] getProducts');
    return [];
  }
  async purchase(productId: string) {
    if (__DEV__) console.log('[iap] purchase', productId);
    return { purchased: false };
  }
  async restore() {
    if (__DEV__) console.log('[iap] restore');
  }
  isEntitled(entitlement: string) {
    if (__DEV__) console.log('[iap] isEntitled', entitlement);
    return false;
  }
}

declare const __DEV__: boolean;

let adsImpl: Ads = new NoopAds();
let iapImpl: IAP = new NoopIAP();

export function setAds(a: Ads) {
  adsImpl = a;
}
export function setIAP(i: IAP) {
  iapImpl = i;
}
export function ads(): Ads {
  return adsImpl;
}
export function iap(): IAP {
  return iapImpl;
}
