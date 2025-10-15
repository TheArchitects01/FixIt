import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Plus, FileText, Eye } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '@/services/api';

interface Report {
  _id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  studentId: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const resp = await apiGet('/reports/mine', token);
      const list = Array.isArray(resp?.reports) ? resp.reports : [] as any[];
      // Normalize statuses so filters/counts work consistently
      const normalized = list.map((r: any) => ({
        ...r,
        status:
          r.status === 'resolved' ? 'completed' :
          r.status === 'in_progress' ? 'in-progress' : r.status,
      }));
      setReports(normalized as any);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  // Refresh data when screen is focused (for real-time updates)
  useFocusEffect(
    React.useCallback(() => {
      fetchMyReports();
    }, [])
  );

  const activeIssues = reports.filter(report => report.status !== 'completed');

  const handleReportNewIssue = () => {
    router.push('../report-issue');
  };

  const handleViewMyReports = () => {
    router.push('/reports');
  };

  const handleViewCampusReports = () => {
    router.push('/campus-reports');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, styles.headerGradient]}
      >
        <Text style={[styles.welcomeText, { color: isDark ? '#C7D2FE' : '#EAF2FF' }]}>Welcome back bro,</Text>
        <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}!</Text>
        <Text style={[styles.subtitleText, { color: isDark ? '#9DB2FF' : '#DBEAFE' }]}>
          Student ID: {user?.studentId}
        </Text>
      </LinearGradient>

      {isDark ? (
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.statsCard,
            { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000' },
          ]}
        >
          <Text style={[styles.statsNumber, { color: '#FFFFFF' }]}>{loading ? '...' : activeIssues.length}</Text>
          <Text style={[styles.statsLabel, { color: '#EAF2FF' }]}>Active Issues</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: '#497D74',
              borderColor: '#497D74',
              shadowColor: theme.colors.shadow ?? '#497D74',
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.statsNumber, { color: '#FFFFFF' }]}>{loading ? '...' : activeIssues.length}</Text>
          <Text style={[styles.statsLabel, { color: '#EAF2FF' }]}>Active Issues</Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {isDark ? (
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', borderWidth: 1.5 }]}
          >
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleReportNewIssue}>
              <LinearGradient
                colors={isDark ? ['#3B3B7A', '#2D2D64'] : ['#A78BFA', '#5E5CE6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Plus size={24} color={'#FFFFFF'} />
              </LinearGradient>
              <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Report New Issue</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#71BBB2', borderColor: '#71BBB2', shadowColor: theme.colors.shadow ?? '#71BBB2' }]} onPress={handleReportNewIssue}>
            <LinearGradient
              colors={isDark ? ['#3B3B7A', '#2D2D64'] : ['#A78BFA', '#5E5CE6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Plus size={24} color={'#FFFFFF'} />
            </LinearGradient>
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Report New Issue</Text>
          </TouchableOpacity>
        )}

        {isDark ? (
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', borderWidth: 1.5 }]}
          >
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleViewMyReports}>
              <LinearGradient
                colors={isDark ? ['#1C3B32', '#0F2E26'] : ['#34D399', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <FileText size={24} color={'#FFFFFF'} />
              </LinearGradient>
              <Text style={[styles.actionText, { color: '#FFFFFF' }]}>My Report History</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#71BBB2', borderColor: '#71BBB2', shadowColor: theme.colors.shadow ?? '#71BBB2' }]} onPress={handleViewMyReports}>
            <LinearGradient
              colors={isDark ? ['#1C3B32', '#0F2E26'] : ['#34D399', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <FileText size={24} color={'#FFFFFF'} />
            </LinearGradient>
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>My Report History</Text>
          </TouchableOpacity>
        )}

        {isDark ? (
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', borderWidth: 1.5 }]}
          >
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleViewCampusReports}>
              <LinearGradient
                colors={isDark ? ['#3B2330', '#2A1722'] : ['#F9A8D4', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Eye size={24} color={'#FFFFFF'} />
              </LinearGradient>
              <Text style={[styles.actionText, { color: '#FFFFFF' }]}>View Campus Reports</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#71BBB2', borderColor: '#71BBB2', shadowColor: theme.colors.shadow ?? '#71BBB2' }]} onPress={handleViewCampusReports}>
            <LinearGradient
              colors={isDark ? ['#3B2330', '#2A1722'] : ['#F9A8D4', '#F472B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Eye size={24} color={'#FFFFFF'} />
            </LinearGradient>
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>View Campus Reports</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  headerGradient: {
    shadowColor: '#27445D',
  },
  welcomeText: {
    fontSize: 16,
    color: '#2563EB',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  statsCard: {
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 18,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -1,
  },
  statsLabel: {
    fontSize: 16,
    color: '#E0F2FE',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  actionsContainer: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    // shadowColor provided inline per-theme
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '600',
    // color provided inline per-theme
    letterSpacing: 0.2,
  },
});