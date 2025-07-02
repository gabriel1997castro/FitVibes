import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from './services/supabase';

export default function Index() {
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is signed in, redirect to home
        router.replace('/groups');
      } else {
        // No user is signed in, redirect to login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      router.replace('/login');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
} 