import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setFeedback, setStore } from '@mgf/game-core';
import { analytics, setAnalytics } from '@mgf/analytics';
import { setAds, setIAP } from '@mgf/monetization';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameHostScreen } from './src/screens/GameHostScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { games } from './src/games';
import { createPostHogAnalytics } from './src/analytics-posthog';
import { createAdMobAds } from './src/ads-admob';
import { createRevenueCatIAP } from './src/iap-revenuecat';
import { createDeviceFeedback } from './src/feedback-impl';

setFeedback(createDeviceFeedback());

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
if (POSTHOG_KEY) {
  setAnalytics(createPostHogAnalytics(POSTHOG_KEY, POSTHOG_HOST));
}

if (process.env.EXPO_PUBLIC_ADMOB_ENABLED === '1') {
  setAds(
    createAdMobAds({
      rewardedUnitId: process.env.EXPO_PUBLIC_ADMOB_REWARDED,
      interstitialUnitId: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL,
    }),
  );
}

const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
if (REVENUECAT_KEY) {
  const productList = (process.env.EXPO_PUBLIC_REVENUECAT_PRODUCTS ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  setIAP(createRevenueCatIAP(REVENUECAT_KEY, productList));
}

setStore({
  async get(k) {
    return AsyncStorage.getItem(k);
  },
  async set(k, v) {
    await AsyncStorage.setItem(k, v);
  },
  async remove(k) {
    await AsyncStorage.removeItem(k);
  },
});

export type RootStackParamList = {
  Home: undefined;
  Game: { id: keyof typeof games };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    analytics().screen('app_start');
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerStyle: { backgroundColor: '#0b0d10' }, headerTintColor: '#f5f5f5' }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Game Factory' }} />
          <Stack.Screen
            name="Game"
            component={GameHostScreen}
            options={({ route }) => ({ title: games[route.params.id].meta.title })}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
