import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStore } from '@mgf/game-core';
import { analytics } from '@mgf/analytics';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameHostScreen } from './src/screens/GameHostScreen';
import { games } from './src/games';

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
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0b0d10' }, headerTintColor: '#f5f5f5' }}>
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
