import { TabList, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RouteName = 'index' | 'guia' | 'vitrine' | 'events' | 'sharktank';

const ICON_MAP: Record<RouteName, any> = {
  index: require('@/assets/images/tabIcons/cardapio.png'),
  guia: require('@/assets/images/tabIcons/caminho-do-segmento.png'),
  vitrine: require('@/assets/images/tabIcons/foguete-inclinado.png'),
  events: require('@/assets/images/calendario.png'),
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
            <TabButton routeName="vitrine">Vitrine</TabButton>
          </TabTrigger>

          <TabTrigger name="events" href="/events" asChild>
            <TabButton routeName="events">Eventos</TabButton>
          </TabTrigger>

          <TabTrigger name="sharktank" href="/sharktank" asChild>
            <TabButton routeName="sharktank">Shark Tank</TabButton>
          </TabTrigger>

          <TabTrigger name="guia" href="/guia" asChild>
            <TabButton routeName="guia" isCenter>
              Guia
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function CustomTabList(props: React.ComponentProps<typeof TabList>) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.two),
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
      ]}>
      <View style={[styles.notchCutout, { backgroundColor: theme.background }]} />
      <View style={styles.tabBar}>
        {props.children}
      </View>
    </View>
  );
}

function TabButton({
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
          isCenter ? styles.centerButton : styles.tabButton,
          {
            backgroundColor: isCenter
              ? theme.primary
              : isFocused
                ? theme.backgroundSelected
                : theme.backgroundElement,
            borderColor: isCenter ? theme.backgroundElement : isFocused ? theme.primary : 'transparent',
          },
        ]}>
        <Image
          source={iconSource}
          style={[
            isCenter ? styles.centerIcon : styles.tabIcon,
            { tintColor: isCenter ? '#FFFFFF' : isFocused ? theme.primary : theme.textSecondary },
          ]}
          resizeMode="contain"
        />
      </View>
      {!isCenter && <Text style={[styles.label, { color: isFocused ? theme.primary : theme.textSecondary }]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    paddingHorizontal: 0,
  },
  tabBar: {
    minHeight: 72,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  notchCutout: {
    position: 'absolute',
    top: -1,
    left: '50%',
    marginLeft: -42,
    width: 84,
    height: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 2,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  leftCenterSpacing: {
    marginRight: 30,
  },
  rightCenterSpacing: {
    marginLeft: 30,
  },
  tabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    borderWidth: 3,
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
  centerIcon: {
    width: 24,
    height: 24,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
  },
});
