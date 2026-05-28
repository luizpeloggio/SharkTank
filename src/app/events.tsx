import { AuthContext } from '@/contexts/auth-context';
import { Spacing } from '@/constants/theme';
import { AppStorage, EventItem, EventReactionState } from '@/services/storage';
import { ThemedView } from '@/components/themed-view';
import { UserProfileHeader } from '@/components/user-profile-header';
import { useTheme } from '@/hooks/use-theme';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SAMPLE_VIDEO_URI = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const EVENT_ACCENTS = ['#009FDF', '#22C55E', '#F97316', '#A855F7', '#EF4444', '#FACC15'];
const DEFAULT_VIDEO_TAGS = ['Ao vivo', 'Novo', 'Workshop', 'Inscricoes'];

function normalizeVideoUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  let next = trimmed;
  if (/^www\./i.test(next)) next = `https://${next}`;

  try {
    const url = new URL(next);
    const driveMatch = url.hostname.includes('drive.google.com')
      ? url.pathname.match(/\/file\/d\/([^/]+)/)
      : null;
    if (driveMatch?.[1]) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    if (url.hostname.includes('dropbox.com')) {
      url.searchParams.set('dl', '1');
      return url.toString();
    }
    return url.toString();
  } catch {
    return next;
  }
}

function isSupportedVideoLink(value: string) {
  if (!value.trim()) return false;
  const normalized = normalizeVideoUrl(value);
  if (/^(file|content|asset|data):/i.test(normalized)) return true;
  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map(tag => tag.trim()).filter(Boolean)));
}

function getActiveVideoTags(item: EventItem) {
  const activeVideo = item.videos.find(video => video.url === item.videoUri);
  const videoTags = activeVideo?.tags ?? [];
  return videoTags.length > 0 ? videoTags : [item.tag].filter(Boolean);
}

function EventVideoPlayer({ uri, isActive, accent }: { uri: string; isActive: boolean; accent: string }) {
  const source = useMemo(() => ({ uri: normalizeVideoUrl(uri) }), [uri]);
  const player = useVideoPlayer(source, videoPlayer => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View style={styles.videoLayer}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsFullscreen
        playsInline
        style={styles.videoView}
      />
      <View style={[styles.videoTint, { backgroundColor: accent }]} />
    </View>
  );
}

function ReelFallback({ item, isActive }: { item: EventItem; isActive: boolean }) {
  return (
    <View style={[styles.fallbackVideo, { backgroundColor: '#090D16' }]}>
      <Image
        source={require('@/assets/images/foguete-1.png')}
        style={styles.reelBackgroundImage}
        resizeMode="contain"
      />
      <View style={[styles.pulseRing, isActive && styles.pulseRingActive, { borderColor: `${item.accent}66` }]} />
      <View style={styles.scanLine} />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  active,
  accent,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  accent: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.82,
        speed: 50,
        bounciness: 4,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        bounciness: 12,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.actionButtonContainer}>
      <Animated.View
        style={[
          styles.actionButtonCircle,
          { transform: [{ scale }] },
          active && { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: accent },
        ]}
      >
        <Text style={[styles.actionIcon, active && { color: accent }]}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.actionText, active && { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

function EventReelCard({
  item,
  isActive,
  width,
  isLiked,
  isSaved,
  isShared,
  isAdmin,
  onLike,
  onSave,
  onShare,
  onAddVideo,
  onSelectVideo,
  onRemoveVideo,
}: {
  item: EventItem;
  isActive: boolean;
  width: number;
  isLiked: boolean;
  isSaved: boolean;
  isShared: boolean;
  isAdmin: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onAddVideo: () => void;
  onSelectVideo: (uri: string) => void;
  onRemoveVideo: (videoId: string) => void;
}) {
  const activeTags = getActiveVideoTags(item);

  return (
    <View style={[styles.reelCard, { width }]}>
      <Image
        source={require('@/assets/images/foguete-1.png')}
        style={styles.reelBackgroundImage}
        resizeMode="contain"
      />
      <ReelFallback item={item} isActive={isActive} />
      <EventVideoPlayer uri={item.videoUri} isActive={isActive} accent={item.accent} />

      <View style={styles.topFade} />
      <View style={styles.bottomFade} />

      <View style={styles.reelChrome}>
        {activeTags.slice(0, 3).map(tag => (
          <View key={tag} style={[styles.liveBadge, { borderColor: item.accent }]}>
            <View style={[styles.liveDot, { backgroundColor: item.accent }]} />
            <Text style={styles.liveText} numberOfLines={1}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sideActions}>
        <ActionButton
          icon={isLiked ? '❤️' : '🤍'}
          label={formatCount(item.likes)}
          active={isLiked}
          accent="#EF4444"
          onPress={onLike}
        />
        <ActionButton
          icon="↗️"
          label={isShared ? 'Enviado' : formatCount(item.shares)}
          active={isShared}
          accent="#38BDF8"
          onPress={onShare}
        />
        <ActionButton
          icon={isSaved ? '⭐' : '☆'}
          label={formatCount(item.saves)}
          active={isSaved}
          accent="#EAB308"
          onPress={onSave}
        />
        {isAdmin && (
          <ActionButton
            icon="➕"
            label="Vídeo"
            accent="#FFFFFF"
            onPress={onAddVideo}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.compactMetaRow}>
          <View style={[styles.hostBadge, { backgroundColor: `${item.accent}22`, borderColor: `${item.accent}55` }]}>
            <Text style={[styles.hostText, { color: item.accent }]} numberOfLines={1}>@{item.host}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaText} numberOfLines={1}>📅 {item.date}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaText} numberOfLines={1}>📍 {item.location}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {item.videos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoStack}>
            {item.videos.slice(0, 4).map(video => {
              const isSelected = item.videoUri === video.url;
              return (
                <Pressable
                  key={video.id}
                  style={[
                    styles.videoChip,
                    {
                      borderColor: isSelected ? item.accent : 'rgba(255,255,255,0.16)',
                      backgroundColor: isSelected ? `${item.accent}33` : 'rgba(0,0,0,0.4)',
                    },
                  ]}
                  onPress={() => onSelectVideo(video.url)}
                  onLongPress={isAdmin ? () => onRemoveVideo(video.id) : undefined}
                  delayLongPress={350}
                >
                  <View style={styles.videoChipRow}>
                    <Text style={[styles.videoChipIcon, { color: isSelected ? item.accent : '#94A3B8' }]}>▶</Text>
                    <Text style={[styles.videoChipText, isSelected && { fontWeight: '900' }]} numberOfLines={1}>{video.title}</Text>
                    {isAdmin && (
                      <Pressable
                        hitSlop={8}
                        style={({ pressed }) => [styles.videoChipDelete, pressed && styles.actionPressed]}
                        onPress={() => onRemoveVideo(video.id)}
                      >
                        <Text style={styles.videoChipDeleteText}>×</Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default function EventsScreen() {
  const theme = useTheme();
  const { session } = useContext(AuthContext);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reactions, setReactions] = useState<EventReactionState>({ liked: [], saved: [], shared: [] });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pickedVideoUri, setPickedVideoUri] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventHost, setNewEventHost] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [tagOptions, setTagOptions] = useState<string[]>(DEFAULT_VIDEO_TAGS);
  const [selectedVideoTags, setSelectedVideoTags] = useState<string[]>(['Novo']);
  const [newTagText, setNewTagText] = useState('');

  const userId = session?.id ?? 'guest';
  const isAdmin = session?.role === 'admin';
  const placeholderTextColor = theme.textSecondary;
  const reelHeight = Math.max(560, height - insets.top - Math.max(insets.bottom, 12) - 86);
  const reelWidth = Math.min(width, 720);

  const loadData = React.useCallback(async () => {
    const [storedEvents, storedReactions] = await Promise.all([
      AppStorage.getEvents(),
      AppStorage.getEventReactions(userId),
    ]);
    setEvents(storedEvents);
    setReactions(storedReactions);
    setSelectedEventId(prev => prev || storedEvents[0]?.id || '');
    const storedTags = storedEvents.flatMap(event => [
      event.tag,
      ...event.videos.flatMap(video => video.tags ?? []),
    ]);
    setTagOptions(current => uniqueTags([...current, ...storedTags]));
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 70 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (typeof next === 'number') setActiveIndex(next);
  });

  const snapOffsets = useMemo(
    () => events.map((_, index) => index * reelHeight),
    [events, reelHeight]
  );

  const handleToggle = async (eventId: string, type: 'liked' | 'saved') => {
    const result = await AppStorage.toggleEventReaction(eventId, userId, type);
    setEvents(result.events);
    setReactions(result.reactions);
  };

  const handleShare = async (event: EventItem) => {
    const message = `${event.title} - ${event.date}\n${event.description}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'share' in navigator) {
      await (navigator as any).share({ title: event.title, text: message });
    } else {
      await Share.share({ title: event.title, message });
    }
    const result = await AppStorage.registerEventShare(event.id, userId);
    setEvents(result.events);
    setReactions(result.reactions);
  };

  const handleSelectVideo = (eventId: string, uri: string) => {
    setEvents(prev => prev.map(event => event.id === eventId ? { ...event, videoUri: uri } : event));
  };

  const handleRemoveVideo = async (eventId: string, videoId: string) => {
    const remove = async () => {
      const updated = await AppStorage.removeEventVideo(eventId, videoId);
      setEvents(updated);
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Apagar este vídeo do evento?') : true;
      if (ok) await remove();
      return;
    }

    Alert.alert('Apagar vídeo', 'Deseja apagar este vídeo do evento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: remove },
    ]);
  };

  const handleAddTagOption = () => {
    const nextTag = newTagText.trim();
    if (!nextTag) return;
    setTagOptions(current => uniqueTags([...current, nextTag]));
    setSelectedVideoTags(current => uniqueTags([...current, nextTag]));
    setNewTagText('');
  };

  const syncEventsAfterTagEdit = async (nextEvents: EventItem[]) => {
    setEvents(nextEvents);
    await AppStorage.saveEvents(nextEvents);
  };

  const handleRenameTagOption = (index: number, value: string) => {
    const previous = tagOptions[index];
    setTagOptions(current => current.map((tag, tagIndex) => tagIndex === index ? value : tag));
    setSelectedVideoTags(current => current.map(tag => tag === previous ? value : tag).filter(Boolean));
    const nextEvents = events.map(event => ({
      ...event,
      tag: event.tag === previous ? value : event.tag,
      videos: event.videos.map(video => ({
        ...video,
        tags: (video.tags ?? []).map(tag => tag === previous ? value : tag),
      })),
    }));
    setEvents(nextEvents);
    void AppStorage.saveEvents(nextEvents);
  };

  const handleFinishEditingTags = async () => {
    setTagOptions(current => uniqueTags(current));
    setSelectedVideoTags(current => uniqueTags(current));
    const nextEvents = events.map(event => ({
      ...event,
      videos: event.videos.map(video => ({ ...video, tags: uniqueTags(video.tags ?? []) })),
    }));
    await syncEventsAfterTagEdit(nextEvents);
  };

  const handleRemoveTagOption = async (tagToRemove: string) => {
    setTagOptions(current => current.filter(tag => tag !== tagToRemove));
    setSelectedVideoTags(current => current.filter(tag => tag !== tagToRemove));
    const nextEvents = events.map(event => ({
      ...event,
      tag: event.tag === tagToRemove ? 'Novo' : event.tag,
      videos: event.videos.map(video => ({
        ...video,
        tags: (video.tags ?? []).filter(tag => tag !== tagToRemove),
      })),
    }));
    await syncEventsAfterTagEdit(nextEvents);
  };

  const handleToggleVideoTag = (tag: string) => {
    setSelectedVideoTags(current => current.includes(tag)
      ? current.filter(item => item !== tag)
      : uniqueTags([...current, tag])
    );
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Evento incompleto', 'Informe pelo menos o nome do evento.');
      return;
    }

    const accent = EVENT_ACCENTS[events.length % EVENT_ACCENTS.length];
    const updated = await AppStorage.addEvent({
      title: newEventTitle.trim(),
      host: newEventHost.trim() || 'Impacto EJ',
      date: newEventDate.trim() || 'Data a definir',
      location: newEventLocation.trim() || 'Local a definir',
      description: newEventDescription.trim() || 'Novo conteudo de evento.',
      tag: 'Novo',
      accent,
      videoUri: SAMPLE_VIDEO_URI,
      posterKey: 'visitor',
    });

    setEvents(updated);
    setSelectedEventId(updated[0]?.id || '');
    setNewEventTitle('');
    setNewEventHost('');
    setNewEventDate('');
    setNewEventLocation('');
    setNewEventDescription('');
    setIsCreatingEvent(false);
  };

  const handleRemoveEvent = async (eventId: string) => {
    const remove = async () => {
      const updated = await AppStorage.removeEvent(eventId);
      setEvents(updated);
      setSelectedEventId(prev => prev === eventId ? updated[0]?.id || '' : prev);
      setActiveIndex(index => Math.min(index, Math.max(0, updated.length - 1)));
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Remover este evento?') : true;
      if (ok) await remove();
      return;
    }

    Alert.alert('Remover evento', 'Deseja apagar este evento da area de videos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: remove },
    ]);
  };

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPickedVideoUri(result.assets[0].uri);
      setVideoUrl('');
    }
  };

  const handleAddVideo = async () => {
    const finalUrl = pickedVideoUri || normalizeVideoUrl(videoUrl);
    if (!selectedEventId || !videoTitle.trim() || !finalUrl) {
      Alert.alert('Video incompleto', 'Escolha um evento, informe um titulo e adicione um link ou upload.');
      return;
    }
    if (!pickedVideoUri && !isSupportedVideoLink(finalUrl)) {
      Alert.alert('Link invalido', 'Use um link direto para video, como MP4, MOV ou HLS. Links de paginas como YouTube/Vimeo nao abrem no player nativo.');
      return;
    }
    const updated = await AppStorage.addEventVideo(selectedEventId, {
      title: videoTitle.trim(),
      url: finalUrl,
      sourceType: pickedVideoUri ? 'upload' : 'link',
      tags: uniqueTags(selectedVideoTags),
    });
    setEvents(updated);
    setVideoTitle('');
    setVideoUrl('');
    setPickedVideoUri('');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.headerLayer}>
          <UserProfileHeader />
        </View>

        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={snapOffsets}
          snapToAlignment="start"
          viewabilityConfig={viewConfigRef.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Spacing.four) + 92 }}
          renderItem={({ item, index }) => (
            <View style={[styles.reelShell, { height: reelHeight }]}>
              <EventReelCard
                item={item}
                isActive={index === activeIndex}
                width={reelWidth}
                isLiked={reactions.liked.includes(item.id)}
                isSaved={reactions.saved.includes(item.id)}
                isShared={reactions.shared.includes(item.id)}
                isAdmin={isAdmin}
                onLike={() => handleToggle(item.id, 'liked')}
                onSave={() => handleToggle(item.id, 'saved')}
                onShare={() => handleShare(item)}
                onAddVideo={() => {
                  setSelectedEventId(item.id);
                  setIsVideoModalOpen(true);
                }}
                onSelectVideo={(uri) => handleSelectVideo(item.id, uri)}
                onRemoveVideo={(videoId) => handleRemoveVideo(item.id, videoId)}
              />
            </View>
          )}
        />

        <Modal
          animationType="slide"
          transparent
          visible={isVideoModalOpen}
          onRequestClose={() => setIsVideoModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalKicker, { color: theme.primary }]}>ADMIN</Text>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Adicionar video</Text>
                </View>
                <Pressable style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]} onPress={() => setIsVideoModalOpen(false)}>
                  <Text style={[styles.closeButtonText, { color: theme.text }]}>×</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.formScroll} contentContainerStyle={styles.formBody} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Eventos</Text>
                  <Pressable
                    style={({ pressed }) => [styles.inlineButton, pressed && styles.actionPressed]}
                    onPress={() => setIsCreatingEvent(prev => !prev)}
                  >
                    <Text style={styles.inlineButtonText}>{isCreatingEvent ? 'Fechar' : '+ Novo'}</Text>
                  </Pressable>
                </View>

                {isCreatingEvent && (
                  <View style={styles.createEventBox}>
                    <TextInput
                      value={newEventTitle}
                      onChangeText={setNewEventTitle}
                      placeholder="Nome do evento"
                      placeholderTextColor={placeholderTextColor}
                      style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                    />
                    <View style={styles.twoColumnRow}>
                      <TextInput
                        value={newEventHost}
                        onChangeText={setNewEventHost}
                        placeholder="Organizador"
                        placeholderTextColor={placeholderTextColor}
                        style={[styles.input, styles.flexInput, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                      />
                      <TextInput
                        value={newEventDate}
                        onChangeText={setNewEventDate}
                        placeholder="Data"
                        placeholderTextColor={placeholderTextColor}
                        style={[styles.input, styles.flexInput, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                      />
                    </View>
                    <TextInput
                      value={newEventLocation}
                      onChangeText={setNewEventLocation}
                      placeholder="Local"
                      placeholderTextColor={placeholderTextColor}
                      style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                    />
                    <TextInput
                      value={newEventDescription}
                      onChangeText={setNewEventDescription}
                      placeholder="Descricao curta"
                      placeholderTextColor={placeholderTextColor}
                      multiline
                      style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                    />
                    <Pressable style={({ pressed }) => [styles.createEventButton, pressed && styles.actionPressed]} onPress={handleCreateEvent}>
                      <Text style={styles.createEventButtonText}>Criar evento</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.eventList}>
                  {events.map(event => {
                    const isSelected = selectedEventId === event.id;
                    return (
                      <Pressable
                        key={event.id}
                        style={[
                          styles.eventChoice,
                          {
                            borderColor: isSelected ? event.accent : 'rgba(255,255,255,0.12)',
                            backgroundColor: isSelected ? `${event.accent}20` : 'rgba(255,255,255,0.06)',
                          },
                        ]}
                        onPress={() => setSelectedEventId(event.id)}
                      >
                        <View style={styles.eventChoiceInfo}>
                          <Text style={[styles.eventChoiceText, { color: theme.text }]} numberOfLines={1}>{event.title}</Text>
                          <Text style={[styles.eventChoiceMeta, { color: theme.textSecondary }]} numberOfLines={1}>{event.date} - {event.location}</Text>
                        </View>
                        <Pressable
                          hitSlop={8}
                          style={styles.removeEventButton}
                          onPress={() => handleRemoveEvent(event.id)}
                        >
                          <Text style={styles.removeEventText}>X</Text>
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.videoFormBox}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Video</Text>
                  <TextInput
                    value={videoTitle}
                    onChangeText={setVideoTitle}
                    placeholder="Titulo do video"
                    placeholderTextColor={placeholderTextColor}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                  />

                  <TextInput
                    value={videoUrl}
                    onChangeText={(value) => {
                      setVideoUrl(value);
                      if (value.trim()) setPickedVideoUri('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Link direto MP4, MOV ou HLS"
                    placeholderTextColor={placeholderTextColor}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                  />

                  <Pressable style={({ pressed }) => [styles.uploadButton, pressed && styles.actionPressed]} onPress={handlePickVideo}>
                    <Text style={styles.uploadButtonText}>{pickedVideoUri ? 'Upload selecionado' : 'Selecionar upload'}</Text>
                  </Pressable>

                  <View style={styles.tagManagerBox}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Tags do video</Text>
                    <View style={styles.tagOptionList}>
                      {tagOptions.map((tag, index) => {
                        const isSelected = selectedVideoTags.includes(tag);
                        return (
                          <View
                            key={`tag-${index}`}
                            style={[
                              styles.tagOptionRow,
                              isSelected && styles.tagOptionRowSelected,
                            ]}
                          >
                            <Pressable
                              style={[styles.tagSelectDot, isSelected && styles.tagSelectDotActive]}
                              onPress={() => handleToggleVideoTag(tag)}
                            >
                              <Text style={styles.tagSelectText}>{isSelected ? '✓' : ''}</Text>
                            </Pressable>
                            <TextInput
                              value={tag}
                              onChangeText={(value) => handleRenameTagOption(index, value)}
                              onBlur={handleFinishEditingTags}
                              placeholder="Tag"
                              placeholderTextColor={placeholderTextColor}
                              style={[styles.tagInput, { color: theme.text }]}
                            />
                            <Pressable
                              hitSlop={8}
                              style={styles.removeTagButton}
                              onPress={() => handleRemoveTagOption(tag)}
                            >
                              <Text style={styles.removeTagText}>X</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.addTagRow}>
                      <TextInput
                        value={newTagText}
                        onChangeText={setNewTagText}
                        placeholder="Nova tag"
                        placeholderTextColor={placeholderTextColor}
                        style={[styles.input, styles.addTagInput, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                        onSubmitEditing={handleAddTagOption}
                      />
                      <Pressable style={({ pressed }) => [styles.inlineButton, pressed && styles.actionPressed]} onPress={handleAddTagOption}>
                        <Text style={styles.inlineButtonText}>Adicionar</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.actionPressed]} onPress={() => setIsVideoModalOpen(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancelar</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.actionPressed]} onPress={handleAddVideo}>
                  <Text style={styles.saveButtonText}>Publicar video</Text>
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
  },
  reelBackgroundImage: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.24,
    left: '50%',
    top: '50%',
    marginLeft: -100,
    marginTop: -100,
  },
  safeArea: {
    flex: 1,
  },
  headerLayer: {
    paddingHorizontal: Spacing.three,
    zIndex: 10,
    position: 'relative',
  },
  reelShell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  reelCard: {
    flex: 1,
    maxHeight: '94%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
  },
  videoTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
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
    height: 96,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  reelChrome: {
    position: 'absolute',
    top: Spacing.four,
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: 148,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sideActions: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 84,
    gap: 14,
    alignItems: 'center',
  },
  actionButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  actionPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.92 }],
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    position: 'absolute',
    left: Spacing.four,
    right: 88,
    bottom: Spacing.three,
    gap: 6,
    paddingVertical: 6,
  },
  compactMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  hostBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  hostText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaPill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  videoStack: {
    gap: 8,
    marginTop: 6,
    paddingRight: Spacing.four,
  },
  videoChip: {
    maxWidth: 132,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  videoChipIcon: {
    fontSize: 8,
    fontWeight: '900',
  },
  videoChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  videoChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  videoChipDelete: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.36)',
  },
  videoChipDeleteText: {
    color: '#FCA5A5',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.four,
    maxHeight: '86%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalKicker: {
    color: '#009FDF',
    fontSize: 11,
    fontWeight: '900',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 26,
  },
  formScroll: {
    maxHeight: 560,
  },
  formBody: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  formLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(56,189,248,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.28)',
  },
  inlineButtonText: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '900',
  },
  createEventBox: {
    gap: Spacing.two,
    borderRadius: 16,
    padding: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flexInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 72,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
  createEventButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  createEventButtonText: {
    color: '#111827',
    fontWeight: '900',
  },
  eventList: {
    gap: 8,
  },
  eventChoice: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventChoiceInfo: {
    flex: 1,
    minWidth: 0,
  },
  eventChoiceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  eventChoiceMeta: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '700',
  },
  removeEventButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.32)',
  },
  removeEventText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '900',
  },
  videoFormBox: {
    gap: Spacing.two,
    borderRadius: 16,
    padding: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  tagManagerBox: {
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: Spacing.three,
    marginTop: Spacing.two,
  },
  tagOptionList: {
    gap: 8,
  },
  tagOptionRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  tagOptionRowSelected: {
    borderColor: 'rgba(56,189,248,0.38)',
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  tagSelectDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  tagSelectDotActive: {
    backgroundColor: '#009FDF',
    borderColor: '#009FDF',
  },
  tagSelectText: {
    color: '#082F49',
    fontSize: 12,
    fontWeight: '900',
  },
  tagInput: {
    flex: 1,
    minHeight: 38,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  removeTagButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.14)',
  },
  removeTagText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '900',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addTagInput: {
    flex: 1,
  },
  input: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  uploadButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56,189,248,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.28)',
    marginTop: Spacing.two,
  },
  uploadButtonText: {
    color: '#7DD3FC',
    fontWeight: '900',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  cancelButton: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.74)',
    fontWeight: '900',
  },
  saveButton: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#009FDF',
  },
  saveButtonText: {
    color: '#082F49',
    fontWeight: '900',
  },
});
