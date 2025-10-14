import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/components/common/ThemeProvider';
import { apiPost } from '@/services/api';

export default function CreateAdminScreen() {
  const { theme, isDark } = useTheme();
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [seedKey, setSeedKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!staffId || !name || !password) {
      Alert.alert('Missing info', 'Please fill Staff ID, Name and Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost('/auth/register-admin', {
        staffId,
        name,
        password,
        seedKey: seedKey || undefined,
      });

      Alert.alert('Admin created', `Admin ${res?.user?.name || name} (Staff ID: ${res?.user?.staffId || staffId}) created successfully.`);
      setStaffId('');
      setName('');
      setPassword('');
      setSeedKey('');
    } catch (e: any) {
      const msg = e?.message || 'Failed to create admin';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Create Admin</Text>
        <Text style={[styles.subtitle, { color: '#EAF2FF' }]}>Seed an admin without leaving the app</Text>
      </LinearGradient>

      <View style={styles.form}> 
        <Text style={[styles.label, { color: theme.colors.text }]}>Staff ID</Text>
        <TextInput
          value={staffId}
          onChangeText={setStaffId}
          placeholder="e.g., 9001"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Admin Name"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Set a password"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          secureTextEntry
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Seed Key (optional)</Text>
        <TextInput
          value={seedKey}
          onChangeText={setSeedKey}
          placeholder="Required after first admin exists"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          autoCapitalize="none"
        />

        <Button
          title={loading ? 'Creating…' : 'Create Admin'}
          onPress={handleCreate}
          disabled={loading}
          style={styles.submit}
        />
        {loading && <ActivityIndicator style={{ marginTop: 12 }} color={theme.colors.primary} />}
      </View>

      <View style={styles.helpBox}>
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>This creates an admin via the backend API.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submit: {
    marginTop: 10,
  },
  helpBox: {
    marginTop: 18,
  },
  helpText: {
    fontSize: 12,
  },
});
