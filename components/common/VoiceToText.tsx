import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Mic, MicOff, Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { AnimatedButton, PulseView, LoadingDots } from './AnimatedComponents';

interface VoiceToTextProps {
  onTextReceived: (text: string) => void;
  placeholder?: string;
  maxDuration?: number;
  language?: string;
}

export function VoiceToText({
  onTextReceived,
  placeholder = "Tap to start recording",
  maxDuration = 30000, // 30 seconds
  language = 'en-US',
}: VoiceToTextProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= maxDuration / 1000) {
            stopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable microphone access to use voice input.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        await requestPermissions();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        const { Haptics } = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // In a real implementation, you would send the audio to a speech-to-text service
        // For now, we'll simulate the process and provide a mock response
        await simulateSpeechToText(uri);
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateSpeechToText = async (audioUri: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock responses for demonstration
    const mockResponses = [
      "There's a broken light in the main hallway near room 201. It's been flickering for days and needs immediate attention.",
      "The air conditioning in the library is not working properly. It's too hot to study comfortably.",
      "Water fountain on the second floor is leaking and creating a puddle. Someone might slip and get hurt.",
      "Elevator in building A is making strange noises and moving very slowly. It might need maintenance.",
      "Parking lot lights are not working in section B. It's unsafe to walk there at night.",
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    onTextReceived(randomResponse);

    // Provide success feedback
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const speakInstructions = () => {
    const instructions = isRecording 
      ? "Recording in progress. Tap the microphone to stop."
      : "Tap the microphone and describe your issue. Speak clearly for best results.";
    
    Speech.speak(instructions, {
      language,
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting microphone permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Microphone access denied</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermissions}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Input</Text>
        <TouchableOpacity onPress={speakInstructions} style={styles.helpButton}>
          <Volume2 size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <Text style={styles.instructions}>
        {isRecording 
          ? "Listening... Speak clearly about your issue"
          : isProcessing
          ? "Processing your voice input..."
          : placeholder
        }
      </Text>

      {isRecording && (
        <View style={styles.recordingInfo}>
          <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
          <Text style={styles.maxDuration}>/ {formatDuration(maxDuration / 1000)}</Text>
        </View>
      )}

      <View style={styles.microphoneContainer}>
        {isRecording ? (
          <PulseView pulseScale={1.1} duration={1000}>
            <AnimatedButton
              style={[styles.micButton, styles.micButtonActive]}
              onPress={stopRecording}
              animationType="scale"
            >
              <Mic size={32} color="#FFFFFF" />
            </AnimatedButton>
          </PulseView>
        ) : (
          <AnimatedButton
            style={styles.micButton}
            onPress={startRecording}
            disabled={isProcessing}
            animationType="bounce"
          >
            {isProcessing ? (
              <LoadingDots color="#3B82F6" size={8} />
            ) : (
              <MicOff size={32} color="#3B82F6" />
            )}
          </AnimatedButton>
        )}
      </View>

      {isRecording && (
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <Text style={styles.stopButtonText}>Stop Recording</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Tips for better results:</Text>
        <Text style={styles.tip}>• Speak clearly and at normal pace</Text>
        <Text style={styles.tip}>• Minimize background noise</Text>
        <Text style={styles.tip}>• Describe the issue in detail</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  instructions: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  recordingInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  duration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  maxDuration: {
    fontSize: 14,
    color: '#64748B',
  },
  microphoneContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  stopButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  tips: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
