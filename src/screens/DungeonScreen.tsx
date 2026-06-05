import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';
import DungeonMap from '../components/DungeonMap';
import { colors, spacing } from '../theme';

export default function DungeonScreen() {
  const { config, currentPlayer, setCurrentPlayer } = useGame();
  const players = config.players;
  const player = players[currentPlayer];

  if (players.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Set up players in Settings first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ Dungeon</Text>
      </View>

      {/* Player selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerTabs}>
        {players.map((p, i) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.tab, currentPlayer === i && styles.tabActive]}
            onPress={() => setCurrentPlayer(i)}
          >
            <Text style={styles.tabText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {player && <DungeonMap player={player} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.gold, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  playerTabs: {
    flexGrow: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { color: colors.text, fontFamily: 'monospace', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontFamily: 'monospace' },
});
