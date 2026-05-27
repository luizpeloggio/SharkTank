import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserProfileHeader } from '@/components/user-profile-header';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export interface DynamicMetric {
  id: string;
  label: string;
  desc: string;
  category: 'faturamento' | 'impacto';
  semesterValues: { [semester: string]: { value: string; percentage: number } };
}

export const DYNAMIC_METRICS: DynamicMetric[] = [
  {
    id: 'dm-1',
    label: 'Faturamento Total das EJs',
    desc: 'Receita gerada pelo ecossistema potiguar em consultorias locais.',
    category: 'faturamento',
    semesterValues: {
      '2025.1': { value: 'R$ 980 Mil', percentage: 40 },
      '2025.2': { value: 'R$ 1.25 Milhões', percentage: 52 },
      '2026.1': { value: 'R$ 1.48 Milhões', percentage: 65 }
    }
  },
  {
    id: 'dm-2',
    label: 'Horas de Consultoria Doadas',
    desc: 'Impacto social gratuito oferecido a microempresas locais.',
    category: 'impacto',
    semesterValues: {
      '2025.1': { value: '450 horas', percentage: 30 },
      '2025.2': { value: '680 horas', percentage: 45 },
      '2026.1': { value: '920 horas', percentage: 61 }
    }
  },
  {
    id: 'dm-3',
    label: 'Projetos Entregues no RN',
    desc: 'Soluções reais que geraram valor na comunidade potiguar.',
    category: 'impacto',
    semesterValues: {
      '2025.1': { value: '82 Projetos', percentage: 38 },
      '2025.2': { value: '115 Projetos', percentage: 53 },
      '2026.1': { value: '154 Projetos', percentage: 72 }
    }
  },
  {
    id: 'dm-4',
    label: 'Captação Média das EJs',
    desc: 'Ticket médio cobrado de micro e pequenas empresas regionais.',
    category: 'faturamento',
    semesterValues: {
      '2025.1': { value: 'R$ 3.800', percentage: 48 },
      '2025.2': { value: 'R$ 4.200', percentage: 53 },
      '2026.1': { value: 'R$ 5.100', percentage: 64 }
    }
  }
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

const TESTIMONIAL_AVATARS: { [key: string]: any } = {
  't1': require('@/assets/images/juliana-macedo.jpg'),
  't2': require('@/assets/images/marcos_rocha.jpg'),
  't3': require('@/assets/images/aline-souza.jpg'),
};

const GALLERY_IMAGES: { [key: string]: any } = {
  '🚀': require('@/assets/images/foguete-1.png'),
  '🏆': require('@/assets/images/trofeu-1.png'),
  '🤝': require('@/assets/images/maos.png'),
};

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

  // Dashboard Filters State
  const [selectedSemester, setSelectedSemester] = useState<string>('2026.1');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const visualMode = 'brand';

  // Animation Progress state (0 to 1)
  const [animationProgress, setAnimationProgress] = useState(0);

  // Trigger counting animation on screen focus and filter changes
  useFocusEffect(
    React.useCallback(() => {
      let start = 0;
      const duration = 900; // ms
      const startTime = performance.now();
      setAnimationProgress(0);

      let animationFrameId: number;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutExpo) for a premium fluid feel
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setAnimationProgress(easeProgress);
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(tick);
        }
      };
      
      animationFrameId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [selectedSemester, selectedCategory])
  );

  // Helper function to animate number formatting dynamically
  const getAnimatedValue = (valueStr: string, progress: number) => {
    if (!valueStr) return '';
    // If it has R$ and Milhões/Mil
    if (valueStr.includes('Milhões')) {
      const num = parseFloat(valueStr.replace('R$', '').replace('Milhões', '').trim());
      const animNum = num * progress;
      return `R$ ${animNum.toFixed(2)} Milhões`;
    }
    if (valueStr.includes('Mil')) {
      const num = parseFloat(valueStr.replace('R$', '').replace('Mil', '').trim());
      const animNum = num * progress;
      return `R$ ${Math.round(animNum)} Mil`;
    }
    // If it is just R$ 5.100 (contains dot/comma)
    if (valueStr.includes('R$')) {
      const num = parseInt(valueStr.replace('R$', '').replace(/\./g, '').trim());
      const animNum = Math.floor(num * progress);
      const formatted = animNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return `R$ ${formatted}`;
    }
    // If it includes "horas"
    if (valueStr.includes('horas')) {
      const num = parseInt(valueStr.replace('horas', '').trim());
      const animNum = Math.floor(num * progress);
      return `${animNum} horas`;
    }
    // If it includes "Projetos"
    if (valueStr.includes('Projetos')) {
      const num = parseInt(valueStr.replace('Projetos', '').trim());
      const animNum = Math.floor(num * progress);
      return `${animNum} Projetos`;
    }
    // General numeric fallback
    const num = parseFloat(valueStr);
    if (!isNaN(num)) {
      return (num * progress).toFixed(0);
    }
    return valueStr;
  };

  const handleOpenTestimonial = (name: string) => {
    const msg = `Em breve você poderá assistir à entrevista completa em vídeo com ${name} contando a trajetória detalhada de fundação de EJ!`;
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Vídeo Depoimento', msg);
    }
  };

  // Determine strict styling colors based on guidelines and theme context
  const isDark = theme.text === '#FFFFFF';
  
  const getColors = () => {
    return {
      bg: theme.background,
      cardBg: theme.backgroundElement,
      border: theme.border,
      borderWidth: 1,
      primary: '#353C7C', // Strict RGB 53 60 124 Brand Color
      text: theme.text,
      textSec: theme.textSecondary,
      accentBg: theme.backgroundSelected,
      badgeBg: theme.backgroundSelected,
      stampBorder: 'solid' as const,
      progressTrack: theme.background,
    };
  };

  const vColors = getColors();

  return (
    <ThemedView style={[styles.container, { backgroundColor: vColors.bg }]}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* HEADER */}
          <View style={[styles.header, { alignItems: 'center', marginBottom: Spacing.three }]}>
            <Image source={require('@/assets/images/foguete-inclinado.png')} style={{ width: 180, height: 140, resizeMode: 'contain', marginBottom: Spacing.two }} />
            <ThemedText type="smallBold" style={{ color: vColors.primary, fontFamily: Fonts.mono }}>
              [ SISTEMA DE DESIGN & IDENTIDADE ]
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: vColors.text }]}>
              Vitrine de Impacto
            </ThemedText>
            <ThemedText type="small" style={[styles.headerSub, { color: vColors.textSec }]}>
              Certificação de performance e impacto do Movimento Empresa Júnior potiguar, utilizando exclusivamente as tonalidades homologadas de azul.
            </ThemedText>
          </View>

          {/* METRICS DASHBOARD GRID */}
          <View style={styles.sectionContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three }}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: vColors.text, marginBottom: 0, fontFamily: Fonts.mono }]}>
                📊 DASHBOARD DE DESEMPENHO
              </ThemedText>
              
              {/* Semester Dropdown/Chips Selector */}
              <View style={{ flexDirection: 'row', backgroundColor: vColors.badgeBg, borderRadius: 8, padding: 3, borderColor: vColors.border, borderWidth: vColors.borderWidth, borderStyle: vColors.stampBorder }}>
                {['2025.1', '2025.2', '2026.1'].map(sem => {
                  const isActive = selectedSemester === sem;
                  return (
                    <Pressable
                      key={sem}
                      onPress={() => setSelectedSemester(sem)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: isActive ? vColors.primary : 'transparent',
                      }}
                    >
                      <ThemedText style={{ fontSize: 10, fontWeight: 'bold', fontFamily: Fonts.mono, color: isActive ? '#FFF' : vColors.text }}>
                        {sem}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Metric Category Selector Chips */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: Spacing.four }}>
              {(['todos', 'faturamento', 'impacto'] as const).map(cat => {
                const isActive = selectedCategory === cat;
                const catMap = { todos: '🌟 Todos', faturamento: '💰 Financeiro', impacto: '♻️ Impacto Social' };
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isActive ? vColors.primary : vColors.cardBg,
                      borderColor: vColors.border,
                      borderWidth: vColors.borderWidth,
                      borderStyle: vColors.stampBorder,
                    }}
                  >
                    <ThemedText type="smallBold" style={{ fontSize: 11, fontFamily: Fonts.mono, color: isActive ? '#FFF' : vColors.text }}>
                      {catMap[cat]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            
            {/* Dynamic Metric Technical Chips */}
            <View style={{ gap: Spacing.three }}>
              {DYNAMIC_METRICS.filter(item => selectedCategory === 'todos' || item.category === selectedCategory).map((item) => {
                const metricDetails = item.semesterValues[selectedSemester] || { value: '0', percentage: 0 };
                const animatedPercentage = Math.round(animationProgress * metricDetails.percentage);
                const displayVal = getAnimatedValue(metricDetails.value, animationProgress);

                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.metricCard, 
                      { 
                        backgroundColor: vColors.cardBg, 
                        borderColor: vColors.border, 
                        borderWidth: vColors.borderWidth, 
                        borderStyle: vColors.stampBorder,
                        padding: Spacing.four, 
                        flexDirection: 'column' 
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <View style={{ flex: 1, paddingRight: Spacing.two }}>
                        <ThemedText type="smallBold" style={{ color: vColors.text, fontSize: 13 }}>
                          {item.label}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: vColors.textSec, fontSize: 11, marginTop: 2 }}>
                          {item.desc}
                        </ThemedText>
                      </View>
                      <ThemedText type="subtitle" style={{ color: vColors.primary, fontWeight: '900', fontSize: 18, fontFamily: Fonts.mono }}>
                        {displayVal}
                      </ThemedText>
                    </View>

                    {/* Technical Specification Label inside the card */}
                    <View style={[styles.cardSpecLabel, { borderColor: vColors.border, borderStyle: vColors.stampBorder }]}>
                      <ThemedText style={{ fontSize: 8, fontFamily: Fonts.mono, color: vColors.textSec }}>
                        APLICAÇÃO: CORES OFICIAIS  |  CERTIFICAÇÃO: MEJ RN
                      </ThemedText>
                    </View>
 
                    {/* Interactive Horizontal Bar Chart representation */}
                    <View style={{ height: 8, width: '100%', backgroundColor: vColors.progressTrack, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', borderColor: vColors.border, borderWidth: 0, borderStyle: vColors.stampBorder }}>
                      <View 
                        style={{ 
                          height: '100%', 
                          width: `${animatedPercentage}%`, 
                          backgroundColor: vColors.primary, 
                          borderColor: vColors.border,
                          borderWidth: 0,
                          borderRadius: 4 
                        }} 
                      />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <ThemedText style={{ fontSize: 8, fontFamily: Fonts.mono, color: vColors.textSec }}>MÍNIMO</ThemedText>
                      <ThemedText style={{ fontSize: 8, fontFamily: Fonts.mono, color: vColors.primary, fontWeight: 'bold' }}>
                        META: {animatedPercentage}% CERTIFICADO
                      </ThemedText>
                      <ThemedText style={{ fontSize: 8, fontFamily: Fonts.mono, color: vColors.textSec }}>MÁXIMO</ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* "ONDE ELES ESTÃO AGORA" CAROUSEL */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: vColors.text, fontFamily: Fonts.mono }]}>
                ⭐ TRAJETÓRIAS CORPORATIVAS
              </ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: Fonts.mono, color: vColors.primary, fontWeight: 'bold' }}>
                [ EX-MEMBROS REGISTRADOS ]
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
                  style={[
                    styles.testimonialCard, 
                    { 
                      backgroundColor: vColors.cardBg, 
                      borderColor: vColors.border, 
                      borderWidth: vColors.borderWidth,
                      borderStyle: vColors.stampBorder,
                    }
                  ]}
                  onPress={() => handleOpenTestimonial(item.name)}
                >
                  {/* Testimonial Header */}
                  <View style={styles.testiHeader}>
                    <View style={[styles.testiAvatarBox, { backgroundColor: vColors.accentBg, overflow: 'hidden' }]}>
                      <Image source={TESTIMONIAL_AVATARS[item.id]} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    </View>
                    <View style={styles.testiMeta}>
                      <ThemedText type="smallBold" style={[styles.testiName, { color: vColors.text }]}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={[styles.testiRole, { color: vColors.textSec, fontFamily: Fonts.mono, fontSize: 8 }]}>
                        {item.previousRole}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Quote */}
                  <ThemedText type="small" style={[styles.testiQuote, { color: vColors.text, fontStyle: 'italic' }]}>
                    "{item.quote}"
                  </ThemedText>

                  {/* Testimonial Footer */}
                  <View style={[styles.testiFooter, { borderColor: vColors.border, borderStyle: vColors.stampBorder }]}>
                    <ThemedText style={[styles.testiCompany, { color: vColors.primary, fontFamily: Fonts.mono, fontSize: 9 }]}>
                      💼 {item.currentCompany}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 16 }}>{item.companyLogo}</ThemedText>
                  </View>
                  
                  {/* Play Video Button as a Technical Stamp Outline */}
                  <View style={[
                    styles.videoBadge, 
                    { 
                      backgroundColor: vColors.badgeBg, 
                      borderColor: vColors.border, 
                      borderWidth: 1,
                      borderStyle: vColors.stampBorder,
                    }
                  ]}>
                    <ThemedText style={{ color: vColors.primary, fontWeight: 'bold', fontSize: 9, fontFamily: Fonts.mono }}>
                      ▶ ASSISTIR RELATÓRIO VÍDEO
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            />
          </View>

          {/* LIFESTYLE GALLERY */}
          <View style={styles.sectionContainer}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: vColors.text, fontFamily: Fonts.mono }]}>
              ⚡ CRONOGRAMA DE CELEBRAÇÕES MEJ
            </ThemedText>
            <ThemedText type="small" style={[styles.sectionSub, { color: vColors.textSec }]}>
              Certificação de eventos, premiações e encontros oficiais homologados pela Federação.
            </ThemedText>

            <View style={styles.galleryList}>
              {GALLERY.map((item) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.galleryCard, 
                    { 
                      backgroundColor: vColors.cardBg, 
                      borderColor: vColors.border, 
                      borderWidth: vColors.borderWidth,
                      borderStyle: vColors.stampBorder,
                    }
                  ]}
                >
                  <View style={[styles.galleryEmojiContainer, { backgroundColor: vColors.accentBg }]}>
                    {GALLERY_IMAGES[item.emoji] ? (
                      <Image source={GALLERY_IMAGES[item.emoji]} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
                    ) : (
                      <ThemedText style={{ fontSize: 32 }}>{item.emoji}</ThemedText>
                    )}
                  </View>
                  <View style={styles.galleryInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText type="smallBold" style={[styles.galleryTitle, { color: vColors.text }]}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={[styles.galleryLoc, { color: vColors.primary, fontFamily: Fonts.mono, fontSize: 9 }]}>
                        📍 {item.location}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={[styles.galleryVibes, { color: vColors.textSec, marginTop: 4 }]}>
                      {item.vibes}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* TECHNICAL Brand warning stamp at bottom */}
          <View style={[styles.brandNotice, { borderColor: vColors.border, borderStyle: vColors.stampBorder }]}>
            <ThemedText style={{ fontSize: 9, color: vColors.textSec, fontFamily: Fonts.mono, textAlign: 'center' }}>
              DOCUMENTO NORMATIVO EXCLUSIVO DO MEJ POTIGUAR
            </ThemedText>
            <ThemedText style={{ fontSize: 8, color: vColors.primary, fontFamily: Fonts.mono, textAlign: 'center', marginTop: 2, fontWeight: 'bold' }}>
              PROIBIDO USO DE CORES SECUNDÁRIAS, TEXTURAS OU ADORNOS NÃO AUTORIZADOS.
            </ThemedText>
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
    marginTop: Spacing.one,
    lineHeight: 18,
  },
  sectionContainer: {
    marginTop: Spacing.four,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  sectionSub: {
    marginBottom: Spacing.three,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  
  // BRAND STYLES SEPARATOR CONTROLS
  controlContainer: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  tabSelector: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },


  // METRICS
  metricCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
  },
  cardSpecLabel: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  testiMeta: {
    flex: 1,
  },
  testiName: {
    fontSize: 15,
  },
  testiRole: {
    marginTop: 2,
  },
  testiQuote: {
    lineHeight: 18,
    fontSize: 12,
    marginBottom: Spacing.three,
  },
  testiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  testiCompany: {
    fontWeight: 'bold',
  },
  videoBadge: {
    borderRadius: 8,
    paddingVertical: Spacing.one + 2,
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
    alignItems: 'center',
  },
  galleryEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  galleryInfo: {
    flex: 1,
  },
  galleryTitle: {
    fontSize: 15,
  },
  galleryLoc: {
    fontWeight: 'bold',
  },
  galleryVibes: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  brandNotice: {
    marginTop: Spacing.five,
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
});
