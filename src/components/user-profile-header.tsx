import React, { useState, useContext } from 'react';
import { View, Image, Text, StyleSheet, Platform, Pressable, Modal, Alert, ScrollView } from 'react-native';
import { AuthContext } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme, setThemePreference } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/contexts/drawer-context';
import { router } from 'expo-router';

const DayNightSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={{ width: 68, height: 38, justifyContent: 'center' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .switch {
            font-size: 14px;
            position: relative;
            display: inline-block;
            width: 4em;
            height: 2.2em;
            border-radius: 30px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            user-select: none;
          }
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #2a2a2a;
            transition: 0.4s;
            border-radius: 30px;
            overflow: hidden;
          }
          .slider:before {
            position: absolute;
            content: "";
            height: 1.2em;
            width: 1.2em;
            border-radius: 20px;
            left: 0.5em;
            bottom: 0.5em;
            transition: 0.4s;
            transition-timing-function: cubic-bezier(0.81, -0.04, 0.38, 1.5);
            box-shadow: inset 8px -4px 0px 0px #fff;
          }
          .switch input:checked + .slider {
            background-color: #00a6ff;
          }
          .switch input:checked + .slider:before {
            transform: translateX(1.8em);
            box-shadow: inset 15px -4px 0px 15px #ffcf48;
          }
          .star {
            background-color: #fff;
            border-radius: 50%;
            position: absolute;
            width: 5px;
            transition: all 0.4s;
            height: 5px;
          }
          .star_1 { left: 2.5em; top: 0.5em; }
          .star_2 { left: 2.2em; top: 1.2em; }
          .star_3 { left: 3em; top: 0.9em; }
          .switch input:checked + .slider .star {
            opacity: 0;
          }
          .cloud {
            width: 3.5em;
            position: absolute;
            bottom: -1.4em;
            left: -1.1em;
            opacity: 0;
            transition: all 0.4s;
          }
          .switch input:checked + .slider .cloud {
            opacity: 1;
          }
        ` }} />
        <label className="switch">
          <input 
            type="checkbox" 
            checked={!value} 
            onChange={(e) => onValueChange(!e.target.checked)} 
          />
          <span className="slider">
            <div className="star star_1" />
            <div className="star star_2" />
            <div className="star star_3" />
            <svg viewBox="0 0 16 16" className="cloud_1 cloud">
              <path transform="matrix(.77976 0 0 .78395-299.99-418.63)" fill="#fff" d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925" />
            </svg>
          </span>
        </label>
      </View>
    );
  }

  return (
    <Pressable onPress={() => onValueChange(!value)} style={{ padding: 4 }}>
      <Text style={{ fontSize: 24 }}>{value ? '🌙' : '☀️'}</Text>
    </Pressable>
  );
};

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  message: string;
  time: string;
}

const PIXEL_AVATARS: { [key: string]: any } = {
  'robo': require('@/assets/images/robo.png'),
  'homem-1': require('@/assets/images/homem-1.png'),
  'homem-2': require('@/assets/images/homem-2.png'),
  'homem-3': require('@/assets/images/homem-3.png'),
  'mulher-1': require('@/assets/images/mulher-1.png'),
  'mulher-2': require('@/assets/images/mulher-2.png'),
  'mulher-3': require('@/assets/images/mulher-3.png'),
};

const NOTIFICATION_ICONS: { [key: string]: any } = {
  '📢': require('@/assets/images/alto-falante.png'),
  '🦈': require('@/assets/images/tubarao-pixel.png'),
};

const renderAvatarHelper = (avatar: string | undefined, currentRole: string, size: number = 34) => {
  if (avatar && PIXEL_AVATARS[avatar]) {
    return <Image source={PIXEL_AVATARS[avatar]} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  if (avatar ? (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('data:image')) : false) {
    return <Image source={{ uri: avatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <Text style={{ fontSize: size * 0.52, textAlign: 'center' }}>
      {avatar || (currentRole === 'admin' ? '👩‍💻' : currentRole === 'lider' ? '⚡' : '🎓')}
    </Text>
  );
};

export function UserProfileHeader({ onMenuPress }: { onMenuPress?: () => void }) {
  const { session, logout } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const drawer = useDrawer();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      icon: '📢',
      title: 'Mural de Notícias',
      message: 'UERN Tech fechou nova parceria B2B de desenvolvimento!',
      time: '2 min atrás',
    },
    {
      id: 'notif-2',
      icon: '🦈',
      title: 'Shark Tank UERN',
      message: 'Seu projeto GenBarber recebeu 15 novos votos da torcida popular.',
      time: '1h atrás',
    },
    {
      id: 'notif-3',
      icon: '🎓',
      title: 'Caminho das Pedras',
      message: 'O mentor Carlos Alberto aprovou os requisitos da Etapa 1.',
      time: '3h atrás',
    },
  ]);
  
  if (!session) return null;
  
  const currentRole = session.role || 'estudante';
  const isDarkMode = colorScheme === 'dark';
  
  // Dynamic greeting based on time of day
  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    if (hour >= 18 && hour < 24) return 'Boa noite';
    return 'Boa madrugada';
  };

  const handleContactSupport = () => {
    const msg = 'Abrindo chamado oficial de suporte na Coordenadoria de Extensão UERN. Retorno em 24h.';
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Suporte UERN', msg);
    }
  };

  const toggleThemePreference = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    setThemePreference(nextTheme);
  };

  const handleMarkAllRead = () => {
    setHasUnread(false);
    if (Platform.OS === 'web') {
      alert('Todas as notificações foram marcadas como lidas.');
    } else {
      Alert.alert('Notificações', 'Todas as notificações foram marcadas como lidas.');
    }
  };

  return (
    <View style={styles.profileHeaderContainer}>
      <View style={styles.headerLeftActions}>
        <Pressable
          onPress={() => {
            if (onMenuPress) onMenuPress();
            else drawer.open();
          }}
          style={({ pressed }) => [
            styles.menuOpenTouchTarget,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && { opacity: 0.7 },
          ]}>
          <Image
            source={require('@/assets/images/menu-aberto.png')}
            style={[styles.menuOpenImage, { tintColor: theme.text }]}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      <View style={styles.headerRightActions}>
        
        {/* A. NOTIFICATION BELL WITH BADGE */}
        <Pressable 
          onPress={() => setIsNotificationsOpen(true)}
          style={({ pressed }) => [
            styles.notificationTouchTarget,
            pressed && { opacity: 0.7 }
          ]}
        >
          <View style={[styles.bellContainer, { borderColor: theme.border }]}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {hasUnread && (
              <View style={styles.notificationBadgeDot} />
            )}
          </View>
        </Pressable>

        {/* B. PROFILE AVATAR CIRCLE */}
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [
            styles.avatarTouchTarget,
            pressed && { opacity: 0.7 }
          ]}
        >
          <View style={[styles.avatarFrame, { borderColor: theme.primary }]}>
            {renderAvatarHelper(session.avatar, currentRole, 34)}
          </View>
        </Pressable>

      </View>

      {/* 1. NOTIFICATIONS POPUP DROPDOWN CARD */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isNotificationsOpen}
        onRequestClose={() => setIsNotificationsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlayBackdrop} 
          onPress={() => setIsNotificationsOpen(false)}
        >
          <View style={{ flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center', position: 'relative' }}>
            <Pressable 
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.popoverCard, 
                { 
                  backgroundColor: theme.backgroundElement, 
                  borderColor: theme.border,
                  right: 70, // Slightly left of the avatar popover
                }
              ]}
            >
              {/* Close button */}
              <Pressable 
                onPress={() => setIsNotificationsOpen(false)} 
                style={styles.closeCardBtn}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </Pressable>

              {/* Title Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 4 }}>
                <Text style={{ fontSize: 16 }}>🔔</Text>
                <Text style={[styles.popoverUserName, { color: theme.text, fontSize: 15 }]}>
                  Notificações
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 4 }]} />

              {/* List */}
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notifRow}>
                    {NOTIFICATION_ICONS[item.icon] ? (
                      <Image source={NOTIFICATION_ICONS[item.icon]} style={{ width: 34, height: 34, marginTop: 2, resizeMode: 'contain' }} />
                    ) : (
                      <Text style={styles.notifIcon}>{item.icon}</Text>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>
                        {item.message}
                      </Text>
                      <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                        {item.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />

              {/* Action Button */}
              {hasUnread ? (
                <Pressable 
                  onPress={handleMarkAllRead}
                  style={({ pressed }) => [
                    styles.markReadAllBtn,
                    { backgroundColor: theme.backgroundSelected },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Text style={[styles.markReadAllText, { color: theme.primary }]}>
                    Marcar todas como lidas
                  </Text>
                </Pressable>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>
                    ✓ Nenhuma notificação pendente
                  </Text>
                </View>
              )}

            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* 2. PROFILE QUICK-SETTINGS DROPDOWN CARD */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isProfileOpen}
        onRequestClose={() => setIsProfileOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlayBackdrop} 
          onPress={() => setIsProfileOpen(false)}
        >
          <View style={{ flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center', position: 'relative' }}>
            <Pressable 
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.popoverCard, 
                { 
                  backgroundColor: theme.backgroundElement, 
                  borderColor: theme.border,
                  right: 16,
                }
              ]}
            >
              
              <Pressable 
                onPress={() => setIsProfileOpen(false)} 
                style={styles.closeCardBtn}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </Pressable>

              {/* Header Profile and Greetings Row */}
              <View style={styles.greetingHeaderRow}>
                <View style={[styles.popoverAvatarFrame, { borderColor: theme.primary }]}>
                  {renderAvatarHelper(session.avatar, currentRole, 48)}
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>
                    {getGreetingMessage()},
                  </Text>
                  <Text style={[styles.popoverUserName, { color: theme.text }]} numberOfLines={1}>
                    {session.name || `@${session.username}`}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={[styles.roleBadge, { backgroundColor: theme.backgroundSelected }]}>
                      <Text style={[styles.roleBadgeText, { color: theme.primary }]}>
                        {currentRole.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Email details */}
              <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>
                {session.email || `${session.username || 'aluno'}@uern.br`}
              </Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* Settings Action Items */}
              <View style={styles.settingsMenu}>
                
                <View style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
                    <Text style={[styles.menuText, { color: theme.text }]}>
                      {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                    </Text>
                  </View>
                  <DayNightSwitch 
                    value={isDarkMode} 
                    onValueChange={toggleThemePreference} 
                  />
                </View>

                <Pressable 
                  onPress={handleContactSupport}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && styles.menuRowPressed
                  ]}
                >
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuIcon}>🛠️</Text>
                    <Text style={[styles.menuText, { color: theme.text }]}>Suporte Técnico</Text>
                  </View>
                  <Text style={[styles.chevron, { color: theme.textSecondary }]}>➔</Text>
                </Pressable>

                <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />

                <Pressable 
                  onPress={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  style={({ pressed }) => [
                    styles.logoutRow,
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Text style={styles.menuIcon}>🚪</Text>
                  <Text style={styles.logoutText}>Sair da Conta</Text>
                </Pressable>

              </View>

            </Pressable>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  profileHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 10,
    width: '100%',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
      },
    }),
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOpenTouchTarget: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOpenImage: {
    width: 18,
    height: 18,
  },
  notificationTouchTarget: {
    padding: 2,
    borderRadius: 22,
  },
  bellContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    position: 'relative',
  },
  notificationBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF453A',
  },
  avatarTouchTarget: {
    padding: 2,
    borderRadius: 22,
  },
  avatarFrame: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  // Modal Backdrop
  modalOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
  },

  // Popover Card Design
  popoverCard: {
    position: 'absolute',
    top: 60,
    width: 290,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  closeCardBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  popoverAvatarFrame: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  popoverAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  popoverUserName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emailLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    width: '100%',
    opacity: 0.5,
  },

  // Settings action list
  settingsMenu: {
    gap: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  menuRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF453A',
  },

  // Notification rows
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  notifIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  notifMessage: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  notifTime: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    opacity: 0.7,
  },
  markReadAllBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  markReadAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
