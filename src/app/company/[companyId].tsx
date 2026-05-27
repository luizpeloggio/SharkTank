import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompany } from '@/contexts/company-context';
import { canEditCompanyProfile, canManageCompanyPosts } from '@/services/permissions';
import { AuthContext } from '@/contexts/auth-context';
import { CompanyRepository, type CompanyPostCategory } from '@/services/company-repository';
import { AppStorage } from '@/services/storage';

export default function CompanyProfileScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ companyId: string }>();
  const { session } = useContext(AuthContext);
  const { companyId: activeCompanyId, company, membership } = useCompany();

  const companyId = params.companyId;
  const isActiveCompany = activeCompanyId === companyId;
  const canEdit = isActiveCompany && canEditCompanyProfile(membership);
  const canPost = isActiveCompany && canManageCompanyPosts({ membership, systemRole: session?.role ?? null });

  const [viewCompany, setViewCompany] = useState(company);
  const title = useMemo(() => viewCompany?.name ?? 'Empresa', [viewCompany?.name]);

  const [members, setMembers] = useState<any[]>([]);
  const [userIndex, setUserIndex] = useState<Record<string, { name?: string; username?: string; avatar?: string }>>({});
  const [posts, setCompanyPosts] = useState<any[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<CompanyPostCategory>('noticia');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount] = useState(128);

  const load = async () => {
    const [targetCompany, m, p, users] = await Promise.all([
      CompanyRepository.getCompany(companyId),
      CompanyRepository.listMembers(companyId),
      CompanyRepository.listPostsByCompany(companyId),
      AppStorage.getUsers(),
    ]);
    setViewCompany(targetCompany);
    setMembers(m);
    setCompanyPosts(p);
    setUserIndex(Object.fromEntries(users.map(u => [u.id, { name: u.name, username: u.username, avatar: u.avatar }])));
  };

  useEffect(() => {
    load();
  }, [companyId]);

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
    const area = viewCompany?.tags?.[0]?.replace('#', '') || 'Tecnologia';
    const location = viewCompany?.tags?.[1]?.replace('#', '') || 'Mossoró, RN';
    return `${area} · ${location}`;
  }, [viewCompany?.tags]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.six }}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.banner, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
              <View style={[styles.bannerGlow, { backgroundColor: theme.backgroundSelected }]} />
              <View style={[styles.bannerGlowSecondary, { backgroundColor: theme.primary }]} />
            </View>

            <View style={styles.profileHeadRow}>
              <View style={[styles.avatarFrame, { borderColor: theme.backgroundElement, backgroundColor: theme.background }]}>
                {renderCompanyAvatar(82)}
              </View>
            </View>

            <View style={styles.identitySection}>
              <View style={styles.titleRow}>
                <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 20 }}>
                  {title}
                </ThemedText>
                <Pressable
                  onPress={() => setIsFollowing(v => !v)}
                  style={({ pressed }) => [
                    styles.followBtn,
                    { borderColor: theme.border, backgroundColor: isFollowing ? theme.backgroundSelected : theme.background },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: isFollowing ? theme.primary : theme.text, fontSize: 11 }}>
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 0 }}>
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
            {!!viewCompany?.tags?.length && (
              <View style={styles.tagsRow}>
                {viewCompany.tags.map((t) => (
                <View key={t} style={[styles.tag, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                  <ThemedText type="code" style={{ color: theme.primary, fontSize: 10, fontWeight: 'bold' }}>
                    {t}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
            {!viewCompany?.tags?.length && (
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <ThemedText type="code" style={{ color: theme.textSecondary, fontSize: 10 }}>
                    Sem conquistas cadastradas
                  </ThemedText>
                </View>
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
                    {m.role === 'leader' ? 'Presidente' : 'Membro'}
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
});

