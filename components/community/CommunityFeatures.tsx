import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { ChevronUp, ChevronDown, Users, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '@/components/common/Card';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface Report {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  upvotes: number;
  userHasUpvoted: boolean;
  createdAt: string;
  building: string;
  room: string;
}

interface CommunityFeaturesProps {
  onReportSelect?: (report: Report) => void;
}

export function CommunityFeatures({ onReportSelect }: CommunityFeaturesProps) {
  const [trendingReports, setTrendingReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrendingReports();
  }, []);

  const fetchTrendingReports = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.10.166:5000/api/reports/trending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrendingReports(data);
      } else {
        throw new Error('Failed to fetch trending reports');
      }
    } catch (error) {
      console.error('Error fetching trending reports:', error);
      setError('Failed to load trending reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (reportId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.10.166:5000/api/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedReport = await response.json();
        
        // Update the local state
        setTrendingReports(prev => 
          prev.map(report => 
            report._id === reportId 
              ? { ...report, upvotes: updatedReport.upvotes, userHasUpvoted: updatedReport.userHasUpvoted }
              : report
          )
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to upvote report');
      }
    } catch (error) {
      console.error('Error upvoting report:', error);
      Alert.alert('Error', 'Failed to upvote report');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#D97706';
      case 'pending': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <Card style={styles.reportCard}>
      <TouchableOpacity
        style={styles.reportContent}
        onPress={() => onReportSelect?.(item)}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.reportLocation}>
              {item.building} - {item.room}
            </Text>
          </View>
          
          <View style={styles.upvoteContainer}>
            <TouchableOpacity
              style={[
                styles.upvoteButton,
                item.userHasUpvoted && styles.upvoteButtonActive
              ]}
              onPress={() => handleUpvote(item._id)}
            >
              <ChevronUp 
                size={20} 
                color={item.userHasUpvoted ? '#FFFFFF' : '#3B82F6'} 
              />
            </TouchableOpacity>
            <Text style={styles.upvoteCount}>{item.upvotes}</Text>
          </View>
        </View>

        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.reportFooter}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                {item.status.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.trendingIndicator}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Community Reports</Text>
        </View>
        <SkeletonLoader type="card" count={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Community Reports</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTrendingReports}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Community Reports</Text>
        <Text style={styles.headerSubtitle}>Most upvoted issues</Text>
      </View>

      <FlatList
        data={trendingReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trending reports yet</Text>
            <Text style={styles.emptySubtext}>
              Reports with community upvotes will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  reportCard: {
    marginBottom: 16,
  },
  reportContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  upvoteContainer: {
    alignItems: 'center',
    gap: 4,
  },
  upvoteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upvoteButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  upvoteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
