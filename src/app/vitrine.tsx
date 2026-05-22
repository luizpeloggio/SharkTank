import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MetricItem {
  id: string;
  value: string;
  label: string;
  description: string;
}

interface Testimonial {
  id: string;
  name: string;
  previousRole: string;
  currentCompany: string;
  quote: string;
  avatar: string;
  companyLogo: string;
}

interface GalleryItem {
  id: string;
  emoji: string;
  title: string;
  location: string;
  vibes: string;
}

const METRICS: MetricItem[] = [
  {
    id: 'm1',
    value: 'R$ 2.4 Mi',
    label: 'Valuation & Faturamento',
    description: 'Gerado por EJs do RN em soluções locais em 2025.',
  },
  {
    id: 'm2',
    value: '42 EJs',
    label: 'Federadas no Estado',
    description: 'Empresas juniores oficiais ativas prestando serviços.',
  },
  {
    id: 'm3',
    value: '1.500+',
    label: 'Membros Ativos',
    description: 'Empresários juniores liderando equipes reais em faculdades.',
  },
  {
    id: 'm4',
    value: '85%',
    label: 'Empregabilidade',
    description: 'De ex-membros contratados por grandes corporações em 6 meses.',
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Juliana Macedo',
    previousRole: 'Ex-Presidente da Computação EJ',
    currentCompany: 'CEO & Founder @ AgroNet',
    quote: 'A EJ me ensinou a negociar com clientes e liderar sob pressão. Esse "músculo" empreendedor me deu confiança para captar R$ 1.5M em rodada seed para minha startup logo após me formar na UERN!',
    avatar: '👩‍💼',
    companyLogo: '🌱',
  },
  {
    id: 't2',
    name: 'Marcos Rocha',
    previousRole: 'Ex-Diretor de Projetos UERN Tech',
    currentCompany: 'Staff Software Engineer @ Nubank',
    quote: 'Desenvolver software para comércios locais em Mossoró me deu uma maturidade técnica de arquitetura de software real. Na entrevista técnica do Nubank, usei todos os exemplos práticos que vivi na EJ.',
    avatar: '👨‍💻',
    companyLogo: '💜',
  },
  {
    id: 't3',
    name: 'Aline Souza',
    previousRole: 'Ex-Assessora Jurídica da Direito EJ',
    currentCompany: 'Product Manager @ Google',
    quote: 'A cultura da EJ é aspiracional e vibrante. Você aprende a gerenciar projetos multidisciplinares e ter foco absoluto em impacto. Essa mentalidade global foi o diferencial para meu ingresso na Big Tech.',
    avatar: '👩‍💻',
    companyLogo: '💛',
  },
];

const GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    emoji: '🚀',
    title: 'ENEJ 2025',
    location: 'Fortaleza - CE',
    vibes: '5.000 empresários juniores unidos pela transformação do Brasil.',
  },
  {
    id: 'g2',
    emoji: '🏆',
    title: 'Prêmio RN Júnior',
    location: 'Natal - RN',
    vibes: 'Celebrando as EJs de maior impacto e faturamento do ano.',
  },
  {
    id: 'g3',
    emoji: '🤝',
    title: 'Imersão de Liderança',
    location: 'UERN Mossoró',
    vibes: 'Treinamento de oratória e negociação intensivo para novos diretores.',
  },
];

export default function VitrineScreen() {
  const theme = useTheme();

  // Metric Animated States
  const [animatedM1, setAnimatedM1] = useState(0);
  const [animatedM2, setAnimatedM2] = useState(0);
  const [animatedM3, setAnimatedM3] = useState(0);
  const [animatedM4, setAnimatedM4] = useState(0);

  // Easing function for smoother counting
  const animateCount = (targetValue: number, setDisplayVal: React.Dispatch<React.SetStateAction<number>>, decimals: boolean = false) => {
    setDisplayVal(0);
    const duration = 1000; // 1 second
    const startTime = Date.now();
    
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuad curve
      const easeProgress = progress * (2 - progress);
      const current = easeProgress * targetValue;
      
      setDisplayVal(decimals ? Math.round(current * 10) / 10 : Math.floor(current));
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayVal(targetValue);
      }
    };
    
    requestAnimationFrame(tick);
  };

  // Run counting animation every time Showcase screen is focused
  useFocusEffect(
    React.useCallback(() => {
      animateCount(2.4, setAnimatedM1, true);
      animateCount(42, setAnimatedM2, false);
      animateCount(1500, setAnimatedM3, false);
      animateCount(85, setAnimatedM4, false);
    }, [])
  );

  const getFormattedValue = (id: string, val: number) => {
    if (id === 'm1') return `R$ ${val.toFixed(1)} Mi`;
    if (id === 'm2') return `${Math.floor(val)} EJs`;
    if (id === 'm3') {
      const formatted = Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `${formatted}+`;
    }
    if (id === 'm4') return `${Math.floor(val)}%`;
    return val.toString();
  };

  const handleOpenTestimonial = (name: string) => {
    const msg = `Em breve você poderá assistir à entrevista completa em vídeo com ${name} contando a trajetória detalhada de fundação de EJ!`;
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Vídeo Depoimento', msg);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              VITRINE E RECONHECIMENTO
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Cultura & Impacto
            </ThemedText>
            <ThemedText type="small" style={[styles.headerSub, { color: theme.textSecondary }]}>
              Descubra a força do Movimento Empresa Júnior (MEJ) e veja onde a vibe empreendedora pode te levar.
            </ThemedText>
          </View>

          {/* METRICS DASHBOARD GRID */}
          <View style={styles.sectionContainer}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
              📊 O MEJ em Números
            </ThemedText>
            
            <View style={styles.metricsGrid}>
              {METRICS.map((item) => {
                const animVal = 
                  item.id === 'm1' ? animatedM1 :
                  item.id === 'm2' ? animatedM2 :
                  item.id === 'm3' ? animatedM3 :
                  animatedM4;
                  
                return (
                  <View 
                    key={item.id} 
                    style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
                  >
                    <ThemedText type="subtitle" style={[styles.metricValue, { color: theme.primary }]}>
                      {getFormattedValue(item.id, animVal)}
                    </ThemedText>
                    <ThemedText type="smallBold" style={[styles.metricLabel, { color: theme.text }]}>
                      {item.label}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.metricDesc, { color: theme.textSecondary }]}>
                      {item.description}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* "ONDE ELES ESTÃO AGORA" CAROUSEL */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
                ⭐ Onde Eles Estão Agora?
              </ThemedText>
              <ThemedText type="code" style={{ color: theme.primary, fontWeight: 'bold' }}>
                EX-MEMBROS
              </ThemedText>
            </View>

            <FlatList
              horizontal
              data={TESTIMONIALS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              renderItem={({ item }) => (
                <Pressable 
                  style={[styles.testimonialCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={() => handleOpenTestimonial(item.name)}
                >
                  {/* Testimonial Header */}
                  <View style={styles.testiHeader}>
                    <View style={[styles.testiAvatarBox, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText style={{ fontSize: 24 }}>{item.avatar}</ThemedText>
                    </View>
                    <View style={styles.testiMeta}>
                      <ThemedText type="smallBold" style={[styles.testiName, { color: theme.text }]}>
                        {item.name}
                      </ThemedText>
                      <ThemedText type="code" style={[styles.testiRole, { color: theme.textSecondary }]}>
                        {item.previousRole}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Quote */}
                  <ThemedText type="small" style={[styles.testiQuote, { color: theme.text }]}>
                    "{item.quote}"
                  </ThemedText>

                  {/* Testimonial Footer */}
                  <View style={styles.testiFooter}>
                    <ThemedText type="code" style={[styles.testiCompany, { color: theme.textSecondary }]}>
                      💼 {item.currentCompany}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 16 }}>{item.companyLogo}</ThemedText>
                  </View>
                  
                  {/* Play Video Button */}
                  <View style={[styles.videoBadge, { backgroundColor: theme.backgroundSelected, borderColor: theme.border, borderWidth: 1 }]}>
                    <ThemedText type="code" style={{ color: theme.primary, fontWeight: 'bold', fontSize: 10 }}>
                      ▶ ASSISTIR TRAJETÓRIA
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            />
          </View>

          {/* LIFESTYLE GALLERY */}
          <View style={styles.sectionContainer}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
              ⚡ O Estilo de Vida Júnior
            </ThemedText>
            <ThemedText type="small" style={[styles.sectionSub, { color: theme.textSecondary }]}>
              O ecossistema é muito trabalho, mas também celebração, premiações e uma união inexplicável.
            </ThemedText>

            <View style={styles.galleryList}>
              {GALLERY.map((item) => (
                <View 
                  key={item.id} 
                  style={[styles.galleryCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
                >
                  <View style={[styles.galleryEmojiContainer, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText style={{ fontSize: 32 }}>{item.emoji}</ThemedText>
                  </View>
                  <View style={styles.galleryInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText type="smallBold" style={[styles.galleryTitle, { color: theme.text }]}>
                        {item.title}
                      </ThemedText>
                      <ThemedText type="code" style={[styles.galleryLoc, { color: theme.primary }]}>
                        📍 {item.location}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={[styles.galleryVibes, { color: theme.textSecondary }]}>
                      {item.vibes}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: Spacing.five }} />
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
  headerSub: {
    color: '#94A3B8',
    marginTop: Spacing.one,
    lineHeight: 18,
  },
  sectionContainer: {
    marginTop: Spacing.four,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: Spacing.two,
  },
  sectionSub: {
    color: '#64748B',
    marginBottom: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  
  // METRICS GRID
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metricCard: {
    width: Platform.OS === 'web' ? '47%' : '47%',
    flexGrow: 1,
    minWidth: 150,
    borderRadius: 16,
    padding: Spacing.three + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#003366', // High energy YC orange
  },
  metricLabel: {
    color: '#FFF',
    fontSize: 13,
    marginVertical: Spacing.one / 2,
  },
  metricDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 14,
  },

  // TESTIMONIAL CAROUSEL
  carouselContainer: {
    paddingRight: Spacing.four,
    gap: Spacing.three,
  },
  testimonialCard: {
    width: 290,
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between',
  },
  testiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  testiAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 51, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testiMeta: {
    flex: 1,
  },
  testiName: {
    color: '#FFF',
    fontSize: 15,
  },
  testiRole: {
    color: '#94A3B8',
    fontSize: 9,
  },
  testiQuote: {
    color: '#CBD5E1',
    fontStyle: 'italic',
    lineHeight: 18,
    fontSize: 12,
    marginBottom: Spacing.three,
  },
  testiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  testiCompany: {
    color: '#00E5FF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  videoBadge: {
    backgroundColor: 'rgba(0, 51, 102, 0.12)',
    borderRadius: 6,
    paddingVertical: Spacing.one,
    alignItems: 'center',
  },

  // GALLERY LIFESTYLE LIST
  galleryList: {
    gap: Spacing.three,
  },
  galleryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.three + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  galleryEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  galleryInfo: {
    flex: 1,
  },
  galleryTitle: {
    color: '#FFF',
    fontSize: 15,
  },
  galleryLoc: {
    color: '#003366',
    fontSize: 9,
    fontWeight: 'bold',
  },
  galleryVibes: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
