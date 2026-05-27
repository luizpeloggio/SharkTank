import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompany } from '@/contexts/company-context';
import { CompanyRepository } from '@/services/company-repository';
import { AuthContext } from '@/contexts/auth-context';
import { canTransferLeadership } from '@/services/permissions';
import { AppStorage } from '@/services/storage';

export default function TransferLeadershipScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ companyId: string }>();
  const { session } = useContext(AuthContext);
  const { companyId: activeCompanyId, membership: myMembership, company, refresh } = useCompany();

  const companyId = params.companyId;
  const isActiveCompany = activeCompanyId === companyId;
  const canTransfer = isActiveCompany && canTransferLeadership(myMembership);

  const [memberships, setMemberships] = useState<any[]>([]);
  const [userIndex, setUserIndex] = useState<Record<string, { email: string; name?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

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

  const transferTo = async (targetUserId: string) => {
    if (!session) return;
    if (!canTransfer) return;

    const confirmText = 'Deseja transferir a liderança? Você perderá as opções administrativas imediatamente.';
    const doTransfer = async () => {
      const result = await CompanyRepository.transferLeadership(companyId, session.id, targetUserId);
      if (!result.ok) {
        const msg = result.reason === 'not_leader'
          ? 'Você não é líder desta empresa.'
          : 'O usuário alvo não é um membro ativo.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Não foi possível', msg);
        return;
      }
      await refresh();
      await load();
      const okMsg = 'Liderança transferida com sucesso.';
      if (Platform.OS === 'web') alert(okMsg);
      else Alert.alert('Sucesso', okMsg);
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const yes = confirm(confirmText);
      if (yes) await doTransfer();
      return;
    }

    Alert.alert('Transferir liderança', confirmText, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Transferir', style: 'destructive', onPress: () => { void doTransfer(); } },
    ]);
  };

  if (!canTransfer) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <UserProfileHeader />
          <View style={styles.header}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              LIDERANÇA
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Acesso negado
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
              Apenas o líder atual pode transferir controle.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const candidates = memberships
    .filter((m: any) => m.role !== 'leader' && m.status === 'active')
    .map((m: any) => ({
      ...m,
      displayName: userIndex[m.userId]?.name ?? 'Membro',
      email: userIndex[m.userId]?.email ?? '—',
    }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />

        <View style={styles.header}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            TRANSFERÊNCIA DE LIDERANÇA
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
            Selecione um membro para assumir o controle (estilo organizações do GitHub).
          </ThemedText>
        </View>

        <FlatList
          data={candidates}
          keyExtractor={(m: any) => `${m.companyId}:${m.userId}`}
          refreshing={isLoading}
          onRefresh={load}
          renderItem={({ item }: any) => (
            <View style={[styles.memberRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  {item.displayName}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  {item.email}
                </ThemedText>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => transferTo(item.userId)}
              >
                <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                  Transferir
                </ThemedText>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ paddingVertical: Spacing.six }}>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                Nenhum candidato disponível. Adicione membros antes de transferir.
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
    flex:  1,
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
  memberRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

