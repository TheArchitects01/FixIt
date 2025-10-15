import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPatch } from '@/services/api';
import { Clock, Play, CheckCircle, RefreshCw } from 'lucide-react-native';

interface Report {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: { byName?: string; byRole?: 'student' | 'admin' | 'staff'; text?: string; createdAt?: string }[];
}

export function StaffReports() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; status: 'pending' | 'in-progress' | 'completed' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const loadAssigned = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const resp = await apiGet('/reports/assigned-to-me', token || undefined);
      const items = ((resp?.reports as any[]) || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: r.priority || 'low',
        notes: Array.isArray(r.notes) ? r.notes : [],
      })) as Report[];
      setReports(items);
    } catch (e) {
      console.error('Load assigned reports failed:', e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssigned();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      await loadAssigned();
    })();
  }, []);

  const getCardGradient = (status?: string): [string, string] => {
    const s = (status || 'pending').toLowerCase();
    if (isDark) {
      switch (s) {
        case 'in-progress': return ['#065F46', '#047857'];
        case 'completed': return ['#064E3B', '#065F46'];
        default: return ['#064E3B', '#065F46'];
      }
    }
    switch (s) {
      case 'in-progress': return ['#10B981', '#34D399'];
      case 'completed': return ['#1F8F5A', '#065F46'];
      default: return ['#10B981', '#34D399'];
    }
  };

  const renderStatusIcon = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'pending': return <Clock size={16} color={'#FFFFFF'} />;
      case 'in-progress': return <Play size={16} color={'#FFFFFF'} />;
      default: return <CheckCircle size={16} color={'#FFFFFF'} />;
    }
  };

  const requestStatusChange = (id: string, newStatus: Report['status']) => {
    setPendingUpdate({ id, status: newStatus });
    setNoteText('');
    setNoteVisible(true);
  };

  const updateReportStatus = async (reportId: string, newStatus: Report['status'], note?: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await apiPatch(`/reports/${reportId}`, { status: newStatus, adminNotes: note || undefined }, token || undefined);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      Alert.alert('Success', `Report marked as ${newStatus}`);
      // Reload to include newly appended note from server timeline
      await loadAssigned();
    } catch (e) {
      console.error('Staff update status error:', e);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  const filtered = reports.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading my jobs...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}> 
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.title, { color: isDark ? theme.colors.primary : theme.colors.text }]}>My Jobs ({filtered.length}/{reports.length})</Text>
          <TouchableOpacity 
            onPress={onRefresh} 
            disabled={refreshing}
            style={{ padding: 8, backgroundColor: '#10B981', borderRadius: 8 }}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 4 }}>
          <View style={styles.filtersRow}>
            {(['all','pending','in-progress','completed'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterBtn,
                  isDark
                    ? { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  statusFilter === s && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[
                  styles.filterText,
                  { color: isDark ? theme.colors.textSecondary : theme.colors.textSecondary },
                  statusFilter === s && { color: '#FFFFFF' }
                ]}>
                  {s === 'all' ? 'All' : s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <View style={styles.centered}><Text style={{ color: theme.colors.textSecondary }}>No jobs assigned.</Text></View>
        ) : filtered.map(report => (
          <TouchableOpacity
            key={report.id}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/reports/[id]', params: { id: report.id } })}
          >
            <LinearGradient
              colors={getCardGradient(report.status)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : theme.colors.border }]}
            >
              <View style={styles.cardHeader}>
                {renderStatusIcon(report.status)}
                <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>{report.title}</Text>
              </View>
              {Array.isArray(report.notes) && report.notes.length > 0 && (
                <Text style={{ color: '#D1FAE5', fontSize: 12, marginTop: 4 }}>
                  {report.notes.length} note{report.notes.length > 1 ? 's' : ''}
                </Text>
              )}
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{report.status.replace('-', ' ')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>

      <Modal visible={noteVisible} transparent animationType="fade" onRequestClose={() => setNoteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add a note</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>Please provide a short note for this status change.</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: isDark ? theme.colors.card : 'rgba(0,0,0,0.03)' }]}
              placeholder="Enter note (required)"
              placeholderTextColor={theme.colors.textSecondary}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setNoteVisible(false); setPendingUpdate(null); setNoteText(''); }} style={[styles.modalButton, { backgroundColor: isDark ? '#2A2A2E' : '#F1F5F9', borderColor: theme.colors.border }]}>
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!noteText.trim() || !pendingUpdate} onPress={async () => {
                if (pendingUpdate && noteText.trim()) {
                  const { id, status } = pendingUpdate;
                  await updateReportStatus(id, status, noteText.trim());
                  setNoteVisible(false);
                  setPendingUpdate(null);
                  setNoteText('');
                }
              }} style={[styles.modalButton, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                <Text style={[styles.modalButtonText, { color: theme.colors.primary }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 10, fontSize: 16 },
  card: { marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  statusBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  actionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  actionBtnGreen: { backgroundColor: 'rgba(16,185,129,0.9)', borderWidth: 0 },
  completedBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  completedBadgeText: { color: '#10B981', fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalMessage: { fontSize: 14, marginBottom: 12 },
  modalInput: { minHeight: 80, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
});
