import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStore } from '@mgf/game-core';
import { analytics, setAnalytics } from '@mgf/analytics';
import { setAds } from '@mgf/monetization';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameHostScreen } from './src/screens/GameHostScreen';
import { games } from './src/games';
import { createPostHogAnalytics } from './src/analytics-posthog';
import { createAdMobAds } from './src/ads-admob';

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
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
