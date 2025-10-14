import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/common/ThemeProvider';
import { Card } from '@/components/common/Card';
import { apiGet } from '@/services/api';

type Report = {
  id: string;
  title: string;
  description: string;
  location: { building: string; room: string };
  createdAt: any;
  status: 'pending' | 'in-progress' | 'completed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  studentId: string;
};

export default function CampusReports() {
  const { theme, isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const resp = await apiGet('/reports', token || undefined);
      const raw = (resp.reports || []) as Report[];
      // Normalize 'resolved' -> 'completed' for display consistency
      const items = raw.map((r) => ({ ...r, status: (r.status === 'resolved' ? 'completed' : r.status) as Report['status'] }));
      setReports(items);
    } catch (e) {
      console.error('Load campus reports failed:', e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const formatDate = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'in-progress': return theme.colors.primary;
      case 'completed': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  // Apply status filter
  const filteredReports = reports.filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading campus reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: isDark ? theme.colors.text : '#1F2937' }]}>Campus Reports ({filteredReports.length})</Text>

      <View style={styles.filtersRow}>
        {(['all','pending','in-progress','completed'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filterBtn,
              { borderColor: isDark ? theme.colors.border : '#E5E7EB', backgroundColor: isDark ? theme.colors.card : '#FFFFFF' },
              statusFilter === s && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: isDark ? theme.colors.textSecondary : '#374151' },
              statusFilter === s && { color: '#FFFFFF', fontWeight: '700' }
            ]}>
              {s === 'all' ? 'All' : s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredReports.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No reports found.</Text>
        </Card>
      ) : (
        filteredReports.map((r) => (
          <Card key={r.id} style={[styles.itemCard, { borderColor: isDark ? theme.colors.border : '#E5E7EB', backgroundColor: isDark ? theme.colors.card : '#FFFFFF' }]}> 
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: isDark ? theme.colors.text : '#111827' }]}>{r.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(r.status || 'pending') }]}> 
                <Text style={styles.statusText}>{(r.status || 'pending').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.itemMeta, { color: theme.colors.textSecondary }]}>{r.location.building} - {r.location.room} · {formatDate(r.createdAt)} · SID: {r.studentId}</Text>
            <Text style={[styles.itemDesc, { color: isDark ? theme.colors.text : '#374151' }]}>{r.description}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  filterText: { fontSize: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 10, fontSize: 16 },
  emptyCard: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16 },
  itemCard: { marginBottom: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  itemMeta: { fontSize: 12, marginBottom: 6 },
  itemDesc: { fontSize: 14, lineHeight: 20 },
});
