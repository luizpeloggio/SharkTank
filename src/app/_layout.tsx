import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppDrawer } from '@/components/app-drawer';
import { LoginScreen } from '@/components/login-screen';
import { AuthContext } from '@/contexts/auth-context';
import { CompanyProvider } from '@/contexts/company-context';
import { DrawerProvider } from '@/contexts/drawer-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStorage, UserSession } from '@/services/storage';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const data = await AppStorage.getSession();
      setSession(data);
      // Deliberate delay to appreciate the splash loading
      setTimeout(() => {
        setIsLoading(false);
      }, 2500);
    }
    loadSession();
  }, []);

  const login = (newSession: UserSession) => {
    setSession(newSession);
  };

  const logout = async () => {
    await AppStorage.clearSession();
    setSession(null);
  };

  const updateSession = async (newSession: UserSession) => {
    await AppStorage.setSession(newSession);
    setSession(newSession);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ session, login, logout, updateSession, isLoading }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {session ? (
          <CompanyProvider>
            <DrawerProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="company/index" />
              </Stack>
              <AppDrawer />
            </DrawerProvider>
          </CompanyProvider>
        ) : (
          <LoginScreen onLoginSuccess={login} />
        )}
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.88,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[loadingStyles.container, { backgroundColor: isDark ? '#090D16' : '#F1F5F9' }]}>
      <Animated.Image
        source={require('@/assets/images/tubarao.png')}
        style={[
          loadingStyles.logo,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={isDark ? '#4d4dff' : '#0000cc'} style={{ marginTop: 24, marginBottom: 12 }} />
      <Text style={[loadingStyles.text, { color: isDark ? '#94A3B8' : '#475569' }]}>Carregando aplicativo...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 270,
    height: 270,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
