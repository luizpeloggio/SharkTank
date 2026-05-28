import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Platform,
  Alert,
  Image,
  Modal,
  TextInput,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppStorage, INITIAL_TRAIL_STEPS } from '@/services/storage';
import type { EarnedAchievement } from '@/services/storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthContext } from '@/contexts/auth-context';
import { useCompany } from '@/contexts/company-context';
import { UserProfileHeader } from '@/components/user-profile-header';

const PIXEL_AVATARS: { [key: string]: any } = {
  'robo': require('@/assets/images/robo.png'),
  'homem-1': require('@/assets/images/homem-1.png'),
  'homem-2': require('@/assets/images/homem-2.png'),
  'homem-3': require('@/assets/images/homem-3.png'),
  'mulher-1': require('@/assets/images/mulher-1.png'),
  'mulher-2': require('@/assets/images/mulher-2.png'),
  'mulher-3': require('@/assets/images/mulher-3.png'),
};

const PRESET_AVATARS = ['robo', 'homem-1', 'homem-2', 'homem-3', 'mulher-1', 'mulher-2', 'mulher-3'];

const renderAvatarHelper = (avatar: string | undefined, currentRole: string, size: number = 64) => {
  if (avatar && PIXEL_AVATARS[avatar]) {
    return <Image source={PIXEL_AVATARS[avatar]} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  if (avatar ? (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('data:image')) : false) {
    return <Image source={{ uri: avatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <ThemedText style={{ fontSize: size * 0.56, textAlign: 'center' }}>
      {avatar || (currentRole === 'admin' ? '👩‍💻' : currentRole === 'lider' ? '⚡' : '🎓')}
    </ThemedText>
  );
};

const getValidationStatus = (text: string) => {
  return {
    hasUpperCase: /[A-Z]/.test(text),
    hasLowerCase: /[a-z]/.test(text),
    hasNumber: /[0-9]/.test(text),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(text),
  };
};

function StrengthIndicator({ text }: { text: string }) {
  const theme = useTheme();
  const status = getValidationStatus(text);
  const rules = [
    { label: 'Letra maiúscula (A-Z)', met: status.hasUpperCase },
    { label: 'Letra minúscula (a-z)', met: status.hasLowerCase },
    { label: 'Número (0-9)', met: status.hasNumber },
    { label: 'Caractere especial (ex: @, #, $, %)', met: status.hasSpecialChar },
  ];

  return (
    <View style={{
      marginTop: Spacing.two,
      padding: Spacing.three,
      borderRadius: 8,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: Spacing.one
    }}>
      {rules.map((rule, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Text style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: rule.met ? '#22C55E' : theme.textSecondary
          }}>
            {rule.met ? '✓' : '○'}
          </Text>
          <Text style={{
            fontSize: 11,
            color: rule.met ? '#22C55E' : theme.textSecondary
          }}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ edit?: string }>();
  const { session, updateSession, logout } = useContext(AuthContext);
  const { companyId, company, membership } = useCompany();

  // Stats States
  const [completedStepsDisplay, setCompletedStepsDisplay] = useState<number>(0);
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(session?.avatar || '');

  const [editUsername, setEditUsername] = useState(session?.username || '');
  const [editName, setEditName] = useState(session?.name || '');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (session) {
      setEditUsername(session.username || '');
      setEditName(session.name || '');
    }
  }, [session]);

  useEffect(() => {
    if (params.edit === '1') {
      setIsEditSectionOpen(true);
    }
  }, [params.edit]);

  const handleSaveName = async () => {
    if (!session) return;
    if (!editName.trim()) {
      const msg = 'O nome completo não pode ficar vazio.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erro ⚠️', msg);
      return;
    }
    setIsSavingName(true);
    try {
      const updated = { ...session, name: editName.trim() };
      await updateSession(updated);
      const successMsg = 'Nome completo atualizado com sucesso! ✨';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('Sucesso! 👤', successMsg);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!session) return;
    if (!editUsername.trim()) {
      const msg = 'O nome de usuário não pode ficar vazio.';
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
    if (!isStrengthValid(editUsername)) {
      const msg = 'O Nome de Usuário deve conter letras maiúsculas, minúsculas, números e caracteres especiais.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Nome de Usuário Fraco ⚠️', msg);
      return;
    }
    setIsSavingUsername(true);
    try {
      const updated = { ...session, username: editUsername.trim() };
      await updateSession(updated);
      const successMsg = 'Nome de usuário atualizado com sucesso! ✨';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('Sucesso! 🌐', successMsg);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingUsername(false);
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
      const successMsg = 'Sua senha foi alterada com sucesso! 🔒';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('Sucesso! ✨', successMsg);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Easing function for smoother counting
  const animateCount = (targetValue: number, setDisplayVal: React.Dispatch<React.SetStateAction<number>>) => {
    if (targetValue === 0) {
      setDisplayVal(0);
      return;
    }
    
    setDisplayVal(0);
    const duration = 800; // 800ms
    const startTime = Date.now();
    
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuad curve
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(easeProgress * targetValue);
      
      setDisplayVal(current);
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayVal(targetValue);
      }
    };
    
    requestAnimationFrame(tick);
  };

  // Sync state with session avatar
  useEffect(() => {
    if (session?.avatar) {
      setSelectedAvatar(session.avatar);
    }
  }, [session]);

  // Load and animate data every time the screen is focused!
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [session])
  );

  const pickImage = async () => {
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
        setSelectedAvatar(uri);
      }
    } catch (e) {
      console.error('Error picking image:', e);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = (e: any) => {
            setSelectedAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    }
  };

  const handleSaveAvatar = async () => {
    if (!session) return;
    const updatedSession = {
      ...session,
      avatar: selectedAvatar,
    };
    await updateSession(updatedSession);
    setIsAvatarModalVisible(false);
    
    if (Platform.OS === 'web') {
      alert('Foto de perfil atualizada com sucesso!');
    } else {
      Alert.alert('Sucesso! 📸', 'Sua foto de perfil foi atualizada!');
    }
  };

  const loadData = async () => {
    const progress = await AppStorage.getTrailProgress();
    const syncedAchievements = session?.id
      ? await AppStorage.syncUserAchievements(session.id, progress)
      : [];
    
    const targetSteps = progress.length;
    
    setAchievements(syncedAchievements);
    setCompletedSteps(progress);
    
    // Animate display counters
    animateCount(targetSteps, setCompletedStepsDisplay);
  };

  const currentRole = session?.role || 'estudante';
  const totalSteps = INITIAL_TRAIL_STEPS.length;
  const progressPercent = totalSteps > 0 ? Math.min(100, (completedSteps.length / totalSteps) * 100) : 0;
  const nextStep = INITIAL_TRAIL_STEPS.find(step => !completedSteps.includes(step.id));
  const profileName = session?.name || (currentRole === 'admin' ? 'Coordenadora Admin' : currentRole === 'lider' ? 'Presidente Computação EJ' : 'Estudante UERN');
  const profileInitials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'EU';
  const roleLabel = currentRole === 'lider' ? 'Presidente' : currentRole === 'admin' ? 'Administradora' : 'Membro';
  const companyName = company?.name || (currentRole === 'lider' ? 'Empresa Jr' : 'Minha EJ');
  const memberSince = membership?.createdAt
    ? new Date(membership.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : 'jan/2023';
  const featuredAchievements = achievements.slice(0, 6);
  const latestAchievement = achievements[achievements.length - 1];
  const latestCompletedStep = completedSteps.length
    ? INITIAL_TRAIL_STEPS.find(step => step.id === completedSteps[completedSteps.length - 1])
    : null;
  const recentActivities = [
    latestCompletedStep
      ? {
          icon: '✓',
          title: `Concluiu a etapa ${latestCompletedStep.title} na jornada`,
          time: 'há 3 dias',
        }
      : null,
    latestAchievement
      ? {
          icon: latestAchievement.icon,
          title: `Ganhou o badge ${latestAchievement.name}`,
          time: 'há 2 semanas',
        }
      : null,
    {
      icon: '✎',
      title: company ? `Publicou uma atualização no feed da ${company.name}` : 'Explorou oportunidades no feed do ecossistema',
      time: 'há 5 dias',
    },
  ].filter((item): item is { icon: string; title: string; time: string } => Boolean(item));

  const handleResetApp = async () => {
    // Reset all Storage variables
    await AppStorage.resetAll();
    
    // Refresh local states
    await loadData();

    if (Platform.OS === 'web') {
      alert('Aplicativo resetado com sucesso! Trilha limpa e posts originais restaurados.');
    } else {
      Alert.alert('Estado Resetado! 🧹', 'A trilha foi limpa, votos reiniciados e posts originais restaurados.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.profileShell, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.profileCover, { backgroundColor: theme.background, borderBottomColor: theme.border }]} />
            <Pressable style={styles.profileAvatarButton} onPress={() => setIsAvatarModalVisible(true)}>
              <View style={[styles.profileAvatarLarge, { backgroundColor: theme.backgroundSelected, borderColor: theme.backgroundElement }]}>
                {session?.avatar ? renderAvatarHelper(session.avatar, currentRole, 84) : (
                  <ThemedText style={[styles.profileAvatarInitials, { color: theme.text }]}>{profileInitials}</ThemedText>
                )}
              </View>
            </Pressable>

            <View style={styles.profileBody}>
              <View style={styles.profileNameRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
                    {profileName}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.profileSubtitle, { color: theme.textSecondary }]}>
                    Ciência da Computação · 5º período
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setIsEditSectionOpen(value => !value)}
                  style={({ pressed }) => [
                    styles.editPill,
                    { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.text }}>Editar</ThemedText>
                </Pressable>
              </View>

              <View style={styles.companyAffiliation}>
                <View style={[styles.affiliationIcon, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <ThemedText style={{ color: theme.text, fontSize: 12, fontWeight: '800' }}>EJ</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 15 }}>
                    {companyName} · {roleLabel}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Membro desde {memberSince}
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.journeyPanel, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.journeyHeader}>
                  <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 15 }}>Jornada de fundação</ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                    {completedStepsDisplay} / {totalSteps} etapas
                  </ThemedText>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
                  Próxima etapa: {nextStep?.title || 'Jornada concluída'}
                </ThemedText>
              </View>

              <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

              <View style={styles.mockSection}>
                <ThemedText type="code" style={[styles.mockSectionTitle, { color: theme.textSecondary }]}>CONQUISTAS</ThemedText>
                {featuredAchievements.length > 0 ? (
                  <View style={styles.achievementPills}>
                    {featuredAchievements.map((badge) => (
                      <View key={badge.id} style={[styles.achievementPill, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <ThemedText style={{ fontSize: 13 }}>{badge.icon}</ThemedText>
                        <ThemedText type="smallBold" style={{ color: theme.text }}>{badge.name}</ThemedText>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Complete etapas, publique e interaja para ganhar badges.
                  </ThemedText>
                )}
              </View>

              <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

              <View style={styles.mockSection}>
                <ThemedText type="code" style={[styles.mockSectionTitle, { color: theme.textSecondary }]}>ATIVIDADE RECENTE</ThemedText>
                <View style={styles.activityList}>
                  {recentActivities.map((activity, index) => (
                    <View key={`${activity.title}-${index}`} style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: theme.background }]}>
                        <ThemedText style={{ color: theme.text, fontSize: 14 }}>{activity.icon}</ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="small" style={[styles.activityTitle, { color: theme.text }]}>{activity.title}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>{activity.time}</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.profileDivider, { backgroundColor: theme.border }]} />

              <View style={styles.mockSection}>
                <ThemedText type="code" style={[styles.mockSectionTitle, { color: theme.textSecondary }]}>CONTA</ThemedText>
                <View style={styles.accountList}>
                  <Pressable style={({ pressed }) => [styles.accountRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}>
                    <ThemedText style={[styles.accountIcon, { color: theme.textSecondary }]}>N</ThemedText>
                    <ThemedText type="small" style={[styles.accountLabel, { color: theme.text }]}>Notificações</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>›</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(companyId ? `/company/${companyId}` : '/company')}
                    style={({ pressed }) => [styles.accountRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
                  >
                    <ThemedText style={[styles.accountIcon, { color: theme.textSecondary }]}>EJ</ThemedText>
                    <ThemedText type="small" style={[styles.accountLabel, { color: theme.text }]}>Minha EJ</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>›</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={logout}
                    style={({ pressed }) => [styles.accountRow, { borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
                  >
                    <ThemedText style={[styles.accountIcon, { color: theme.textSecondary }]}>S</ThemedText>
                    <ThemedText type="small" style={[styles.accountLabel, { color: theme.text }]}>Sair</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>›</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>


          {isEditSectionOpen && (
          <View style={styles.sectionContainer}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
              Editar perfil
            </ThemedText>

            <View style={[styles.optionsList, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>

              <View style={{ padding: Spacing.four, gap: Spacing.four }}>
                  {/* 1. Nome Completo Card */}
                  <View style={[styles.optionsList, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, padding: Spacing.four, gap: Spacing.three }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.one }}>
                      <ThemedText style={{ fontSize: 16 }}>👤</ThemedText>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>
                        Alterar Nome Completo
                      </ThemedText>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }
                      ]}
                      placeholder="Seu nome completo"
                      placeholderTextColor={theme.textSecondary}
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.detailsSaveBtn,
                        { backgroundColor: theme.primary, marginTop: Spacing.one },
                        pressed && { opacity: 0.8 },
                        isSavingName && { opacity: 0.6 }
                      ]}
                      disabled={isSavingName}
                      onPress={handleSaveName}
                    >
                      <ThemedText type="smallBold" style={{ color: '#FFF', fontWeight: 'bold' }}>
                        {isSavingName ? 'Salvando...' : 'Salvar Nome'}
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* 2. Nome de Usuário Card */}
                  <View style={[styles.optionsList, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, padding: Spacing.four, gap: Spacing.three }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.one }}>
                      <ThemedText style={{ fontSize: 16 }}>🌐</ThemedText>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>
                        Alterar Nome de Usuário (@)
                      </ThemedText>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }
                      ]}
                      placeholder="Ex: Lucas@123"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      value={editUsername}
                      onChangeText={setEditUsername}
                    />
                    <StrengthIndicator text={editUsername} />
                    <Pressable
                      style={({ pressed }) => [
                        styles.detailsSaveBtn,
                        { backgroundColor: theme.primary, marginTop: Spacing.one },
                        pressed && { opacity: 0.8 },
                        isSavingUsername && { opacity: 0.6 }
                      ]}
                      disabled={isSavingUsername}
                      onPress={handleSaveUsername}
                    >
                      <ThemedText type="smallBold" style={{ color: '#FFF', fontWeight: 'bold' }}>
                        {isSavingUsername ? 'Salvando...' : 'Salvar Usuário'}
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* 3. Alterar Senha Card */}
                  <View style={[styles.optionsList, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, padding: Spacing.four, gap: Spacing.three }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.one }}>
                      <ThemedText style={{ fontSize: 16 }}>🔒</ThemedText>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>
                        Alterar Senha de Acesso
                      </ThemedText>
                    </View>
                    <View style={styles.inputGroup}>
                      <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>
                        Senha Atual
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }
                        ]}
                        placeholder="Sua senha atual"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>
                        Nova Senha
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }
                        ]}
                        placeholder="Sua nova senha"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>
                    {newPassword.length > 0 && <StrengthIndicator text={newPassword} />}
                    <Pressable
                      style={({ pressed }) => [
                        styles.detailsSaveBtn,
                        { backgroundColor: theme.primary, marginTop: Spacing.one },
                        pressed && { opacity: 0.8 },
                        isSavingPassword && { opacity: 0.6 }
                      ]}
                      disabled={isSavingPassword}
                      onPress={handleSavePassword}
                    >
                      <ThemedText type="smallBold" style={{ color: '#FFF', fontWeight: 'bold' }}>
                        {isSavingPassword ? 'Salvando...' : 'Salvar Senha'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
            </View>
          </View>
          )}

          <View style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>

      {/* ================= EDIT AVATAR MODAL ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAvatarModalVisible}
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
            
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <View>
                <ThemedText type="code" style={{ color: theme.primary }}>
                  CUSTOMIZAÇÃO
                </ThemedText>
                <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                  Alterar Foto de Perfil
                </ThemedText>
              </View>
              <Pressable 
                onPress={() => setIsAvatarModalVisible(false)}
                style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
              >
                <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
              </Pressable>
            </View>

            {/* Modal Scrollable Content */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              {/* Current Preview */}
              <View style={styles.previewContainer}>
                {selectedAvatar && PIXEL_AVATARS[selectedAvatar] ? (
                  <Image source={PIXEL_AVATARS[selectedAvatar]} style={[styles.largePreviewImage, { borderColor: theme.primary }]} />
                ) : selectedAvatar && (selectedAvatar.startsWith('http') || selectedAvatar.startsWith('file') || selectedAvatar.startsWith('data:image')) ? (
                  <Image source={{ uri: selectedAvatar }} style={[styles.largePreviewImage, { borderColor: theme.primary }]} />
                ) : (
                  <View style={[styles.largePreviewPlaceholder, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                    <ThemedText style={{ fontSize: 50 }}>
                      {selectedAvatar && !PIXEL_AVATARS[selectedAvatar] && !selectedAvatar.startsWith('http') ? selectedAvatar : '🎓'}
                    </ThemedText>
                  </View>
                )}
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
                  Pré-visualização do Avatar
                </ThemedText>
              </View>

              {/* Preset Selector */}
              <View style={{ marginBottom: Spacing.four }}>
                <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.text }]}>
                  Selecione um Avatar Divertido:
                </ThemedText>
                
                <View style={styles.presetGrid}>
                  {PRESET_AVATARS.map((avatarName, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.presetGridItem,
                        { backgroundColor: theme.background, borderColor: 'transparent', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
                        selectedAvatar === avatarName && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected, borderWidth: 2 }
                      ]}
                      onPress={() => setSelectedAvatar(avatarName)}
                    >
                      <Image source={PIXEL_AVATARS[avatarName]} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Upload Button */}
              <View style={{ marginBottom: Spacing.six }}>
                <ThemedText type="smallBold" style={[styles.sectionLabel, { color: theme.text }]}>
                  Ou envie uma foto personalizada:
                </ThemedText>
                
                <Pressable style={[styles.galleryBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]} onPress={pickImage}>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    📸 Escolher Foto da Galeria
                  </ThemedText>
                </Pressable>
              </View>

            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <View style={styles.modalFooterActions}>
                <Pressable 
                  style={[styles.cancelBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={() => {
                    setSelectedAvatar(session?.avatar || '');
                    setIsAvatarModalVisible(false);
                  }}
                >
                  <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Cancelar</ThemedText>
                </Pressable>
                
                <Pressable 
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSaveAvatar}
                >
                  <ThemedText type="smallBold" style={{ color: '#FFF' }}>Salvar Foto</ThemedText>
                </Pressable>
              </View>
            </View>

          </View>
        </View>
      </Modal>

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
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  header: {
    marginTop: Spacing.one,
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  profileShell: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  profileCover: {
    height: 150,
    borderBottomWidth: 1,
  },
  profileAvatarButton: {
    marginTop: -64,
    marginLeft: Spacing.four,
    width: 112,
    height: 112,
  },
  profileAvatarLarge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarInitials: {
    fontSize: 30,
    fontWeight: '800',
  },
  profileBody: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  profileSubtitle: {
    fontSize: 15,
    marginTop: 2,
  },
  editPill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
  },
  companyAffiliation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  affiliationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  profileDivider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.four,
    opacity: 0.75,
  },
  mockSection: {
    gap: Spacing.two,
  },
  mockSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  achievementPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  achievementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  activityList: {
    gap: Spacing.three,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 16,
    lineHeight: 21,
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
  profileCard: {
    borderRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: Spacing.two,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#090D16',
    borderWidth: 2,
    borderColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#003366',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#131C2E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.four,
  },
  largePreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#003366',
  },
  largePreviewPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#090D16',
    borderWidth: 3,
    borderColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#FFF',
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  presetGridItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetGridItemActive: {
    borderColor: '#003366',
    backgroundColor: 'rgba(0,51,102,0.12)',
  },
  galleryBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.one,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.four,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    color: '#FFF',
  },
  closeModalBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: 6,
  },
  seloBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: 6,
  },
  seloText: {
    color: '#00E5FF',
    fontWeight: 'bold',
    fontSize: 9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    backgroundColor: 'rgba(9, 13, 22, 0.5)',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statLbl: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionContainer: {
    marginTop: Spacing.five,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#FFF',
    marginBottom: Spacing.one,
  },
  sectionSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  achievementCounter: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  achievementsGrid: {
    gap: Spacing.two,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
  achievementIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 22,
  },
  achievementName: {
    fontSize: 14,
  },
  achievementDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  achievementId: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 6,
  },
  emptyAchievements: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    gap: Spacing.one,
    padding: Spacing.four,
  },
  emptyAchievementIcon: {
    fontSize: 28,
  },
  
  // ROLE PICKER CARD GRID
  rolePickerBox: {
    gap: Spacing.three,
  },
  pickerCard: {
    borderRadius: 18,
    padding: Spacing.three + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  pickerCardSelected: {
    borderColor: '#003366',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 51, 102, 0.05)',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  pickerDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },

  // OPTIONS LIST
  optionsList: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  inputGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Platform.OS === 'ios' ? Spacing.four : Spacing.three,
    fontSize: 15,
  },
  detailsSaveBtn: {
    backgroundColor: '#003366',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSegmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    minWidth: 132,
  },
  themeSegment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
  },
});
