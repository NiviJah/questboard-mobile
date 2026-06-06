import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchHouseholdCode, getIsAdmin, getServerUrl, setServerUrl, testConnection } from '../api/client';
import { useGame } from '../context/GameContext';
import { CLASSES } from '../game/data';
import { colors, spacing } from '../theme';

type EditTarget = { type: 'chore' | 'reward'; item: any } | null;

export default function SettingsScreen() {
  const { config, updateConfig, refreshFromServer, isOnline } = useGame();
  const [serverInput, setServerInput] = useState(getServerUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const isAdmin = getIsAdmin();

  // Admin edit modal state
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editPts, setEditPts] = useState('');
  const [editWho, setEditWho] = useState<'all' | 'kids' | 'adults'>('all');
  const [editFreq, setEditFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchHouseholdCode().then(setHouseholdCode).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOnline) fetchHouseholdCode().then(setHouseholdCode).catch(() => {});
  }, [isOnline]);

  function openEdit(type: 'chore' | 'reward', item: any) {
    setEditTarget({ type, item });
    setEditName(item.name ?? '');
    setEditIcon(item.icon ?? '⚔️');
    setEditPts(String(type === 'chore' ? (item.pts ?? 2) : (item.cost ?? 10)));
    setEditWho(item.who ?? 'all');
    setEditFreq(item.freq ?? 'daily');
    setEditDesc(item.desc ?? '');
  }

  function saveEdit() {
    if (!editTarget) return;
    if (editTarget.type === 'chore') {
      const updated = (config.chores ?? []).map((c: any) =>
        c.id === editTarget.item.id
          ? { ...c, name: editName, icon: editIcon, pts: parseInt(editPts) || c.pts, freq: editFreq, who: editWho }
          : c,
      );
      updateConfig({ chores: updated });
    } else {
      const updated = (config.rewards ?? []).map((r: any) =>
        r.id === editTarget.item.id
          ? { ...r, name: editName, icon: editIcon, cost: parseInt(editPts) || r.cost, desc: editDesc, who: editWho }
          : r,
      );
      updateConfig({ rewards: updated });
    }
    setEditTarget(null);
  }

  function deleteItem(type: 'chore' | 'reward', id: string) {
    Alert.alert('Delete?', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          if (type === 'chore') {
            updateConfig({ chores: (config.chores ?? []).filter((c: any) => c.id !== id) });
          } else {
            updateConfig({ rewards: (config.rewards ?? []).filter((r: any) => r.id !== id) });
          }
        },
      },
    ]);
  }

  function addChore() {
    const newChore = {
      id: `custom_${Date.now()}`,
      name: 'New Quest',
      icon: '⚔️',
      pts: 2,
      freq: 'daily',
      who: 'all',
      mode: 'party',
    };
    updateConfig({ chores: [...(config.chores ?? []), newChore] });
    openEdit('chore', newChore);
  }

  function addReward() {
    const newReward = {
      id: `custom_${Date.now()}`,
      name: 'New Reward',
      icon: '🎁',
      cost: 10,
      desc: 'A custom reward',
      who: 'all',
    };
    updateConfig({ rewards: [...(config.rewards ?? []), newReward] });
    openEdit('reward', newReward);
  }

  async function handleShareInvite() {
    const url = getServerUrl();
    const code = householdCode ?? '—';
    await Share.share({
      message: `Join our Questboard household! 🏰\n\nServer: ${url}\nCode: ${code}\n\nOpen Questboard → Join Household → enter these details.`,
    });
  }

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
      {
        text: 'Remove', style: 'destructive', onPress: () =>
          updateConfig({ players: config.players.filter(p => p.id !== id) }),
      },
    ]);
  }

  const chores: any[] = config.chores ?? [];
  const rewards: any[] = config.rewards ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <View style={[styles.onlineBadge, { backgroundColor: isOnline ? colors.success : colors.hp }]}>
          <Text style={styles.onlineText}>{isOnline ? '● Online' : '○ Offline'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Server */}
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
            {testing ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.btnText}>Test & Save</Text>}
          </TouchableOpacity>
          {testResult === true && <Text style={styles.success}>✓ Connected!</Text>}
          {testResult === false && <Text style={styles.error}>✗ Connection failed</Text>}
        </View>

        {/* Household */}
        <Text style={styles.sectionTitle}>Household</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Join Code</Text>
          <Text style={styles.code}>{householdCode ?? '—'}</Text>
          <Text style={styles.codeHint}>Share this with family members so they can join</Text>
          <TouchableOpacity style={styles.btn} onPress={handleShareInvite}>
            <Text style={styles.btnText}>📨 Send Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Players */}
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
              <TouchableOpacity style={[styles.modeBtn, player.mode === 'adults' && styles.modeBtnActive]} onPress={() => updatePlayer(player.id, 'mode', 'adults')}>
                <Text style={styles.modeBtnText}>Adult</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeBtn, player.mode === 'kids' && styles.modeBtnActive]} onPress={() => updatePlayer(player.id, 'mode', 'kids')}>
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

        {/* Admin: Manage Quests */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>🛡️ Manage Quests (Admin)</Text>
            {chores.map((chore: any) => (
              <View key={chore.id} style={styles.adminRow}>
                <Text style={styles.adminIcon}>{chore.icon}</Text>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{chore.name}</Text>
                  <Text style={styles.adminMeta}>{chore.pts}pts · {chore.freq} · {chore.who}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit('chore', chore)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => deleteItem('chore', chore.id)}>
                  <Text style={styles.delBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addChore}>
              <Text style={styles.addBtnText}>+ Add Quest</Text>
            </TouchableOpacity>

            {/* Admin: Manage Rewards */}
            <Text style={styles.sectionTitle}>🛡️ Manage Rewards (Admin)</Text>
            {rewards.map((reward: any) => (
              <View key={reward.id} style={styles.adminRow}>
                <Text style={styles.adminIcon}>{reward.icon}</Text>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{reward.name}</Text>
                  <Text style={styles.adminMeta}>{reward.cost}💰 · {reward.who}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit('reward', reward)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => deleteItem('reward', reward.id)}>
                  <Text style={styles.delBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addReward}>
              <Text style={styles.addBtnText}>+ Add Reward</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Display */}
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

        <TouchableOpacity style={styles.syncBtn} onPress={refreshFromServer}>
          <Text style={styles.syncBtnText}>↻ Sync from Server</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editTarget !== null} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editTarget?.type === 'chore' ? '⚔️ Edit Quest' : '🎁 Edit Reward'}
            </Text>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>Icon (emoji)</Text>
            <TextInput style={styles.input} value={editIcon} onChangeText={setEditIcon} placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>{editTarget?.type === 'chore' ? 'Points (XP)' : 'Cost (💰)'}</Text>
            <TextInput style={styles.input} value={editPts} onChangeText={setEditPts} keyboardType="number-pad" placeholderTextColor={colors.textDim} />

            {editTarget?.type === 'chore' && (
              <>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.row}>
                  {(['daily', 'weekly', 'monthly'] as const).map(f => (
                    <TouchableOpacity key={f} style={[styles.modeBtn, editFreq === f && styles.modeBtnActive]} onPress={() => setEditFreq(f)}>
                      <Text style={styles.modeBtnText}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {editTarget?.type === 'reward' && (
              <>
                <Text style={styles.label}>Description</Text>
                <TextInput style={styles.input} value={editDesc} onChangeText={setEditDesc} placeholderTextColor={colors.textDim} />
              </>
            )}

            <Text style={styles.label}>Who</Text>
            <View style={styles.row}>
              {(['all', 'kids', 'adults'] as const).map(w => (
                <TouchableOpacity key={w} style={[styles.modeBtn, editWho === w && styles.modeBtnActive]} onPress={() => setEditWho(w)}>
                  <Text style={styles.modeBtnText}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.row, { marginTop: spacing.md }]}>
              <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveEdit}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setEditTarget(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cancelBtn: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.sm,
  },
  cancelBtnText: { color: colors.text, fontFamily: 'monospace', fontSize: 13 },
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
    borderColor: (colors as any).info ?? colors.accent,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  syncBtnText: { color: (colors as any).info ?? colors.accent, fontFamily: 'monospace', fontSize: 13 },
  code: {
    color: colors.gold,
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  codeHint: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  adminIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  adminInfo: { flex: 1 },
  adminName: { color: colors.text, fontFamily: 'monospace', fontSize: 12 },
  adminMeta: { color: colors.textDim, fontFamily: 'monospace', fontSize: 10 },
  editBtn: {
    padding: spacing.xs,
    borderRadius: 4,
    backgroundColor: colors.surface,
    width: 32,
    alignItems: 'center',
  },
  editBtnText: { fontSize: 14 },
  delBtn: {
    padding: spacing.xs,
    borderRadius: 4,
    backgroundColor: colors.surface,
    width: 32,
    alignItems: 'center',
  },
  delBtnText: { fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.gold,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
});
