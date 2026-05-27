import {
    TabList,
    TabListProps,
    Tabs,
    TabSlot,
    TabTrigger,
    TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Principal</TabButton>
          </TabTrigger>
          <TabTrigger name="guia" href="/guia" asChild>
            <TabButton>Guia</TabButton>
          </TabTrigger>
          <TabTrigger name="vitrine" href="/vitrine" asChild>
            <TabButton>Vitrine</TabButton>
          </TabTrigger>
          <TabTrigger name="sharktank" href="/sharktank" asChild>
            <TabButton>Shark Tank</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();

  // Map route names to icon images
  const iconMap: { [key: string]: any } = {
    index: require('@/assets/images/tabIcons/cardapio.png'),
    guia: require('@/assets/images/tabIcons/caminho-do-segmento.png'),
    vitrine: require('@/assets/images/tabIcons/foguete-inclinado.png'),
    sharktank: require('@/assets/images/tubaraozao.png'),
    profile: require('@/assets/images/tabIcons/profile.png'),
  };

  // Extract route name from props if available
  const routeName = (props as any)['data-name'] || (children as string)?.toLowerCase();
  const iconSource = iconMap[routeName];

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: isFocused ? theme.primary : 'transparent',
            borderWidth: 1,
          },
        ]}>
        {iconSource && (
          <Image
            source={iconSource}
            style={[
              styles.tabIcon,
              { tintColor: isFocused ? theme.primary : theme.textSecondary },
            ]}
            resizeMode="contain"
          />
        )}
        <ThemedText type="smallBold" style={{ color: isFocused ? theme.primary : theme.textSecondary }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={[styles.innerContainer, { borderColor: colors.border, borderWidth: 1 }]}>
        <ThemedText type="smallBold" style={[styles.brandText, { color: colors.primary }]}>
          💥 ImpactoEJ
        </ThemedText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link" style={{ color: colors.textSecondary }}>Docs</ThemedText>
            <SymbolView
              tintColor={colors.textSecondary}
              name="arrow.up.right.square"
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
