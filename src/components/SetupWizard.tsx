import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { setServerUrl, testConnection } from '../api/client';
import { colors, spacing } from '../theme';

interface Props {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [serverInput, setServerInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    const ok = await testConnection(serverInput);
    setTestResult(ok);
    setTesting(false);
  }

  function handleSave() {
    setServerUrl(serverInput.trim());
    onComplete();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>⚔️ Questboard Setup</Text>
      <Text style={styles.subtitle}>Family RPG Chore Tracker</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server URL</Text>
        <Text style={styles.hint}>
          Enter your Questboard server address (e.g. 192.168.1.10:8099)
        </Text>
        <TextInput
          style={styles.input}
          value={serverInput}
          onChangeText={setServerInput}
          placeholder="192.168.1.x:8099"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestConnection}
          disabled={testing || !serverInput}
        >
          {testing ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <Text style={styles.testBtnText}>Test Connection</Text>
          )}
        </TouchableOpacity>
        {testResult === true && (
          <Text style={styles.success}>✓ Connected successfully!</Text>
        )}
        {testResult === false && (
          <Text style={styles.error}>✗ Could not connect. Check URL and try again.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !serverInput && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!serverInput}
      >
        <Text style={styles.saveBtnText}>
          {testResult === true ? 'Continue →' : 'Skip & Continue →'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.offlineNote}>
        You can configure this later in Settings. The app works offline using cached data.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    color: colors.gold,
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: 'monospace',
    borderRadius: 4,
    padding: spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  testBtn: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  testBtnText: { color: colors.accent, fontFamily: 'monospace', fontSize: 13 },
  success: { color: colors.success, fontFamily: 'monospace', fontSize: 12, marginTop: spacing.sm },
  error: { color: colors.hp, fontFamily: 'monospace', fontSize: 12, marginTop: spacing.sm },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineNote: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
  },
});
