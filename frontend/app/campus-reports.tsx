import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { apiGet } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';

import { StatusBadge } from '@/components/common/StatusBadge';
import { User, MapPin, Clock, FileText, Search, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'pending' | 'in-progress' | 'completed' | 'rejected';

type ReportItem = {
  id: string;
  title: string;
  description: string;
  studentName: string;
  location: { building: string; room: string };
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  status: Status;
  photo?: string;
  assignedTo?: string;
  adminNotes?: string;
};

export default function CampusReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [truncated, setTruncated] = useState<Record<string, boolean>>({});
  const [collapsedText, setCollapsedText] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const fetchReports = React.useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setReports([]);
        return;
      }
      
      // All users can see campus reports
      const resp = await apiGet('/reports', token || undefined);
      const list = Array.isArray(resp?.reports) ? resp.reports : [];
      const mappedReports: ReportItem[] = list.map((report: any) => ({
        id: report._id || report.id,
        title: report.title,
        description: report.description,
        studentName: report.studentId || 'Unknown',
        location: report.location || { building: 'N/A', room: 'N/A' },
        createdAt: report.createdAt,
        priority: report.priority || 'low',
        status: normalizeStatus(report.status),
        photo: report.photo,
        assignedTo: report.assignedTo,
        adminNotes: report.adminNotes,
      }));
      setReports(mappedReports);
    } catch (error: any) {
      console.error('❌ Failed to load reports:', error?.message || error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useFocusEffect(
    React.useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const PRIORITY_COLORS: Record<string, string> = {
    high: '#DC2626',
    medium: '#F59E0B',
    low: '#10B981',
    urgent: '#DC2626',
  };

  // Normalize various backend status values to our badge set
  const normalizeStatus = (value?: string): Status => {
    const v = (value || 'pending').toString().trim().toLowerCase();
    if (['in-progress', 'inprogress', 'in_progress', 'progress'].includes(v)) return 'in-progress';
    if (['complete', 'completed', 'resolved', 'done', 'closed', 'success'].includes(v)) return 'completed';
    if (['rejected', 'deny', 'denied'].includes(v)) return 'rejected';
    if (['pending', 'new', 'open', 'created'].includes(v)) return 'pending';
    return 'pending';
  };

  // Light/Dark palettes (must be before any early returns to keep hook order stable)
  const { isDark } = useTheme();
  const palette = isDark
    ? {
        screenBackground: '#121212',
        cardBackground: '#1F1F21',
        textPrimary: '#FFFFFF',
        textSecondary: '#B0B0B0',
        metaIcon: '#9E9E9E',
        borderColor: '#2C2C2E',
        noteBackground: '#1C1C1E',
      }
    : {
        screenBackground: '#F1F5F9',
        cardBackground: '#FFFFFF',
        textPrimary: '#1E293B',
        textSecondary: '#475569',
        metaIcon: '#64748B',
        borderColor: '#E2E8F0',
        noteBackground: '#F1F5F9',
      };

  const getCardGradient = (status?: string): [string, string] => {
    const v = (status || 'pending').toLowerCase();
    if (isDark) {
      switch (v) {
        case 'in-progress': return ['#0C4A6E', '#1E3A8A'];
        case 'complete': return ['#064E3B', '#065F46'];
        case 'pending': return ['#451A03', '#7C2D12'];
        case 'rejected': return ['#7F1D1D', '#DC2626'];
        default: return ['#0F172A', '#1E293B'];
      }
    } else {
      switch (v) {
        case 'in-progress': return ['#5B8DEF', '#1E40AF'];
        case 'complete': return ['#1F8F5A', '#065F46'];
        case 'pending': return ['#FDBA74', '#C2410C'];
        case 'rejected': return ['#F87171', '#DC2626'];
        default: return ['#94A3B8', '#475569'];
      }
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // For students, show a different title
  const isStudent = user?.role === 'student';
  const pageTitle = isStudent ? 'Rejected Reports with Admin Notes' : 'Campus Reports';

  // Filter reports based on search query only
  const searchFilteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.studentName.toLowerCase().includes(query) ||
      report.location.building.toLowerCase().includes(query) ||
      report.location.room.toLowerCase().includes(query)
    );
  });

  return (
    <View style={[styles.mainContainer, { backgroundColor: '#000000' }]}>
      {/* Header */}
                  <View style={styles.reportHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Reports ({searchFilteredReports.length})</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: '#FFFFFF' }]}
            placeholder="Search by title, location, or student..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#FFFFFF"
          />
        </View>

      </View>

      {/* Reports List */}
      <ScrollView 
        style={styles.reportsContainer}
        contentContainerStyle={styles.reportsContent}
      >
        {searchFilteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? "No reports found matching your search"
                : "No reports available"}
            </Text>
          </View>
        ) : (
          searchFilteredReports.map((report) => (
        <LinearGradient
          key={report.id}
          colors={getCardGradient(report.status)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.reportCardGradient, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : palette.borderColor }]}
        >
          <View style={styles.header}>
            <View style={styles.priorityAndTitle}>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: PRIORITY_COLORS[report.priority || 'low'] },
                ]}
              />
              <Text style={[styles.reportTitle, { color: '#FFFFFF' }]}>{report.title}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <User size={14} color={'#E8F0FF'} />
            <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.9)' }]}>{report.studentName}</Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={14} color={'#E8F0FF'} />
            <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.9)' }]}> 
              {report.location.building} - {report.location.room}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Clock size={14} color={'#E8F0FF'} />
            <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.85)' }]}>{formatDate(report.createdAt)}</Text>
          </View>

          <View style={styles.descriptionSection}>
            <View style={styles.descriptionHeader}>
              <FileText size={14} color={'rgba(255,255,255,0.95)'} />
              <Text style={[styles.descriptionLabel, { color: 'rgba(255,255,255,0.95)' }]}>Description</Text>
            </View>
            {expanded[report.id] ? (
              <>
                <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
                  {report.description || 'No description provided.'}
                </Text>
                {truncated[report.id] && (
                  <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => toggleExpand(report.id)}>
                    <Text style={[styles.readMore, { color: '#E8F0FF' }]}>Show less</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              truncated[report.id] && collapsedText[report.id] ? (
                <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
                  {collapsedText[report.id]}
                  <Text onPress={() => toggleExpand(report.id)} style={[styles.readMore, { color: '#E8F0FF' }]}>...see more</Text>
                </Text>
              ) : (
                <Text
                  style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}
                  numberOfLines={2}
                  onTextLayout={(e) => {
                    const isTruncated = e.nativeEvent.lines.length > 2;
                    if (isTruncated && !collapsedText[report.id]) {
                      const firstTwo = e.nativeEvent.lines.slice(0, 2).map(l => l.text).join('\n');
                      setCollapsedText(prev => ({ ...prev, [report.id]: firstTwo }));
                    }
                    setTruncated(prev => (prev[report.id] === isTruncated ? prev : { ...prev, [report.id]: isTruncated }));
                  }}
                >
                  {(report.description || 'No description provided.').trim()}
                </Text>
              )
            )}
          </View>

          {report.photo && (
            <Image source={{ uri: report.photo }} style={styles.image} resizeMode="cover" />
          )}

          <View style={styles.footer}>
            <StatusBadge status={report.status} />
            {report.assignedTo && (
              <Text style={[styles.assignedTo, { color: 'rgba(255,255,255,0.9)' }]}>Assigned to: {report.assignedTo}</Text>
            )}
          </View>

          {report.adminNotes && (
            <View style={[styles.notesContainer, { backgroundColor: 'rgba(255,255,255,0.12)' }]}> 
              <Text style={[styles.notesLabel, { color: '#FFFFFF' }]}>Admin Notes:</Text>
              <Text style={[styles.notesText, { color: 'rgba(255,255,255,0.9)' }]}>{report.adminNotes}</Text>
            </View>
          )}
        </LinearGradient>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginTop: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 25,
    paddingTop: 15,
  },
  backButton: {
    marginRight: 16,
    marginTop: 30,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },

  reportsContainer: {
    flex: 1,
  },
  reportsContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  reportCardGradient: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    marginBottom: 8,
  },
  priorityAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.95,
  },
  readMore: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedTo: {
    fontSize: 13,
  },
  notesContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
  },
});
