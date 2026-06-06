import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getServerUrl, setServerUrl, testConnection } from '../api/client';
import { useGame } from '../context/GameContext';
import { CLASSES } from '../game/data';
import { colors, spacing } from '../theme';

export default function SettingsScreen() {
  const { config, updateConfig, refreshFromServer, isOnline } = useGame();
  const [serverInput, setServerInput] = useState(getServerUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  async function handleTestAndSave() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(serverInput);
      setTestResult(result.ok);
      if (result.ok) {
        setServerUrl(serverInput.trim());
        try { await refreshFromServer(); } catch {}
        Alert.alert('Connected! ✅', 'Server URL saved.');
      } else {
        Alert.alert('Connection failed ❌', result.error);
      }
    } catch (e) {
      setTestResult(false);
      Alert.alert('Error', String(e));
    } finally {
      setTesting(false);
    }
  }

  function addPlayer() {
    const newPlayer = {
      id: `player_${Date.now()}`,
      name: `Player ${config.players.length + 1}`,
      mode: 'adults' as const,
      class: 'warrior',
    };
    updateConfig({ players: [...config.players, newPlayer] });
  }

  function updatePlayer(id: string, field: string, value: any) {
    updateConfig({
      players: config.players.map(p => p.id === id ? { ...p, [field]: value } : p),
    });
  }

  function removePlayer(id: string) {
    Alert.alert('Remove player?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
        updateConfig({ players: config.players.filter(p => p.id !== id) })
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <View style={[styles.onlineBadge, { backgroundColor: isOnline ? colors.success : colors.hp }]}>
          <Text style={styles.onlineText}>{isOnline ? '● Online' : '○ Offline'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Server section */}
        <Text style={styles.sectionTitle}>Server</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={serverInput}
            onChangeText={setServerInput}
            placeholder="192.168.1.x:8099"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.btn} onPress={handleTestAndSave} disabled={testing}>
            {testing ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={styles.btnText}>Test & Save</Text>
            )}
          </TouchableOpacity>
          {testResult === true && <Text style={styles.success}>✓ Connected!</Text>}
          {testResult === false && <Text style={styles.error}>✗ Connection failed</Text>}
        </View>

        {/* Players section */}
        <Text style={styles.sectionTitle}>Players</Text>
        {config.players.map(player => (
          <View key={player.id} style={styles.card}>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={player.name}
                onChangeText={v => updatePlayer(player.id, 'name', v)}
                placeholder="Player name"
                placeholderTextColor={colors.textDim}
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePlayer(player.id)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mode:</Text>
              <TouchableOpacity
                style={[styles.modeBtn, player.mode === 'adults' && styles.modeBtnActive]}
                onPress={() => updatePlayer(player.id, 'mode', 'adults')}
              >
                <Text style={styles.modeBtnText}>Adult</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, player.mode === 'kids' && styles.modeBtnActive]}
                onPress={() => updatePlayer(player.id, 'mode', 'kids')}
              >
                <Text style={styles.modeBtnText}>Kid</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.classRow}>
                {CLASSES.map(cls => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.classBtn, player.class === cls.id && styles.classBtnActive]}
                    onPress={() => updatePlayer(player.id, 'class', cls.id)}
                  >
                    <Text style={styles.classBtnText}>{cls.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
          <Text style={styles.addBtnText}>+ Add Player</Text>
        </TouchableOpacity>

        {/* Display options */}
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>CRT Overlay</Text>
            <Switch
              value={config.crtOverlay}
              onValueChange={v => updateConfig({ crtOverlay: v })}
              trackColor={{ true: colors.accent, false: colors.surface }}
            />
          </View>
        </View>

        {/* Sync button */}
        <TouchableOpacity style={styles.syncBtn} onPress={refreshFromServer}>
          <Text style={styles.syncBtnText}>↻ Sync from Server</Text>
        </TouchableOpacity>
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
  onlineBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  onlineText: { color: '#fff', fontSize: 10, fontFamily: 'monospace' },
  content: { padding: spacing.md, gap: spacing.sm },
  sectionTitle: {
    color: colors.gold,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  label: { color: colors.textDim, fontFamily: 'monospace', fontSize: 12 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: 'monospace',
    borderRadius: 4,
    padding: spacing.sm,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFlex: { flex: 1 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    padding: spacing.sm,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontFamily: 'monospace', fontSize: 13 },
  success: { color: colors.success, fontFamily: 'monospace', fontSize: 12 },
  error: { color: colors.hp, fontFamily: 'monospace', fontSize: 12 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  removeBtn: {
    backgroundColor: colors.hp,
    borderRadius: 4,
    padding: spacing.sm,
    width: 36,
    alignItems: 'center',
  },
  removeBtnText: { color: '#fff', fontFamily: 'monospace' },
  modeBtn: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: { borderColor: colors.gold, backgroundColor: colors.card },
  modeBtnText: { color: colors.text, fontFamily: 'monospace', fontSize: 12 },
  classRow: { flexDirection: 'row', gap: spacing.xs },
  classBtn: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classBtnActive: { borderColor: colors.gold },
  classBtnText: { color: colors.text, fontFamily: 'monospace', fontSize: 11 },
  addBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  addBtnText: { color: colors.accent, fontFamily: 'monospace', fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.info,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  syncBtnText: { color: colors.info, fontFamily: 'monospace', fontSize: 13 },
});
