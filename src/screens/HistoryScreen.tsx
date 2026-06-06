import React from 'react';
import {
  SafeAreaView,
  ScrollView,
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>📜 History</Text>
      </View>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No history yet. Complete some chores!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {history.map((item, i) => {
            const pid = item?.playerId ?? '';
            const ts = item?.ts ?? 0;
            const gold = item?.gold;
            const xp = item?.xp;
            const monster = item?.monster;
            const rewardName = item?.rewardName;
            const choreName = item?.choreName;

            let icon = '📋';
            let title = `${playerName(pid)} — ${choreName ?? 'Chore'}`;
            if (monster) {
              icon = '⚔️';
              title = `${playerName(pid)} defeated ${monster}`;
            } else if (rewardName) {
              icon = '🎁';
              title = `${playerName(pid)} redeemed ${rewardName}`;
            }

            return (
              <View key={i} style={styles.entry}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryIcon}>{icon}</Text>
                  <View style={styles.entryTextCol}>
                    <Text style={styles.entryTitle}>{title}</Text>
                    <Text style={styles.entryTime}>{ts ? formatTime(ts) : ''}</Text>
                  </View>
                </View>
                {gold !== undefined && gold !== 0 && (
                  <Text style={[styles.badge, gold < 0 ? styles.goldNeg : styles.goldPos]}>
                    {gold > 0 ? '+' : ''}{gold} 💰
                  </Text>
                )}
                {xp !== undefined && gold === undefined && (
                  <Text style={[styles.badge, styles.xpColor]}>+{xp} XP</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
  entryTextCol: { flex: 1 },
  entryTitle: { color: colors.text, fontFamily: 'monospace', fontSize: 12 },
  entryTime: { color: colors.textDim, fontFamily: 'monospace', fontSize: 10 },
  badge: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginLeft: spacing.xs },
  goldPos: { color: colors.gold },
  goldNeg: { color: colors.hp },
  xpColor: { color: (colors as any).info ?? colors.accent },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontFamily: 'monospace' },
});
