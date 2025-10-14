import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, LogOut, CircleHelp as HelpCircle, Info, Camera } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';

const themeColors = {
  student: {
    primary: '#2563EB',
    secondary: '#E0F2FE',
  },
  admin: {
    primary: '#DC2626',
    secondary: '#FEE2E2',
  },
  staff: {
    primary: '#10B981',
    secondary: '#D1FAE5',
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfileImage } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  
  const themeColor = useMemo(() => 
    themeColors[user?.role === 'admin' ? 'admin' : 'student'],
    [user?.role]
  );
  const colors = themeColors[user?.role || 'student'];

  const handleUpdateProfileImage = async () => {
    try {
      // Request permission explicitly for reliability across platforms
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // New API shape: array of media types; cast to any to satisfy TS in some Expo versions
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await updateProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    }
  };

  const handleLogout = () => {
    setConfirmVisible(true);
  };

  const confirmLogout = async () => {
    setConfirmVisible(false);
    await logout();
    router.replace('/login');
  };

  const handleHelp = () => {
    router.push('/help');
  };

  const handleAbout = () => {
    router.push('/about');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { shadowColor: themeColor.primary }]}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Profile</Text>
      </View>

      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.profileCard,
          { shadowColor: themeColor.primary, borderColor: theme.colors.border },
          !isDark && {
            // stronger, soft shadow in light mode
            shadowColor: '#27445D',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.22,
            shadowRadius: 18,
            elevation: 8,
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleUpdateProfileImage}
        >
          {user?.profileImage ? (
            <Image 
              source={{ uri: user.profileImage }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <User size={32} color={'#FFFFFF'} />
            </View>
          )}
          <View style={[styles.cameraIconOverlay, { backgroundColor: themeColor.primary }]}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
        <Text style={[styles.roleText, { color: '#E0ECFF' }]}>
          {user?.role === 'admin' ? 'Administrator' : 'Student'}
        </Text>
        <View style={[styles.idContainer, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={[styles.idText, { color: '#E5EDFF' }]}>
            {user?.role === 'admin' 
              ? `Staff ID: ${user?.staffId}` 
              : `Student ID: ${user?.studentId}`
            }
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.menuContainer}>
        {/* Dark mode toggle temporarily removed */}

        <TouchableOpacity style={styles.menuItemOuter} onPress={handleHelp}>
          <LinearGradient
            colors={isDark ? ['#0F172A', '#1E293B'] : ['#71BBB2', '#71BBB2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.menuItemGradient,
              { borderColor: theme.colors.border },
              !isDark && {
                shadowColor: '#27445D',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.16,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            <HelpCircle size={20} color={'#FFFFFF'} />
            <Text style={[styles.menuText, { color: '#FFFFFF' }]}>Help & Support</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItemOuter} onPress={handleAbout}>
          <LinearGradient
            colors={isDark ? ['#0F172A', '#1E293B'] : ['#71BBB2', '#71BBB2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.menuItemGradient,
              { borderColor: theme.colors.border },
              !isDark && {
                shadowColor: '#27445D',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.16,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            <Info size={20} color={'#FFFFFF'} />
            <Text style={[styles.menuText, { color: '#FFFFFF' }]}>About FixIt</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="primary"
        style={[styles.logoutButton, { backgroundColor: '#EF4444', borderColor: '#EF4444', shadowColor: '#EF4444' }]}
        textStyle={[styles.logoutText, { color: '#FFFFFF' }]}
      />

      {user?.role === 'admin' && (
        <Button
          title="Add Admin"
          onPress={() => router.push({ pathname: '/create-admin' })}
          variant="secondary"
          style={{ marginTop: 12, backgroundColor: '#27445D', borderColor: '#27445D', shadowColor: '#27445D' }}
          textStyle={{ color: '#FFFFFF' }}
        />
      )}

      {user?.role === 'admin' && (
        <Button
          title="Add Staff"
          onPress={() => router.push({ pathname: '/create-staff' })}
          variant="secondary"
          style={{ marginTop: 12, backgroundColor: '#10B981', borderColor: '#10B981', shadowColor: '#10B981' }}
          textStyle={{ color: '#FFFFFF' }}
        />
      )}

      {/* Themed Logout Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[styles.modalButton, { backgroundColor: isDark ? '#2A2A2E' : '#F1F5F9', borderColor: theme.colors.border }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                style={[styles.modalButton, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              >
                <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  idContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  idText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  menuContainer: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  menuText: {
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  logoutButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
  // Gradient menu item wrappers
  menuItemOuter: {
    marginBottom: 8,
    borderRadius: 16,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    // mimic elevation/shadow from original card
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});