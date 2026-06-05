import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGame, type Player } from '../context/GameContext';
import { isChoreDoneForPlayer } from '../game/logic';
import { colors, spacing } from '../theme';

interface Props {
  player: Player;
  freq: 'daily' | 'weekly' | 'monthly';
}

export default function ChoreGrid({ player, freq }: Props) {
  const { state, completeChore, getActiveChores } = useGame();
  const chores = getActiveChores(player, freq);
  const doneStore =
    freq === 'daily'
      ? state.dailyDone
      : freq === 'weekly'
      ? state.weeklyDone
      : state.monthlyDone;

  if (chores.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No {freq} chores today</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {chores.map(chore => {
        const done = isChoreDoneForPlayer(doneStore, chore, player.id);
        return (
          <TouchableOpacity
            key={`${chore.id}:${player.id}`}
            style={[styles.card, done && styles.cardDone]}
            onPress={() => !done && completeChore(chore.id, freq)}
            activeOpacity={done ? 1 : 0.7}
          >
            <Text style={[styles.icon, done && styles.textDone]}>{chore.icon}</Text>
            <Text style={[styles.name, done && styles.textDone]} numberOfLines={2}>
              {chore.name}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.pts}>+{chore.pts}</Text>
              <Text style={styles.mode}>{chore.mode === 'party' ? '👥' : '👤'}</Text>
              {done && <Text style={styles.check}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.sm,
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'space-between',
  },
  cardDone: {
    opacity: 0.5,
    borderColor: colors.success,
    borderWidth: 1,
  },
  icon: { fontSize: 24 },
  name: {
    color: colors.text,
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 4,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.textDim,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pts: { color: colors.gold, fontSize: 11, fontFamily: 'monospace' },
  mode: { fontSize: 10 },
  check: { color: colors.success, fontSize: 12 },
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textDim, fontFamily: 'monospace' },
});
