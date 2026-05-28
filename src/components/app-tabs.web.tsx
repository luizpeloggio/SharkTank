import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type RouteName = 'index' | 'guia' | 'vitrine' | 'events' | 'sharktank';

const ICON_MAP: Record<RouteName, any> = {
  index: require('@/assets/images/tabIcons/cardapio.png'),
  guia: require('@/assets/images/tabIcons/trail.png'),
  vitrine: require('@/assets/images/trofeu-1.png'),
  events: require('@/assets/images/tabIcons/foguete-inclinado.png'),
  sharktank: require('@/assets/images/tubaraozao.png'),
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton routeName="index">Principal</TabButton>
          </TabTrigger>
          <TabTrigger name="vitrine" href="/vitrine" asChild>
            <TabButton routeName="vitrine">Conquistas</TabButton>
          </TabTrigger>
          <TabTrigger name="events" href="/events" asChild>
            <TabButton routeName="events">Eventos</TabButton>
          </TabTrigger>
          <TabTrigger name="sharktank" href="/sharktank" asChild>
            <TabButton routeName="sharktank">Shark Tank</TabButton>
          </TabTrigger>
          <TabTrigger name="guia" href="/guia" asChild>
            <TabButton routeName="guia" isCenter>
              Rota
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  routeName,
  isCenter = false,
  ...props
}: TabTriggerSlotProps & { routeName: RouteName; isCenter?: boolean }) {
  const theme = useTheme();
  const iconSource = ICON_MAP[routeName];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.pressable,
        routeName === 'vitrine' && styles.leftCenterSpacing,
        routeName === 'events' && styles.rightCenterSpacing,
        isCenter && styles.centerPressable,
        pressed && styles.pressed,
        isCenter && styles.centerButtonWrap,
      ]}>
      <View
        style={[
          isCenter ? styles.centerButton : styles.tabButtonView,
          {
            backgroundColor: isCenter
              ? theme.primary
              : isFocused
                ? theme.backgroundSelected
                : theme.backgroundElement,
            borderColor: isCenter ? theme.backgroundElement : isFocused ? theme.primary : 'transparent',
            borderWidth: isCenter ? 4 : 1,
          },
        ]}>
        {iconSource && (
          <Image
            source={iconSource}
            style={[
              isCenter ? styles.centerIcon : styles.tabIcon,
              routeName === 'vitrine' && styles.trophyIcon,
              { tintColor: isCenter ? '#FFFFFF' : isFocused ? theme.primary : theme.textSecondary },
            ]}
            resizeMode="contain"
          />
        )}
      </View>
      {!isCenter && (
        <ThemedText type="smallBold" style={[styles.tabLabel, { color: isFocused ? theme.primary : theme.textSecondary }]}>
          {children}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        {
          backgroundColor: colors.backgroundElement,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      ]}>
      <View style={[styles.notchCutout, { backgroundColor: colors.background }]} />
      <View style={styles.innerContainer}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    paddingBottom: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notchCutout: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -42,
    width: 84,
    height: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 2,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pressed: {
    opacity: 0.78,
  },
  pressable: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonView: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 11,
  },
  centerButtonWrap: {
    position: 'absolute',
    left: '50%',
    top: -24,
    transform: [{ translateX: -28 }],
    zIndex: 5,
  },
  centerPressable: {
    width: 56,
    minWidth: 56,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  trophyIcon: {
    width: 32,
    height: 32,
  },
  centerIcon: {
    width: 27,
    height: 27,
  },
  leftCenterSpacing: {
    marginRight: 30,
  },
  rightCenterSpacing: {
    marginLeft: 30,
  },
});
