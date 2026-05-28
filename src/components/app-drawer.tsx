import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useDrawer } from '@/contexts/drawer-context';
import { useCompany } from '@/contexts/company-context';
import { canSeeCompanyAdmin } from '@/services/permissions';
import { AuthContext } from '@/contexts/auth-context';
import { setThemePreference, useColorScheme } from '@/hooks/use-color-scheme';

function DrawerItem({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        {
          borderColor: theme.border,
          backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <ThemedText style={{ fontSize: 15 }}>{icon}</ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 13 }}>
          {label}
        </ThemedText>
      </View>
      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>›</ThemedText>
    </Pressable>
  );
}

function DarkModeToggle({ isDarkMode }: { isDarkMode: boolean }) {
  const theme = useTheme();
  // We slidetranslateX between 2px (left/Claro) and 82px (right/Escuro)
  const translateX = useRef(new Animated.Value(isDarkMode ? 82 : 2)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isDarkMode ? 82 : 2,
      useNativeDriver: true,
      damping: 16,
      mass: 0.8,
      stiffness: 130,
    }).start();
  }, [isDarkMode, translateX]);

  return (
    <View style={[styles.themeRow, { borderBottomColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 13 }}>
          🎨 Aparência do App
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
          Alternar modo claro / escuro
        </ThemedText>
      </View>
      <View style={[styles.themeSegmentedControl, { backgroundColor: theme.background, borderColor: theme.border }]}>
        
        {/* Sliding background indicator */}
        <Animated.View
          style={[
            styles.slidingBg,
            {
              transform: [{ translateX }],
              backgroundColor: theme.primary,
            },
          ]}
        />

        <Pressable
          onPress={() => setThemePreference('light')}
          style={styles.themeSegment}
        >
          <ThemedText
            type="smallBold"
            style={{
              fontSize: 10,
              fontFamily: Fonts.mono,
              color: !isDarkMode ? '#FFFFFF' : theme.textSecondary,
              zIndex: 2,
            }}
          >
            ☀️ Claro
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setThemePreference('dark')}
          style={styles.themeSegment}
        >
          <ThemedText
            type="smallBold"
            style={{
              fontSize: 10,
              fontFamily: Fonts.mono,
              color: isDarkMode ? '#FFFFFF' : theme.textSecondary,
              zIndex: 2,
            }}
          >
            🌙 Escuro
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export function AppDrawer() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { logout } = useContext(AuthContext);
  const { isOpen, close } = useDrawer();
  const { companyId, company, membership } = useCompany();

  const isCompanyLeader = canSeeCompanyAdmin(membership);
  const isDarkMode = colorScheme === 'dark';
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
    if (!companyId) return 'Nenhuma cadastrada';
    return company?.name ?? 'Minha empresa';
  }, [company?.name, companyId]);

  const handleContactSupport = () => {
    const msg = 'Abrindo chamado oficial de suporte na Coordenadoria de Extensão UERN. Retorno em 24h.';
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Suporte UERN', msg);
    }
  };

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
        {/* PREMIUM DRAWER HEADER */}
        <View style={[styles.header, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Image
              source={require('@/assets/images/tubarao.png')}
              style={{ width: 40, height: 40, resizeMode: 'contain' }}
            />
            <View>
              <ThemedText type="code" style={{ color: theme.primary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1.2 }}>
                SHARK TANK UERN
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 15, marginTop: 1 }}>
                Navegação Geral
              </ThemedText>
            </View>
          </View>
        </View>

        {/* SECTION: EMPRESA */}
        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
            <ThemedText type="code" style={{ color: theme.textSecondary, letterSpacing: 1, fontWeight: 'bold', fontSize: 10 }}>
              EMPRESA JÚNIOR
            </ThemedText>
          </View>
          
          <View style={[styles.companyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: Fonts.mono }}>CONECTADA</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              🏢 {companyTitle}
            </ThemedText>
          </View>

          <DrawerItem
            icon="💼"
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
              icon="👥"
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
                icon="⚙️"
                label="Gerenciar Empresa"
                onPress={() => {
                  close();
                  router.push(`/company/${companyId}/manage`);
                }}
              />
              <DrawerItem
                icon="👑"
                label="Transferir Liderança"
                onPress={() => {
                  close();
                  router.push(`/company/${companyId}/transfer-leadership`);
                }}
              />
            </>
          )}
        </View>

        {/* SECTION: CONTA */}
        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
            <ThemedText type="code" style={{ color: theme.textSecondary, letterSpacing: 1, fontWeight: 'bold', fontSize: 10 }}>
              OPÇÕES & CONTA
            </ThemedText>
          </View>

          <DarkModeToggle isDarkMode={isDarkMode} />

          <DrawerItem icon="👤" label="Editar Perfil" onPress={() => { close(); router.push('/profile?edit=1'); }} />
          <DrawerItem icon="💬" label="Suporte Técnico" onPress={() => { close(); handleContactSupport(); }} />
          <DrawerItem icon="🚪" label="Sair da Conta" onPress={() => { close(); logout(); }} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
        boxShadow: '10px 0 35px rgba(0,0,0,0.18)',
      } as any,
    }),
  },
  header: {
    paddingBottom: Spacing.three + 2,
    marginBottom: Spacing.two,
  },
  section: {
    paddingVertical: Spacing.two,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  bullet: {
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  companyCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  themeRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  themeSegmentedControl: {
    flexDirection: 'row',
    width: 164,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    padding: 2,
    position: 'relative',
    alignItems: 'center',
  },
  slidingBg: {
    position: 'absolute',
    left: 0,
    top: 2,
    bottom: 2,
    width: 78,
    borderRadius: 17,
  },
  themeSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
