import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/components/common/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Settings, LogOut, Shield, Briefcase, Key } from 'lucide-react-native';
import { ChangePassword } from '@/components/profile/ChangePassword';

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Please log in to view profile
        </Text>
      </View>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin':
        return <Shield size={24} color="#FFFFFF" />;
      case 'staff':
        return <Briefcase size={24} color="#FFFFFF" />;
      default:
        return <User size={24} color="#FFFFFF" />;
    }
  };

  const getRoleColor = (): [string, string] => {
    switch (user.role) {
      case 'admin':
        return ['#DC2626', '#EF4444'];
      case 'staff':
        return ['#2563EB', '#3B82F6'];
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Profile Header */}
      <LinearGradient
        colors={getRoleColor()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.profileInfo}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              {user.profileImage ? (
                <User size={40} color="#FFFFFF" />
              ) : (
                getRoleIcon()
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                {user.staffId && ` • ID: ${user.staffId}`}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </View>
        
        {/* Password Change Button - Simple text version for testing */}
        <View style={styles.testButton}>
          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.testButtonText}>CHANGE PASSWORD</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Profile Actions */}
      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Settings</Text>
          
          {/* Only show for admins and staff */}
          {(user.role === 'admin' || user.role === 'staff') && (
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {/* We'll handle this inline with the ChangePassword component */}}
            >
              <Lock size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>Change Password</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionItem, { borderBottomColor: 'transparent' }]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>


        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Name</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Role</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Text>
          </View>

          {user.staffId && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Staff ID</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.staffId}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Change Password</Text>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <ChangePassword />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    paddingTop: 60,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  passwordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  passwordButtonAbsolute: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
