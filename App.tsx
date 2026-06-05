import React from 'react';
import { StatusBar } from 'react-native';
import { GameProvider } from './src/context/GameContext';
import Navigator from './src/navigation/Navigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <GameProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <Navigator />
    </GameProvider>
  );
}
