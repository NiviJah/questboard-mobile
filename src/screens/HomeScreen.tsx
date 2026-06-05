import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGame } from '../context/GameContext';
import ChoreGrid from '../components/ChoreGrid';
import PlayerCard from '../components/PlayerCard';
import { colors, spacing } from '../theme';

type FreqTab = 'daily' | 'weekly' | 'monthly';

export default function HomeScreen() {
  const { config, currentPlayer, setCurrentPlayer, isOnline } = useGame();
  const [freqTab, setFreqTab] = useState<FreqTab>('daily');
  const players = config.players;
  const player = players[currentPlayer];

  if (players.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>⚔️ Questboard</Text>
          <Text style={styles.emptyText}>
            No players configured yet.{'\n'}Go to Settings to set up your family.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Online indicator */}
      <View style={[styles.onlineBadge, { backgroundColor: isOnline ? colors.success : colors.hp }]}>
        <Text style={styles.onlineText}>{isOnline ? '● Online' : '○ Offline'}</Text>
      </View>

      {/* Player tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerTabs}>
        {players.map((p, i) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.playerTab, currentPlayer === i && styles.playerTabActive]}
            onPress={() => setCurrentPlayer(i)}
          >
            <Text style={styles.playerTabText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView>
        {/* Player card */}
        {player && <PlayerCard player={player} />}

        {/* Freq tabs */}
        <View style={styles.freqTabs}>
          {(['daily', 'weekly', 'monthly'] as FreqTab[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.freqTab, freqTab === f && styles.freqTabActive]}
              onPress={() => setFreqTab(f)}
            >
              <Text style={[styles.freqTabText, freqTab === f && styles.freqTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chore grid */}
        {player && <ChoreGrid player={player} freq={freqTab} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  onlineText: { color: '#fff', fontSize: 10, fontFamily: 'monospace' },
  playerTabs: {
    flexGrow: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  playerTabActive: { borderBottomColor: colors.gold },
  playerTabText: { color: colors.text, fontFamily: 'monospace', fontSize: 13 },
  freqTabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  freqTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  freqTabActive: { backgroundColor: colors.card },
  freqTabText: { color: colors.textDim, fontFamily: 'monospace', fontSize: 12 },
  freqTabTextActive: { color: colors.gold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.gold, fontSize: 28, fontFamily: 'monospace', marginBottom: spacing.md },
  emptyText: {
    color: colors.textDim,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 22,
  },
});
