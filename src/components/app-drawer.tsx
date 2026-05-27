import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDrawer } from '@/contexts/drawer-context';
import { useCompany } from '@/contexts/company-context';
import { canSeeCompanyAdmin } from '@/services/permissions';

function DrawerItem({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { borderBottomColor: theme.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <ThemedText type="smallBold" style={{ color: theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function AppDrawer() {
  const theme = useTheme();
  const { isOpen, close } = useDrawer();
  const { companyId, company, membership } = useCompany();

  const isCompanyLeader = canSeeCompanyAdmin(membership);
  const translateX = useRef(new Animated.Value(-280)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toX = isOpen ? 0 : -280;
    const toOpacity = isOpen ? 1 : 0;
    Animated.parallel([
      Animated.timing(translateX, { toValue: toX, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: toOpacity, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [isOpen, opacity, translateX]);

  const companyTitle = useMemo(() => {
    if (!companyId) return 'Sem empresa';
    return company?.name ?? 'Minha empresa';
  }, [company?.name, companyId]);

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.backgroundElement,
            borderRightColor: theme.border,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
            MENU
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: theme.text, marginTop: 4 }}>
            Navegação
          </ThemedText>
        </View>

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
            APP
          </ThemedText>
          <DrawerItem label="Principal" onPress={() => { close(); router.push('/'); }} />
          <DrawerItem label="Vitrine" onPress={() => { close(); router.push('/vitrine'); }} />
          <DrawerItem label="Shark Tank" onPress={() => { close(); router.push('/sharktank'); }} />
          <DrawerItem label="Perfil" onPress={() => { close(); router.push('/profile'); }} />
          <DrawerItem label="Guia" onPress={() => { close(); router.push('/guia'); }} />
        </View>

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
            EMPRESA
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.text, marginBottom: Spacing.two }}>
            {companyTitle}
          </ThemedText>

          <DrawerItem
            label={companyId ? 'Perfil da Empresa' : 'Criar minha Empresa'}
            onPress={() => {
              close();
              if (companyId) {
                router.push(`/company/${companyId}`);
                return;
              }
              router.push('/company');
            }}
          />

          {companyId && (
            <DrawerItem
              label="Membros"
              onPress={() => {
                close();
                router.push(`/company/${companyId}/members`);
              }}
            />
          )}

          {companyId && isCompanyLeader && (
            <>
              <DrawerItem
                label="Gerenciar Empresa"
                onPress={() => {
                  close();
                  router.push(`/company/${companyId}/manage`);
                }}
              />
              <DrawerItem
                label="Transferir Liderança"
                onPress={() => {
                  close();
                  router.push(`/company/${companyId}/transfer-leadership`);
                }}
              />
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    paddingTop: 56,
    paddingHorizontal: Spacing.three,
    borderRightWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '8px 0 30px rgba(0,0,0,0.35)',
      } as any,
    }),
  },
  header: {
    paddingBottom: Spacing.three,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: Spacing.three,
    marginTop: Spacing.three,
  },
  item: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
});

