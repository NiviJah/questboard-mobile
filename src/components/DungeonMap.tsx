import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGame, type Player } from '../context/GameContext';
import { dungeonMoveResult, GRID_H, GRID_W, initDungeonMap, luckForLevel, getLevelFromXP, todayKey } from '../game/logic';
import { colors, spacing } from '../theme';

const TILE_PX = 14; // display size per tile in pixels

const TILE_COLORS: Record<string, string> = {
  floor: '#2a2a3e',
  wall: '#0a0a1a',
  stairs_down: '#9060ff',
  stairs_up: '#60a0ff',
  gold_s: '#c0a000',
  gold_l: '#f0c040',
  chest: '#d08000',
  locked_chest: '#a06000',
  trap: '#e04040',
  monster: '#c03030',
  key: '#80e080',
};

const TILE_ICONS: Record<string, string> = {
  stairs_down: '▼',
  stairs_up: '▲',
  gold_s: '$',
  gold_l: '$',
  chest: 'C',
  locked_chest: 'L',
  trap: '!',
  monster: 'M',
  key: 'K',
};

interface Props {
  player: Player;
}

export default function DungeonMap({ player }: Props) {
  const { state, fightDungeonMonster } = useGame();
  const xp = state.xp[player.id] ?? 0;
  const { level } = getLevelFromXP(xp);
  const luck = luckForLevel(level);
  const tKey = todayKey();

  // Initialize dungeon map for player if needed
  const storedMap = state.dungeonMaps?.[player.id];
  const [localMap, setLocalMap] = useState(() => {
    if (storedMap?.dayKey === tKey) return storedMap;
    return initDungeonMap(tKey);
  });

  const map = localMap;
  const [px, py] = map.pos;
  const explored = new Set(map.explored);

  function move(dx: number, dy: number) {
    if (map.activeMonster && (map.activeMonster.currentHP ?? 0) > 0) return;
    if (map.pendingMoves <= 0) return;
    const result = dungeonMoveResult(map, dx, dy, tKey, player.mode, luck);
    if (result) setLocalMap(result.newMap);
  }

  function attackMonster() {
    if (!map.activeMonster) return;
    fightDungeonMonster(player.id, 3);
    setLocalMap(prev => ({
      ...prev,
      activeMonster: prev.activeMonster
        ? { ...prev.activeMonster, currentHP: Math.max(0, (prev.activeMonster.currentHP ?? 0) - 3) }
        : null,
    }));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Floor {map.floor ?? 1} | Moves: {map.pendingMoves}
          {map.hasKey ? ' 🗝️' : ''}
        </Text>
      </View>

      {/* Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            {Array.from({ length: GRID_H }, (_, gy) => (
              <View key={gy} style={styles.row}>
                {Array.from({ length: GRID_W }, (_, gx) => {
                  const coordKey = `${gx},${gy}`;
                  const isExplored = explored.has(coordKey);
                  const isPlayer = gx === px && gy === py;
                  const tile = map.grid?.[gy]?.[gx] ?? 'wall';
                  const bg = isExplored ? TILE_COLORS[tile] ?? '#1a1a2e' : '#050510';
                  const icon = TILE_ICONS[tile];

                  return (
                    <View
                      key={gx}
                      style={[
                        styles.tile,
                        { backgroundColor: bg, width: TILE_PX, height: TILE_PX },
                      ]}
                    >
                      {isPlayer && (
                        <Text style={{ fontSize: TILE_PX - 2, lineHeight: TILE_PX }}>@</Text>
                      )}
                      {!isPlayer && isExplored && icon && (
                        <Text style={{ fontSize: TILE_PX - 4, lineHeight: TILE_PX, color: '#fff' }}>
                          {icon}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Active monster */}
      {map.activeMonster && (map.activeMonster.currentHP ?? 0) > 0 && (
        <View style={styles.monsterBattle}>
          <Text style={styles.monsterBattleText}>
            ⚔️ {map.activeMonster.name} — {map.activeMonster.currentHP}/{map.activeMonster.maxHP} HP
          </Text>
          <TouchableOpacity style={styles.attackBtn} onPress={attackMonster}>
            <Text style={styles.attackBtnText}>ATTACK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* D-pad */}
      {map.pendingMoves > 0 && !(map.activeMonster && (map.activeMonster.currentHP ?? 0) > 0) && (
        <View style={styles.dpad}>
          <View style={styles.dpadRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => move(0, -1)}>
              <Text style={styles.dpadText}>▲</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dpadRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => move(-1, 0)}>
              <Text style={styles.dpadText}>◀</Text>
            </TouchableOpacity>
            <View style={[styles.dpadBtn, { backgroundColor: 'transparent' }]} />
            <TouchableOpacity style={styles.dpadBtn} onPress={() => move(1, 0)}>
              <Text style={styles.dpadText}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dpadRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => move(0, 1)}>
              <Text style={styles.dpadText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {map.pendingMoves <= 0 && (
        <Text style={styles.noMovesText}>
          Complete chores to earn dungeon moves!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.sm, backgroundColor: colors.surface },
  headerText: { color: colors.gold, fontFamily: 'monospace', fontSize: 12 },
  row: { flexDirection: 'row' },
  tile: { borderWidth: 0.5, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  monsterBattle: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monsterBattleText: { color: colors.hp, fontFamily: 'monospace', fontSize: 13 },
  attackBtn: {
    backgroundColor: colors.hp,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 4,
  },
  attackBtnText: { color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' },
  dpad: { alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface },
  dpadRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  dpadBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dpadText: { color: colors.text, fontSize: 18 },
  noMovesText: {
    color: colors.textDim,
    fontFamily: 'monospace',
    textAlign: 'center',
    padding: spacing.md,
    fontSize: 12,
  },
});
