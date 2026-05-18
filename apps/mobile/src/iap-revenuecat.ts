import type { IAP } from '@mgf/monetization';

type CustomerInfo = { entitlements: { active: Record<string, unknown> } };

type RnPurchases = {
  configure(options: { apiKey: string }): void;
  getCustomerInfo(): Promise<CustomerInfo>;
  getOfferings(): Promise<{
    all: Record<string, { availablePackages: { product: { identifier: string } }[] }>;
  }>;
  purchasePackage(pkg: { product: { identifier: string } }): Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases(): Promise<CustomerInfo>;
  addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): void;
};

let cached: RnPurchases | null = null;
function lib(): RnPurchases {
  if (!cached) {
    // Lazy require so Expo Go can still load the bundle when RevenueCat is not activated by env.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    cached = (mod.default ?? mod) as RnPurchases;
  }
  return cached;
}

export function createRevenueCatIAP(apiKey: string, productIds: readonly string[] = []): IAP {
  const Purchases = lib();
  let entitlements: Set<string> = new Set();

  Purchases.configure({ apiKey });

  Purchases.addCustomerInfoUpdateListener((info) => {
    entitlements = new Set(Object.keys(info.entitlements.active));
  });

  void (async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      entitlements = new Set(Object.keys(info.entitlements.active));
    } catch (err) {
      if (__DEV__) console.warn('[iap] initial getCustomerInfo failed', err);
    }
  })();

  return {
    productIds() {
      return productIds;
    },
    async purchase(productId: string) {
      try {
        const offerings = await Purchases.getOfferings();
        const pkg = Object.values(offerings.all)
          .flatMap((o) => o.availablePackages)
          .find((p) => p.product.identifier === productId);
        if (!pkg) return { purchased: false };
        const result = await Purchases.purchasePackage(pkg);
        entitlements = new Set(Object.keys(result.customerInfo.entitlements.active));
        return { purchased: true };
      } catch (err) {
        if (__DEV__) console.warn('[iap] purchase failed', err);
        return { purchased: false };
      }
    },
    async restore() {
      const info = await Purchases.restorePurchases();
      entitlements = new Set(Object.keys(info.entitlements.active));
    },
    isEntitled(entitlement: string) {
      return entitlements.has(entitlement);
    },
  };
}

declare const __DEV__: boolean;
