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
import { useLocalSearchParams } from 'expo-router';
import { AppStorage } from '@/services/storage';
import type { EarnedAchievement } from '@/services/storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthContext } from '@/contexts/auth-context';
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
  const { session, updateSession } = useContext(AuthContext);

  // Stats States
  const [completedStepsCount, setCompletedStepsCount] = useState<number>(0);
  const [votesCastCount, setVotesCastCount] = useState<number>(0);
  const [completedStepsDisplay, setCompletedStepsDisplay] = useState<number>(0);
  const [votesCastDisplay, setVotesCastDisplay] = useState<number>(0);
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([]);
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
    const votes = await AppStorage.getUserVotes();
    const syncedAchievements = session?.id
      ? await AppStorage.syncUserAchievements(session.id, progress)
      : [];
    
    const targetSteps = progress.length;
    const targetVotes = votes.length;
    
    setCompletedStepsCount(targetSteps);
    setVotesCastCount(targetVotes);
    setAchievements(syncedAchievements);
    
    // Animate display counters
    animateCount(targetSteps, setCompletedStepsDisplay);
    animateCount(targetVotes, setVotesCastDisplay);
  };

  const currentRole = session?.role || 'estudante';

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
          
          {/* HEADER */}
          <View style={styles.header}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              GESTÃO DE PERFIS
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Perfil & Configurações
            </ThemedText>
          </View>

          {/* ACTIVE USER SUMMARY CARD */}
          <View style={[styles.profileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.profileHeader}>
              <Pressable 
                style={styles.avatarPressable} 
                onPress={() => setIsAvatarModalVisible(true)}
              >
                <View style={[styles.avatarCircle, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                  {renderAvatarHelper(session?.avatar, currentRole, 64)}
                  <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.border }]}>
                    <ThemedText style={{ fontSize: 10, color: '#FFF' }}>✏️</ThemedText>
                  </View>
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle" style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
                  {session?.name || (currentRole === 'admin' ? 'Coordenadora Admin' : currentRole === 'lider' ? 'Presidente Computação EJ' : 'Estudante UERN')}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: 'bold', marginTop: 1 }}>
                  @{session?.username || 'usuario'}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2, marginBottom: 4 }}>
                  {session?.email || 'usuario@uern.br'}
                </ThemedText>
                <View style={styles.badgeRow}>
                  <View style={[
                    styles.roleBadge,
                    { backgroundColor: theme.backgroundSelected }
                  ]}>
                    <ThemedText type="code" style={{ 
                      color: theme.primary,
                      fontWeight: 'bold',
                      fontSize: 10
                    }}>
                      {currentRole.toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={[styles.seloBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="code" style={[styles.seloText, { color: theme.primary }]}>OFICIAL UERN</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick stats dashboard inside card */}
            <View style={[styles.statsRow, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
              <View style={styles.statCol}>
                <ThemedText type="subtitle" style={[styles.statVal, { color: theme.text }]}>{completedStepsDisplay}/5</ThemedText>
                <ThemedText type="code" style={[styles.statLbl, { color: theme.textSecondary }]}>TRILHA EJ</ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.statCol}>
                <ThemedText type="subtitle" style={[styles.statVal, { color: theme.text }]}>{votesCastDisplay}</ThemedText>
                <ThemedText type="code" style={[styles.statLbl, { color: theme.textSecondary }]}>VOTOS CAST</ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.statCol}>
                <ThemedText type="subtitle" style={[styles.statVal, { color: theme.text }]}>
                  {currentRole === 'admin' ? 'A+' : currentRole === 'lider' ? 'A' : 'B'}
                </ThemedText>
                <ThemedText type="code" style={[styles.statLbl, { color: theme.textSecondary }]}>NÍVEL PERM</ThemedText>
              </View>
            </View>
          </View>


          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
                  Conquistas
                </ThemedText>
                <ThemedText type="small" style={[styles.sectionSub, { color: theme.textSecondary }]}>
                  Badges de progresso, conteúdo e networking do usuário.
                </ThemedText>
              </View>
              <View style={[styles.achievementCounter, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                <ThemedText type="code" style={{ color: theme.primary, fontWeight: 'bold' }}>
                  {achievements.length}
                </ThemedText>
              </View>
            </View>

            {achievements.length === 0 ? (
              <View style={[styles.emptyAchievements, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <ThemedText style={styles.emptyAchievementIcon}>🏁</ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  Nenhuma conquista ainda
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  Complete etapas, publique e interaja para ganhar suas primeiras badges.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.achievementsGrid}>
                {achievements.map((badge) => (
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
                      <ThemedText type="smallBold" style={[styles.achievementName, { color: theme.text }]}>
                        {badge.name}
                      </ThemedText>
                      <ThemedText type="small" style={[styles.achievementDesc, { color: theme.textSecondary }]}>
                        {badge.description}
                      </ThemedText>
                      <ThemedText type="code" style={[styles.achievementId, { color: badge.color }]}>
                        {badge.category.toUpperCase()} · #{badge.id.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
