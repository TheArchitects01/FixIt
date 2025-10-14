import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import { useRouter } from 'expo-router';
import { FileText, Clock, CheckCircle, Play } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '@/services/api';

interface Report {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function StaffDashboard() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const resp = await apiGet('/reports/assigned-to-me', token || undefined);
        const items = ((resp?.reports as any[]) || []).map((r: any) => ({
          id: r.id,
          status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
          priority: r.priority || 'low',
        })) as Report[];
        setReports(items);
      } catch (e) {
        setReports([]);
        console.error('Load assigned reports error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    completed: reports.filter(r => r.status === 'completed').length,
  };

  const goToMyJobs = () => {
    router.push('/reports');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { borderColor: theme.colors.border }]}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Staff Dashboard</Text>
        <Text style={[styles.subtitle, { color: '#EAF2FF' }]}>Your assigned jobs at a glance</Text>
      </LinearGradient>

      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: isDark ? theme.colors.card : '#27445D', borderColor: isDark ? theme.colors.border : '#1F3A52' }]}>
          <View style={styles.statRow}>
            <FileText size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.total}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? theme.colors.textSecondary : '#E0ECFF' }]}>Assigned</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? theme.colors.card : '#27445D', borderColor: isDark ? theme.colors.border : '#1F3A52' }]}>
          <View style={styles.statRow}>
            <Clock size={20} color={theme.colors.warning} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.pending}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? theme.colors.textSecondary : '#E0ECFF' }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? theme.colors.card : '#27445D', borderColor: isDark ? theme.colors.border : '#1F3A52' }]}>
          <View style={styles.statRow}>
            <Play size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.inProgress}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? theme.colors.textSecondary : '#E0ECFF' }]}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? theme.colors.card : '#27445D', borderColor: isDark ? theme.colors.border : '#1F3A52' }]}>
          <View style={styles.statRow}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.completed}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? theme.colors.textSecondary : '#E0ECFF' }]}>Completed</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={goToMyJobs}>
        <Text style={styles.buttonText}>View My Jobs</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16, borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 14 },
  grid: { padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 16, padding: 16, borderWidth: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 14, fontWeight: '600' },
  button: { marginHorizontal: 24, marginTop: 12, padding: 16, borderRadius: 16 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
});
