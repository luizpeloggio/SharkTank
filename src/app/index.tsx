import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStorage, FeedPost, UserRole } from '@/services/storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function FeedScreen() {
  const theme = useTheme();

  // Core States
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('estudante');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'vaga' | 'evento' | 'noticia'>('todos');
  const [isPostModalVisible, setIsPostModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form States for New Post
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'vaga' | 'evento' | 'noticia'>('noticia');
  const [newApplyUrl, setNewApplyUrl] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [isPostModalVisible]);

  const loadData = async () => {
    setIsLoading(true);
    const storedPosts = await AppStorage.getFeedPosts();
    const role = await AppStorage.getRole();
    setPosts(storedPosts);
    setUserRole(role);
    setIsLoading(false);
  };

  const handleLike = async (postId: string) => {
    const updated = await AppStorage.toggleLikePost(postId);
    setPosts(updated);
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim() || !newAuthor.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor, preencha todos os campos obrigatórios (Título, Conteúdo e Autor)!');
      } else {
        Alert.alert('Campos Pendentes', 'Por favor, insira o título, conteúdo e nome do autor.');
      }
      return;
    }

    const tagMap = {
      noticia: '#NOTÍCIA',
      vaga: '#VAGA',
      evento: '#EVENTO',
    };

    const newPostData = {
      title: newTitle,
      content: newContent,
      author: newAuthor,
      category: newCategory,
      tag: tagMap[newCategory],
      applyUrl: newApplyUrl.trim() ? newApplyUrl.trim() : undefined,
    };

    const updated = await AppStorage.addFeedPost(newPostData);
    setPosts(updated);
    
    // Reset Form & Close Modal
    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
    setNewApplyUrl('');
    setNewCategory('noticia');
    setIsPostModalVisible(false);

    if (Platform.OS === 'web') {
      alert('Postagem criada com sucesso no Feed do Ecossistema!');
    } else {
      Alert.alert('Sucesso!', 'Sua postagem foi adicionada ao mural.');
    }
  };

  // Filter Posts
  const filteredPosts = selectedFilter === 'todos' 
    ? posts 
    : posts.filter(post => post.category === selectedFilter);

  // Style tags based on category
  const getTagColors = (category: string) => {
    switch (category) {
      case 'vaga':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.3)' }; // Purple
      case 'evento':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' }; // Green
      case 'noticia':
      default:
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316', border: 'rgba(249, 115, 22, 0.3)' }; // Vibrant Orange
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              MURAL DO ECOSSISTEMA
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Radar de EJs
            </ThemedText>
          </View>
          
          <View style={[styles.roleTag, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
            <ThemedText type="code" style={[styles.roleTagText, { color: theme.text }]}>
              Perfis: {userRole.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* HORIZONTAL CATEGORY FILTER CHIPS */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['todos', 'vaga', 'evento', 'noticia'] as const).map(filter => {
              const isActive = selectedFilter === filter;
              const label = filter === 'todos' ? 'Todos' : filter === 'vaga' ? '💼 Vagas' : filter === 'evento' ? '📅 Eventos' : '📰 Notícias';
              
              return (
                <Pressable
                  key={filter}
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: isActive ? theme.primary : theme.backgroundElement,
                      borderColor: isActive ? theme.primary : theme.border,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <ThemedText 
                    type="smallBold" 
                    style={[
                      styles.chipText,
                      { color: isActive ? '#FFFFFF' : theme.textSecondary }
                    ]}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* FEED POSTS LIST */}
        {isLoading ? (
          // Skeleton Loader Simulation
          <View style={styles.skeletonContainer}>
            <View style={[styles.skeletonCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} />
            <View style={[styles.skeletonCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>🏜️</ThemedText>
            <ThemedText type="smallBold" style={[styles.emptyTitle, { color: theme.text }]}>
              Nenhuma postagem encontrada
            </ThemedText>
            <ThemedText type="small" style={[styles.emptySub, { color: theme.textSecondary }]}>
              Parece que este filtro está temporariamente vazio.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedListContent}
            renderItem={({ item }) => {
              const colors = getTagColors(item.category);
              
              return (
                <View style={[styles.postCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.authorSection}>
                      <View style={[styles.authorBadge, { backgroundColor: theme.primary }]}>
                        <ThemedText type="smallBold" style={{ color: '#FFF' }}>
                          {item.author.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View>
                        <ThemedText type="smallBold" style={[styles.authorName, { color: theme.text }]}>
                          {item.author}
                        </ThemedText>
                        <ThemedText type="code" style={[styles.postDate, { color: theme.textSecondary }]}>
                          {item.date}
                        </ThemedText>
                      </View>
                    </View>
                    
                    {/* Category Tag */}
                    <View style={[
                      styles.tagBadge, 
                      { backgroundColor: colors.bg, borderColor: colors.border }
                    ]}>
                      <ThemedText type="code" style={[styles.tagText, { color: colors.text }]}>
                        {item.tag}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Card Body */}
                  <ThemedText type="smallBold" style={[styles.cardTitle, { color: theme.text }]}>
                    {item.title}
                  </ThemedText>
                  
                  <ThemedText type="small" style={[styles.cardContent, { color: theme.textSecondary }]}>
                    {item.content}
                  </ThemedText>

                  {/* Card Footer Actions */}
                  <View style={[styles.cardFooter, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                    
                    {/* Likes Action */}
                    <Pressable 
                      style={styles.likeBtn}
                      onPress={() => handleLike(item.id)}
                    >
                      <ThemedText style={styles.likeEmoji}>🔥</ThemedText>
                      <ThemedText type="code" style={[styles.likeCount, { color: theme.textSecondary }]}>
                        {item.likes} curtidas
                      </ThemedText>
                    </Pressable>

                    {/* Apply Recruitment Link */}
                    {item.applyUrl && (
                      <Pressable 
                        style={[styles.applyBtn, { borderColor: theme.primary, borderWidth: 1 }]}
                        onPress={() => {
                          if (Platform.OS === 'web') {
                            window.open(item.applyUrl, '_blank');
                          } else {
                            Alert.alert('Candidatura', `Redirecionando para inscrição em: ${item.applyUrl}`);
                          }
                        }}
                      >
                        <ThemedText type="code" style={[styles.applyBtnText, { color: theme.primary }]}>
                          Candidatar-se ↗
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* ROLE-RESTRICTED FAB BUTTON (LIDER OR ADMIN) */}
        {(userRole === 'lider' || userRole === 'admin') && (
          <Pressable 
            style={[styles.fabBtn, { backgroundColor: theme.primary }]}
            onPress={() => setIsPostModalVisible(true)}
          >
            <ThemedText style={styles.fabIcon}>+</ThemedText>
          </Pressable>
        )}

        {/* ================= CREATE POST MODAL ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isPostModalVisible}
          onRequestClose={() => setIsPostModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary }}>
                    NOVA PUBLICAÇÃO
                  </ThemedText>
                  <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                    Espalhe a sua Voz!
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsPostModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Form Content */}
              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                
                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Título da Postagem *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Processo Seletivo Computação EJ"
                  placeholderTextColor={theme.textSecondary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Nome da Organização / Autor *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Computação EJ UERN"
                  placeholderTextColor={theme.textSecondary}
                  value={newAuthor}
                  onChangeText={setNewAuthor}
                />

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Categoria *
                </ThemedText>
                <View style={styles.categorySelectRow}>
                  {(['noticia', 'vaga', 'evento'] as const).map(cat => {
                    const isSel = newCategory === cat;
                    const nameMap = { noticia: '📰 Notícia', vaga: '💼 Vaga', evento: '📅 Evento' };
                    
                    return (
                      <Pressable
                        key={cat}
                        style={[
                          styles.catChoice,
                          { 
                            backgroundColor: isSel ? theme.backgroundSelected : theme.background,
                            borderColor: isSel ? theme.primary : theme.border,
                            borderWidth: 1,
                          }
                        ]}
                        onPress={() => setNewCategory(cat)}
                      >
                        <ThemedText type="code" style={[styles.catChoiceText, { color: isSel ? theme.primary : theme.textSecondary }]}>
                          {nameMap[cat]}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Conteúdo do Post *
                </ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  multiline
                  numberOfLines={4}
                  placeholder="Descreva a vaga, novidade ou edital em detalhes. Torne atraente e aspiracional!"
                  placeholderTextColor={theme.textSecondary}
                  value={newContent}
                  onChangeText={setNewContent}
                />

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Link de Ação / Inscrição (Opcional)
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: https://ej.org/inscricao"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  value={newApplyUrl}
                  onChangeText={setNewApplyUrl}
                />
                
                <View style={{ height: Spacing.six }} />
              </ScrollView>

              {/* Modal Footer */}
              <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <Pressable 
                  style={[styles.publishBtn, { backgroundColor: theme.primary }]}
                  onPress={handleCreatePost}
                >
                  <ThemedText type="smallBold" style={styles.publishBtnText}>
                    💥 Publicar Agora
                  </ThemedText>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  roleTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: Spacing.one,
  },
  roleTagText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 9,
  },
  filterContainer: {
    marginVertical: Spacing.two,
  },
  filterScroll: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 20,
    backgroundColor: '#131C2E',
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#003366',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  feedListContent: {
    paddingBottom: Spacing.six + Spacing.four,
  },
  postCard: {
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  authorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    color: '#FFF',
    fontSize: 14,
  },
  postDate: {
    color: '#64748B',
    fontSize: 10,
  },
  tagBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: Spacing.two,
  },
  cardContent: {
    color: '#94A3B8',
    lineHeight: 20,
    fontSize: 13,
    marginBottom: Spacing.three,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: Spacing.three,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  likeEmoji: {
    fontSize: 16,
  },
  likeCount: {
    color: '#FF9570',
    fontWeight: '600',
    fontSize: 11,
  },
  applyBtn: {
    backgroundColor: '#9333EA', // Purple color for vaga action
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#003366',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  fabIcon: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 16,
  },
  emptySub: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Skeleton
  skeletonContainer: {
    flex: 1,
    gap: Spacing.three,
  },
  skeletonCard: {
    height: 180,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  // Modal
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
    height: '85%',
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
  formScroll: {
    flex: 1,
    padding: Spacing.four,
  },
  label: {
    color: '#FFF',
    fontSize: 13,
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySelectRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  catChoice: {
    flex: 1,
    paddingVertical: Spacing.two,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  catChoiceSelected: {
    backgroundColor: 'rgba(0, 51, 102, 0.15)',
  },
  catChoiceText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  publishBtn: {
    backgroundColor: '#003366',
    paddingVertical: Spacing.two + 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
