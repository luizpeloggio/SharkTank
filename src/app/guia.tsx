import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserProfileHeader } from '@/components/user-profile-header';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AuthContext } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
    AppStorage,
    INITIAL_TRAIL_STEPS,
    TrailStep
} from '@/services/storage';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  bio: string;
  area: 'tech' | 'juridico' | 'vendas' | 'marketing' | 'financas';
}

export const MENTORS_LIST: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Carlos Alberto',
    role: 'Ex-Presidente da Computação EJ',
    company: 'Tech Solutions',
    avatar: '👨‍💻',
    bio: 'Especialista em React Native, arquitetura de sistemas e metodologias ágeis de desenvolvimento.',
    area: 'tech'
  },
  {
    id: 'mentor-2',
    name: 'Mariana Lima',
    role: 'Consultora de Processos Jurídicos',
    company: 'UERN Consultoria',
    avatar: '⚖️',
    bio: 'Advogada especialista em terceiro setor. Auxilia no registro de estatutos e governança corporativa.',
    area: 'juridico'
  },
  {
    id: 'mentor-3',
    name: 'Felipe Santos',
    role: 'Diretor Comercial',
    company: 'Vendas Pro',
    avatar: '📈',
    bio: 'Treinamento de funil de vendas, prospecção ativa outbound e negociação complexa B2B.',
    area: 'vendas'
  },
  {
    id: 'mentor-4',
    name: 'Juliana Costa',
    role: 'Especialista em Growth',
    company: 'Digital Hub',
    avatar: '📣',
    bio: 'Desenvolvimento de marcas, marketing digital de conteúdo e tráfego pago para startups.',
    area: 'marketing'
  },
  {
    id: 'mentor-5',
    name: 'Roberto Dias',
    role: 'CFO e Assessor Financeiro',
    company: 'Dias Capital',
    avatar: '💰',
    bio: 'Planejamento de fluxo de caixa, precificação de serviços e prestação de contas de EJs.',
    area: 'financas'
  }
];

type AchievementModalData = {
  name: string;
  stepTitle: string;
  xp: number;
  color: string;
};

const TRAIL_COLORS = {
  green: '#58CC02',
  greenDeep: '#46A302',
  lime: '#89E219',
  blue: '#1CB0F6',
  blueDeep: '#0F8ED1',
  gold: '#FFC800',
  goldDeep: '#F4A900',
  gray: '#C9D2DC',
  grayDeep: '#A7B2BF',
  ink: '#263340',
};

const CONFETTI_PARTICLES = [
  { left: '13%', top: '18%', color: '#58CC02', size: 8, delay: 0 },
  { left: '77%', top: '15%', color: '#1CB0F6', size: 7, delay: 120 },
  { left: '22%', top: '36%', color: '#FFC800', size: 6, delay: 70 },
  { left: '84%', top: '39%', color: '#FF6B6B', size: 9, delay: 170 },
  { left: '12%', top: '64%', color: '#CE82FF', size: 6, delay: 40 },
  { left: '72%', top: '70%', color: '#58CC02', size: 7, delay: 100 },
] as const;

const getStepXp = (stepId: number) => 100 + stepId * 25;

function JourneyHeaderIcon() {
  return (
    <Svg width={58} height={58} viewBox="0 0 64 64">
      <Defs>
        <SvgLinearGradient id="headerRouteGradient" x1="10" y1="8" x2="54" y2="58">
          <Stop offset="0" stopColor="#65D9FF" />
          <Stop offset="1" stopColor={TRAIL_COLORS.blue} />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="32" cy="32" r="28" fill="url(#headerRouteGradient)" />
      <Circle cx="32" cy="28" r="20" fill="#FFFFFF" opacity={0.14} />
      <Path
        d="M20 39 C25 27 36 38 44 25"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="1 8"
      />
      <Circle cx="20" cy="39" r="4.5" fill="#FFFFFF" />
      <Circle cx="44" cy="25" r="4.5" fill={TRAIL_COLORS.gold} />
      <Path
        d="M42 16 L51 25 L42 34"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      />
    </Svg>
  );
}

function TrailBackgroundPattern() {
  return (
    <View pointerEvents="none" style={styles.trailPattern}>
      <Svg width="100%" height="100%" viewBox="0 0 390 1080" preserveAspectRatio="xMidYMin meet">
        <Path
          d="M197 32 C115 118 296 180 205 270 C118 356 277 420 185 520 C101 612 292 683 203 780 C129 861 246 926 184 1030"
          fill="none"
          stroke={TRAIL_COLORS.blue}
          strokeWidth={24}
          strokeLinecap="round"
          opacity={0.035}
        />
        <Path
          d="M197 32 C115 118 296 180 205 270 C118 356 277 420 185 520 C101 612 292 683 203 780 C129 861 246 926 184 1030"
          fill="none"
          stroke={TRAIL_COLORS.blueDeep}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="2 15"
          opacity={0.17}
        />
        <Path
          d="M66 136 C102 118 128 124 154 152"
          fill="none"
          stroke={TRAIL_COLORS.green}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="2 12"
          opacity={0.12}
        />
        <Path
          d="M252 382 C288 365 318 374 336 410"
          fill="none"
          stroke={TRAIL_COLORS.green}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="2 12"
          opacity={0.11}
        />
        <Path
          d="M58 696 C96 672 130 686 150 721"
          fill="none"
          stroke={TRAIL_COLORS.blue}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="2 12"
          opacity={0.12}
        />
        {[
          { x: 208, y: 96, done: true },
          { x: 172, y: 228, done: true },
          { x: 228, y: 363, done: false },
          { x: 160, y: 515, done: false },
          { x: 225, y: 704, done: false },
          { x: 176, y: 914, done: false },
        ].map((point, index) => (
          <React.Fragment key={`${point.x}-${point.y}`}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={12}
              fill={point.done ? TRAIL_COLORS.green : '#FFFFFF'}
              opacity={point.done ? 0.14 : 0.18}
            />
            <Circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill={point.done ? TRAIL_COLORS.greenDeep : '#98A7B6'}
              opacity={0.34}
            />
            {index < 5 && (
              <Path
                d={`M ${point.x + 24} ${point.y + 20} L ${point.x + 38} ${point.y + 29} L ${point.x + 24} ${point.y + 38}`}
                fill="none"
                stroke={index % 2 === 0 ? TRAIL_COLORS.blue : TRAIL_COLORS.green}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.14}
              />
            )}
          </React.Fragment>
        ))}
        <Rect x={302} y={167} width={28} height={28} rx={8} fill={TRAIL_COLORS.gold} opacity={0.08} />
        <Path d="M310 181 L316 187 L326 176" fill="none" stroke={TRAIL_COLORS.goldDeep} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.16} />
        <Rect x={56} y={430} width={26} height={26} rx={8} fill={TRAIL_COLORS.green} opacity={0.08} />
        <Path d="M63 443 L69 449 L78 438" fill="none" stroke={TRAIL_COLORS.greenDeep} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.16} />
        <Rect x={288} y={852} width={28} height={28} rx={8} fill={TRAIL_COLORS.blue} opacity={0.08} />
        <Path d="M296 866 L302 872 L311 861" fill="none" stroke={TRAIL_COLORS.blueDeep} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.16} />
      </Svg>
    </View>
  );
}

function CheckIcon({ size = 30, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M7.5 16.6 13.2 22 24.8 10"
        fill="none"
        stroke={color}
        strokeWidth={4.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 25, color = '#8B99A8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M10.2 13.8v-2.7c0-3.5 2.4-6.1 5.8-6.1s5.8 2.6 5.8 6.1v2.7"
        fill="none"
        stroke={color}
        strokeWidth={3.1}
        strokeLinecap="round"
      />
      <Rect x={7.4} y={13} width={17.2} height={13.8} rx={4.2} fill={color} />
      <Circle cx={16} cy={19.2} r={1.8} fill="#EEF2F6" />
      <Path d="M16 20.7v2.3" stroke="#EEF2F6" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function TrophyIcon({ size = 78, color = TRAIL_COLORS.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <SvgLinearGradient id="trophyGradient" x1="20" y1="8" x2="76" y2="86">
          <Stop offset="0" stopColor="#FFE76A" />
          <Stop offset="0.55" stopColor={color} />
          <Stop offset="1" stopColor={TRAIL_COLORS.goldDeep} />
        </SvgLinearGradient>
      </Defs>
      <Path d="M30 16h36v11c0 15.8-7.1 27.4-18 27.4S30 42.8 30 27V16Z" fill="url(#trophyGradient)" />
      <Path d="M34 24H19v6.4c0 9.6 6.1 17.1 15.8 18.8" fill="none" stroke="#F4A900" strokeWidth={7} strokeLinecap="round" />
      <Path d="M62 24h15v6.4c0 9.6-6.1 17.1-15.8 18.8" fill="none" stroke="#F4A900" strokeWidth={7} strokeLinecap="round" />
      <Path d="M48 55v12" stroke="#D78D00" strokeWidth={7} strokeLinecap="round" />
      <Path d="M34 78h28" stroke="#D78D00" strokeWidth={9} strokeLinecap="round" />
      <Path d="M39 68h18" stroke="#FFC800" strokeWidth={9} strokeLinecap="round" />
      <Path d="M40 25h16" stroke="#FFF7B8" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
    </Svg>
  );
}

function NodeFace({
  isCompleted,
  isUnlocked,
  isCurrent,
  stepId,
}: {
  isCompleted: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  stepId: number;
}) {
  const gradientId = `nodeGradient${stepId}`;

  if (!isUnlocked) {
    return (
      <View style={styles.nodeIconCenter}>
        <LockIcon />
      </View>
    );
  }

  return (
    <Svg width={84} height={84} viewBox="0 0 84 84">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="12" y1="8" x2="70" y2="78">
          <Stop offset="0" stopColor={isCompleted ? TRAIL_COLORS.lime : '#65D9FF'} />
          <Stop offset="0.55" stopColor={isCompleted ? TRAIL_COLORS.green : TRAIL_COLORS.blue} />
          <Stop offset="1" stopColor={isCompleted ? TRAIL_COLORS.greenDeep : TRAIL_COLORS.blueDeep} />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="42" cy="42" r="37" fill={`url(#${gradientId})`} />
      <Circle cx="42" cy="35" r="27" fill="#FFFFFF" opacity={0.14} />
      <Path d="M23 66c8 6 30 7 42-1" stroke="#000000" strokeWidth={7} strokeLinecap="round" opacity={0.12} />
      {isCompleted ? (
        <Path
          d="M27 42.8 37.5 53 58 31"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <Circle cx="42" cy="42" r={isCurrent ? 20 : 18} fill="#FFFFFF" opacity={0.18} />
          <Path
            d="M42 27v30M27 42h30"
            stroke="#FFFFFF"
            strokeWidth={isCurrent ? 6 : 5}
            strokeLinecap="round"
            opacity={0.96}
          />
        </>
      )}
    </Svg>
  );
}

interface ProgressCircleProps {
  progress: number;
  size: number;
  strokeWidth: number;
  children: React.ReactNode;
}

function ProgressCircle({ progress, size, strokeWidth, children }: ProgressCircleProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(201, 210, 220, 0.55)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active Progress Circle */}
        {progress > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={TRAIL_COLORS.green}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

export default function GuiaScreen() {
  const theme = useTheme();
  const { session } = useContext(AuthContext);
  
  // Storage States
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userRole, setUserRole] = useState<string>('estudante');
  
  // Interactive UI States
  const [selectedStep, setSelectedStep] = useState<TrailStep | null>(null);
  const [checkedSubItems, setCheckedSubItems] = useState<{ [key: string]: boolean }>({});
  const [isMentorsVisible, setIsMentorsVisible] = useState<boolean>(false);
  const [isStepModalVisible, setIsStepModalVisible] = useState<boolean>(false);
  const [achievementModal, setAchievementModal] = useState<AchievementModalData | null>(null);
  const achievementScale = useRef(new Animated.Value(0.86)).current;
  const achievementOpacity = useRef(new Animated.Value(0)).current;
  const achievementFloat = useRef(new Animated.Value(0)).current;
  const confettiMotion = useRef(new Animated.Value(0)).current;

  // Mentorship and Networking states
  const [selectedArea, setSelectedArea] = useState<string>('todos');
  const [isBookingModalVisible, setIsBookingModalVisible] = useState<boolean>(false);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<Mentor | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('14:00 - 14:30');
  const [bookingDescription, setBookingDescription] = useState<string>('');
  const [bookedSessions, setBookedSessions] = useState<string[]>([]);

  // Load state on mount/focus
  useEffect(() => {
    loadData();
  }, [isStepModalVisible, isMentorsVisible]);

  useEffect(() => {
    if (!achievementModal) return;

    achievementScale.setValue(0.86);
    achievementOpacity.setValue(0);
    achievementFloat.setValue(0);
    confettiMotion.setValue(0);

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(achievementFloat, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(achievementFloat, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const confettiLoop = Animated.loop(
      Animated.timing(confettiMotion, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      Animated.timing(achievementOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(achievementScale, {
        toValue: 1,
        friction: 6,
        tension: 95,
        useNativeDriver: true,
      }),
    ]).start();
    floatLoop.start();
    confettiLoop.start();

    return () => {
      floatLoop.stop();
      confettiLoop.stop();
    };
  }, [achievementFloat, achievementModal, achievementOpacity, achievementScale, confettiMotion]);

  const loadData = async () => {
    const progress = await AppStorage.getTrailProgress();
    const role = await AppStorage.getRole();
    const subitems = await AppStorage.getCheckedSubItems();
    setCompletedSteps(progress);
    setUserRole(role);
    setCheckedSubItems(subitems);
  };

  // Calculate stats
  const totalSteps = INITIAL_TRAIL_STEPS.length;
  const completedCount = completedSteps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // Check if step is unlocked
  const isStepUnlocked = (stepId: number) => {
    // Admin has everything unlocked for testing purposes!
    if (userRole === 'admin') return true;
    if (stepId === 1) return true; // First step is always unlocked
    
    // Strict progression: every step prior to stepId must be completed
    for (let i = 1; i < stepId; i++) {
      if (!completedSteps.includes(i)) {
        return false;
      }
    }
    return true;
  };

  const handleOpenStep = async (step: TrailStep) => {
    if (!isStepUnlocked(step.id)) {
      if (Platform.OS === 'web') {
        alert('Etapa Bloqueada! Complete as etapas anteriores para desbloquear esta.');
      } else {
        Alert.alert('Etapa Bloqueada', 'Complete as etapas anteriores para liberar este conhecimento!');
      }
      return;
    }
    
    // Load existing checked subitems from persistent storage
    const savedChecked = await AppStorage.getCheckedSubItems();
    
    // If step is completed, auto-check all subitems. Otherwise preserve user checks
    const isCompleted = completedSteps.includes(step.id);
    const updatedChecked = { ...savedChecked };
    
    step.checklistItems.forEach((_, idx) => {
      const key = `${step.id}-${idx}`;
      if (isCompleted) {
        updatedChecked[key] = true;
      } else if (updatedChecked[key] === undefined) {
        updatedChecked[key] = false;
      }
    });
    
    setCheckedSubItems(updatedChecked);
    setSelectedStep(step);
    setIsStepModalVisible(true);
  };

  const toggleSubItem = async (key: string) => {
    const updated = {
      ...checkedSubItems,
      [key]: !checkedSubItems[key],
    };
    setCheckedSubItems(updated);
    await AppStorage.setCheckedSubItems(updated);
  };

  // Check if all subitems for the selected step are checked
  const areAllSubItemsChecked = () => {
    if (!selectedStep) return false;
    return selectedStep.checklistItems.every((_, idx) => 
      checkedSubItems[`${selectedStep.id}-${idx}`] === true
    );
  };

  const handleCompleteStep = async () => {
    if (!selectedStep) return;

    const progress = await AppStorage.toggleTrailStep(selectedStep.id);
    const isNowCompleted = progress.includes(selectedStep.id);
    const earnedBadge = isNowCompleted && session?.id
      ? await AppStorage.awardTrailStepAchievement(session.id, selectedStep.id)
      : null;
    
    // Synchronize subitems in storage if completed
    if (isNowCompleted) {
      const updatedChecked = { ...checkedSubItems };
      selectedStep.checklistItems.forEach((_, idx) => {
        updatedChecked[`${selectedStep.id}-${idx}`] = true;
      });
      setCheckedSubItems(updatedChecked);
      await AppStorage.setCheckedSubItems(updatedChecked);
    }

    setCompletedSteps(progress);
    setIsStepModalVisible(false);
    
    if (isNowCompleted) {
      setAchievementModal({
        name: earnedBadge?.name ?? 'Etapa dominada',
        stepTitle: selectedStep.title,
        xp: getStepXp(selectedStep.id),
        color: earnedBadge?.color ?? TRAIL_COLORS.green,
      });
      return;
    }

    const message = `Etapa "${selectedStep.title}" marcada como pendente.`;
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Status Atualizado', message);
    }
  };

  // Calculate dynamic step checklist percentage ratio [0, 1]
  const getStepPercentage = (step: TrailStep) => {
    if (completedSteps.includes(step.id)) return 1.0;
    const total = step.checklistItems.length;
    if (total === 0) return 0.0;
    
    let checkedCount = 0;
    step.checklistItems.forEach((_, idx) => {
      if (checkedSubItems[`${step.id}-${idx}`] === true) {
        checkedCount++;
      }
    });
    return checkedCount / total;
  };

  const handleContactMentor = async (name: string) => {
    if (session?.id) {
      await AppStorage.awardAchievement('user', session.id, 'user-networking');
    }
    const msg = `Mensagem enviada com sucesso para o mentor ${name}! Ele responderá em até 24h no seu email acadêmico.`;
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Email Enviado!', msg);
    }
  };

  const handleOpenBooking = (mentor: Mentor) => {
    setSelectedMentorForBooking(mentor);
    setSelectedTimeSlot('14:00 - 14:30');
    setBookingDescription('');
    setIsBookingModalVisible(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedMentorForBooking) return;
    
    setBookedSessions(prev => [...prev, selectedMentorForBooking.name]);
    
    const msg = `Sucesso! Sua mentoria rápida com ${selectedMentorForBooking.name} foi agendada para hoje no horário ${selectedTimeSlot}.\n\nO link da sala virtual do Google Meet foi enviado para o seu e-mail!`;
    
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Mentoria Agendada!', msg);
    }
    
    setIsBookingModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <UserProfileHeader />
        
        {/* HEADER SECTION */}
        <View style={[styles.header, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.headerIconWrap}>
            <JourneyHeaderIcon />
          </View>
          <View style={styles.headerCopy}>
            <ThemedText type="smallBold" style={styles.headerEyebrow}>
              MAPA DE PROGRESSO
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Rota da Fundação
            </ThemedText>
            <ThemedText type="small" style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Avance pelos marcos essenciais para tirar sua EJ do papel.
            </ThemedText>
          </View>
          
          {userRole === 'admin' && (
            <View style={[styles.adminBadge, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
              <ThemedText type="code" style={[styles.adminBadgeText, { color: theme.text }]}>ADMIN MODE</ThemedText>
            </View>
          )}
        </View>

        {/* PROGRESS BAR BAR */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarWrapper, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
          </View>
          <ThemedText type="smallBold" style={[styles.progressText, { color: theme.textSecondary }]}>
            {completedCount} de {totalSteps} Etapas Concluídas ({Math.round(progressPercent)}%)
          </ThemedText>
        </View>

        {/* DUOLINGO TRAIL SCROLLVIEW */}
        <ScrollView 
          contentContainerStyle={styles.trailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TrailBackgroundPattern />
          {INITIAL_TRAIL_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isUnlocked = isStepUnlocked(step.id);
            const isCurrent = isUnlocked && !isCompleted;
            const ratio = getStepPercentage(step);
            
            // Curved vertical snake pathway using sine-wave oscillation!
            const amplitude = 55; // Horizontal sway in pixels
            const frequency = 1.3; // Oscillation rate
            const translateX = Math.sin(idx * frequency) * amplitude;
            const wiggleStyle = { transform: [{ translateX }] };

            return (
              <View key={step.id} style={[styles.nodeContainer, wiggleStyle]}>
                <ProgressCircle progress={ratio} size={98} strokeWidth={6}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.nodeButton,
                      isCompleted && styles.nodeButtonCompleted,
                      isCurrent && styles.nodeButtonCurrent,
                      !isUnlocked && styles.nodeButtonLocked,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleOpenStep(step)}
                  >
                    <View
                      style={[
                        styles.nodeDepth,
                        {
                          backgroundColor: isCompleted
                            ? TRAIL_COLORS.greenDeep
                            : isUnlocked
                              ? TRAIL_COLORS.blueDeep
                              : TRAIL_COLORS.grayDeep,
                        },
                      ]}
                    />
                    <View style={styles.nodeTop}>
                      <NodeFace
                        isCompleted={isCompleted}
                        isUnlocked={isUnlocked}
                        isCurrent={isCurrent}
                        stepId={step.id}
                      />
                    </View>
                    {isCurrent && <View style={styles.currentPulse} />}
                  </Pressable>
                </ProgressCircle>

                <View
                  style={[
                    styles.nodeLabelContainer,
                    {
                      backgroundColor: isUnlocked ? theme.backgroundElement : theme.backgroundSelected,
                      borderColor: isUnlocked ? theme.border : 'transparent',
                    },
                  ]}
                >
                  <ThemedText 
                    type="smallBold" 
                    style={[
                      styles.nodeLabelTitle,
                      { color: isUnlocked ? theme.text : theme.textSecondary }
                    ]}
                  >
                    {step.title}
                  </ThemedText>
                  <ThemedText type="code" style={[styles.nodeLabelSub, { color: theme.textSecondary }]}>
                    {isCompleted ? 'Concluida' : isUnlocked ? `${step.duration} +${getStepXp(step.id)} XP` : 'Bloqueada'}
                  </ThemedText>
                </View>
              </View>
            );
          })}
          
          {/* Spacer at the bottom to avoid overlapping floating buttons */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING MENTORS TRIGGER BUTTON */}
        <Pressable 
          style={[styles.floatingMentorBtn, { backgroundColor: theme.primary }]}
          onPress={() => setIsMentorsVisible(true)}
        >
          <ThemedText type="smallBold" style={styles.floatingMentorText}>
            💬 Mentores Online
          </ThemedText>
        </Pressable>

        {/* ================= STEP DETAILS MODAL ================= */}
        {selectedStep && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={isStepModalVisible}
            onRequestClose={() => setIsStepModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
                
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                  <View>
                    <ThemedText type="code" style={{ color: theme.primary }}>
                      PASSO {selectedStep.id} • {selectedStep.duration}
                    </ThemedText>
                    <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                      {selectedStep.title}
                    </ThemedText>
                  </View>
                  <Pressable 
                    onPress={() => setIsStepModalVisible(false)}
                    style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                  >
                    <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                  </Pressable>
                </View>

                {/* Modal Content */}
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <ThemedText type="default" style={[styles.modalDesc, { color: theme.textSecondary }]}>
                    {selectedStep.description}
                  </ThemedText>

                  {/* Template Links */}
                  {selectedStep.templateUrl && (
                    <View style={[styles.templateBox, { backgroundColor: 'rgba(0, 229, 255, 0.08)', borderColor: theme.primary, borderWidth: 1 }]}>
                      <ThemedText type="smallBold" style={{ color: '#00E5FF' }}>
                        📂 Modelo Oficial Disponível
                      </ThemedText>
                      <ThemedText type="small" style={[styles.templateSubText, { color: theme.textSecondary }]}>
                        Clique para acessar referências da Brasil Júnior.
                      </ThemedText>
                      <Pressable 
                        style={[styles.templateLinkBtn, { backgroundColor: theme.primary }]}
                        onPress={() => {
                          if (Platform.OS === 'web') {
                            window.open(selectedStep.templateUrl, '_blank');
                          } else {
                            Alert.alert('Abrindo Navegador', `Acessando: ${selectedStep.templateUrl}`);
                          }
                        }}
                      >
                        <ThemedText type="code" style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>
                          Acessar Modelo (.docx)
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {/* Checklist Subitems */}
                  <View style={styles.checklistSection}>
                    <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.text }]}>
                      Requisitos para Concluir a Etapa:
                    </ThemedText>
                    
                    {selectedStep.checklistItems.map((item, idx) => {
                      const itemKey = `${selectedStep.id}-${idx}`;
                      const isChecked = checkedSubItems[itemKey] || false;
                      
                      return (
                        <Pressable
                          key={idx}
                          style={[styles.checkRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                          onPress={() => toggleSubItem(itemKey)}
                        >
                          <View style={[
                            styles.checkbox,
                            { borderColor: theme.primary },
                            isChecked && { backgroundColor: theme.primary }
                          ]}>
                            {isChecked && <CheckIcon size={15} />}
                          </View>
                          <ThemedText 
                            type="small" 
                            style={[
                              styles.checkText,
                              { color: theme.text },
                              isChecked && { color: theme.textSecondary, textDecorationLine: 'line-through' }
                            ]}
                          >
                            {item}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={[styles.modalFooter, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                  <Pressable 
                    style={[
                      styles.completeBtn,
                      { backgroundColor: theme.primary },
                      completedSteps.includes(selectedStep.id) && { backgroundColor: theme.backgroundSelected },
                      !areAllSubItemsChecked() && !completedSteps.includes(selectedStep.id) && { backgroundColor: theme.border, opacity: 0.5 }
                    ]}
                    disabled={!areAllSubItemsChecked() && !completedSteps.includes(selectedStep.id)}
                    onPress={handleCompleteStep}
                  >
                    <ThemedText type="smallBold" style={[styles.completeBtnText, { color: completedSteps.includes(selectedStep.id) ? theme.text : '#FFFFFF' }]}>
                      {completedSteps.includes(selectedStep.id) 
                        ? 'Remarcar como Pendente' 
                        : areAllSubItemsChecked() 
                          ? 'Concluir etapa' 
                          : 'Marque todos os requisitos acima'}
                    </ThemedText>
                  </Pressable>
                </View>

              </View>
            </View>
          </Modal>
        )}

        {/* ================= ACHIEVEMENT UNLOCK MODAL ================= */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={achievementModal !== null}
          onRequestClose={() => setAchievementModal(null)}
        >
          <View style={styles.achievementOverlay}>
            {CONFETTI_PARTICLES.map((particle, index) => {
              const translateY = confettiMotion.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index % 2 === 0 ? -12 : 12],
              });
              const rotate = confettiMotion.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', index % 2 === 0 ? '18deg' : '-18deg'],
              });

              return (
                <Animated.View
                  key={`${particle.left}-${particle.top}`}
                  style={[
                    styles.confettiParticle,
                    {
                      left: particle.left,
                      top: particle.top,
                      width: particle.size,
                      height: particle.size * 1.8,
                      backgroundColor: particle.color,
                      opacity: achievementOpacity,
                      transform: [{ translateY }, { rotate }],
                    },
                  ]}
                />
              );
            })}

            <Animated.View
              style={[
                styles.achievementCard,
                {
                  opacity: achievementOpacity,
                  transform: [
                    { scale: achievementScale },
                    {
                      translateY: achievementFloat.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.achievementGlow, { backgroundColor: achievementModal?.color ?? TRAIL_COLORS.green }]} />
              <View style={styles.achievementIconShell}>
                <View style={styles.achievementIconDepth} />
                <View style={styles.achievementIconTop}>
                  <TrophyIcon color={achievementModal?.color ?? TRAIL_COLORS.gold} />
                </View>
              </View>

              <ThemedText type="smallBold" style={styles.achievementEyebrow}>
                Conquista desbloqueada!
              </ThemedText>
              <ThemedText type="subtitle" style={styles.achievementTitle}>
                {achievementModal?.name}
              </ThemedText>
              <ThemedText type="small" style={styles.achievementSubtitle}>
                {achievementModal?.stepTitle}
              </ThemedText>

              <View style={styles.xpPill}>
                <ThemedText type="smallBold" style={styles.xpPillText}>
                  +{achievementModal?.xp} XP ganho
                </ThemedText>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.achievementButton,
                  pressed && styles.achievementButtonPressed,
                ]}
                onPress={() => setAchievementModal(null)}
              >
                <ThemedText type="smallBold" style={styles.achievementButtonText}>
                  Continuar jornada
                </ThemedText>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ================= MENTORS DRAWER MODAL ================= */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isMentorsVisible}
          onRequestClose={() => setIsMentorsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '80%', backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              
              {/* Drawer Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary }}>
                    SUPORTE AO ALUNO
                  </ThemedText>
                  <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                    Mentores & Networking
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsMentorsVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              {/* Dynamic Specialty Filters */}
              <View style={{ paddingHorizontal: Spacing.four, marginVertical: Spacing.three }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {(['todos', 'tech', 'juridico', 'vendas', 'marketing', 'financas'] as const).map(area => {
                    const isSel = selectedArea === area;
                    const labelMap = { 
                      todos: '🌟 Todos', 
                      tech: '💻 Tech', 
                      juridico: '⚖️ Jurídico', 
                      vendas: '📈 Vendas', 
                      marketing: '📣 Marketing', 
                      financas: '💰 Finanças' 
                    };
                    return (
                      <Pressable
                        key={area}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: isSel ? theme.primary : theme.background,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                        onPress={() => setSelectedArea(area)}
                      >
                        <ThemedText type="smallBold" style={{ color: isSel ? '#FFF' : theme.text }}>
                          {labelMap[area]}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Mentors List */}
              <FlatList
                data={MENTORS_LIST.filter(m => selectedArea === 'todos' || m.area === selectedArea)}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: Spacing.four, paddingBottom: Spacing.four }}
                renderItem={({ item }) => {
                  const isBooked = bookedSessions.includes(item.name);
                  return (
                    <View style={[styles.mentorCard, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
                      <View style={styles.mentorAvatarContainer}>
                        <ThemedText style={styles.mentorAvatar}>{item.avatar}</ThemedText>
                      </View>
                      <View style={styles.mentorInfo}>
                        <ThemedText type="smallBold" style={[styles.mentorName, { color: theme.text }]}>{item.name}</ThemedText>
                        <ThemedText type="code" style={[styles.mentorRole, { color: theme.primary }]}>{item.role} ({item.company})</ThemedText>
                        <ThemedText type="small" style={[styles.mentorBio, { color: theme.textSecondary }]}>{item.bio}</ThemedText>
                        
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.two }}>
                          <Pressable 
                            style={[styles.contactBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.border, borderWidth: 1 }]}
                            onPress={() => handleContactMentor(item.name)}
                          >
                            <ThemedText type="code" style={{ color: theme.text, fontWeight: 'bold' }}>
                              Enviar Dúvida
                            </ThemedText>
                          </Pressable>
                          
                          <Pressable 
                            style={[styles.contactBtn, { backgroundColor: isBooked ? '#22C55E' : theme.primary }]}
                            onPress={() => handleOpenBooking(item)}
                          >
                            <ThemedText type="code" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                              {isBooked ? 'Mentoria Agendada ✓' : 'Reservar Office Hours'}
                            </ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />

            </View>
          </View>
        </Modal>

        {/* ================= OFFICE HOURS BOOKING MODAL ================= */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isBookingModalVisible}
          onRequestClose={() => setIsBookingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { width: '90%', maxHeight: '75%', paddingBottom: Spacing.four, backgroundColor: theme.backgroundElement, borderTopColor: theme.border, borderTopWidth: 1 }]}>
              
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View>
                  <ThemedText type="code" style={{ color: theme.primary }}>
                    AGENDAMENTO
                  </ThemedText>
                  <ThemedText type="subtitle" style={[styles.modalTitle, { color: theme.text }]}>
                    Agendar mentoria rápida
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsBookingModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.background }]}
                >
                  <ThemedText type="default" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              <ScrollView style={{ paddingHorizontal: Spacing.four, marginTop: Spacing.three }} showsVerticalScrollIndicator={false}>
                {selectedMentorForBooking && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, padding: Spacing.three, borderRadius: 12, marginBottom: Spacing.four, borderColor: theme.border, borderWidth: 1 }}>
                    <ThemedText style={{ fontSize: 32, marginRight: 12 }}>{selectedMentorForBooking.avatar}</ThemedText>
                    <View>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>{selectedMentorForBooking.name}</ThemedText>
                      <ThemedText type="code" style={{ color: theme.primary }}>{selectedMentorForBooking.role}</ThemedText>
                    </View>
                  </View>
                )}

                <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: Spacing.two }}>
                  ⏰ Selecione o Horário de Hoje:
                </ThemedText>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.four }}>
                  {['14:00 - 14:30', '14:40 - 15:10', '15:20 - 15:50', '16:00 - 16:30'].map(slot => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <Pressable
                        key={slot}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: isSelected ? theme.primary : theme.background,
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: 1,
                        }}
                        onPress={() => setSelectedTimeSlot(slot)}
                      >
                        <ThemedText type="smallBold" style={{ color: isSelected ? '#FFF' : theme.text }}>
                          {slot}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: Spacing.two }}>
                  📝 Qual a sua dúvida principal?
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
                  placeholder="Ex: Gostaria de revisar nosso estatuto inicial ou tirar dúvidas sobre o Meet..."
                  placeholderTextColor={theme.textSecondary}
                  value={bookingDescription}
                  onChangeText={setBookingDescription}
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
                    onPress={() => setIsBookingModalVisible(false)}
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
                    onPress={handleConfirmBooking}
                  >
                    <ThemedText type="smallBold" style={{ color: '#FFF' }}>Confirmar Agendamento</ThemedText>
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
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  headerIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 176, 246, 0.11)',
    borderWidth: 1,
    borderColor: 'rgba(28, 176, 246, 0.18)',
  },
  headerCopy: {
    flex: 1,
  },
  headerEyebrow: {
    color: TRAIL_COLORS.greenDeep,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 32,
    marginTop: 2,
  },
  headerSubtitle: {
    marginTop: Spacing.one,
    lineHeight: 19,
  },
  adminBadge: {
    backgroundColor: 'rgba(0, 51, 102, 0.15)',
    borderWidth: 1,
    borderColor: '#003366',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one / 2,
    borderRadius: Spacing.one,
  },
  adminBadgeText: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 10,
  },
  progressContainer: {
    marginVertical: Spacing.two,
    gap: Spacing.one,
  },
  progressBarWrapper: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#003366',
    borderRadius: 4,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  trailScrollContent: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    position: 'relative',
    gap: Spacing.two,
  },
  trailPattern: {
    position: 'absolute',
    top: 0,
    width: '100%',
    maxWidth: 390,
    height: 1080,
    alignSelf: 'center',
    zIndex: 0,
  },
  nodeContainer: {
    alignItems: 'center',
    marginVertical: Spacing.three,
    position: 'relative',
    width: '100%',
    zIndex: 1,
  },
  nodeButton: {
    width: 86,
    height: 92,
    borderRadius: 44,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 10,
  },
  nodeButtonCompleted: {
    shadowColor: TRAIL_COLORS.greenDeep,
  },
  nodeButtonCurrent: {
    shadowColor: TRAIL_COLORS.blueDeep,
  },
  nodeButtonLocked: {
    opacity: 0.88,
    shadowOpacity: 0.08,
  },
  nodeDepth: {
    position: 'absolute',
    top: 10,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#A7B2BF',
  },
  nodeTop: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
  },
  nodeIconCenter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E6EBF1',
    borderWidth: 4,
    borderColor: '#D2DAE3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPulse: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: 'rgba(28, 176, 246, 0.28)',
  },
  nodeLabelContainer: {
    alignItems: 'center',
    marginTop: Spacing.three,
    width: 210,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  nodeLabelTitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 19,
  },
  nodeLabelSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  floatingMentorBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#003366',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 30,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  floatingMentorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },

  // ACHIEVEMENT MODAL
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  achievementCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 16,
  },
  achievementGlow: {
    position: 'absolute',
    top: -88,
    width: 230,
    height: 230,
    borderRadius: 115,
    opacity: 0.15,
  },
  achievementIconShell: {
    width: 116,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  achievementIconDepth: {
    position: 'absolute',
    top: 17,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#E2A500',
  },
  achievementIconTop: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFF7CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFE37A',
  },
  achievementEyebrow: {
    color: TRAIL_COLORS.greenDeep,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0,
    textAlign: 'center',
  },
  achievementTitle: {
    color: TRAIL_COLORS.ink,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  achievementSubtitle: {
    color: '#6B7785',
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  xpPill: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: '#EAF8DF',
    borderWidth: 2,
    borderColor: '#BDEFA1',
  },
  xpPillText: {
    color: TRAIL_COLORS.greenDeep,
    fontSize: 15,
  },
  achievementButton: {
    marginTop: Spacing.four,
    width: '100%',
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: TRAIL_COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: TRAIL_COLORS.greenDeep,
  },
  achievementButtonPressed: {
    transform: [{ translateY: 3 }],
    borderBottomWidth: 2,
  },
  achievementButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  confettiParticle: {
    position: 'absolute',
    borderRadius: 3,
  },
  
  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: Platform.OS === 'web' ? '100%' : '100%',
    maxWidth: MaxContentWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.four,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
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
  modalScroll: {
    flex: 1,
    padding: Spacing.four,
  },
  modalDesc: {
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: Spacing.three,
  },
  templateBox: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  templateSubText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  templateLinkBtn: {
    backgroundColor: '#00E5FF',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    marginTop: Spacing.two,
  },
  templateLinkText: {
    color: '#090D16',
    fontWeight: 'bold',
    fontSize: 11,
  },
  checklistSection: {
    marginTop: Spacing.one,
    marginBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#FFF',
    marginBottom: Spacing.two,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  checkboxChecked: {
    backgroundColor: '#003366',
  },
  checkText: {
    color: '#E2E8F0',
    flex: 1,
  },
  checkTextChecked: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  modalFooter: {
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  completeBtn: {
    backgroundColor: '#003366',
    paddingVertical: Spacing.two + 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeBtnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  completeBtnUndo: {
    backgroundColor: '#475569',
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  // MENTORS DETAILS
  mentorCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mentorAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  mentorAvatar: {
    fontSize: 24,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    color: '#FFF',
    fontSize: 16,
  },
  mentorRole: {
    color: '#003366',
    fontSize: 10,
    marginVertical: 2,
    fontWeight: 'bold',
  },
  mentorBio: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  contactBtn: {
    backgroundColor: '#00E5FF',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    marginTop: Spacing.two,
  },
});
