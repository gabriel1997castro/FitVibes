import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from './services/supabase';

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthRoute = segments[0] === 'login' || segments[0] === 'register';
      
      if (!session && !isAuthRoute) {
        // Redirect to the sign-in page if not signed in
        router.replace('/login');
      } else if (session && isAuthRoute) {
        // Redirect to the tab bar if signed in
        router.replace('/(tabs)/groups');
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthRoute = segments[0] === 'login' || segments[0] === 'register';
      
      if (!session && !isAuthRoute) {
        // Redirect to the sign-in page if not signed in
        router.replace('/login');
      } else if (session && isAuthRoute) {
        // Redirect to the tab bar if signed in
        router.replace('/(tabs)/groups');
      }
    });
  }, [segments]);

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 