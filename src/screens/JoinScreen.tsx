import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getIsAdmin, joinHousehold, setIsAdmin, setServerUrl, testConnection } from '../api/client';
import { colors, spacing } from '../theme';

interface Props {
  onJoined: () => void;
}

export default function JoinScreen({ onJoined }: Props) {
  const [serverInput, setServerInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  async function handleJoin() {
    const url = serverInput.trim();
    const code = codeInput.trim();
    if (!url || (!adminMode && !code)) {
      Alert.alert('Missing info', adminMode ? 'Enter server address.' : 'Enter server address and household code.');
      return;
    }
    setLoading(true);
    try {
      if (adminMode) {
        const result = await testConnection(url);
        if (result.ok) {
          setServerUrl(url);
          setIsAdmin(true);
          onJoined();
        } else {
          Alert.alert('Cannot reach server ❌', result.error || 'Check the address and try again.');
        }
      } else {
        const result = await joinHousehold(url, code);
        if (result.ok) {
          setServerUrl(url);
          onJoined();
        } else {
          Alert.alert('Failed to join ❌', result.error || 'Wrong code or server unreachable.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>⚔️ QUESTBOARD</Text>
        <Text style={styles.subtitle}>
          {adminMode ? 'Admin setup — connect to your server' : 'Join your household to start your quest'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Server address</Text>
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

          {!adminMode && (
            <>
              <Text style={styles.label}>Household code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={codeInput}
                onChangeText={t => setCodeInput(t.toUpperCase())}
                placeholder="ABC-123"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
              />
            </>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleJoin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>{adminMode ? 'Connect →' : 'Join Household →'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setAdminMode(v => !v)} style={styles.switchLink}>
          <Text style={styles.switchText}>
            {adminMode ? '← Join as family member' : 'I\'m the admin — set up this household'}
          </Text>
        </TouchableOpacity>

        {!adminMode && (
          <Text style={styles.hint}>
            Ask your household admin for the server address and code.{'\n'}
            Find them in Settings → Household Code.
          </Text>
        )}
      </KeyboardAvoidingView>
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
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.lg,
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
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeInput: {
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnText: { color: '#fff', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },
  switchLink: { marginTop: spacing.lg, alignItems: 'center' },
  switchText: { color: colors.accent, fontFamily: 'monospace', fontSize: 12 },
  hint: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
