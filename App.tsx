import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { supabase } from './src/lib/supabase';
import { AppNavigator } from './src/navigation/AppNavigator';

/**
 * Handle Supabase magic-link callbacks. When a user taps the link in their
 * email, the OS reopens the app with a URL like:
 *   actbl://auth/callback#access_token=...&refresh_token=...
 * We extract those tokens and hand them to Supabase to establish the session.
 */
async function handleAuthDeepLink(url: string) {
  try {
    const parsed = Linking.parse(url);
    if (!parsed.path?.includes('auth/callback')) return;

    // Tokens may arrive either as query params or as URL fragment params,
    // depending on the email template. Linking.parse normalizes the query
    // params; for the hash fragment we have to parse manually.
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
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[auth] deep-link handling failed', err);
  }
}

function DeepLinkHandler() {
  useEffect(() => {
    // Handle the URL the app was launched with, if any.
    void Linking.getInitialURL().then((url) => {
      if (url) void handleAuthDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleAuthDeepLink(url);
    });

    return () => {
      sub.remove();
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <DeepLinkHandler />
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
