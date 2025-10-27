import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/common/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Card } from '@/components/common/Card';
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, Play, RefreshCw, MessageSquare } from 'lucide-react-native';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiGet, apiPatch } from '@/services/api';

interface Report {
  id: string;
  title: string;
  description: string;
  location: { building: string; room: string };
  createdAt: any;
  updatedAt?: any;
  studentId: string;
  studentName?: string;
  photo?: string;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  statusNotes?: Array<{
    status: string;
    note: string;
    createdAt: string;
  }>;
  conversationNotes?: Array<{
    sender: 'admin' | 'staff';
    senderName: string;
    senderImage?: string | null;
    message: string;
    createdAt: string;
  }>;
  assignmentNote?: string;
  rejectionNote?: string;
}

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { socket, connected, joinReport, leaveReport } = useSocket();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [statusToUpdateAfterNote, setStatusToUpdateAfterNote] = useState<'in-progress' | 'completed' | null>(null);
  const [conversationMessage, setConversationMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const formatDate = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatDateTime = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatNoteDate = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const load = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const resp = await apiGet(`/reports/${id}` as const, token || undefined);
      const r = resp?.report;
      const normalized: Report = {
        id: r.id,
        title: r.title,
        description: r.description,
        location: r.location,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        studentId: r.studentId,
        studentName: r.studentName,
        photo: r.photo,
        assignedTo: r.assignedTo,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: (r.priority || 'low') as Report['priority'],
        statusNotes: r.statusNotes || [],
        conversationNotes: r.conversationNotes || [],
        assignmentNote: r.assignmentNote,
        rejectionNote: r.rejectionNote,
      };
      console.log('Conversation notes:', r.conversationNotes);
      setReport(normalized);
    } catch (e) {
      console.error('Load report failed', e);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    
    // Join the report room for real-time updates
    if (id) {
      joinReport(id);
      console.log(`🔌 Joined report room: ${id}`);
    }
    
    return () => {
      if (id) {
        leaveReport(id);
        console.log(`👋 Left report room: ${id}`);
      }
    };
  }, [id]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !id) return;

    const handleNewMessage = (data: { reportId: string; message: any }) => {
      console.log('📨 New message received via socket:', data);
      if (data.reportId === id) {
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            conversationNotes: [...(prev.conversationNotes || []), data.message]
          };
        });
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, id]);

  // Auto-scroll to bottom when conversation notes change
  useEffect(() => {
    if (report?.conversationNotes && report.conversationNotes.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [report?.conversationNotes?.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const updateStatus = async (newStatus: Report['status']) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const statusChanged = report?.status !== newStatus;
      
      await apiPatch(`/reports/${id}`, { status: newStatus }, token || undefined);
      setReport(prev => prev ? { ...prev, status: newStatus } : prev);
      
      if (statusChanged) {
        Alert.alert('Success', `Report marked as ${newStatus}`);
      }
    } catch (e) {
      console.error('Update status failed', e);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Report not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#000000' }}
        keyboardVerticalOffset={28=}
      >
      <ScrollView 
        style={[styles.container, { backgroundColor: '#000000' }]}
        contentContainerStyle={{ backgroundColor: '#000000', flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      > 
        <View style={[styles.header, { borderBottomColor: isDark ? theme.colors.border : '#1F3A52' }]}> 
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/reports');
          }
        }} style={styles.backButton}>
          <ArrowLeft size={24} color={isDark ? theme.colors.text : '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? theme.colors.text : '#FFFFFF', flex: 1 }]}>Report Details</Text>
        <TouchableOpacity 
          onPress={onRefresh} 
          disabled={refreshing}
          style={[styles.refreshButton, { backgroundColor: user?.role === 'admin' ? '#DC2626' : user?.role === 'staff' ? '#10B981' : '#3B82F6' }]}
        >
          <RefreshCw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Card style={[styles.card, isDark ? { backgroundColor: theme.colors.card, borderColor: theme.colors.border } : { backgroundColor: '#27445D', borderColor: '#1F3A52' }]}>
        <Text style={[styles.reportTitle, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>{report.title}</Text>
        {/* Name */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Name: {report.studentName || 'N/A'}</Text>
        </View>
        {/* ID (Student) */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>ID: {report.studentId || 'N/A'}</Text>
        </View>
        {/* Time (Created) */}
        <View style={styles.metaRow}>
          <Clock size={14} color={isDark ? theme.colors.textSecondary : '#BFD2FF'} />
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Time: {formatDateTime(report.createdAt)}</Text>
        </View>
        {/* Location */}
        <View style={styles.metaRow}>
          <MapPin size={14} color={isDark ? theme.colors.textSecondary : '#BFD2FF'} />
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Location: {report.location?.building || 'N/A'} - {report.location?.room || 'N/A'}</Text>
        </View>
        {/* Priority */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Priority: {report.priority}</Text>
        </View>
        {/* Updated */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>Updated: {report.updatedAt ? formatDateTime(report.updatedAt) : '—'}</Text>
        </View>
        {/* Status (badge) */}
        <View style={[styles.metaRow, { marginTop: 2 }]}> 
          <StatusBadge status={report.status === 'completed' ? 'completed' : (report.status as any)} />
        </View>
        <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>Description</Text>
        <Text style={[styles.description, { color: isDark ? theme.colors.textSecondary : '#D7E2FF' }]}>{report.description || 'No description provided.'}</Text>

        {/* Staff Status Change Buttons */}
        {user?.role === 'staff' && report.status !== 'completed' && (
          <View style={[styles.actionButtonsContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            {report.status === 'pending' ? (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#10B981' }]} 
                onPress={() => {
                  setNoteModalVisible(true);
                  setStatusToUpdateAfterNote('in-progress');
                }}
              >
                <Play size={18} color="#FFFFFF" />
                <Text style={styles.actionText}>Start Progress</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#10B981' }]} 
                onPress={() => {
                  setNoteModalVisible(true);
                  setStatusToUpdateAfterNote('completed');
                }}
              >
                <CheckCircle size={18} color="#FFFFFF" />
                <Text style={styles.actionText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Status Notes Section */}
        {report.statusNotes && report.statusNotes.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.text : '#FFFFFF', marginTop: 16 }]}>Status Updates</Text>
            {report.statusNotes.map((note, index) => (
              <View key={index} style={[styles.noteContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
                <View style={styles.noteHeader}>
                  <Text style={[styles.noteStatus, { color: '#10B981' }]}>
                    {note.status === 'resolved' ? 'Completed' : note.status.replace('-', ' ')}
                  </Text>
                  <Text style={[styles.noteDate, { color: isDark ? theme.colors.textSecondary : '#BFD2FF' }]}>
                    {formatNoteDate(note.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.noteText, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>{note.note}</Text>
              </View>
            ))}
          </>
        )}

        {/* Conversation Notes Section - Only for Admin and Staff */}
        {(user?.role === 'admin' || user?.role === 'staff') && report.status !== 'completed' && report.assignedTo && (
          <>
            {/* Chat Header */}
            <View style={[styles.chatHeader, { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
            }]}>
              <View style={styles.chatHeaderLeft}>
                <MessageSquare size={20} color={isDark ? '#FFFFFF' : '#FFFFFF'} />
                <Text style={[styles.chatTitle, { color: isDark ? '#FFFFFF' : '#FFFFFF' }]}>
                  Messages
                </Text>
              </View>
            </View>

            {/* Chat Messages Area */}
            <View style={[styles.chatContainer, { 
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
            }]}>
              {report.conversationNotes && report.conversationNotes.length > 0 ? (
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.messagesScroll} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                  {report.conversationNotes.map((msg, index) => {
                    const isMyMessage = (user?.role === 'admin' && msg.sender === 'admin') || 
                                       (user?.role === 'staff' && msg.sender === 'staff');
                    return (
                      <View 
                        key={index} 
                        style={[
                          styles.messageWrapper,
                          isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper
                        ]}
                      >
                        {/* Their message - show profile image */}
                        {!isMyMessage && (
                          msg.senderImage ? (
                            <Image 
                              source={{ uri: msg.senderImage }} 
                              style={styles.profileImage}
                            />
                          ) : (
                            <View style={[styles.profileImagePlaceholder, { 
                              backgroundColor: msg.sender === 'admin' ? '#DC2626' : '#10B981' 
                            }]}>
                              <Text style={styles.profileImageText}>
                                {msg.senderName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )
                        )}
                        
                        {/* Message Bubble */}
                        <View style={styles.messageBubbleContainer}>
                          <View 
                            style={[
                              styles.messageBubble,
                              isMyMessage 
                                ? [styles.myMessage, { backgroundColor: user?.role === 'admin' ? '#DC2626' : '#10B981' }]
                                : [styles.theirMessage, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]
                            ]}
                          >
                            {!isMyMessage && (
                              <Text style={[styles.senderNameInBubble, { 
                                color: msg.sender === 'admin' ? '#DC2626' : '#10B981' 
                              }]}>
                                {msg.senderName}
                              </Text>
                            )}
                            <Text style={[styles.messageText, { 
                              color: isMyMessage ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')
                            }]}>
                              {msg.message}
                            </Text>
                            <Text style={[styles.messageTime, { 
                              color: isMyMessage ? 'rgba(255,255,255,0.7)' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')
                            }]}>
                              {formatNoteDate(msg.createdAt)}
                            </Text>
                          </View>
                        </View>

                        {/* My message - show profile image */}
                        {isMyMessage && (
                          msg.senderImage ? (
                            <Image 
                              source={{ uri: msg.senderImage }} 
                              style={styles.profileImage}
                            />
                          ) : (
                            <View style={[styles.profileImagePlaceholder, { 
                              backgroundColor: user?.role === 'admin' ? '#DC2626' : '#10B981' 
                            }]}>
                              <Text style={styles.profileImageText}>
                                {msg.senderName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyMessagesContainer}>
                  <MessageSquare size={48} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.noMessages, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)' }]}>
                    No messages yet
                  </Text>
                  <Text style={[styles.noMessagesSubtext, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }]}>
                    Start the conversation below
                  </Text>
                </View>
              )}
            </View>

            {/* Message Input Area */}
            <View style={[styles.messageInputContainer, { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
            }]}>
              <TextInput
                style={[styles.messageInput, { 
                  color: isDark ? theme.colors.text : '#FFFFFF',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)'
                }]}
                placeholder="Type a message..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)'}
                value={conversationMessage}
                onChangeText={setConversationMessage}
                multiline
                maxLength={500}
                editable={!isSendingMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, { 
                  backgroundColor: user?.role === 'admin' ? '#DC2626' : '#10B981',
                  opacity: conversationMessage.trim() && !isSendingMessage ? 1 : 0.5
                }]}
                disabled={!conversationMessage.trim() || isSendingMessage}
                onPress={async () => {
                  if (!conversationMessage.trim() || isSendingMessage) return;
                  
                  try {
                    setIsSendingMessage(true);
                    const messageToSend = conversationMessage.trim();
                    setConversationMessage('');
                    
                    const token = await AsyncStorage.getItem('token');
                    await apiPatch(`/reports/${id}`, { 
                      conversationNote: messageToSend
                    }, token || undefined);
                    
                    console.log('✅ Message sent successfully');
                  } catch (e) {
                    console.error('Send message failed', e);
                    Alert.alert('Error', 'Failed to send message. Please try again.');
                  } finally {
                    setIsSendingMessage(false);
                  }
                }}
              >
                {isSendingMessage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MessageSquare size={20} color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {report.photo && (
          <Image source={{ uri: report.photo }} style={styles.image} resizeMode="cover" />
        )}

        {/* Note Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={noteModalVisible}
          onRequestClose={() => setNoteModalVisible(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? theme.colors.card : '#27445D' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>
                {statusToUpdateAfterNote === 'in-progress' ? 'Start Progress' :
                 statusToUpdateAfterNote === 'completed' ? 'Mark Complete' :
                 'Add Note'}
              </Text>
              <TextInput
                style={[styles.noteInput, { 
                  color: isDark ? theme.colors.text : '#FFFFFF',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                }]}
                placeholder="Enter your note..."
                placeholderTextColor={isDark ? theme.colors.textSecondary : '#BFD2FF'}
                value={note}
                onChangeText={setNote}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setNoteModalVisible(false);
                    setNote('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#10B981' }]}
                  onPress={async () => {
                    if (!note.trim()) {
                      Alert.alert('Error', 'Please enter a note');
                      return;
                    }
                    try {
                      // Close modal first for better UX
                      setNoteModalVisible(false);
                      
                      const token = await AsyncStorage.getItem('token');
                      await apiPatch(`/reports/${id}`, { 
                        statusNote: note.trim(),
                        status: statusToUpdateAfterNote || report.status
                      }, token || undefined);
                      
                      // Clear states and reload after API call
                      setNote('');
                      setStatusToUpdateAfterNote(null);
                      await load();
                      Alert.alert('Success', statusToUpdateAfterNote ? 
                        `Status updated to ${statusToUpdateAfterNote} with note` : 
                        'Note added successfully'
                      );
                    } catch (e) {
                      console.error('Update failed', e);
                      Alert.alert('Error', 'Failed to update');
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 10, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  backButton: { padding: 6, borderRadius: 8 },
  refreshButton: { padding: 8, borderRadius: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  card: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  reportTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText: { fontSize: 14 },
  sectionLabel: { marginTop: 12, fontSize: 14, fontWeight: '700' },
  description: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  image: { width: '100%', height: 220, borderRadius: 10, marginTop: 12 },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 14,
  },
  // Status Notes styles
  noteContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteStatus: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noteDate: {
    fontSize: 12,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  noteInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Chat UI Styles
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
    minHeight: 200,
    maxHeight: 400,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubbleContainer: {
    maxWidth: '70%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    borderBottomLeftRadius: 4,
  },
  senderNameInBubble: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMessages: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  noMessagesSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  messageInputContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  // Chat Modal Styles
  chatModalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  chatModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  chatInput: {
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 20,
  },
  chatModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  chatModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  sendButtonModal: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatModalButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
});
