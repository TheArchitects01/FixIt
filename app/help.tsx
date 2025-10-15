import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useTheme } from '@/components/common/ThemeProvider';

export default function HelpScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Help & Support</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>What is FixIt?</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            FixIt is the university's official maintenance reporting system. Students and staff can easily report maintenance issues around campus and track their resolution status in real-time.
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How to Submit a Report</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            1. Tap "Report New Issue" from your dashboard{'\n'}
            2. Fill in the issue title and description{'\n'}
            3. Specify the building and room location{'\n'}
            4. Optionally add a photo to help identify the issue{'\n'}
            5. Submit your report
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tracking Your Reports</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            You can view all your submitted reports in the "My Reports" section. Each report shows its current status:
            {'\n\n'}• Pending: Report received, waiting for review{'\n'}
            • In Progress: Maintenance team is working on the issue{'\n'}
            • Resolved: Issue has been fixed
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Priority Levels</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            Reports are automatically categorized by priority:
            {'\n\n'}• Urgent: Safety hazards, security issues{'\n'}
            • High: Equipment failures affecting classes{'\n'}
            • Medium: General maintenance needs{'\n'}
            • Low: Cosmetic or minor issues
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact Support</Text>
          <View style={styles.contactContainer}>
            <View style={styles.contactRow}>
              <Mail size={20} color={theme.colors.primary} />
              <Text style={[styles.contactText, { color: theme.colors.primary }]}>support@university.edu</Text>
            </View>
            <View style={styles.contactRow}>
              <Phone size={20} color={theme.colors.primary} />
              <Text style={[styles.contactText, { color: theme.colors.primary }]}>(555) 123-4567</Text>
            </View>
          </View>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            For urgent issues outside business hours, contact campus security at (555) 999-0000.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  contactContainer: {
    marginVertical: 16,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
});