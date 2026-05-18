import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Screen, theme } from '@mgf/ui';
import { analytics } from '@mgf/analytics';
import { NOADS_ENTITLEMENT, iap, type Product } from '@mgf/monetization';

export const NOADS_PRODUCT_ID = process.env.EXPO_PUBLIC_NOADS_PRODUCT_ID ?? 'com.mgf.no_ads';

export function SettingsScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [entitled, setEntitled] = useState(iap().isEntitled(NOADS_ENTITLEMENT));

  useEffect(() => {
    let live = true;
    iap()
      .getProducts()
      .then((ps) => {
        if (live) setProducts(ps);
      });
    return () => {
      live = false;
    };
  }, []);

  const refreshEntitled = useCallback(() => setEntitled(iap().isEntitled(NOADS_ENTITLEMENT)), []);

  const buy = useCallback(async () => {
    setBusy('buy');
    analytics().track('iap_purchase_started', { productId: NOADS_PRODUCT_ID });
    try {
      const result = await iap().purchase(NOADS_PRODUCT_ID);
      analytics().track(result.purchased ? 'iap_purchase_completed' : 'iap_purchase_cancelled', {
        productId: NOADS_PRODUCT_ID,
      });
      refreshEntitled();
      if (!result.purchased) {
        Alert.alert('Purchase not completed', 'No charge was made. Try again any time.');
      }
    } finally {
      setBusy(null);
    }
  }, [refreshEntitled]);

  const restore = useCallback(async () => {
    setBusy('restore');
    analytics().track('iap_restore_started');
    try {
      await iap().restore();
      refreshEntitled();
      Alert.alert(
        'Purchases restored',
        iap().isEntitled(NOADS_ENTITLEMENT) ? 'Ads are off.' : 'Nothing to restore.',
      );
    } finally {
      setBusy(null);
    }
  }, [refreshEntitled]);

  const noadsProduct = products?.find((p) => p.id === NOADS_PRODUCT_ID);
  const priceLabel = noadsProduct?.priceString ? ` — ${noadsProduct.priceString}` : '';
  const buyLabel = busy === 'buy' ? 'Loading…' : `Remove ads${priceLabel}`;
  const restoreLabel = busy === 'restore' ? 'Restoring…' : 'Restore purchases';
  const iapConfigured = products !== null && products.length > 0;

  return (
    <Screen>
      <Text style={styles.h1}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.h2}>Remove ads</Text>
        {entitled ? (
          <Text style={styles.good}>✓ Ads removed. Thanks for your support.</Text>
        ) : (
          <>
            <Text style={styles.body}>
              {iapConfigured
                ? 'Pay once to skip the rewarded-ad prompt and continue runs instantly.'
                : 'In-app purchases are not configured in this build.'}
            </Text>
            <Button label={buyLabel} onPress={buy} disabled={busy !== null || !iapConfigured} />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Restore</Text>
        <Text style={styles.body}>Already paid on another device or after reinstalling? Tap to restore.</Text>
        <Button label={restoreLabel} variant="ghost" onPress={restore} disabled={busy !== null} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { color: theme.text, fontSize: 26, fontWeight: '800', paddingBottom: 12 },
  h2: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  body: { color: theme.mute, marginBottom: 10 },
  good: { color: theme.good, fontWeight: '700' },
  section: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, marginBottom: 12 },
});
