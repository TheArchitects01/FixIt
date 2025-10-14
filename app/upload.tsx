import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync, thumbnailUrl } from '../utils/cloudinary';
import { Stack } from 'expo-router';

export default function UploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  const pickAndUpload = async () => {
    try {
      setSecureUrl(null);
      setPublicId(null);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // New API: use an array of media types; TS types may lag, so cast to any
        mediaTypes: ['images'] as any,
        quality: 0.9,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploading(true);
      const uploaded = await uploadImageAsync(uri, { folder: 'app-uploads' });
      setSecureUrl(uploaded.secure_url);
      setPublicId(uploaded.public_id);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload failed', e?.message || 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const thumbUrl = publicId ? thumbnailUrl(publicId, 300) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Upload Image' }} />

      <TouchableOpacity style={styles.button} onPress={pickAndUpload} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pick & Upload</Text>}
      </TouchableOpacity>

      {secureUrl && (
        <View style={styles.previewBox}>
          <Text style={styles.label}>Uploaded Image</Text>
          <Image source={{ uri: thumbUrl || secureUrl }} style={styles.preview} resizeMode="cover" />
          <Text style={styles.url} numberOfLines={2}>{secureUrl}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  button: {
    backgroundColor: '#3366FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  previewBox: {
    gap: 8,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  url: {
    fontSize: 12,
  },
});
