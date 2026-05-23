import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  AppStorage,
  INITIAL_TRAIL_STEPS,
  SHARKS,
  TrailStep,
} from '@/services/storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UserProfileHeader } from '@/components/user-profile-header';

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

interface ProgressCircleProps {
  progress: number;
  size: number;
  strokeWidth: number;
  children: React.ReactNode;
}

function ProgressCircle({ progress, size, strokeWidth, children }: ProgressCircleProps) {
  const theme = useTheme();
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
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active Progress Circle */}
        {progress > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.primary}
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
  
  // Storage States
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userRole, setUserRole] = useState<string>('estudante');
  
  // Interactive UI States
  const [selectedStep, setSelectedStep] = useState<TrailStep | null>(null);
  const [checkedSubItems, setCheckedSubItems] = useState<{ [key: string]: boolean }>({});
  const [isMentorsVisible, setIsMentorsVisible] = useState<boolean>(false);
  const [isStepModalVisible, setIsStepModalVisible] = useState<boolean>(false);

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
    
    const message = isNowCompleted 
      ? `Parabéns! Você completou a etapa "${selectedStep.title}"!`
      : `Etapa "${selectedStep.title}" marcada como pendente.`;

    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert(isNowCompleted ? '💥 Sucesso!' : 'Status Atualizado', message);
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

  const handleContactMentor = (name: string) => {
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
        <View style={styles.header}>
          <View>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              CAMINHO DAS PEDRAS
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.text }]}>
              Fundação da EJ
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
                
                {/* Progress Circle wrapping the node button */}
                <ProgressCircle progress={ratio} size={90} strokeWidth={5}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.nodeButton,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      isCompleted && { backgroundColor: theme.primary, borderColor: '#FF7C4D' },
                      isCurrent && { backgroundColor: theme.backgroundSelected, borderColor: theme.primary, borderWidth: 5 },
                      !isUnlocked && { backgroundColor: theme.background, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleOpenStep(step)}
                  >
                    <ThemedText 
                      type="subtitle" 
                      style={[
                        styles.nodeText,
                        { color: isCompleted || isCurrent ? '#FFFFFF' : theme.textSecondary }
                      ]}
                    >
                      {isCompleted ? '✓' : !isUnlocked ? '🔒' : step.id}
                    </ThemedText>
                  </Pressable>
                </ProgressCircle>

                {/* Micro Node Title */}
                <View style={styles.nodeLabelContainer}>
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
                    {step.duration}
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
                            {isChecked && <ThemedText type="smallBold" style={{ color: '#FFF', fontSize: 10 }}>✓</ThemedText>}
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
                          ? '✓ Concluir Etapa' 
                          : 'Marque todos os requisitos acima'}
                    </ThemedText>
                  </Pressable>
                </View>

              </View>
            </View>
          </Modal>
        )}

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
  },
  nodeContainer: {
    alignItems: 'center',
    marginVertical: Spacing.two,
    position: 'relative',
    width: '100%',
  },
  connectorLine: {
    position: 'absolute',
    top: 75,
    width: 6,
    height: 100,
    zIndex: -1,
  },
  nodeButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  nodeCompleted: {
    backgroundColor: '#003366',
    borderColor: '#FF7C4D',
  },
  nodeCurrent: {
    backgroundColor: '#1E293B',
    borderColor: '#003366',
    borderWidth: 5,
  },
  nodeLocked: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  nodeText: {
    fontWeight: '800',
    fontSize: 24,
  },
  nodeLabelContainer: {
    alignItems: 'center',
    marginTop: Spacing.two,
    width: 180,
  },
  nodeLabelTitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
  },
  nodeLabelSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
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
