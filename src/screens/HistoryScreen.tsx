import React from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { colors, spacing } from '../theme';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const { state, config } = useGame();
  const history = state.history ?? [];
  const players = config.players;

  function playerName(id: string): string {
    return players.find(p => p.id === id)?.name ?? id;
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>📜 History</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No history yet. Complete some chores!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>📜 History</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <View style={styles.entryLeft}>
              {item.monster ? (
                <>
                  <Text style={styles.entryIcon}>⚔️</Text>
                  <View>
                    <Text style={styles.entryTitle}>{playerName(item.playerId)} defeated {item.monster}</Text>
                    <Text style={styles.entryTime}>{formatTime(item.ts)}</Text>
                  </View>
                </>
              ) : item.rewardName ? (
                <>
                  <Text style={styles.entryIcon}>🎁</Text>
                  <View>
                    <Text style={styles.entryTitle}>{playerName(item.playerId)} redeemed {item.rewardName}</Text>
                    <Text style={styles.entryTime}>{formatTime(item.ts)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.entryIcon}>📋</Text>
                  <View>
                    <Text style={styles.entryTitle}>{playerName(item.playerId)} completed a chore</Text>
                    <Text style={styles.entryTime}>{formatTime(item.ts)}</Text>
                  </View>
                </>
              )}
            </View>
            {item.gold !== undefined && (
              <Text style={[styles.goldBadge, item.gold < 0 ? styles.goldNeg : styles.goldPos]}>
                {item.gold > 0 ? '+' : ''}{item.gold} 💰
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.gold, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  list: { padding: spacing.sm },
  entry: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  entryIcon: { fontSize: 20 },
  entryTitle: { color: colors.text, fontFamily: 'monospace', fontSize: 12 },
  entryTime: { color: colors.textDim, fontFamily: 'monospace', fontSize: 10 },
  goldBadge: { fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
  goldPos: { color: colors.gold },
  goldNeg: { color: colors.hp },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontFamily: 'monospace' },
});
