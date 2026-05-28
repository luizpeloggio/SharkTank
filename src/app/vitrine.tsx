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
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { AppStorage, type EventItem, type FeedPost, type AchievementDefinition } from '@/services/storage';

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

interface ImpactStat {
  id: string;
  label: string;
  value: string;
  helper?: string;
}

type HighlightType = 'event' | 'video' | 'achievement' | 'news';
interface HighlightCard {
  id: string;
  type: HighlightType;
  kicker: string;
  title: string;
  subtitle: string;
  icon: string;
  accent?: string;
  image: any;
  yearLabel: string;
}

interface BornCompany {
  id: string;
  name: string;
  description: string;
  impact: string;
  story: string;
  badge: string;
  logo: string;
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

const BORN_COMPANIES: BornCompany[] = [
  {
    id: 'bc-1',
    name: 'AgroNet',
    description: 'Plataforma de monitoramento inteligente para irrigação e gestão agrícola.',
    impact: 'Redução média de 18% no consumo de água em propriedades piloto.',
    story: 'Nasceu a partir de um projeto consultivo de EJ e evoluiu com validação em campo e parcerias locais.',
    badge: 'Origem EJ',
    logo: '🌱',
  },
  {
    id: 'bc-2',
    name: 'Mossoró Studio',
    description: 'Estúdio de produto digital especializado em apps e branding para comércio regional.',
    impact: 'Mais de 40 PMEs atendidas e aumento de presença digital em cidades do RN.',
    story: 'Começou como portfólio de entregas em EJ e virou uma operação profissional com foco em qualidade e processo.',
    badge: 'Spin-off EJ',
    logo: '🧩',
  },
  {
    id: 'bc-3',
    name: 'EcoCycle',
    description: 'Rede de logística reversa com incentivos para reciclagem e rastreio de materiais.',
    impact: 'Toneladas recicladas e geração de renda para cooperativas locais.',
    story: 'Ideia amadurecida em desafios internos de EJ e acelerada com apoio do ecossistema universitário.',
    badge: 'Impacto',
    logo: '♻️',
  },
];

interface CardGradientProps {
  id: string;
  colors: [string, string];
  children?: React.ReactNode;
  style?: any;
}

function CardGradient({ id, colors, children, style }: CardGradientProps) {
  return (
    <View style={[styles.gradientCardContainer, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

export default function VitrineScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
 
  // Dashboard Filters State
  const [selectedSemester, setSelectedSemester] = useState<string>('2026.1');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
 
  // Animation Progress state (0 to 1)
  const [animationProgress, setAnimationProgress] = useState(0);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [achievements, setAchievements] = useState<AchievementDefinition[]>([]);
 
  // Trigger counting animation on screen focus and filter changes
  useFocusEffect(
    React.useCallback(() => {
      // Re-trigger animation when filters change
      const _trigger = [selectedSemester, selectedCategory];
      void _trigger;
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

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const load = async () => {
        const [storedEvents, storedPosts] = await Promise.all([
          AppStorage.getEvents(),
          AppStorage.getFeedPosts(),
        ]);
        const defs = AppStorage.getAchievementDefinitions();

        if (!mounted) return;
        setEvents(storedEvents);
        setPosts(storedPosts);
        setAchievements(defs);
      };
      void load();
      return () => {
        mounted = false;
      };
    }, [])
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

  const impactStats: ImpactStat[] = [
    { id: 'is-1', label: 'Empresas Juniores', value: '48', helper: 'ativas no RN' },
    { id: 'is-2', label: 'Universitários impactados', value: '3.200+', helper: 'formação prática' },
    { id: 'is-3', label: 'Projetos realizados', value: '150+', helper: 'soluções entregues' },
    { id: 'is-4', label: 'Empresas nascidas de EJ', value: '12', helper: 'spin-offs & startups' },
  ];

  const latestEvents = events.slice(0, 4);
  const latestNews = posts.slice(0, 4);
  const featuredAchievements = achievements.slice(0, 4);
  const featuredVideos = latestEvents
    .flatMap(event => {
      const fromList = event.videos.slice(0, 2).map(video => ({ event, title: video.title, url: video.url }));
      const fromActive = event.videoUri ? [{ event, title: event.title, url: event.videoUri }] : [];
      return [...fromList, ...fromActive];
    })
    .slice(0, 4);

  const highlightImages = {
    event: require('@/assets/images/mapa.png'),
    video: require('@/assets/images/foguete-inclinado.png'),
    achievement: require('@/assets/images/trofeu.png'),
    news: require('@/assets/images/visitante.png'),
  } as const;

  const getCardGradientColors = (item: HighlightCard): [string, string] => {
    if (item.accent === 'viagem' || item.kicker.toLowerCase() === 'viagem' || item.icon === '✈️') {
      return ['#353C7C', '#1D224F'];
    }
    if (item.accent === 'premio' || item.kicker.toLowerCase() === 'prêmio' || item.kicker.toLowerCase() === 'premio' || item.icon === '🏆') {
      return ['#353C7C', '#5C3806'];
    }
    if (item.type === 'event' || item.kicker.toLowerCase().includes('evento')) {
      return ['#353C7C', '#0E4221'];
    }
    if (item.type === 'video' || item.kicker.toLowerCase().includes('vídeo') || item.kicker.toLowerCase().includes('video')) {
      return ['#353C7C', '#3E1960'];
    }
    if (item.type === 'news' || item.kicker.toLowerCase().includes('novidade')) {
      return ['#353C7C', '#1B2C42'];
    }
    return ['#353C7C', '#1B2C42'];
  };

  const yearLabel = selectedSemester.split('.')[0] || '2026';

  const highlightCards: HighlightCard[] = [
    {
      id: 'h-special-viagem',
      type: 'achievement' as const,
      kicker: 'Viagem',
      title: 'ENEJ em Curitiba',
      subtitle: 'Maior encontro de EJs do Brasil. Passagem e hospedagem pela EJ.',
      icon: '✈️',
      accent: 'viagem',
      image: highlightImages.achievement,
      yearLabel: '2024',
    },
    {
      id: 'h-special-premio',
      type: 'achievement' as const,
      kicker: 'Prêmio',
      title: 'Melhor EJ do Nordeste',
      subtitle: 'Ranking nacional da Brasil Júnior. Reconhecimento de todo o movimento.',
      icon: '🏆',
      accent: 'premio',
      image: highlightImages.achievement,
      yearLabel: '2024',
    },
    ...latestEvents.map(event => ({
      id: `h-event-${event.id}`,
      type: 'event' as const,
      kicker: 'Últimos eventos',
      title: event.title,
      subtitle: `${event.date} · ${event.location}`,
      icon: '📅',
      accent: event.accent,
      image: highlightImages.event,
      yearLabel,
    })),
    ...featuredVideos.map((video, index) => ({
      id: `h-video-${video.event.id}-${index}`,
      type: 'video' as const,
      kicker: 'Vídeos em destaque',
      title: video.title,
      subtitle: `${video.event.host} · ${video.event.location}`,
      icon: '🎬',
      accent: video.event.accent,
      image: highlightImages.video,
      yearLabel,
    })),
    ...featuredAchievements.map(ach => ({
      id: `h-ach-${ach.id}`,
      type: 'achievement' as const,
      kicker: 'Conquistas',
      title: ach.name,
      subtitle: ach.description,
      icon: ach.icon,
      accent: ach.color,
      image: highlightImages.achievement,
      yearLabel,
    })),
    ...latestNews.map(post => ({
      id: `h-news-${post.id}`,
      type: 'news' as const,
      kicker: 'Novidades',
      title: post.title,
      subtitle: `${post.author} · ${post.date}`,
      icon: post.category === 'vaga' ? '💼' : post.category === 'evento' ? '📣' : '📰',
      image: highlightImages.news,
      yearLabel,
    })),
  ].slice(0, 14);

  const highlightCardWidth = 270;
  const highlightCardHeight = 330;
  
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
            <ThemedText type="smallBold" style={{ color: vColors.primary, fontFamily: Fonts.mono }}>
              [ CONQUISTAS · IMPACTO · ECOSSISTEMA ]
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: vColors.text }]}>
              Conquistas & Impacto
            </ThemedText>
            <ThemedText type="small" style={[styles.headerSub, { color: vColors.textSec }]}>
              Panorama institucional com indicadores consolidados, destaques recentes e casos de sucesso originados em Empresas Juniores.
            </ThemedText>
          </View>

          {/* 1) TOPO COM DADOS/IMPACTO */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: vColors.text, fontFamily: Fonts.mono }]}>
                IMPACTO EM NÚMEROS
              </ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: Fonts.mono, color: vColors.primary, fontWeight: 'bold' }}>
                [ ECOSSISTEMA RN ]
              </ThemedText>
            </View>

            <View style={styles.impactGrid}>
              {impactStats.map(stat => (
                <View
                  key={stat.id}
                  style={[
                    styles.impactCard,
                    {
                      backgroundColor: vColors.cardBg,
                      borderColor: vColors.border,
                      borderWidth: vColors.borderWidth,
                      borderStyle: vColors.stampBorder,
                    },
                  ]}
                >
                  <ThemedText type="subtitle" style={{ color: vColors.text, fontWeight: '900', fontSize: 18 }}>
                    {stat.value}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: vColors.text, marginTop: 3 }} numberOfLines={1}>
                    {stat.label}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={{ height: Spacing.one }} />
          </View>

          {/* 2) CARROSSEL DE DESTAQUES */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: vColors.text, fontFamily: Fonts.mono }]}>
                DESTAQUES
              </ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: Fonts.mono, color: '#A89070', fontWeight: 'bold', letterSpacing: 0.5 }}>
                DESLIZE PRA VER →
              </ThemedText>
            </View>

            <FlatList
              horizontal
              data={highlightCards}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightCarouselContainer}
              snapToInterval={highlightCardWidth + Spacing.three}
              decelerationRate="fast"
              disableIntervalMomentum
              renderItem={({ item }) => {
                const colors = getCardGradientColors(item);
                return (
                  <Pressable 
                    onPress={() => {
                      if (item.type === 'event') return;
                      if (item.type === 'video') return;
                      if (item.type === 'achievement') return;
                      if (item.type === 'news') return;
                    }}
                  >
                    <CardGradient
                      id={`grad-${item.id}`}
                      colors={colors}
                      style={[
                        styles.highlightCard,
                        {
                          width: highlightCardWidth,
                          height: highlightCardHeight,
                        },
                      ]}
                    >
                      <View style={styles.highlightTopRow}>
                        <ThemedText style={styles.highlightEmoji}>
                          {item.icon}
                        </ThemedText>
                        <View style={styles.highlightPill}>
                          <ThemedText style={styles.highlightPillText}>
                            {item.yearLabel}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.highlightBottom}>
                        <ThemedText style={styles.highlightKicker}>
                          {item.kicker.toUpperCase()}
                        </ThemedText>
                        <ThemedText style={styles.highlightTitle}>
                          {item.title}
                        </ThemedText>
                        <ThemedText style={styles.highlightSub} numberOfLines={3}>
                          {item.subtitle}
                        </ThemedText>
                      </View>
                    </CardGradient>
                  </Pressable>
                );
              }}
            />
          </View>

          {/* 3) EMPRESAS QUE NASCERAM DE EJ */}
          <View style={styles.sectionContainer}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: vColors.text, fontFamily: Fonts.mono }]}>
              EMPRESAS QUE NASCERAM DE EJ
            </ThemedText>
            <ThemedText type="small" style={[styles.sectionSub, { color: vColors.textSec }]}>
              Histórias reais que começaram dentro da EJ e ganharam o mercado com entrega, processo e impacto.
            </ThemedText>

            <View style={styles.galleryList}>
              {BORN_COMPANIES.map((company) => (
                <View
                  key={company.id}
                  style={[
                    styles.bornCompanyCard,
                    {
                      backgroundColor: vColors.cardBg,
                      borderColor: vColors.border,
                      borderWidth: vColors.borderWidth,
                      borderStyle: vColors.stampBorder,
                    },
                  ]}
                >
                  <View style={styles.bornCompanyHeader}>
                    <View style={[styles.bornCompanyLogo, { backgroundColor: vColors.accentBg }]}>
                      <ThemedText style={{ fontSize: 22 }}>{company.logo}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.bornCompanyTitleRow}>
                        <ThemedText type="smallBold" style={{ color: vColors.text, fontSize: 15 }} numberOfLines={1}>
                          {company.name}
                        </ThemedText>
                        <View style={[styles.bornCompanyBadge, { backgroundColor: vColors.badgeBg, borderColor: vColors.border, borderWidth: 1, borderStyle: vColors.stampBorder }]}>
                          <ThemedText style={{ fontSize: 9, fontFamily: Fonts.mono, color: vColors.primary, fontWeight: 'bold' }}>
                            {company.badge.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText type="small" style={{ color: vColors.textSec, marginTop: 3 }} numberOfLines={2}>
                        {company.description}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.bornCompanyDivider, { borderColor: vColors.border, borderStyle: vColors.stampBorder }]} />

                  <ThemedText type="smallBold" style={{ color: vColors.text, fontSize: 12 }}>
                    {company.impact}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: vColors.textSec, marginTop: 6, lineHeight: 16 }}>
                    {company.story}
                  </ThemedText>
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

  // IMPACT GRID
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  impactCard: {
    width: '48%',
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 86,
    justifyContent: 'center',
  },
  impactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
  highlightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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

  // BORN COMPANIES
  bornCompanyCard: {
    borderRadius: 18,
    padding: Spacing.four,
  },
  bornCompanyHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  bornCompanyLogo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bornCompanyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  bornCompanyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bornCompanyDivider: {
    borderTopWidth: 1,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    marginBottom: Spacing.two,
  },

  // HIGHLIGHT CARDS (imagem)
  gradientCardContainer: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  highlightCard: {
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  highlightImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    resizeMode: 'cover',
    opacity: 0.95,
  },
  highlightImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  highlightTint: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  highlightCarouselContainer: {
    paddingRight: Spacing.four,
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  highlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  highlightEmoji: {
    fontSize: 42,
  },
  highlightPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  highlightPillText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  highlightBottom: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  highlightKicker: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  highlightTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: Spacing.two,
  },
  highlightSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  brandNotice: {
    marginTop: Spacing.five,
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
});
