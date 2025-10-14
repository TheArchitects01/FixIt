import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Moon, Sun, Bell, Shield, Info, ChevronRight } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';
import { Card } from './Card';
import { AnimatedButton, FadeInView } from './AnimatedComponents';

interface SettingsProps {
  onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { theme, isDark, toggleTheme } = useTheme();

  const settingsItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Get updates on your reports',
      icon: Bell,
      type: 'toggle' as const,
      value: true,
      onToggle: () => {}, // Placeholder for notification toggle
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your data and privacy',
      icon: Shield,
      type: 'navigation' as const,
      onPress: () => {}, // Placeholder for privacy settings
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: Info,
      type: 'navigation' as const,
      onPress: () => {}, // Placeholder for about page
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FadeInView delay={100}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Appearance
            </Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                {isDark ? (
                  <Moon size={20} color={theme.colors.primary} />
                ) : (
                  <Sun size={20} color={theme.colors.primary} />
                )}
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={isDark ? theme.colors.surface : theme.colors.surface}
            />
          </View>
        </Card>
      </FadeInView>

      <FadeInView delay={300}>
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Preferences
            </Text>
          </View>

          {settingsItems.map((item, index) => (
            <AnimatedButton
              key={item.id}
              accessibilityRole="switch"
              accessibilityLabel={item.title}
              onPress={item.type === 'navigation' ? item.onPress : undefined}
              style={styles.settingItem}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <item.icon size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.settingText}
        </Card>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Campus Report System v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Made with ❤️ for campus community
          </Text>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
