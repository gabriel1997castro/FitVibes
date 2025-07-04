import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from './components/Button';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
  group_id: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchNotifications();
  }, []);

  const checkAuthAndFetchNotifications = async () => {
    try {
      setError(null);
      setAuthStatus('Checking authentication...');
      
      // Test multiple auth methods
      console.log('=== AUTH DEBUG START ===');
      
      // Method 1: Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session method:', { session: !!session, error: sessionError });
      
      // Method 2: Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User method:', { user: !!user, error: userError });
      
      // Method 3: Get current user
      const currentUser = supabase.auth.getUser();
      console.log('Current user method:', { currentUser: !!currentUser });
      
      console.log('=== AUTH DEBUG END ===');

      if (sessionError) {
        setAuthStatus('Session error: ' + sessionError.message);
        throw new Error('Session error: ' + sessionError.message);
      }

      if (userError) {
        setAuthStatus('User error: ' + userError.message);
        throw new Error('User error: ' + userError.message);
      }

      if (!session && !user) {
        setAuthStatus('No active session or user found');
        throw new Error('No active session or user found');
      }

      const activeUser = user || session?.user;
      if (!activeUser) {
        setAuthStatus('No user found in session');
        throw new Error('No user found in session');
      }

      setAuthStatus(`Authenticated as: ${activeUser.email} (${activeUser.id})`);
      console.log('Active user:', activeUser.id);

      // Now fetch notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', activeUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Notifications fetched:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error in checkAuthAndFetchNotifications:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    await checkAuthAndFetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'balance_created':
      case 'payment_made':
      case 'payment_received':
        if (notification.group_id) {
          router.push(`/groups/${notification.group_id}/balance`);
        }
        break;
      case 'achievement':
        // Navigate to profile or achievements screen
        router.push('/(tabs)/profile');
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {format(new Date(item.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.authStatus}>{authStatus}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar notificações</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <Text style={styles.authStatus}>{authStatus}</Text>
        <Button
          title="Tentar novamente"
          onPress={fetchNotifications}
          style={styles.retryButton}
          textStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma notificação</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  authStatus: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
}); 