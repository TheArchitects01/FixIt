import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/common/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, Play, RefreshCw, MessageSquare } from 'lucide-react-native';
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
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  statusNotes?: Array<{
    status: string;
    note: string;
    createdAt: string;
  }>;
  assignmentNote?: string;
  rejectionNote?: string;
}

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [statusToUpdateAfterNote, setStatusToUpdateAfterNote] = useState<'in-progress' | 'completed' | null>(null);

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
        assignedTo: r.assignedTo,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: (r.priority || 'low') as Report['priority'],
        statusNotes: r.statusNotes || [],
        assignmentNote: r.assignmentNote,
        rejectionNote: r.rejectionNote,
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

  const updateStatus = async (newStatus: Report['status']) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const statusChanged = report?.status !== newStatus;
      
      await apiPatch(`/reports/${id}`, { status: newStatus }, token || undefined);
      setReport(prev => prev ? { ...prev, status: newStatus } : prev);
      
      if (statusChanged) {
        Alert.alert('Success', `Report marked as ${newStatus}`);
      }
    } catch (e) {
      console.error('Update status failed', e);
      Alert.alert('Error', 'Failed to update status');
    }
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

        {/* Status Notes Section */}
        {report.statusNotes && report.statusNotes.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.text : '#FFFFFF', marginTop: 16 }]}>Status Updates</Text>
            {report.statusNotes.map((note, index) => (
              <View key={index} style={[styles.noteContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
                <View style={styles.noteHeader}>
                  <Text style={[styles.noteStatus, { color: '#10B981' }]}>
                    {note.status === 'resolved' ? 'Completed' : note.status.replace('-', ' ')}
                  </Text>
                  <Text style={[styles.noteDate, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>
                    {formatNoteDate(note.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.noteText, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>{note.note}</Text>
              </View>
            ))}
          </>
        )}

        {report.photo && (
          <Image source={{ uri: report.photo }} style={styles.image} resizeMode="cover" />
        )}

        {/* Note Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={noteModalVisible}
          onRequestClose={() => setNoteModalVisible(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? theme.colors.card : '#27445D' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>
                {statusToUpdateAfterNote === 'in-progress' ? 'Start Progress' :
                 statusToUpdateAfterNote === 'completed' ? 'Mark Complete' :
                 'Add Note'}
              </Text>
              <TextInput
                style={[styles.noteInput, { 
                  color: isDark ? theme.colors.text : '#FFFFFF',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                }]}
                placeholder="Enter your note..."
                placeholderTextColor={isDark ? theme.colors.textSecondary : '#BFD2FF'}
                value={note}
                onChangeText={setNote}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setNoteModalVisible(false);
                    setNote('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#10B981' }]}
                  onPress={async () => {
                    if (!note.trim()) {
                      Alert.alert('Error', 'Please enter a note');
                      return;
                    }
                    try {
                      // Close modal first for better UX
                      setNoteModalVisible(false);
                      
                      const token = await AsyncStorage.getItem('token');
                      await apiPatch(`/reports/${id}`, { 
                        statusNote: note.trim(),
                        status: statusToUpdateAfterNote || report.status
                      }, token || undefined);
                      
                      // Clear states and reload after API call
                      setNote('');
                      setStatusToUpdateAfterNote(null);
                      await load();
                      Alert.alert('Success', statusToUpdateAfterNote ? 
                        `Status updated to ${statusToUpdateAfterNote} with note` : 
                        'Note added successfully'
                      );
                    } catch (e) {
                      console.error('Update failed', e);
                      Alert.alert('Error', 'Failed to update');
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Staff Status Change Buttons */}
        {user?.role === 'staff' && report.status !== 'completed' && (
          <View style={[styles.actionButtonsContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.actionButtonsRow}>
              {report.status === 'pending' ? (
                <TouchableOpacity 
                  style={[styles.actionButton, { flex: 1, backgroundColor: '#10B981' }]} 
                  onPress={() => {
                    setNoteModalVisible(true);
                    setStatusToUpdateAfterNote('in-progress');
                  }}
                >
                  <Play size={18} color="#FFFFFF" />
                  <Text style={styles.actionText}>Start Progress</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, { flex: 1, backgroundColor: '#10B981' }]} 
                  onPress={() => {
                    setNoteModalVisible(true);
                    setStatusToUpdateAfterNote('completed');
                  }}
                >
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={styles.actionText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1, backgroundColor: '#3B82F6' }]} 
                onPress={() => {
                  setNoteModalVisible(true);
                  setStatusToUpdateAfterNote(null);
                }}
              >
                <MessageSquare size={18} color="#FFFFFF" />
                <Text style={styles.actionText}>Add Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
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
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 14,
  },
  // Status Notes styles
  noteContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteStatus: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noteDate: {
    fontSize: 12,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  noteInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
