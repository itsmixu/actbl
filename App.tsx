import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { supabase } from './src/lib/supabase';
import { AppNavigator } from './src/navigation/AppNavigator';

async function handleOAuthCallback(url: string) {
  try {
    const parsed = Linking.parse(url);
    if (!parsed.path?.includes('auth/callback')) return;

    let accessToken =
      typeof parsed.queryParams?.access_token === 'string'
        ? parsed.queryParams.access_token
        : null;
    let refreshToken =
      typeof parsed.queryParams?.refresh_token === 'string'
        ? parsed.queryParams.refresh_token
        : null;

    if (!accessToken || !refreshToken) {
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
        accessToken = accessToken ?? hashParams.get('access_token');
        refreshToken = refreshToken ?? hashParams.get('refresh_token');
      }
    }

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
  } catch (err) {
    console.warn('[auth] OAuth callback handling failed', err);
  }
}

function OAuthCallbackHandler() {
  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      if (url) void handleOAuthCallback(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => void handleOAuthCallback(url));
    return () => sub.remove();
  }, []);
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <OAuthCallbackHandler />
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
