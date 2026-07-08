import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompany } from '@/contexts/company-context';
import { canManageCompanyPosts } from '@/services/permissions';
import { AuthContext } from '@/contexts/auth-context';
import { CompanyRepository, type CompanyPostCategory } from '@/services/company-repository';
import { AppStorage } from '@/services/storage';
import type { EarnedAchievement } from '@/services/storage';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CompanyProfileScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ companyId: string }>();
  const { session, logout } = useContext(AuthContext);
  const { companyId: activeCompanyId, company, membership, refresh: refreshCompanyContext } = useCompany();

  const companyId = params.companyId;
  const isActiveCompany = activeCompanyId === companyId;
  const canPost = isActiveCompany && canManageCompanyPosts({ membership, systemRole: session?.role ?? null });
  const canEditCompany = isActiveCompany && (membership?.role === 'leader' || session?.role === 'admin');

  const [viewCompany, setViewCompany] = useState(company);
  const title = useMemo(() => viewCompany?.name ?? 'Empresa', [viewCompany?.name]);

  const [members, setMembers] = useState<any[]>([]);
  const [userIndex, setUserIndex] = useState<Record<string, { name?: string; username?: string; avatar?: string }>>({});
  const [posts, setCompanyPosts] = useState<any[]>([]);
  const [companyAchievements, setCompanyAchievements] = useState<EarnedAchievement[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<CompanyPostCategory>('noticia');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount] = useState(128);

  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [companyEditName, setCompanyEditName] = useState('');
  const [companyEditUsername, setCompanyEditUsername] = useState('');
  const [companyEditDescription, setCompanyEditDescription] = useState('');
  const [companyEditLocation, setCompanyEditLocation] = useState('');
  const [companyEditBadges, setCompanyEditBadges] = useState('');
  const [companyEditAvatar, setCompanyEditAvatar] = useState('');
  const [companyEditCover, setCompanyEditCover] = useState('');
  const [isSavingCompanyDetails, setIsSavingCompanyDetails] = useState(false);

  const [isCompanyAvatarPreviewVisible, setIsCompanyAvatarPreviewVisible] = useState(false);
  const [isCompanyCoverPreviewVisible, setIsCompanyCoverPreviewVisible] = useState(false);

  // NOTIFICATIONS & PASSWORD MODAL STATE
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif-1',
      icon: '📢',
      title: 'Mural de Notícias',
      message: 'UERN Tech fechou nova parceria B2B de desenvolvimento!',
      time: '2 min atrás',
      read: false,
    },
    {
      id: 'notif-2',
      icon: '🦈',
      title: 'Shark Tank UERN',
      message: 'Seu projeto de pitch recebeu novos votos da torcida popular!',
      time: '1h atrás',
      read: false,
    },
    {
      id: 'notif-3',
      icon: '🎓',
      title: 'Jornada de Inovação',
      message: 'A coordenação de extensão aprovou a documentação de sua EJ.',
      time: '3h atrás',
      read: false,
    },
    {
      id: 'notif-4',
      icon: '💡',
      title: 'Novo Desafio',
      message: 'Participe do próximo hackathon com mentoria exclusiva.',
      time: '1 dia atrás',
      read: true,
    },
  ]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [recentActivities] = useState<any[]>([
    {
      icon: '🚀',
      title: 'Nova vaga de estágio aberta no portal.',
      time: 'Ontem',
    },
    {
      icon: '🤝',
      title: 'Parceria de projeto firmada com a Reitoria.',
      time: '3 dias atrás',
    },
    {
      icon: '🏆',
      title: 'Conquistou o selo de EJ de Alto Impacto.',
      time: '1 semana atrás',
    },
  ]);

  const toggleNotificationRead = async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    setNotifications(updated);
    if (session) {
      await AsyncStorage.setItem(`sharktank_notifications_${session.id}`, JSON.stringify(updated));
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (session) {
      await AsyncStorage.setItem(`sharktank_notifications_${session.id}`, JSON.stringify(updated));
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    if (session) {
      await AsyncStorage.setItem(`sharktank_notifications_${session.id}`, JSON.stringify([]));
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      const msg = 'Por favor, preencha todos os campos de senha.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erro ⚠️', msg);
      return;
    }
    if (currentPassword.length < 6) {
      const msg = 'A senha atual deve ter no mínimo 6 caracteres.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erro ⚠️', msg);
      return;
    }
    const isStrengthValid = (text: string) => {
      const hasUpper = /[A-Z]/.test(text);
      const hasLower = /[a-z]/.test(text);
      const hasDigit = /[0-9]/.test(text);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(text);
      return hasUpper && hasLower && hasDigit && hasSpecial;
    };
    if (!isStrengthValid(newPassword)) {
      const msg = 'A Nova Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Senha Fraca ⚠️', msg);
      return;
    }
    setIsSavingPassword(true);
    try {
      await AsyncStorage.setItem('@uern_impactoej_password', newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setIsPasswordModalVisible(false);
      const successMsg = 'Sua senha foi alterada com sucesso! 🔒';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('Sucesso! ✨', successMsg);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPassword(false);
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      if (session) {
        const stored = await AsyncStorage.getItem(`sharktank_notifications_${session.id}`);
        if (stored) {
          try {
            setNotifications(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse notifications', e);
          }
        }
      }
    };
    loadNotifications();
  }, [session]);

  const load = React.useCallback(async () => {
    const [targetCompany, m, p, users] = await Promise.all([
      CompanyRepository.getCompany(companyId),
      CompanyRepository.listMembers(companyId),
      CompanyRepository.listPostsByCompany(companyId),
      AppStorage.getUsers(),
    ]);
    setViewCompany(targetCompany);
    setMembers(m);
    setCompanyPosts(p);
    setCompanyAchievements(await AppStorage.syncCompanyAchievements(companyId, {
      membersCount: m.length,
      eventCount: p.filter(post => post.category === 'evento').length,
      followersCount,
    }));
    setUserIndex(Object.fromEntries(users.map(u => [u.id, { name: u.name, username: u.username, avatar: u.avatar }])));
  }, [companyId, followersCount]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const createPost = async () => {
    if (!session) return;
    if (!canPost) return;
    if (!newTitle.trim() || !newContent.trim()) return;
    if (editingPostId) {
      await CompanyRepository.updateCompanyPost(editingPostId, {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
    } else {
      await CompanyRepository.addCompanyPost({
        id: `cp_${Date.now()}`,
        companyId,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        createdAt: Date.now(),
        authorUserId: session.id,
      });
    }
    setIsPostModalOpen(false);
    setEditingPostId(null);
    setNewTitle('');
    setNewContent('');
    setNewCategory('noticia');
    await load();
  };

  const startEditPost = (post: any) => {
    setEditingPostId(post.id);
    setNewTitle(post.title);
    setNewContent(post.content);
    setNewCategory(post.category);
    setIsPostModalOpen(true);
  };

  const deletePost = async (postId: string) => {
    if (!canPost) return;
    if (Platform.OS === 'web') {
      if (!window.confirm('Excluir este post da empresa?')) return;
    } else {
      const answer = await new Promise<boolean>((resolve) => {
        Alert.alert('Excluir post', 'Tem certeza que deseja apagar este post?', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!answer) return;
    }
    await CompanyRepository.deleteCompanyPost(postId);
    await load();
  };

  const startEditCompany = () => {
    setCompanyEditName(viewCompany?.name ?? '');
    setCompanyEditUsername(viewCompany?.username ?? '');
    setCompanyEditDescription(viewCompany?.description ?? '');
    setCompanyEditLocation(viewCompany?.location ?? '');
    setCompanyEditBadges(viewCompany?.badges?.join(', ') ?? '');
    setCompanyEditAvatar(viewCompany?.avatar ?? '');
    setCompanyEditCover(viewCompany?.coverImage ?? '');
    setIsCompanyEditModalOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!viewCompany) return;
    if (!companyEditName.trim()) {
      Alert.alert('Erro', 'O nome da empresa não pode ser vazio.');
      return;
    }
    const usernameTrimmed = companyEditUsername.trim();
    if (!usernameTrimmed) {
      Alert.alert('Erro', 'O nome de usuário da empresa não pode ser vazio.');
      return;
    }
    if (!usernameTrimmed.startsWith('@')) {
      Alert.alert('Nome de Usuário Inválido ⚠️', 'O Nome de Usuário da empresa deve começar com "@" (ex: @exemplo123).');
      return;
    }
    const hasUpper = /[A-Z]/.test(usernameTrimmed);
    const hasLower = /[a-z]/.test(usernameTrimmed);
    const hasDigit = /[0-9]/.test(usernameTrimmed);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(usernameTrimmed);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      Alert.alert('Nome de Usuário Fraco ⚠️', 'O Nome de Usuário da empresa deve conter letra maiúscula, letras minúsculas, números e caracteres especiais.');
      return;
    }

    setIsSavingCompanyDetails(true);
    try {
      const normalizedUsername = usernameTrimmed.toLowerCase();
      const allCompanies = await CompanyRepository.listCompanies();
      const isTaken = allCompanies.some(c => c.id !== viewCompany.id && c.username?.toLowerCase().trim() === normalizedUsername);
      if (isTaken) {
        Alert.alert('Nome de Usuário Duplicado ⚠️', 'Este nome de usuário já está em uso por outra empresa.');
        setIsSavingCompanyDetails(false);
        return;
      }

      const updated = {
        ...viewCompany,
        name: companyEditName.trim(),
        username: usernameTrimmed,
        description: companyEditDescription.trim(),
        location: companyEditLocation.trim(),
        badges: companyEditBadges.split(',').map(b => b.trim()).filter(Boolean),
        avatar: companyEditAvatar.trim(),
        coverImage: companyEditCover.trim(),
        updatedAt: Date.now(),
      };
      await CompanyRepository.upsertCompany(updated);
      setViewCompany(updated);
      await refreshCompanyContext();
      setIsCompanyEditModalOpen(false);
      Alert.alert('Sucesso', 'Perfil da empresa atualizado com sucesso.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar os dados da empresa.');
    } finally {
      setIsSavingCompanyDetails(false);
    }
  };

  const pickCompanyAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('É necessário conceder permissão de acesso à galeria para enviar uma foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = selectedAsset.base64 ? `data:image/jpeg;base64,${selectedAsset.base64}` : selectedAsset.uri;
        setCompanyEditAvatar(uri);
      }
    } catch (e) {
      console.error('Error picking company avatar:', e);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = (e: any) => {
            setCompanyEditAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    }
  };

  const pickCompanyCover = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('É necessário conceder permissão de acesso à galeria para enviar uma foto de capa.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = selectedAsset.base64 ? `data:image/jpeg;base64,${selectedAsset.base64}` : selectedAsset.uri;
        setCompanyEditCover(uri);
      }
    } catch (e) {
      console.error('Error picking company cover:', e);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = (e: any) => {
            setCompanyEditCover(reader.result as string);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    }
  };

  const handleShareCompany = async () => {
    try {
      await Share.share({
        message: `Confira o perfil da empresa júnior ${viewCompany?.name || 'EJ'} no SharkTank UERN!`,
        url: Platform.OS === 'web' ? window.location.href : undefined,
      });
    } catch (error) {
      console.error('Error sharing company profile:', error);
    }
  };

  const renderCompanyAvatar = (size: number) => {
    const avatar = viewCompany?.avatar;
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('data:image'))) {
      return <Image source={{ uri: avatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={{ color: theme.primary, fontWeight: '800', fontSize: size * 0.35 }}>
          {(viewCompany?.name || 'E').slice(0, 1).toUpperCase()}
        </ThemedText>
      </View>
    );
  };

  const formatRelativeDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) return 'há hoje';
    if (diff < 2 * day) return 'há 1 dia';
    if (diff < 7 * day) return `há ${Math.floor(diff / day)} dias`;
    const weeks = Math.floor(diff / (7 * day));
    return weeks <= 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  };

  const yearsActive = useMemo(() => {
    if (!viewCompany?.createdAt) return 0;
    return Math.max(1, Math.floor((Date.now() - viewCompany.createdAt) / (365 * 24 * 60 * 60 * 1000)));
  }, [viewCompany?.createdAt]);

  const companyMeta = useMemo(() => {
    const area = viewCompany?.badges?.[0]?.replace('#', '') || 'Tecnologia';
    const location = viewCompany?.location?.trim();
    return [area, location].filter(Boolean).join(' · ');
  }, [viewCompany?.badges, viewCompany?.location]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.six }}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Pressable 
              style={[styles.banner, { backgroundColor: theme.background, borderBottomColor: theme.border, overflow: 'hidden' }]}
              onPress={() => setIsCompanyCoverPreviewVisible(true)}
            >
              {viewCompany?.coverImage ? (
                <Image source={{ uri: viewCompany.coverImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <>
                  <View style={[styles.bannerGlow, { backgroundColor: theme.backgroundSelected }]} />
                  <View style={[styles.bannerGlowSecondary, { backgroundColor: theme.primary }]} />
                </>
              )}
            </Pressable>

            <View style={[styles.profileHeadRow, { justifyContent: 'space-between', paddingRight: Spacing.four }]}>
              <Pressable 
                style={[styles.avatarFrame, { borderColor: theme.backgroundElement, backgroundColor: theme.background }]}
                onPress={() => setIsCompanyAvatarPreviewVisible(true)}
              >
                {renderCompanyAvatar(82)}
              </Pressable>

              <View style={{ flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two, alignItems: 'center' }}>
                <Pressable
                  onPress={handleShareCompany}
                  style={({ pressed }) => [
                    styles.shareIconButton,
                    { borderColor: theme.border, backgroundColor: theme.background },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Image 
                    source={require('@/assets/images/aviao-de-papel.png')} 
                    style={{ width: 14, height: 14, resizeMode: 'contain', tintColor: theme.textSecondary }} 
                  />
                </Pressable>
                {canEditCompany && (
                  <Pressable
                    onPress={startEditCompany}
                    style={({ pressed }) => [
                      styles.editBtn,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary, fontSize: 11 }}>
                      Editar
                    </ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setIsFollowing(v => !v)}
                  style={({ pressed }) => [
                    styles.followBtn,
                    { borderColor: theme.border, backgroundColor: isFollowing ? theme.backgroundSelected : theme.background },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: isFollowing ? theme.primary : theme.textSecondary, fontSize: 11 }}>
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.identitySection}>
              <View style={styles.titleRow}>
                <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 20, flex: 1 }}>
                  {title}
                </ThemedText>
              </View>
              {viewCompany?.username ? (
                <ThemedText type="small" style={{ color: theme.primary, marginTop: 2, fontWeight: 'bold' }}>
                  {viewCompany.username}
                </ThemedText>
              ) : null}
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                {companyMeta}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 6, lineHeight: 20 }}>
                {viewCompany?.description || 'Sem descrição da empresa.'}
              </ThemedText>
              <ThemedText type="code" style={{ color: theme.textSecondary, marginTop: 8, fontSize: 11 }}>
                <ThemedText type="code" style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>
                  {followersCount}
                </ThemedText>
                {' seguidores'}
              </ThemedText>
            </View>

            <View style={[styles.statsRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={styles.statCol}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>{posts.length}</ThemedText>
                <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 9 }}>projetos</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statCol}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>{members.length}</ThemedText>
                <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 9 }}>membros</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statCol}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>{yearsActive}</ThemedText>
                <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 9 }}>anos ativa</ThemedText>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
                CONQUISTAS
              </ThemedText>
            </View>
            {companyAchievements.length > 0 ? (
              <View style={styles.achievementsGrid}>
                {companyAchievements.map((badge) => (
                  <View
                    key={badge.id}
                    style={[
                      styles.achievementCard,
                      {
                        backgroundColor: badge.backgroundColor,
                        borderColor: badge.color,
                      },
                    ]}
                  >
                    <View style={[styles.achievementIconWrap, { backgroundColor: badge.color }]}>
                      <ThemedText style={styles.achievementIcon}>{badge.icon}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 13 }}>
                        {badge.name}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 15 }}>
                        {badge.description}
                      </ThemedText>
                      <ThemedText type="code" style={{ color: badge.color, fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>
                        {badge.category.toUpperCase()} · #{badge.id.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyAchievements, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText style={{ fontSize: 22 }}>🏁</ThemedText>
                <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 10 }}>
                  Sem conquistas de empresa ainda
                </ThemedText>
              </View>
            )}

          <View style={styles.sectionHeader}>
            <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
              MEMBROS
            </ThemedText>
            <Pressable onPress={() => router.push(`/company/${companyId}/members`)}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Ver todos
              </ThemedText>
            </Pressable>
          </View>

          <View style={{ height: Spacing.two }} />
          {members.slice(0, 5).map((m: any) => (
            <Pressable key={m.userId} style={[styles.memberRow, { borderBottomColor: theme.border }]}>
              <View style={styles.memberLeft}>
                <View style={[styles.memberAvatar, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="code" style={{ color: theme.text, fontSize: 10, fontWeight: '700' }}>
                    {(userIndex[m.userId]?.name || userIndex[m.userId]?.username || 'MB')
                      .split(' ')
                      .slice(0, 2)
                      .map((v: string) => v[0]?.toUpperCase() || '')
                      .join('')}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    {userIndex[m.userId]?.name || userIndex[m.userId]?.username || 'Membro da empresa'}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11 }}>
                    {m.title || (m.role === 'leader' ? 'Presidente' : 'Membro')}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 12 }}>
                ›
              </ThemedText>
            </Pressable>
          ))}

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          <View style={styles.sectionTitleRow}>
            <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
              POSTS RECENTES
            </ThemedText>
            {canPost && (
              <Pressable onPress={() => setIsPostModalOpen(true)}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  Novo post +
                </ThemedText>
              </Pressable>
            )}
          </View>

          <FlatList
            data={posts}
            keyExtractor={(p: any) => p.id}
            scrollEnabled={false}
            renderItem={({ item }: any) => (
              <View style={[styles.postCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.postHeader}>
                  <View style={styles.postMetaRow}>
                    <View style={[styles.typeBadge, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                      <ThemedText type="code" style={{ color: theme.text, fontSize: 10, fontWeight: '700' }}>
                        {item.category === 'vaga' ? 'Vaga' : item.category === 'evento' ? 'Evento' : 'Notícia'}
                      </ThemedText>
                    </View>
                    <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 10 }}>
                      {formatRelativeDate(item.createdAt)}
                    </ThemedText>
                  </View>
                  {canPost && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable onPress={() => startEditPost(item)}>
                        <ThemedText type="code" style={{ color: theme.primary, fontWeight: '700' }}>Editar</ThemedText>
                      </Pressable>
                      <Pressable onPress={() => deletePost(item.id)}>
                        <ThemedText type="code" style={{ color: '#EF4444', fontWeight: '700' }}>Excluir</ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  {item.title}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {item.content}
                </ThemedText>
              </View>
            )}
            ListEmptyComponent={
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
                Nenhuma postagem ainda.
              </ThemedText>
            }
          />

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          <View style={styles.sectionTitleRow}>
            <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
              ATIVIDADE RECENTE
            </ThemedText>
          </View>
          <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
            {recentActivities.map((activity, index) => (
              <View key={`${activity.title}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
                  <ThemedText style={{ color: theme.text, fontSize: 14 }}>{activity.icon}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="small" style={{ color: theme.text }}>{activity.title}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>{activity.time}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          <View style={styles.mockSection}>
            <ThemedText type="code" style={[styles.mockSectionTitle, { color: theme.textSecondary }]}>CONFIGURAÇÕES</ThemedText>
            <View style={styles.accountList}>
              <Pressable 
                onPress={() => setIsNotificationsModalVisible(true)}
                style={({ pressed }) => [styles.accountRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
              >
                <ThemedText style={[styles.accountIcon, { color: theme.textSecondary }]}>🔔</ThemedText>
                <ThemedText type="small" style={[styles.accountLabel, { color: theme.text }]}>Notificações</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>›</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setIsPasswordModalVisible(true)}
                style={({ pressed }) => [styles.accountRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
              >
                <ThemedText style={[styles.accountIcon, { color: theme.textSecondary }]}>🔒</ThemedText>
                <ThemedText type="small" style={[styles.accountLabel, { color: theme.text }]}>Alterar Senha</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>›</ThemedText>
              </Pressable>
              <Pressable
                onPress={logout}
                style={({ pressed }) => [styles.accountRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
              >
                <ThemedText style={[styles.accountIcon, { color: theme.textSecondary }]}>🚪</ThemedText>
                <ThemedText type="small" style={[styles.accountLabel, { color: theme.text }]}>Sair</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>›</ThemedText>
              </Pressable>
            </View>
          </View>

          </View>

        <Modal
          animationType="slide"
          transparent
          visible={isPostModalOpen}
          onRequestClose={() => setIsPostModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <ThemedText type="subtitle" style={{ color: theme.text }}>
                  {editingPostId ? 'Editar post da empresa' : 'Novo post da empresa'}
                </ThemedText>
                <Pressable onPress={() => setIsPostModalOpen(false)}>
                  <ThemedText style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              <View style={{ padding: Spacing.four, gap: Spacing.three }}>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Título"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                />
                <TextInput
                  value={newContent}
                  onChangeText={setNewContent}
                  placeholder="Conteúdo"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[styles.input, { minHeight: 120, textAlignVertical: 'top', backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['noticia', 'vaga', 'evento'] as const).map((cat) => {
                    const active = newCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setNewCategory(cat)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: active ? theme.primary : theme.border,
                          backgroundColor: active ? theme.backgroundSelected : theme.background,
                        }}
                      >
                        <ThemedText type="smallBold" style={{ color: active ? theme.primary : theme.textSecondary, fontSize: 11 }}>
                          {cat.toUpperCase()}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={createPost}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                    {editingPostId ? 'Salvar alterações' : 'Publicar'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ================= NOTIFICATIONS MODAL ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isNotificationsModalVisible}
          onRequestClose={() => setIsNotificationsModalVisible(false)}
        >
          <View style={styles.centeredModalOverlay}>
            <View style={[styles.centeredModalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: Spacing.four }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary, fontSize: 11 }}>
                    CENTRAL DE ALERTAS
                  </ThemedText>
                  <ThemedText type="subtitle" style={{ color: theme.text, marginTop: 4 }}>
                    Notificações
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsNotificationsModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background, width: 36, height: 36, borderRadius: 18 }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Modal Content */}
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingVertical: Spacing.four }} showsVerticalScrollIndicator={false}>
                
                {notifications.length === 0 ? (
                  <View style={{ padding: Spacing.six, alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText style={{ fontSize: 48, marginBottom: Spacing.two }}>📭</ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Nenhuma notificação encontrada</ThemedText>
                  </View>
                ) : (
                  <View style={{ gap: Spacing.three }}>
                    {notifications.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleNotificationRead(item.id)}
                        style={[
                          styles.notificationCard,
                          { 
                            backgroundColor: item.read ? theme.background : theme.backgroundSelected,
                            borderColor: item.read ? theme.border : theme.primary,
                          }
                        ]}
                      >
                        <View style={[styles.notificationIconWrap, { backgroundColor: theme.backgroundElement }]}>
                          <ThemedText style={{ fontSize: 20 }}>{item.icon}</ThemedText>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ThemedText type="smallBold" style={{ color: theme.text }}>
                              {item.title}
                            </ThemedText>
                            {!item.read && (
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
                            )}
                          </View>
                          <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 13 }}>
                            {item.message}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }}>
                            {item.time}
                          </ThemedText>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

              </ScrollView>

              {/* Modal Footer */}
              {notifications.length > 0 && (
                <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1, paddingVertical: Spacing.four }]}>
                  <View style={styles.modalFooterActions}>
                    <Pressable 
                      style={[styles.cancelBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                      onPress={clearAllNotifications}
                    >
                      <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Limpar Todas</ThemedText>
                    </Pressable>
                    <Pressable 
                      style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                      onPress={markAllAsRead}
                    >
                      <ThemedText type="smallBold" style={{ color: '#FFF' }}>Lidas ✓</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}

            </View>
          </View>
        </Modal>

        {/* ================= ALTERAR SENHA MODAL ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isPasswordModalVisible}
          onRequestClose={() => setIsPasswordModalVisible(false)}
        >
          <View style={styles.centeredModalOverlay}>
            <View style={[styles.centeredModalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: Spacing.four }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary, fontSize: 11 }}>
                    SEGURANÇA DA CONTA
                  </ThemedText>
                  <ThemedText type="subtitle" style={{ color: theme.text, marginTop: 4 }}>
                    Alterar Senha
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setIsPasswordModalVisible(false);
                  }}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background, width: 36, height: 36, borderRadius: 18 }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Modal Content */}
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingVertical: Spacing.four }} showsVerticalScrollIndicator={false}>
                
                <View style={{ gap: Spacing.four }}>
                  <View>
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
                      Senha Atual
                    </ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                      placeholder="Digite sua senha atual"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />
                  </View>

                  <View>
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
                      Nova Senha
                    </ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                </View>

              </ScrollView>

              {/* Modal Footer */}
              <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1, paddingVertical: Spacing.four }]}>
                <View style={styles.modalFooterActions}>
                  <Pressable 
                    style={[styles.cancelBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                    onPress={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setIsPasswordModalVisible(false);
                    }}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Cancelar</ThemedText>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    disabled={isSavingPassword}
                    onPress={handleSavePassword}
                  >
                    <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                      {isSavingPassword ? 'Salvando...' : 'Atualizar Senha'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

            </View>
          </View>
        </Modal>

        {/* ================= EDIT JUNIOR ENTERPRISE MODAL ================= */}
        <Modal
          animationType="slide"
          transparent
          visible={isCompanyEditModalOpen}
          onRequestClose={() => setIsCompanyEditModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1, height: '80%' }]}>
              
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <ThemedText type="subtitle" style={{ color: theme.text }}>
                  Editar Empresa Júnior
                </ThemedText>
                <Pressable onPress={() => setIsCompanyEditModalOpen(false)}>
                  <ThemedText style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }} showsVerticalScrollIndicator={false}>
                
                {/* Previews and Image Selectors */}
                <View style={{ marginBottom: Spacing.four, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                  {/* Cover Preview Picker */}
                  <Pressable onPress={pickCompanyCover} style={{ height: 120, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    {companyEditCover ? (
                      <Image source={{ uri: companyEditCover }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    ) : (
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>Sem foto de fundo. Toque para adicionar 🖼️</ThemedText>
                    )}
                    <View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <ThemedText style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Alterar Capa 📷</ThemedText>
                    </View>
                  </Pressable>
                  
                  {/* Avatar Preview picker overlapping Cover */}
                  <View style={{ height: 60, alignItems: 'flex-start', paddingLeft: Spacing.four, marginTop: -35, position: 'relative', zIndex: 10 }}>
                    <Pressable onPress={pickCompanyAvatar} style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: theme.backgroundElement, backgroundColor: theme.backgroundSelected, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                      {companyEditAvatar ? (
                        <Image source={{ uri: companyEditAvatar }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center' }}>Toque 📷</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Nome */}
                <View>
                  <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: 6 }}>
                    Nome da Empresa
                  </ThemedText>
                  <TextInput
                    value={companyEditName}
                    onChangeText={setCompanyEditName}
                    placeholder="Ex: Impacto EJ"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  />
                </View>

                {/* Nome de Usuário */}
                <View>
                  <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: 6 }}>
                    Nome de Usuário (ex: @exemplo123)
                  </ThemedText>
                  <TextInput
                    value={companyEditUsername}
                    onChangeText={setCompanyEditUsername}
                    placeholder="Ex: @impacto123"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  />
                </View>

                {/* Descrição */}
                <View>
                  <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: 6 }}>
                    Descrição
                  </ThemedText>
                  <TextInput
                    value={companyEditDescription}
                    onChangeText={setCompanyEditDescription}
                    placeholder="Descreva a empresa júnior..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                    style={[styles.input, { minHeight: 100, textAlignVertical: 'top', backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  />
                </View>

                {/* Localização */}
                <View>
                  <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: 6 }}>
                    Localização
                  </ThemedText>
                  <TextInput
                    value={companyEditLocation}
                    onChangeText={setCompanyEditLocation}
                    placeholder="Ex: Mossoró, RN"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  />
                </View>

                {/* Áreas (Tags) */}
                <View>
                  <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: 6 }}>
                    Áreas de Atuação (separadas por vírgula)
                  </ThemedText>
                  <TextInput
                    value={companyEditBadges}
                    onChangeText={setCompanyEditBadges}
                    placeholder="Ex: Tecnologia, Consultoria, Projetos"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  />
                </View>

                <View style={{ height: Spacing.four }} />

                <Pressable
                  onPress={handleSaveCompany}
                  disabled={isSavingCompanyDetails}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.85 },
                    isSavingCompanyDetails && { opacity: 0.6 }
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                    {isSavingCompanyDetails ? 'Salvando...' : 'Salvar Alterações'}
                  </ThemedText>
                </Pressable>

              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ================= AVATAR PREVIEW/ZOOM MODAL ================= */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isCompanyAvatarPreviewVisible}
          onRequestClose={() => setIsCompanyAvatarPreviewVisible(false)}
        >
          <Pressable 
            style={styles.zoomModalOverlay} 
            onPress={() => setIsCompanyAvatarPreviewVisible(false)}
          >
            <View style={styles.zoomModalContent}>
              {viewCompany?.avatar ? (
                <Image source={{ uri: viewCompany.avatar }} style={styles.zoomAvatarImage} resizeMode="contain" />
              ) : (
                <View style={[styles.largePreviewPlaceholder, { width: 280, height: 280, borderRadius: 140, backgroundColor: theme.backgroundElement, borderColor: theme.primary, borderWidth: 3 }]}>
                  <ThemedText style={{ fontSize: 120 }}>
                    {(viewCompany?.name || 'E').slice(0, 1).toUpperCase()}
                  </ThemedText>
                </View>
              )}
              
              <Pressable 
                onPress={() => setIsCompanyAvatarPreviewVisible(false)}
                style={[styles.closeModalBtn, { position: 'absolute', top: 40, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'transparent' }]}
              >
                <ThemedText type="subtitle" style={{ color: '#FFF' }}>✕</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ================= COVER PREVIEW/ZOOM MODAL ================= */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isCompanyCoverPreviewVisible}
          onRequestClose={() => setIsCompanyCoverPreviewVisible(false)}
        >
          <Pressable 
            style={styles.zoomModalOverlay} 
            onPress={() => setIsCompanyCoverPreviewVisible(false)}
          >
            <View style={styles.zoomModalContent}>
              {viewCompany?.coverImage ? (
                <Image source={{ uri: viewCompany.coverImage }} style={styles.zoomCoverImage} resizeMode="contain" />
              ) : (
                <View style={[styles.largePreviewPlaceholder, { width: 320, height: 180, backgroundColor: theme.backgroundElement, borderColor: theme.primary, borderWidth: 3, justifyContent: 'center', alignItems: 'center' }]}>
                  <ThemedText style={{ color: theme.textSecondary }}>Sem foto de fundo</ThemedText>
                </View>
              )}
              
              <Pressable 
                onPress={() => setIsCompanyCoverPreviewVisible(false)}
                style={[styles.closeModalBtn, { position: 'absolute', top: 40, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'transparent' }]}
              >
                <ThemedText type="subtitle" style={{ color: '#FFF' }}>✕</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  banner: {
    height: 148,
    marginTop: -Spacing.four,
    marginHorizontal: -Spacing.four,
    marginBottom: Spacing.one,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.18,
    top: -140,
    left: -50,
  },
  bannerGlowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.14,
    bottom: -95,
    right: -40,
  },
  profileHeadRow: {
    marginTop: -48,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  avatarFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  identitySection: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  followBtn: {
    borderWidth: 1,
    borderRadius: 999,
    minWidth: 88,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  shareIconButton: {
    borderWidth: 1,
    borderRadius: 999,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    borderWidth: 1,
    borderRadius: 999,
    minWidth: 70,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statsRow: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
    marginTop: Spacing.two,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  achievementsGrid: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.two + 2,
  },
  achievementIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 19,
  },
  emptyAchievements: {
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  separator: {
    width: '100%',
    height: 1,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    opacity: 0.7,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.two + 2,
    marginTop: Spacing.two,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    justifyContent: 'space-between',
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.four,
    height: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 14,
  },
  primaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalContent: {
    width: '90%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  zoomAvatarImage: {
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  zoomCoverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  closeModalBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  largePreviewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    marginVertical: 4,
  },
  notificationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  centeredModalCard: {
    width: '95%',
    maxWidth: 680,
    minHeight: 520,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: Spacing.four,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalScroll: {
    flex: 1,
    padding: Spacing.four,
  },
  modalFooter: {
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  modalFooterActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#003366',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
  mockSection: {
    gap: Spacing.two,
  },
  mockSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  accountList: {
    marginTop: Spacing.two,
  },
  accountRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  accountIcon: {
    width: 20,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  accountLabel: {
    flex: 1,
    fontSize: 17,
  },
});

