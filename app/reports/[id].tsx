import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/common/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, Play, RefreshCw } from 'lucide-react-native';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiGet, apiPatch } from '@/services/api';

interface Report {
  id: string;
  title: string;
  description: string;
  location: { building: string; room: string };
  createdAt: any;
  updatedAt?: any;
  studentId: string;
  studentName?: string;
  photo?: string;
  adminNotes?: string;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: Array<{
    byUserId?: string;
    byName?: string;
    byRole?: 'student' | 'admin' | 'staff';
    text?: string;
    statusAtTime?: string;
    createdAt?: any;
  }>;
}

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // modal states for status update with note
  const [noteVisible, setNoteVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [targetStatus, setTargetStatus] = useState<Report['status'] | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(true);

  const formatDate = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatDateTime = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatNoteDate = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const load = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const resp = await apiGet(`/reports/${id}` as const, token || undefined);
      const r = resp?.report;
      const normalized: Report = {
        id: r.id,
        title: r.title,
        description: r.description,
        location: r.location,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        studentId: r.studentId,
        studentName: r.studentName,
        photo: r.photo,
        adminNotes: r.adminNotes,
        assignedTo: r.assignedTo,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: (r.priority || 'low') as Report['priority'],
        notes: r.notes || [],
      };
      setReport(normalized);
    } catch (e) {
      console.error('Load report failed', e);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const updateStatus = async (newStatus: Report['status'], note: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const statusChanged = report?.status !== newStatus;
      
      // Add cleanupNotes flag when marking as completed
      const payload: any = { 
        status: newStatus, 
        adminNotes: note || undefined 
      };
      
      if (newStatus === 'completed' && statusChanged) {
        payload.cleanupNotes = true; // Signal backend to cleanup routine notes
      }
      
      await apiPatch(`/reports/${id}`, payload, token || undefined);
      setReport(prev => prev ? { ...prev, status: newStatus, adminNotes: note || prev.adminNotes } : prev);
      
      if (statusChanged) {
        Alert.alert('Success', `Report marked as ${newStatus}`);
      } else {
        Alert.alert('Success', 'Note added successfully');
      }
    } catch (e) {
      console.error('Update status failed', e);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const openNoteModal = (status: Report['status']) => {
    setTargetStatus(status);
    setNoteText('');
    setNoteVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#000000' }]}> 
      <View style={[styles.header, { borderBottomColor: isDark ? theme.colors.border : '#1F3A52' }]}> 
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/reports');
          }
        }} style={styles.backButton}>
          <ArrowLeft size={24} color={isDark ? theme.colors.text : '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? theme.colors.text : '#FFFFFF', flex: 1 }]}>Report Details</Text>
        <TouchableOpacity 
          onPress={onRefresh} 
          disabled={refreshing}
          style={[styles.refreshButton, { backgroundColor: user?.role === 'admin' ? '#DC2626' : user?.role === 'staff' ? '#10B981' : '#3B82F6' }]}
        >
          <RefreshCw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Card style={[styles.card, isDark ? { backgroundColor: theme.colors.card, borderColor: theme.colors.border } : { backgroundColor: '#27445D', borderColor: '#1F3A52' }]}>
        <Text style={[styles.reportTitle, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>{report.title}</Text>
        {/* Name */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Name: {report.studentName || 'N/A'}</Text>
        </View>
        {/* ID (Student) */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>ID: {report.studentId || 'N/A'}</Text>
        </View>
        {/* Time (Created) */}
        <View style={styles.metaRow}>
          <Clock size={14} color={isDark ? theme.colors.textSecondary : '#BFD2FF'} />
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Time: {formatDateTime(report.createdAt)}</Text>
        </View>
        {/* Location */}
        <View style={styles.metaRow}>
          <MapPin size={14} color={isDark ? theme.colors.textSecondary : '#BFD2FF'} />
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Location: {report.location?.building || 'N/A'} - {report.location?.room || 'N/A'}</Text>
        </View>
        {/* Priority */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Priority: {report.priority}</Text>
        </View>
        {/* Updated */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Updated: {report.updatedAt ? formatDateTime(report.updatedAt) : '—'}</Text>
        </View>
        {/* Status (badge) */}
        <View style={[styles.metaRow, { marginTop: 2 }]}> 
          <StatusBadge status={report.status === 'completed' ? 'completed' : (report.status as any)} />
        </View>
        <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>Description</Text>
        <Text style={[styles.description, { color: isDark ? theme.colors.textSecondary : '#D7E2FF' }]}>{report.description || 'No description provided.'}</Text>
        {report.photo && (
          <Image source={{ uri: report.photo }} style={styles.image} resizeMode="cover" />
        )}
      </Card>

      {/* Admin Add Note Button - only for admins on assigned reports and not completed */}
      {user?.role === 'admin' && report.assignedTo && report.status !== 'completed' && (
        <TouchableOpacity 
          style={[styles.addNoteButton, { backgroundColor: '#10B981' }]}
          onPress={() => openNoteModal(report.status)}
        >
          <Text style={styles.addNoteButtonText}>Add Note for Staff</Text>
        </TouchableOpacity>
      )}

      {/* Staff Add Note Button - only if not completed */}
      {user?.role === 'staff' && report.status !== 'completed' && (
        <TouchableOpacity 
          style={[styles.addNoteButton, { backgroundColor: '#DC2626' }]}
          onPress={() => openNoteModal(report.status)}
        >
          <Text style={styles.addNoteButtonText}>Add Note for Admin</Text>
        </TouchableOpacity>
      )}

      {/* Notes Timeline Section */}
      {report.notes && report.notes.length > 0 && (
        <Card style={[styles.card, isDark ? { backgroundColor: theme.colors.card, borderColor: theme.colors.border } : { backgroundColor: '#27445D', borderColor: '#1F3A52' }]}>
          <TouchableOpacity 
            style={styles.notesTimelineHeader} 
            onPress={() => setNotesExpanded(!notesExpanded)}
            activeOpacity={0.7}
          >
            <Text style={[styles.notesTimelineTitle, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>
              Notes Timeline ({report.notes.length})
            </Text>
            <Text style={{ color: isDark ? theme.colors.primary : '#93C5FD', fontWeight: 'bold', fontSize: 16 }}>
              {notesExpanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {notesExpanded && (
            <View style={styles.notesTimelineContainer}>
              {report.notes
                .slice()
                .sort((a, b) => {
                  const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return bDate - aDate;
                })
                .map((note, idx) => {
                  const isStaffNote = note.byRole === 'staff';
                  const isAdminNote = note.byRole === 'admin';
                  
                  let bgColor, borderColor, textColor;
                  
                  if (isStaffNote) {
                    // Staff notes - Green
                    bgColor = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(110, 231, 183, 0.15)';
                    borderColor = isDark ? '#10B981' : '#6EE7B7';
                    textColor = isDark ? '#10B981' : '#6EE7B7';
                  } else if (isAdminNote) {
                    // Admin notes - Red
                    bgColor = isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(252, 165, 165, 0.15)';
                    borderColor = isDark ? '#DC2626' : '#FCA5A5';
                    textColor = isDark ? '#DC2626' : '#FCA5A5';
                  } else {
                    // Student notes - Blue
                    bgColor = isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(147, 197, 253, 0.15)';
                    borderColor = isDark ? theme.colors.primary : '#93C5FD';
                    textColor = isDark ? theme.colors.primary : '#93C5FD';
                  }
                  
                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.noteTimelineCard,
                        { 
                          backgroundColor: bgColor,
                          borderLeftColor: borderColor
                        }
                      ]}
                    >
                      <View style={styles.noteTimelineHeader}>
                        <Text style={[styles.noteAuthor, { color: textColor }]}>
                          {note.byName || 'User'} • {note.byRole || 'user'}
                        </Text>
                      <Text style={[styles.noteDate, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>
                        {note.statusAtTime ? `(${note.statusAtTime}) • ` : ''}
                        {note.createdAt ? formatNoteDate(note.createdAt) : ''}
                      </Text>
                    </View>
                    <Text style={[styles.noteText, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>
                      {note.text || 'No content'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      )}

      {/* Staff Status Change Buttons */}
      {user?.role === 'staff' && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}>
          {report.status === 'pending' && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={() => openNoteModal('in-progress')}>
              <Play size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Start Progress</Text>
            </TouchableOpacity>
          )}
          {report.status !== 'completed' && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={() => openNoteModal('completed')}>
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={noteVisible} transparent animationType="fade" onRequestClose={() => setNoteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add a note</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>Provide a short note for this status change.</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: isDark ? theme.colors.card : 'rgba(0,0,0,0.03)' }]}
              placeholder="Enter note (required)"
              placeholderTextColor={theme.colors.textSecondary}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setNoteVisible(false); setTargetStatus(null); setNoteText(''); }} style={[styles.modalButton, { backgroundColor: isDark ? '#2A2A2E' : '#F1F5F9', borderColor: theme.colors.border }]}>
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!noteText.trim() || !targetStatus} onPress={async () => {
                if (targetStatus && noteText.trim()) {
                  await updateStatus(targetStatus, noteText.trim());
                  setNoteVisible(false);
                  setTargetStatus(null);
                  setNoteText('');
                }
              }} style={[styles.modalButton, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                <Text style={[styles.modalButtonText, { color: theme.colors.primary }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 10, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  backButton: { padding: 6, borderRadius: 8 },
  refreshButton: { padding: 8, borderRadius: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  card: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  reportTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText: { fontSize: 14 },
  sectionLabel: { marginTop: 12, fontSize: 14, fontWeight: '700' },
  description: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  image: { width: '100%', height: 220, borderRadius: 10, marginTop: 12 },
  addNoteButton: { marginHorizontal: 16, marginTop: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  addNoteButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  actionText: { color: '#FFFFFF', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalMessage: { fontSize: 14, marginBottom: 12 },
  modalInput: { minHeight: 80, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
  notesTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesTimelineTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesTimelineContainer: {
    gap: 12,
  },
  noteTimelineCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  noteTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  noteAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.9,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
