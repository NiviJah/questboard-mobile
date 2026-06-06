import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { colors, spacing } from '../theme';

interface Props {
  onSelected: (playerId: string) => void;
}

export default function PlayerSelectScreen({ onSelected }: Props) {
  const { config } = useGame();
  const players = config.players;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <Text style={styles.title}>⚔️ QUESTBOARD</Text>
        <Text style={styles.subtitle}>Who are you?</Text>

        <View style={styles.list}>
          {players.length === 0 ? (
            <Text style={styles.hint}>
              No players set up yet.{'\n'}Ask your household admin to add players in Settings.
            </Text>
          ) : (
            players.map(p => (
              <TouchableOpacity key={p.id} style={styles.playerBtn} onPress={() => onSelected(p.id)}>
                <Text style={styles.playerIcon}>{p.mode === 'kids' ? '👶' : '👤'}</Text>
                <View>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerMode}>{p.mode === 'kids' ? 'Kid' : 'Adult'} · {p.class}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.hint}>
          This device will remember your choice.{'\n'}
          You can switch players anytime in the app.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: {
    color: colors.gold,
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  list: { gap: spacing.sm, marginBottom: spacing.xl },
  playerBtn: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerIcon: { fontSize: 32 },
  playerName: { color: colors.text, fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },
  playerMode: { color: colors.textDim, fontFamily: 'monospace', fontSize: 12, marginTop: 2 },
  hint: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
});
