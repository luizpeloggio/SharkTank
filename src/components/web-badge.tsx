import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import React from 'react';
import { useColorScheme, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>
      <ThemedView style={{
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: 8,
        backgroundColor: scheme === 'dark' ? '#131C2E' : '#E2E8F0',
        borderColor: scheme === 'dark' ? '#1E293B' : '#CBD5E1',
        borderWidth: 1,
      }}>
        <ThemedText type="code" style={{ fontSize: 11, color: scheme === 'dark' ? '#94A3B8' : '#64748B' }}>
          ⚡ Powered by Expo v55
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});
