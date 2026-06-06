import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { colors, spacing } from '../theme';

export default function RewardsScreen() {
  const { config, state, currentPlayer, setCurrentPlayer, redeemReward, getPlayerRewards } = useGame();
  const players = config.players;
  const player = players[currentPlayer];
  const [tab, setTab] = useState<'kids' | 'adults' | 'all'>('all');

  if (!player) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Set up players in Settings first</Text>
        </View>
      </SafeAreaView>
    );
  }

  const gold = state.gold[player.id] ?? 0;
  const rewards = getPlayerRewards(player).filter(r => tab === 'all' || r.who === tab || r.who === 'all');

  function handleRedeem(reward: any) {
    if (gold < reward.cost) {
      Alert.alert('Not enough gold', `You need ${reward.cost - gold} more gold!`);
      return;
    }
    Alert.alert(
      `Redeem "${reward.name}"?`,
      `Cost: ${reward.cost} 💰\n${reward.desc}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Redeem!', onPress: () => redeemReward(reward.id, player.id) },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Rewards</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {gold}</Text>
        </View>
      </View>

      {/* Player tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerTabs} contentContainerStyle={styles.playerTabsContent}>
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

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'kids', 'adults'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, tab === f && styles.filterTabActive]}
            onPress={() => setTab(f)}
          >
            <Text style={[styles.filterText, tab === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'kids' ? '👶 Kids' : '👨 Adults'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {rewards.map(reward => {
          const canAfford = gold >= reward.cost;
          return (
            <TouchableOpacity
              key={reward.id}
              style={[styles.card, !canAfford && styles.cardGrayed]}
              onPress={() => handleRedeem(reward)}
            >
              <Text style={styles.rewardIcon}>{reward.icon}</Text>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardDesc} numberOfLines={2}>{reward.desc}</Text>
              <View style={styles.costRow}>
                <Text style={[styles.costText, !canAfford && styles.costTextGrayed]}>
                  💰 {reward.cost}
                </Text>
                {!canAfford && (
                  <Text style={styles.needText}>Need {reward.cost - gold} more</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.gold, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
  goldBadge: { backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  goldText: { color: colors.gold, fontFamily: 'monospace', fontSize: 14 },
  playerTabs: { flexGrow: 0, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  playerTabsContent: { paddingHorizontal: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.gold },
  tabText: { color: colors.text, fontFamily: 'monospace', fontSize: 12 },
  filterRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  filterTabActive: { backgroundColor: colors.card },
  filterText: { color: colors.textDim, fontFamily: 'monospace', fontSize: 12 },
  filterTextActive: { color: colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm, gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardGrayed: { opacity: 0.6 },
  rewardIcon: { fontSize: 28, marginBottom: spacing.xs },
  rewardName: { color: colors.gold, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  rewardDesc: { color: colors.textDim, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', marginTop: 4 },
  costRow: { marginTop: spacing.sm, alignItems: 'center' },
  costText: { color: colors.gold, fontFamily: 'monospace', fontSize: 13 },
  costTextGrayed: { color: colors.textDim },
  needText: { color: colors.hp, fontFamily: 'monospace', fontSize: 9, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontFamily: 'monospace' },
});
