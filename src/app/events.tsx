import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { UserProfileHeader } from '@/components/user-profile-header';
import { Spacing } from '@/constants/theme';

type EventReel = {
  id: string;
  title: string;
  host: string;
  date: string;
  location: string;
  description: string;
  tag: string;
  accent: string;
  videoUri: string;
  poster: any;
  attendees: string;
  saves: string;
};

const EVENT_REELS: EventReel[] = [
  {
    id: 'enej-2026',
    title: 'ENEJ RN 2026',
    host: 'RN Junior',
    date: '15 Jun • 19:00',
    location: 'Auditorio Central',
    description: 'Pitches, mentorias relampago e networking entre empresas juniores do ecossistema UERN.',
    tag: 'Ao vivo em breve',
    accent: '#22C55E',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: require('@/assets/images/foguete-1.png'),
    attendees: '512',
    saves: '38',
  },
  {
    id: 'pitch-night',
    title: 'Pitch Night UERN',
    host: 'Impacto EJ',
    date: '22 Jun • 18:30',
    location: 'Hub de Inovacao',
    description: 'Uma noite de apresentacoes curtas para conectar ideias, investidores e times fundadores.',
    tag: 'Inscricoes abertas',
    accent: '#F97316',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: require('@/assets/images/foguete-1.png'),
    attendees: '248',
    saves: '21',
  },
  {
    id: 'lab-b2b',
    title: 'Lab B2B Jr',
    host: 'UERN Proex',
    date: '30 Jun • 09:00',
    location: 'Sala Maker',
    description: 'Desafio pratico para transformar servicos de EJs em propostas comerciais prontas para cliente.',
    tag: 'Workshop',
    accent: '#38BDF8',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: require('@/assets/images/visitante.png'),
    attendees: '186',
    saves: '17',
  },
];

function WebVideo({ uri, isActive }: { uri: string; isActive: boolean }) {
  if (Platform.OS !== 'web') return null;

  return React.createElement('video', {
    src: uri,
    muted: true,
    loop: true,
    autoPlay: isActive,
    playsInline: true,
    controls: false,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.72,
    },
  });
}

function ReelFallback({ item, isActive }: { item: EventReel; isActive: boolean }) {
  return (
    <View style={[styles.fallbackVideo, { backgroundColor: item.accent }]}>
      <View style={[styles.pulseRing, isActive && styles.pulseRingActive]} />
      <Image source={item.poster} style={styles.posterIcon} resizeMode="contain" />
      <View style={styles.scanLine} />
    </View>
  );
}

export default function EventsScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const reelHeight = Math.max(560, height - insets.top - Math.max(insets.bottom, 12) - 86);
  const reelWidth = Math.min(width, 720);

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 70 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (typeof next === 'number') setActiveIndex(next);
  });

  const snapOffsets = useMemo(
    () => EVENT_REELS.map((_, index) => index * reelHeight),
    [reelHeight]
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerLayer}>
          <UserProfileHeader />
          <View style={styles.brandRow}>
            <View style={styles.brandIconFrame}>
              <Image source={require('@/assets/images/foguete-inclinado.png')} style={styles.brandIcon} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.brandKicker}>EVENTOS UERN</Text>
              <Text style={styles.brandTitle}>Decole na agenda</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={EVENT_REELS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={snapOffsets}
          snapToAlignment="start"
          viewabilityConfig={viewConfigRef.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Spacing.four) + 92 }}
          renderItem={({ item, index }) => {
            const isActive = index === activeIndex;

            return (
              <View style={[styles.reelShell, { height: reelHeight }]}>
                <View style={[styles.reelCard, { width: reelWidth }]}>
                  <ReelFallback item={item} isActive={isActive} />
                  <WebVideo uri={item.videoUri} isActive={isActive} />

                  <View style={styles.topFade} />
                  <View style={styles.bottomFade} />

                  <View style={styles.reelChrome}>
                    <View style={[styles.liveBadge, { borderColor: item.accent }]}>
                      <View style={[styles.liveDot, { backgroundColor: item.accent }]} />
                      <Text style={styles.liveText}>{item.tag}</Text>
                    </View>
                  </View>

                  <View style={styles.sideActions}>
                    <Pressable style={styles.actionButton}>
                      <Text style={styles.actionIcon}>♥</Text>
                      <Text style={styles.actionText}>{item.attendees}</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Text style={styles.actionIcon}>↗</Text>
                      <Text style={styles.actionText}>Share</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Text style={styles.actionIcon}>★</Text>
                      <Text style={styles.actionText}>{item.saves}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.content}>
                    <Text style={styles.host}>@{item.host}</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaText}>{item.date}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  headerLayer: {
    paddingHorizontal: Spacing.three,
    zIndex: 5,
  },
  brandRow: {
    position: 'absolute',
    left: Spacing.three,
    top: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 6,
  },
  brandIconFrame: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  brandIcon: {
    width: 28,
    height: 28,
  },
  brandKicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  reelShell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  reelCard: {
    flex: 1,
    maxHeight: '98%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  fallbackVideo: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    opacity: 0.48,
  },
  pulseRingActive: {
    transform: [{ scale: 1.08 }],
  },
  posterIcon: {
    width: 150,
    height: 150,
    opacity: 0.82,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '46%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 320,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  reelChrome: {
    position: 'absolute',
    top: Spacing.four,
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sideActions: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 148,
    gap: 16,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    position: 'absolute',
    left: Spacing.four,
    right: 92,
    bottom: Spacing.four,
    gap: 8,
  },
  host: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  description: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
