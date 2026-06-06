import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import DungeonScreen from '../screens/DungeonScreen';
import RewardsScreen from '../screens/RewardsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import JoinScreen from '../screens/JoinScreen';
import PlayerSelectScreen from '../screens/PlayerSelectScreen';
import { getBoundPlayerId, getServerUrl, setBoundPlayerId } from '../api/client';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏰',
    Dungeon: '⚔️',
    Rewards: '🎁',
    History: '📜',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[name] ?? '?'}
    </Text>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontFamily: colors.pixel, fontSize: 10 },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dungeon" component={DungeonScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function Navigator() {
  const [joined, setJoined] = useState(() => !!getServerUrl());
  const [boundPlayerId, setBound] = useState(() => getBoundPlayerId());

  if (!joined) {
    return <JoinScreen onJoined={() => setJoined(true)} />;
  }

  if (!boundPlayerId) {
    return (
      <PlayerSelectScreen
        onSelected={(id) => {
          setBoundPlayerId(id);
          setBound(id);
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
