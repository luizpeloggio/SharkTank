import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompany } from '@/contexts/company-context';
import { CompanyRepository } from '@/services/company-repository';
import { AppStorage } from '@/services/storage';
import type { CompanyMembership } from '@/domain/company';
import { canSeeCompanyAdmin } from '@/services/permissions';
import { AuthContext } from '@/contexts/auth-context';

type MemberRow = {
  membership: CompanyMembership;
  displayName: string;
  email: string;
};

export default function CompanyMembersScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ companyId: string }>();
  const { session } = useContext(AuthContext);
  const { companyId: activeCompanyId, membership: myMembership, company } = useCompany();

  const companyId = params.companyId;
  const isActiveCompany = activeCompanyId === companyId;
  const isLeader = isActiveCompany && canSeeCompanyAdmin(myMembership);

  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userIndex, setUserIndex] = useState<Record<string, { email: string; name?: string }>>({});

  const [addEmail, setAddEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const title = useMemo(() => company?.name ?? 'Empresa', [company?.name]);

  const load = async () => {
    setIsLoading(true);
    const [list, users] = await Promise.all([
      CompanyRepository.listMembers(companyId),
      AppStorage.getUsers(),
    ]);
    setMemberships(list);
    setUserIndex(Object.fromEntries(users.map(u => [u.id, { email: u.email, name: u.name }])));
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const rows: MemberRow[] = useMemo(() => (
    memberships.map(m => ({
      membership: m,
      displayName: userIndex[m.userId]?.name || (m.role === 'leader' ? 'Líder' : 'Membro'),
      email: userIndex[m.userId]?.email || '—',
    }))
  ), [memberships, userIndex]);

  const addMemberByEmail = async () => {
    if (!session) return;
    if (!isLeader) return;
    const normalized = addEmail.toLowerCase().trim();
    if (!normalized) return;

    setIsAdding(true);
    try {
      const user = await AppStorage.findUserByEmail(normalized);
      if (!user) {
        const msg = 'Usuário não encontrado. A pessoa precisa criar uma conta primeiro.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Não encontrado', msg);
        return;
      }

      await CompanyRepository.addMember({
        companyId,
        userId: user.id,
        role: 'member',
        status: 'active',
        createdAt: Date.now(),
      });
      setAddEmail('');
      await load();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />

        <View style={styles.header}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            MEMBROS
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
            {isLeader ? 'Você pode gerenciar membros.' : 'Apenas líderes podem gerenciar membros.'}
          </ThemedText>
        </View>

        {isLeader && (
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
              Adicionar membro por e-mail
            </ThemedText>
            <TextInput
              value={addEmail}
              onChangeText={setAddEmail}
              placeholder="email@uern.br"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
            />
            <Pressable
              disabled={isAdding}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: theme.primary, marginTop: Spacing.three, opacity: isAdding ? 0.6 : 1 },
                pressed && !isAdding && { opacity: 0.85 },
              ]}
              onPress={addMemberByEmail}
            >
              <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                {isAdding ? 'Adicionando...' : 'Adicionar'}
              </ThemedText>
            </Pressable>
          </View>
        )}

        <View style={{ height: Spacing.three }} />

        <FlatList
          data={rows}
          keyExtractor={(r) => `${r.membership.companyId}:${r.membership.userId}`}
          refreshing={isLoading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={[styles.memberRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  {item.displayName}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  {item.email}
                </ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                <ThemedText type="code" style={{ color: theme.primary, fontSize: 10, fontWeight: 'bold' }}>
                  {item.membership.role.toUpperCase()}
                </ThemedText>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ paddingVertical: Spacing.six }}>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                Nenhum membro encontrado.
              </ThemedText>
            </View>
          }
        />
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
  memberRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});

