import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primary}
      labelStyle={{
        selected: { color: colors.primary },
        default: { color: colors.textSecondary },
      }}>
      <NativeTabs.Trigger name="index">
        <Label>Principal</Label>
        <Icon src={require('@/assets/images/tabIcons/feed.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="guia">
        <Label>Guia</Label>
        <Icon src={require('@/assets/images/tabIcons/trail.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vitrine">
        <Label>Vitrine</Label>
        <Icon src={require('@/assets/images/tabIcons/vitrine.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sharktank">
        <Label>Shark Tank</Label>
        <Icon src={require('@/assets/images/tabIcons/sharktank.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Perfil</Label>
        <Icon src={require('@/assets/images/tabIcons/profile.png')} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
