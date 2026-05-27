import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompany } from '@/contexts/company-context';
import { canEditCompanyProfile } from '@/services/permissions';
import { CompanyService } from '@/services/company-service';
import * as ImagePicker from 'expo-image-picker';

export default function CompanyManageScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ companyId: string }>();
  const { companyId: activeCompanyId, company, membership, refresh } = useCompany();

  const companyId = params.companyId;
  const isActiveCompany = activeCompanyId === companyId;
  const canEdit = isActiveCompany && canEditCompanyProfile(membership);

  const [name, setName] = useState(company?.name ?? '');
  const [description, setDescription] = useState(company?.description ?? '');
  const [location, setLocation] = useState(company?.location ?? '');
  const [badgesText, setBadgesText] = useState((company?.badges ?? company?.tags ?? []).join(', '));
  const [avatar, setAvatar] = useState(company?.avatar ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const title = useMemo(() => company?.name ?? 'Empresa', [company?.name]);

  useEffect(() => {
    if (!company || company.id !== companyId) return;
    setName(company.name ?? '');
    setDescription(company.description ?? '');
    setLocation(company.location ?? '');
    setBadgesText((company.badges ?? company.tags ?? []).join(', '));
    setAvatar(company.avatar ?? '');
  }, [company, companyId]);

  const save = async () => {
    if (!canEdit) return;
    if (!name.trim()) {
      const msg = 'Informe o nome da empresa.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Campos obrigatórios', msg);
      return;
    }
    setIsSaving(true);
    try {
      const badges = badgesText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 8);
      await CompanyService.updateCompany(companyId, { name, description, badges, location, avatar: avatar || undefined });
      await refresh();
      if (Platform.OS === 'web') alert('Empresa atualizada.');
      else Alert.alert('Sucesso', 'Empresa atualizada.');
    } finally {
      setIsSaving(false);
    }
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (Platform.OS === 'web') alert('Permissão de galeria necessária.');
      else Alert.alert('Permissão necessária', 'Permita acesso à galeria para escolher a foto.');
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
      const asset = result.assets[0];
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setAvatar(uri);
    }
  };

  if (!canEdit) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <UserProfileHeader />
          <View style={styles.header}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              GESTÃO
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Acesso negado
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
              Apenas o líder da empresa pode editar este perfil.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />

        <View style={styles.header}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            GESTÃO DA EMPRESA
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
            Atualize informações e administre o perfil usando sua conta normal.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
            Foto / Avatar
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: theme.border, backgroundColor: theme.background, marginTop: Spacing.two },
              pressed && { opacity: 0.85 },
            ]}
            onPress={pickAvatar}
          >
            <ThemedText type="smallBold" style={{ color: theme.text }}>
              {avatar ? 'Trocar foto' : 'Adicionar foto'}
            </ThemedText>
          </Pressable>

          <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
            Nome *
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome da empresa"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginTop: Spacing.three }}>
            Descrição
          </ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[
              styles.input,
              { minHeight: 90, textAlignVertical: 'top', backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
            ]}
          />

          <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginTop: Spacing.three }}>
            Localização
          </ThemedText>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Cidade, UF"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginTop: Spacing.three }}>
            Badges / tags (separadas por vírgula)
          </ThemedText>
          <TextInput
            value={badgesText}
            onChangeText={setBadgesText}
            placeholder="Ex: #EJ, #UERN, #Tech"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <Pressable
            disabled={isSaving}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary, marginTop: Spacing.four, opacity: isSaving ? 0.6 : 1 },
              pressed && !isSaving && { opacity: 0.85 },
            ]}
            onPress={save}
          >
            <ThemedText type="smallBold" style={{ color: '#FFF' }}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </ThemedText>
          </Pressable>

          <View style={{ height: Spacing.two }} />

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: theme.border, backgroundColor: theme.background },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push(`/company/${companyId}/transfer-leadership`)}
          >
            <ThemedText type="smallBold" style={{ color: theme.text }}>
              Transferir liderança
            </ThemedText>
          </Pressable>
        </View>
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
  header: {
    marginTop: Spacing.one,
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
    marginTop: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 14,
    marginTop: Spacing.two,
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
});

