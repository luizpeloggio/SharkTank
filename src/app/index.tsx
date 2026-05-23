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
import { UserProfileHeader } from '@/components/user-profile-header';

export interface B2BService {
  id: string;
  ej: string;
  title: string;
  price: string;
  rating: number;
  description: string;
  portfolio: string;
  avatar: string;
}

export const B2B_SERVICES: B2BService[] = [
  {
    id: 's-1',
    ej: 'Computação EJ (Mossoró)',
    title: 'Desenvolvimento de Sites & Web Apps',
    price: 'A partir de R$ 1.800',
    rating: 4.9,
    description: 'Criação de landing pages responsivas, e-commerces e sistemas web sob medida em React/Node.',
    portfolio: 'Mais de 15 sites entregues na região oeste potiguar.',
    avatar: '💻'
  },
  {
    id: 's-2',
    ej: 'Administração Consultoria',
    title: 'Plano de Negócios & Viabilidade',
    price: 'A partir de R$ 1.200',
    rating: 4.8,
    description: 'Estruturação de planos financeiros, análise SWOT, estudo de concorrentes e projeção de caixa.',
    portfolio: 'Auxiliamos mais de 20 comércios locais a estruturarem suas finanças.',
    avatar: '📊'
  },
  {
    id: 's-3',
    ej: 'Assessoria Direito EJ',
    title: 'Contratos, Estatutos & Registro',
    price: 'Sob Consulta',
    rating: 5.0,
    description: 'Assessoria jurídica completa para startups, termos de uso, contratos de prestação e compliance.',
    portfolio: 'Apoiamos a regularização civil de 8 empresas juniores do estado.',
    avatar: '⚖️'
  }
];

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

  // Interactive View Toggle (Mural Feed vs B2B Services Marketplace)
  const [activeView, setActiveView] = useState<'feed' | 'marketplace'>('feed');
  
  // Smart Notifications states
  const [isNotificationsVisible, setIsNotificationsVisible] = useState<boolean>(false);
  const [notifications, setNotifications] = useState([
    { id: 'notif-1', title: '💼 Nova vaga de programador front-end!', desc: 'Computação EJ Mossoró acabou de abrir inscrições. Confira agora!', unread: true, category: 'vaga' },
    { id: 'notif-2', title: '🦈 Shark Tank: A votação popular encerra em breve!', desc: 'Vá até o Shark Tank e ajude a eleger a melhor startup acadêmica!', unread: true, category: 'sharktank' },
    { id: 'notif-3', title: '🛣️ Guia de Fundação: Nova etapa disponível!', desc: 'Seu progresso desbloqueou a etapa burocrática de CNPJ e cartório.', unread: true, category: 'guia' }
  ]);

  // B2B Services states
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState<boolean>(false);
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<B2BService | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [estimatedBudget, setEstimatedBudget] = useState<string>('Abaixo de R$ 2.000');

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

  const handleOpenQuote = (service: B2BService) => {
    setSelectedServiceForQuote(service);
    setClientName('');
    setClientEmail('');
    setProjectDescription('');
    setEstimatedBudget('Abaixo de R$ 2.000');
    setIsQuoteModalVisible(true);
  };

  const handleConfirmQuote = () => {
    if (!clientName.trim() || !clientEmail.trim() || !projectDescription.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor, preencha todos os campos obrigatórios!');
      } else {
        Alert.alert('Campos Obrigatórios', 'Por favor, insira o seu nome, e-mail e descrição do projeto.');
      }
      return;
    }

    const msg = `Sucesso! Sua solicitação de orçamento para "${selectedServiceForQuote?.title}" foi recebida pela equipe da ${selectedServiceForQuote?.ej}.\n\nVocê receberá o portfólio completo e a proposta comercial no e-mail ${clientEmail} em até 48 horas úteis!`;
    
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Solicitação Recebida!', msg);
    }
    
    setIsQuoteModalVisible(false);
  };

  const handleReadNotification = (id: string) => {
    setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, unread: false } : notif));
  };

  const handleClearAllNotifications = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
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
        <UserProfileHeader />
        
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
        </View>

        {/* VIEW SELECTOR: FEED VS B2B MARKETPLACE */}
        <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 12, padding: 4, marginBottom: Spacing.three, borderColor: theme.border, borderWidth: 1 }}>
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeView === 'feed' ? theme.primary : 'transparent',
              alignItems: 'center',
            }}
            onPress={() => setActiveView('feed')}
          >
            <ThemedText type="smallBold" style={{ color: activeView === 'feed' ? '#FFF' : theme.text }}>
              📰 Mural de Notícias
            </ThemedText>
          </Pressable>

          <Pressable
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeView === 'marketplace' ? theme.primary : 'transparent',
              alignItems: 'center',
            }}
            onPress={() => setActiveView('marketplace')}
          >
            <ThemedText type="smallBold" style={{ color: activeView === 'marketplace' ? '#FFF' : theme.text }}>
              🛍️ Serviços B2B
            </ThemedText>
          </Pressable>
        </View>

        {/* CONTENT PANELS RENDERING */}
        {activeView === 'feed' ? (
          <>
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
          </>
        ) : (
          /* B2B SERVICES MARKETPLACE */
          <FlatList
            data={B2B_SERVICES}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedListContent}
            renderItem={({ item }) => (
              <View style={[styles.postCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, padding: Spacing.four }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 24, marginRight: 8 }}>{item.avatar}</ThemedText>
                    <View>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>{item.ej}</ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ThemedText style={{ color: '#EAB308', fontSize: 12 }}>★ </ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>{item.rating}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={{ backgroundColor: theme.backgroundSelected, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderColor: theme.border, borderWidth: 1 }}>
                    <ThemedText style={{ fontSize: 10, fontWeight: 'bold', color: theme.primary }}>{item.price}</ThemedText>
                  </View>
                </View>

                <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 16, marginVertical: Spacing.one }}>{item.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.two }}>{item.description}</ThemedText>
                
                <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.two, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>💼 {item.portfolio}</ThemedText>
                  <Pressable
                    style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                    onPress={() => handleOpenQuote(item)}
                  >
                    <ThemedText type="code" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Solicitar Proposta</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          />
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

        {/* ================= SMART NOTIFICATIONS DRAWER ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isNotificationsVisible}
          onRequestClose={() => setIsNotificationsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '75%', backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary }}>
                    NOTIFICAÇÕES INTELIGENTES
                  </ThemedText>
                  <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                    Seu painel de alertas
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsNotificationsVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.four, marginVertical: Spacing.three }}>
                <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                  {notifications.filter(n => n.unread).length} novos alertas não lidos
                </ThemedText>
                {notifications.some(n => n.unread) && (
                  <Pressable onPress={handleClearAllNotifications}>
                    <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
                      Marcar todos como lidos
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: Spacing.four, paddingBottom: Spacing.four }}
                renderItem={({ item }) => (
                  <Pressable 
                    onPress={() => handleReadNotification(item.id)}
                    style={{
                      padding: Spacing.three,
                      borderRadius: 12,
                      backgroundColor: item.unread ? theme.backgroundSelected : theme.background,
                      borderColor: item.unread ? theme.primary : theme.border,
                      borderWidth: 1,
                      marginBottom: Spacing.two,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 13 }}>
                        {item.title}
                      </ThemedText>
                      {item.unread && (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                      )}
                    </View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {item.desc}
                    </ThemedText>
                  </Pressable>
                )}
              />

            </View>
          </View>
        </Modal>

        {/* ================= B2B SERVICES QUOTE MODAL ================= */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isQuoteModalVisible}
          onRequestClose={() => setIsQuoteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { width: '90%', maxHeight: '80%', paddingBottom: Spacing.four, backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary }}>
                    ORÇAMENTO B2B
                  </ThemedText>
                  <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                    Solicitar Proposta
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsQuoteModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              <ScrollView style={{ paddingHorizontal: Spacing.four, marginTop: Spacing.three }} showsVerticalScrollIndicator={false}>
                {selectedServiceForQuote && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, padding: Spacing.three, borderRadius: 12, marginBottom: Spacing.four, borderColor: theme.border, borderWidth: 1 }}>
                    <ThemedText style={{ fontSize: 32, marginRight: 12 }}>{selectedServiceForQuote.avatar}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>{selectedServiceForQuote.ej}</ThemedText>
                      <ThemedText type="code" style={{ color: theme.primary }}>{selectedServiceForQuote.title}</ThemedText>
                    </View>
                  </View>
                )}

                <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
                  Seu Nome / Nome da Empresa *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Luiz Barber / Startup X"
                  placeholderTextColor={theme.textSecondary}
                  value={clientName}
                  onChangeText={setClientName}
                />

                <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
                  E-mail de Contato *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: luiz@empresa.com"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={clientEmail}
                  onChangeText={setClientEmail}
                />

                <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
                  Orçamento Estimado
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.three }}>
                  {['Abaixo de R$ 2.000', 'R$ 2.000 a R$ 5.000', 'Acima de R$ 5.000'].map(budget => {
                    const isSelected = estimatedBudget === budget;
                    return (
                      <Pressable
                        key={budget}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: isSelected ? theme.primary : theme.background,
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: 1,
                        }}
                        onPress={() => setEstimatedBudget(budget)}
                      >
                        <ThemedText type="smallBold" style={{ color: isSelected ? '#FFF' : theme.text, fontSize: 11 }}>
                          {budget}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
                  Descrição Resumida do Projeto *
                </ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: Spacing.three,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    fontSize: 14,
                    marginBottom: Spacing.four,
                  }}
                  multiline
                  placeholder="Ex: Preciso de um site institucional de 5 páginas com agendamento simples."
                  placeholderTextColor={theme.textSecondary}
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                />
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                  <Pressable 
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      borderWidth: 1,
                    }}
                    onPress={() => setIsQuoteModalVisible(false)}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Cancelar</ThemedText>
                  </Pressable>
                  <Pressable 
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: theme.primary,
                    }}
                    onPress={handleConfirmQuote}
                  >
                    <ThemedText type="smallBold" style={{ color: '#FFF' }}>Enviar Solicitação</ThemedText>
                  </Pressable>
                </View>
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
