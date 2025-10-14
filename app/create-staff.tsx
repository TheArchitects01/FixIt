import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/components/common/ThemeProvider';
import { apiPost } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateStaffScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      Alert.alert('Forbidden', 'Only admins can create staff accounts.');
      router.back();
      return;
    }
  }, [user]);

  const handleCreate = async () => {
    if (!name || !password) {
      Alert.alert('Missing info', 'Please fill Name and Password.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await apiPost(
        '/auth/register-staff',
        { name, password },
        token || undefined
      );

      const assigned = res?.user?.staffId ? String(res.user.staffId) : '';
      setStaffId(assigned);
      Alert.alert('Staff created', `Staff ${res?.user?.name || name} (Staff ID: ${assigned}) created successfully.`);
      setName('');
      setPassword('');
    } catch (e: any) {
      const msg = e?.message || 'Failed to create staff';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <LinearGradient
        colors={isDark ? ['#064E3B', '#065F46'] : ['#10B981', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Create Staff</Text>
        <Text style={[styles.subtitle, { color: '#E7F8F1' }]}>Add a staff account for assignments</Text>
      </LinearGradient>

      <View style={styles.form}> 
        <Text style={[styles.label, { color: theme.colors.text }]}>Staff ID (assigned automatically)</Text>
        <TextInput
          value={staffId}
          onChangeText={() => {}}
          placeholder={"e.g., 5551 (after creation)"}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          autoCapitalize="none"
          editable={false}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Staff Name"
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

        <Button
          title={loading ? 'Creating…' : 'Create Staff'}
          onPress={handleCreate}
          disabled={loading}
          style={[styles.submit, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
          textStyle={{ color: '#FFFFFF' }}
        />
        {loading && <ActivityIndicator style={{ marginTop: 12 }} color={'#10B981'} />}
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
});
