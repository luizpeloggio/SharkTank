import React, { useContext, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useCompany } from '@/contexts/company-context';
import { AuthContext } from '@/contexts/auth-context';
import { CompanyService } from '@/services/company-service';
import { router } from 'expo-router';

export default function CompanyIndexScreen() {
  const theme = useTheme();
  const { session } = useContext(AuthContext);
  const { companyId, company, membership, refresh, isLoading } = useCompany();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const title = useMemo(() => (company ? company.name : 'Minha Empresa'), [company]);

  const createCompany = async () => {
    if (!session) return;
    if (!name.trim()) {
      const msg = 'Informe o nome da empresa.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Campos obrigatórios', msg);
      return;
    }
    setIsCreating(true);
    try {
      await CompanyService.createCompanyForUser({
        userId: session.id,
        name,
        description,
      });
      await refresh();
      setName('');
      setDescription('');
    } finally {
      setIsCreating(false);
    }
  };

  if (companyId) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <UserProfileHeader />

          <View style={styles.header}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              PERFIL DA EMPRESA
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              {title}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {company?.description || 'Sem descrição'}
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={{ color: theme.text }}>
              Seu papel
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {membership?.role === 'leader' ? 'Líder' : 'Membro'}
            </ThemedText>

            <View style={{ height: Spacing.three }} />

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: theme.primary },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push(`/company/${companyId}`)}
            >
              <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                Ver perfil público
              </ThemedText>
            </Pressable>
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
            EMPRESA
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
            {isLoading ? 'Carregando...' : 'Crie seu perfil de empresa'}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
            Você ainda não tem uma empresa vinculada. Crie uma para começar.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
            Nome da empresa *
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Computação EJ UERN"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginTop: Spacing.three }}>
            Descrição (opcional)
          </ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="O que sua empresa faz?"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[
              styles.input,
              { minHeight: 90, textAlignVertical: 'top', backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
            ]}
          />

          <Pressable
            disabled={isCreating}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary, marginTop: Spacing.four, opacity: isCreating ? 0.6 : 1 },
              pressed && !isCreating && { opacity: 0.85 },
            ]}
            onPress={createCompany}
          >
            <ThemedText type="smallBold" style={{ color: '#FFF' }}>
              {isCreating ? 'Criando...' : 'Criar empresa'}
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
});

