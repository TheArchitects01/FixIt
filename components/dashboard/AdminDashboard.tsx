import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import { useRouter } from 'expo-router';
import { FileText, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '@/services/api';

interface Report {
  id: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface DashboardStats {
  totalReports: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

// Removed hardcoded admin palette in favor of theme-driven colors

export function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const resp = await apiGet('/reports', token || undefined);
        const items = ((resp?.reports as any[]) || []).map((r: any) => ({
          id: r.id,
          status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
          priority: r.priority || 'low',
        })) as Report[];
        setReports(items);
      } catch (e) {
        console.error('Load reports error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats: DashboardStats = {
    totalReports: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'completed').length,
    urgent: reports.filter(r => r.priority === 'urgent').length,
  };

  const handleManageReports = () => {
    router.push('/reports');
  };
  // Removed Add Admin navigation from dashboard

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      {isDark ? (
        <LinearGradient
          colors={["#0F172A", "#1E293B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.header,
            { shadowColor: theme.colors.primary, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, paddingTop: 32, marginBottom: 16 },
          ]}
        >
          <Text style={{ ...styles.welcomeText, color: '#E5EDFF' }}>Admin Dashboard</Text>
          <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
          <Text style={[styles.subtitleText, { color: '#BFD2FF' }]}>Staff ID: {user?.staffId}</Text>
        </LinearGradient>
      ) : (
        <View style={{ ...styles.header, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', borderWidth: 1, paddingTop: 32, marginBottom: 16 }}>
          <Text style={{ ...styles.welcomeText, color: '#E5EDFF' }}>Admin Dashboard</Text>
          <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
          <Text style={[styles.subtitleText, { color: '#BFD2FF' }]}>Staff ID: {user?.staffId}</Text>
        </View>
      )}

      <View style={[styles.statsGrid, isDark && { gap: 8, marginBottom: 16 }, !isDark && { gap: 8, marginBottom: 16 }]}>
        {isDark ? (
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: theme.colors.primary, padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.totalReports}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#BFD2FF' }]}>Total Reports</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.totalReports}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Total Reports</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: theme.colors.primary, padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Clock size={20} color={theme.colors.warning} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.pending}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#BFD2FF' }]}>Pending</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Clock size={20} color={theme.colors.warning} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.pending}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Pending</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: theme.colors.primary, padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.inProgress}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#BFD2FF' }]}>In Progress</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.inProgress}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>In Progress</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: theme.colors.primary, padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <CheckCircle size={20} color={theme.colors.success} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.resolved}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#BFD2FF' }]}>Resolved</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <CheckCircle size={20} color={theme.colors.success} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.resolved}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Resolved</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: theme.colors.primary, padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <AlertTriangle size={20} color={theme.colors.error} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.urgent}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#BFD2FF' }]}>Urgent Issues</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <AlertTriangle size={20} color={'#F87171'} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.urgent}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Urgent Issues</Text>
          </Card>
        )}
      </View>

      <View style={{ marginHorizontal: 24, marginTop: 8, marginBottom: 24, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity 
          style={[styles.manageButton, { backgroundColor: theme.colors.primary, flex: 1 }]} 
          onPress={handleManageReports}
        >
          <Text style={styles.manageButtonText}>Manage Reports</Text>
        </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  statsGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  urgentCard: {
    margin: 24,
    marginTop: 0,
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  urgentNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  urgentLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  manageButton: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});