import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, FileText, User, Settings, Users, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';

export default function TabLayout() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? theme.colors.background : '#FFFFFF' }}>
      <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: isDark ? 'transparent' : '#27445D',
              borderTopColor: theme.colors.border,
              paddingBottom: 8,
              paddingTop: 8,
              height: 80,
            },
            tabBarBackground: () => (
              isDark ? (
                <LinearGradient
                  colors={[ '#0F172A', '#1E293B' ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                />
              ) : null
            ),
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
            }}
          />
          
          <Tabs.Screen
            name="reports"
            options={{
              title: user?.role === 'admin' ? 'Manage Reports' : (user?.role === 'staff' ? 'My Jobs' : 'My Reports'),
              tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
            }}
          />

        <Tabs.Screen
          name="activity"
          options={{
            title: user?.role === 'admin' ? 'Notifications' : 'Activity',
            tabBarIcon: ({ size, color }) => <Bell size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
        </Tabs>
    </View>
  );
}