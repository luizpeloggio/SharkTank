import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppStorage, SharkProject, SHARKS } from '@/services/storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SHARK_AVATARS: { [key: string]: any } = {
  'shark-1': require('@/assets/images/Amanda.jpg'),
  'shark-2': require('@/assets/images/Karina.jpg'),
  'shark-3': require('@/assets/images/Luiza.jpg'),
};

export default function SharkTankScreen() {
  const theme = useTheme();

  // Core Data States
  const [projects, setProjects] = useState<SharkProject[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [isEnrollModalVisible, setIsEnrollModalVisible] = useState<boolean>(false);

  // Inscription Form States
  const [projName, setProjName] = useState<string>('');
  const [projDesc, setProjDesc] = useState<string>('');
  const [projMembers, setProjMembers] = useState<string>('');
  const [projCourse, setProjCourse] = useState<string>('');
  const [projLogo, setProjLogo] = useState<string>('');

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate Countdown (Target: June 15, 2026)
  useEffect(() => {
    const targetDate = new Date('2026-06-15T19:00:00-03:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Load votes and projects
  useEffect(() => {
    loadData();
  }, [isEnrollModalVisible]);

  const loadData = async () => {
    const list = await AppStorage.getSharkProjects();
    const votes = await AppStorage.getUserVotes();
    setProjects(list);
    setUserVotes(votes);
  };

  const handleVote = async (projectId: string) => {
    if (userVotes.includes(projectId)) {
      if (Platform.OS === 'web') {
        alert('Você já votou neste projeto!');
      } else {
        Alert.alert('Voto já registrado', 'Sua torcida por este projeto já foi registrada! Você pode votar em outros projetos se desejar.');
      }
      return;
    }

    const res = await AppStorage.voteForProject(projectId);
    setProjects(res.projects);
    setUserVotes(res.userVotes);

    if (Platform.OS === 'web') {
      alert('Voto computado com sucesso! Obrigado por participar do Shark Tank UERN!');
    } else {
      Alert.alert('Voto Confirmado! 🦈', 'Obrigado por ajudar a escolher o melhor projeto do ecossistema.');
    }
  };

  const pickLogoImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        if (Platform.OS === 'web') {
          alert('Precisamos de acesso às suas fotos para carregar a logo!');
        } else {
          Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para carregar a logo!');
        }
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProjLogo(result.assets[0].uri);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Não foi possível carregar a imagem da logo.');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar a imagem da logo.');
      }
    }
  };

  const handleEnrollProject = async () => {
    if (!projName.trim() || !projDesc.trim() || !projMembers.trim() || !projCourse.trim() || !projLogo) {
      if (Platform.OS === 'web') {
        alert('Por favor, preencha todos os campos obrigatórios e envie a logo da startup!');
      } else {
        Alert.alert('Campos Pendentes', 'Por favor, informe todos os campos e selecione a foto da logo da startup.');
      }
      return;
    }

    const newProj: SharkProject = {
      id: `proj-${Date.now()}`,
      name: projName,
      description: projDesc,
      team: `Integrantes: ${projMembers.trim()} | Curso: ${projCourse.trim()}`,
      logo: projLogo,
      votes: 0,
    };

    // Save to AsyncStorage
    const currentList = await AppStorage.getSharkProjects();
    const updated = [...currentList, newProj];
    await require('@react-native-async-storage/async-storage').default.setItem('@uern_impactoej_shark_projects', JSON.stringify(updated));

    setProjects(updated);
    setProjName('');
    setProjDesc('');
    setProjMembers('');
    setProjCourse('');
    setProjLogo('');
    setIsEnrollModalVisible(false);

    if (Platform.OS === 'web') {
      alert('Projeto inscrito com sucesso! Ele já está disponível no painel de votação popular.');
    } else {
      Alert.alert('Sucesso! 💥', 'Seu projeto foi inscrito e já pode receber votos da torcida!');
    }
  };

  // Calculate total votes cast
  const totalVotes = projects.reduce((sum, item) => sum + item.votes, 0);

  // Helper to calculate percentage of votes
  const getVotePercent = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* SYMPLA SYMPLA EVENTO PANEL */}
          <View style={[styles.eventCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={[styles.eventBadge, { backgroundColor: theme.primary }]}>
              <ThemedText type="code" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                🦈 EVENTO EXCLUSIVO UERN
              </ThemedText>
            </View>
            
            <ThemedText type="subtitle" style={[styles.eventTitle, { color: theme.text }]}>
              Shark Tank UERN 2026
            </ThemedText>
            
            <ThemedText type="small" style={[styles.eventMeta, { color: theme.textSecondary }]}>
              📍 Auditório Central, Campus Mossoró • 📅 15 de Junho, 19:00
            </ThemedText>

            {/* Countdown timer */}
            <View style={styles.timerRow}>
              <View style={[styles.timerBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="subtitle" style={[styles.timerNum, { color: theme.primary }]}>{timeLeft.days}</ThemedText>
                <ThemedText type="code" style={[styles.timerLabel, { color: theme.textSecondary }]}>DIAS</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.timerColon, { color: theme.primary }]}>:</ThemedText>
              <View style={[styles.timerBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="subtitle" style={[styles.timerNum, { color: theme.primary }]}>{timeLeft.hours}</ThemedText>
                <ThemedText type="code" style={[styles.timerLabel, { color: theme.textSecondary }]}>HORAS</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.timerColon, { color: theme.primary }]}>:</ThemedText>
              <View style={[styles.timerBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="subtitle" style={[styles.timerNum, { color: theme.primary }]}>{timeLeft.minutes}</ThemedText>
                <ThemedText type="code" style={[styles.timerLabel, { color: theme.textSecondary }]}>MINS</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.timerColon, { color: theme.primary }]}>:</ThemedText>
              <View style={[styles.timerBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="subtitle" style={[styles.timerNum, { color: theme.primary }]}>{timeLeft.seconds}</ThemedText>
                <ThemedText type="code" style={[styles.timerLabel, { color: theme.textSecondary }]}>SEGS</ThemedText>
              </View>
            </View>

            {/* Inscription Action */}
            <Pressable 
              style={[styles.enrollCta, { backgroundColor: theme.primary }]}
              onPress={() => setIsEnrollModalVisible(true)}
            >
              <ThemedText type="smallBold" style={styles.enrollCtaText}>
                🚀 Inscrever Minha Startup / Projeto
              </ThemedText>
            </Pressable>
          </View>

          {/* JURADOS CAROUSEL */}
          <View style={styles.sectionContainer}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
              🦈 Os Tubarões
            </ThemedText>
            
            <FlatList
              horizontal
              data={SHARKS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.juryScroll}
              renderItem={({ item }) => (
                <View style={[styles.juryCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
                  <View style={[styles.juryAvatarBox, { backgroundColor: theme.backgroundSelected }]}>
                    <Image 
                      source={SHARK_AVATARS[item.id]} 
                      style={{ width: 64, height: 64, borderRadius: 32 }} 
                      resizeMode="cover"
                    />
                  </View>
                  <ThemedText type="smallBold" style={[styles.juryName, { color: theme.text }]}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="code" style={[styles.juryRole, { color: theme.primary }]}>
                    {item.role}
                  </ThemedText>
                  <ThemedText type="code" style={[styles.juryCompany, { color: theme.textSecondary }]}>
                    {item.company}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.juryBio, { color: theme.textSecondary }]}>
                    {item.bio}
                  </ThemedText>
                </View>
              )}
            />
          </View>

          {/* POPULAR VOTING PANEL */}
          <View style={styles.sectionContainer}>
            <View style={styles.votingHeader}>
              <View style={{ flex: 1, paddingRight: Spacing.two }}>
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
                  🗳️ Votação Popular da Torcida
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Vote nos seus projetos preferidos e veja os resultados parciais ao vivo!
                </ThemedText>
              </View>
              <View style={[styles.votesBadge, { backgroundColor: theme.backgroundSelected, borderColor: theme.border, borderWidth: 1 }]}>
                <ThemedText type="code" style={{ color: theme.primary, fontWeight: 'bold' }}>
                  {totalVotes} VOTOS
                </ThemedText>
              </View>
            </View>

            <View style={styles.projectsList}>
              {projects.map((proj) => {
                const voted = userVotes.includes(proj.id);
                const pct = getVotePercent(proj.votes);
                
                return (
                  <View 
                    key={proj.id} 
                    style={[styles.projCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
                  >
                    <View style={styles.projCardHeader}>
                      <View style={styles.projMeta}>
                        <View style={[styles.projLogoBox, { backgroundColor: theme.backgroundSelected }]}>
                          {proj.logo && (proj.logo.startsWith('file:') || proj.logo.startsWith('data:') || proj.logo.startsWith('http')) ? (
                            <Image 
                              source={{ uri: proj.logo }} 
                              style={{ width: 44, height: 44, borderRadius: 12 }} 
                              resizeMode="cover" 
                            />
                          ) : (
                            <ThemedText style={{ fontSize: 24 }}>{proj.logo || '🚀'}</ThemedText>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ThemedText type="smallBold" style={[styles.projName, { color: theme.text }]}>
                              {proj.name}
                            </ThemedText>
                            {proj.name === 'GenBarber' && (
                              <View style={styles.easterEggTag}>
                                <ThemedText type="code" style={styles.easterEggTagText}>ESPECIAL</ThemedText>
                              </View>
                            )}
                          </View>
                          <ThemedText type="code" style={[styles.projTeam, { color: theme.textSecondary }]}>
                            👥 {proj.team}
                          </ThemedText>
                        </View>
                      </View>
                      
                      {/* Voting Button */}
                      <Pressable
                        style={[
                          styles.voteBtn,
                          { backgroundColor: theme.background, borderColor: theme.border },
                          voted && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => handleVote(proj.id)}
                      >
                        <ThemedText type="code" style={[styles.voteBtnText, { color: voted ? '#FFFFFF' : theme.textSecondary }]}>
                          {voted ? 'Votado ✓' : 'Votar 🦈'}
                        </ThemedText>
                      </Pressable>
                    </View>

                    <ThemedText type="small" style={[styles.projDesc, { color: theme.textSecondary }]}>
                      {proj.description}
                    </ThemedText>

                    {/* Result Visual Bar */}
                    <View style={styles.votingBarContainer}>
                      <View style={[styles.barBackground, { backgroundColor: theme.background }]}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
                      </View>
                      <ThemedText type="code" style={[styles.votingBarText, { color: theme.textSecondary }]}>
                        {proj.votes} votos ({pct}%)
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: Spacing.six }} />
        </ScrollView>

        {/* ================= ENROLL PROJECT MODAL ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEnrollModalVisible}
          onRequestClose={() => setIsEnrollModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary }}>
                    INSCREVA SEU PROJETO
                  </ThemedText>
                  <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                    Rumo aos Tubarões!
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsEnrollModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Form Content */}
              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                
                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Nome da Startup / Ideia *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: GenBarber"
                  placeholderTextColor={theme.textSecondary}
                  value={projName}
                  onChangeText={setProjName}
                />

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Integrantes do Time *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Luiz P., Maria J."
                  placeholderTextColor={theme.textSecondary}
                  value={projMembers}
                  onChangeText={setProjMembers}
                />

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Curso *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Ciência da Computação"
                  placeholderTextColor={theme.textSecondary}
                  value={projCourse}
                  onChangeText={setProjCourse}
                />

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Foto da Logo da Startup *
                </ThemedText>
                <Pressable 
                  style={[
                    styles.input, 
                    { 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: Spacing.four, 
                      backgroundColor: theme.background, 
                      borderStyle: 'dashed', 
                      borderWidth: 1.5, 
                      borderColor: theme.primary,
                      borderRadius: 12,
                      marginTop: 4
                    }
                  ]} 
                  onPress={pickLogoImage}
                >
                  {projLogo ? (
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      <Image source={{ uri: projLogo }} style={{ width: 80, height: 80, borderRadius: 16 }} />
                      <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>✓ Logo Carregada com Sucesso</ThemedText>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      <ThemedText style={{ fontSize: 24 }}>📸</ThemedText>
                      <ThemedText style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>Selecionar Imagem da Logo da Startup</ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>Formatos aceitos: JPG, PNG</ThemedText>
                    </View>
                  )}
                </Pressable>

                <ThemedText type="smallBold" style={[styles.label, { color: theme.textSecondary }]}>
                  Descrição do Pitch *
                </ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  multiline
                  numberOfLines={4}
                  placeholder="Explique o que seu projeto faz, qual dor do mercado resolve, e como o app ou produto funciona."
                  placeholderTextColor={theme.textSecondary}
                  value={projDesc}
                  onChangeText={setProjDesc}
                />

                <View style={{ height: Spacing.six }} />
              </ScrollView>

              {/* Footer */}
              <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <Pressable 
                  style={[styles.publishBtn, { backgroundColor: theme.primary }]}
                  onPress={handleEnrollProject}
                >
                  <ThemedText type="smallBold" style={styles.publishBtnText}>
                    🦈 Submeter Inscrição
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
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  eventCard: {
    borderRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(0, 51, 102, 0.2)',
    marginTop: Spacing.two,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
  },
  eventBadge: {
    backgroundColor: '#003366',
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    marginBottom: Spacing.two,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  eventMeta: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: Spacing.one,
    fontSize: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.four,
    gap: Spacing.one,
  },
  timerBlock: {
    backgroundColor: '#090D16',
    borderRadius: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  timerNum: {
    color: '#003366',
    fontSize: 20,
    fontWeight: '800',
  },
  timerLabel: {
    color: '#64748B',
    fontSize: 8,
    marginTop: 1,
    fontWeight: 'bold',
  },
  timerColon: {
    color: '#003366',
    fontSize: 20,
    fontWeight: '800',
  },
  enrollCta: {
    backgroundColor: '#003366',
    borderRadius: 14,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  enrollCtaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginTop: Spacing.five,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: Spacing.two,
  },
  
  // JURY
  juryScroll: {
    paddingRight: Spacing.four,
    gap: Spacing.three,
  },
  juryCard: {
    width: 220,
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  juryAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  juryName: {
    color: '#FFF',
    fontSize: 14,
  },
  juryRole: {
    color: '#003366',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  juryCompany: {
    color: '#00E5FF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  juryBio: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: Spacing.two,
  },

  // VOTING RESULTS
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  votesBadge: {
    backgroundColor: 'rgba(0, 51, 102, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 51, 102, 0.3)',
  },
  projectsList: {
    gap: Spacing.three,
  },
  projCard: {
    borderRadius: 18,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  projCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  projLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projName: {
    color: '#FFF',
    fontSize: 16,
  },
  projTeam: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  easterEggTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  easterEggTagText: {
    color: '#00E5FF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  voteBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 10,
  },
  voteBtnSelected: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  voteBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 10,
  },
  projDesc: {
    color: '#94A3B8',
    lineHeight: 18,
    fontSize: 12,
    marginVertical: Spacing.three,
  },
  votingBarContainer: {
    gap: Spacing.one,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#090D16',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 4,
  },
  votingBarText: {
    color: '#64748B',
    fontSize: 9,
    textAlign: 'right',
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
