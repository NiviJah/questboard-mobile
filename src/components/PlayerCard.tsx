import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGame, type Player } from '../context/GameContext';
import { getLevelFromXP } from '../game/logic';
import { colors, spacing } from '../theme';
import MonsterSprite from './MonsterSprite';

interface Props {
  player: Player;
}

export default function PlayerCard({ player }: Props) {
  const { state, getMonster } = useGame();
  const xp = state.xp[player.id] ?? 0;
  const gold = state.gold[player.id] ?? 0;
  const streak = state.streaks[player.id] ?? 0;
  const { level, xpInLevel, xpNeeded } = getLevelFromXP(xp);
  const monster = getMonster(player);
  const maxHP = monster?.maxHP ?? 10;
  const currentDmg = state.monsterDamage[player.id] ?? 0;
  const currentHP = Math.max(0, maxHP - currentDmg);
  const hpPercent = currentHP / maxHP;
  const damageLog = state.damageLog[player.id] ?? [];

  const classEmojis: Record<string, string> = {
    warrior: '⚔️', mage: '🧙', witch: '🧹', rogue: '🗡️',
    paladin: '🛡️', ranger: '🏹', frost_knight: '❄️',
  };

  return (
    <View style={styles.card}>
      {/* Header: hero info */}
      <View style={styles.header}>
        <Text style={styles.heroEmoji}>{classEmojis[player.class] ?? '⚔️'}</Text>
        <View style={styles.heroInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.levelText}>Lv.{level} {player.class}</Text>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${(xpInLevel / xpNeeded) * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>{xpInLevel}/{xpNeeded} XP</Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.goldText}>💰 {gold}</Text>
          {streak > 0 && <Text style={styles.streakText}>🔥 {streak}</Text>}
        </View>
      </View>

      {/* Monster section */}
      {monster && (
        <View style={styles.monsterSection}>
          <View style={styles.monsterRow}>
            <MonsterSprite monsterId={monster.id} displaySize={64} />
            <View style={styles.monsterInfo}>
              <Text style={styles.monsterName}>{monster.name}</Text>
              <Text style={styles.monsterReward}>💰 +{monster.gold} gold on kill</Text>
              <View style={styles.hpBarBg}>
                <View
                  style={[
                    styles.hpBarFill,
                    {
                      width: `${hpPercent * 100}%`,
                      backgroundColor: hpPercent > 0.5 ? colors.hp : colors.warning,
                    },
                  ]}
                />
              </View>
              <Text style={styles.hpText}>{currentHP}/{maxHP} HP</Text>
            </View>
          </View>

          {/* Damage log */}
          {damageLog.length > 0 && (
            <View style={styles.damageLog}>
              {damageLog.map((entry, i) => (
                <Text key={i} style={[styles.damageEntry, { opacity: 1 - i * 0.3 }]}>
                  {entry}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroEmoji: { fontSize: 36 },
  heroInfo: { flex: 1 },
  playerName: {
    color: colors.gold,
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  levelText: { color: colors.textDim, fontSize: 11, fontFamily: 'monospace' },
  xpBarBg: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginTop: 4,
  },
  xpBarFill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  xpText: { color: colors.textDim, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  statsBadge: { alignItems: 'flex-end', gap: 2 },
  goldText: { color: colors.gold, fontSize: 14, fontFamily: 'monospace' },
  streakText: { color: colors.accent, fontSize: 12, fontFamily: 'monospace' },
  monsterSection: { marginTop: spacing.md },
  monsterRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  monsterInfo: { flex: 1 },
  monsterName: { color: colors.text, fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold' },
  monsterReward: { color: colors.textDim, fontSize: 11, fontFamily: 'monospace', marginBottom: 4 },
  hpBarBg: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpBarFill: { height: 8, borderRadius: 4 },
  hpText: { color: colors.text, fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  damageLog: { marginTop: spacing.sm },
  damageEntry: { color: colors.hp, fontSize: 11, fontFamily: 'monospace' },
});
