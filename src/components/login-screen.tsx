import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
  Animated,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppStorage, UserRole, UserSession } from '@/services/storage';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

const SOCIAL_ACCOUNTS = {
  Google: [
    { email: 'luiz.peloggio@gmail.com', name: 'Luiz Peloggio', role: 'estudante', avatar: '🎓' },
    { email: 'lider.impacto@gmail.com', name: 'Impacto Líder', role: 'lider', avatar: '💼' },
    { email: 'admin.uern@gmail.com', name: 'UERN Admin', role: 'admin', avatar: '⚡' },
  ],
  Apple: [
    { email: 'luiz.dev@icloud.com', name: 'Luiz Peloggio', role: 'estudante', avatar: '🎓' },
    { email: 'impacto.lider@icloud.com', name: 'Impacto Líder', role: 'lider', avatar: '💼' },
    { email: 'uern.admin@icloud.com', name: 'UERN Admin', role: 'admin', avatar: '⚡' },
  ],
};

const RadarStyleInjector = () => {
  if (Platform.OS !== 'web') return null;
  return (
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes radar-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse-dot {
        0%, 100% { box-shadow: 0 0 0.8em 0.2em rgba(53, 60, 124, 0.6); }
        50% { box-shadow: 0 0 2em 0.5em rgba(53, 60, 124, 1); }
      }
      .web-radar-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #09090b;
        background-image: linear-gradient(rgba(53, 60, 124, 0.08) 0.1em, transparent 0.1em),
                          linear-gradient(90deg, rgba(53, 60, 124, 0.08) 0.1em, transparent 0.1em);
        background-size: 3em 3em;
        overflow: hidden;
        z-index: 0;
      }
      .web-radar-pattern::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150vw;
        height: 150vh;
        transform: translate(-50%, -50%);
        background: repeating-radial-gradient(
          circle,
          transparent 0,
          transparent 2.9em,
          rgba(53, 60, 124, 0.15) 3em
        );
        z-index: 1;
      }
      .web-radar-pattern::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50em;
        height: 50em;
        margin-top: -25em;
        margin-left: -25em;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 75%,
          rgba(53, 60, 124, 0.4) 100%
        );
        animation: radar-spin 6s linear infinite;
        z-index: 2;
      }
      .web-radar-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 1em;
        height: 1em;
        transform: translate(-50%, -50%);
        background-color: #353C7C;
        border-radius: 50%;
        z-index: 3;
        animation: pulse-dot 2s ease-in-out infinite;
      }
    `}} />
  );
};

export function RadarPattern() {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 360,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  if (Platform.OS === 'web') {
    return (
      <View style={StyleSheet.absoluteFill}>
        <RadarStyleInjector />
        <div className="web-radar-pattern">
          <div className="web-radar-center" />
        </div>
      </View>
    );
  }

  // Native fallback
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#09090b', overflow: 'hidden', zIndex: -1 }]}>
      <View style={styles.radarCenterNative} />
      <View style={[styles.radarRingNative, { width: 120, height: 120, borderRadius: 60, marginLeft: -60, marginTop: -60 }]} />
      <View style={[styles.radarRingNative, { width: 240, height: 240, borderRadius: 120, marginLeft: -120, marginTop: -120 }]} />
      <View style={[styles.radarRingNative, { width: 360, height: 360, borderRadius: 180, marginLeft: -180, marginTop: -180 }]} />
      <View style={[styles.radarRingNative, { width: 480, height: 480, borderRadius: 240, marginLeft: -240, marginTop: -240 }]} />

      <Animated.View
        style={[
          styles.radarBeamNative,
          {
            transform: [
              { rotate: spin }
            ]
          }
        ]}
      />
    </View>
  );
}

const PRESET_AVATARS = ['🎓', '💼', '⚡', '🦊', '🚀', '👾', '🦄', '🦁', '🐯', '🐼', '🤖', '🎨', '🎸', '🥑'];

const getValidationStatus = (text: string) => {
  return {
    hasUpperCase: /[A-Z]/.test(text),
    hasLowerCase: /[a-z]/.test(text),
    hasNumber: /[0-9]/.test(text),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\/]/.test(text),
  };
};

const isStrengthValid = (text: string) => {
  const status = getValidationStatus(text);
  return status.hasUpperCase && status.hasLowerCase && status.hasNumber && status.hasSpecialChar;
};

function StrengthIndicator({ text }: { text: string }) {
  const theme = useTheme();
  const status = getValidationStatus(text);
  const rules = [
    { label: 'Letra maiúscula (A-Z)', met: status.hasUpperCase },
    { label: 'Letra minúscula (a-z)', met: status.hasLowerCase },
    { label: 'Número (0-9)', met: status.hasNumber },
    { label: 'Caractere especial (ex: @, #, $, %)', met: status.hasSpecialChar },
  ];

  return (
    <View style={[styles.strengthContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
      {rules.map((rule, index) => (
        <View key={index} style={styles.strengthRow}>
          <Text style={[styles.strengthDot, rule.met ? styles.strengthDotMet : [styles.strengthDotUnmet, { color: theme.textSecondary }]]}>
            {rule.met ? '✓' : '○'}
          </Text>
          <Text style={[styles.strengthText, rule.met ? styles.strengthTextMet : [styles.strengthTextUnmet, { color: theme.textSecondary }]]}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [wantsAvatar, setWantsAvatar] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('estudante');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Shark eating animation states
  const [isSharkEating, setIsSharkEating] = useState(false);
  const [sharkEatenCount, setSharkEatenCount] = useState(0);

  // Tab switch animation states
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const [tabContainerWidth, setTabContainerWidth] = useState(0);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isRegistering ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [isRegistering]);

  useEffect(() => {
    if (!isSharkEating) return;

    const targetText = isRegistering ? 'CADASTRAR' : 'ENTRAR';
    const textLength = targetText.length;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += 1;
      setSharkEatenCount(currentStep);

      if (currentStep > textLength) {
        clearInterval(interval);
        setIsSharkEating(false);
        setSharkEatenCount(0);
        if (isRegistering) {
          handleRegister();
        } else {
          handleLogin();
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isSharkEating, isRegistering]);

  const handleActionButtonPress = () => {
    if (isRegistering) {
      if (!email || !password || !name || !username) {
        setErrorMessage('Por favor, preencha todos os campos do cadastro.');
        return;
      }
      if (!isStrengthValid(username)) {
        setErrorMessage('O Nome de Usuário deve conter letras maiúsculas, minúsculas, números e caracteres especiais.');
        return;
      }
      if (!isStrengthValid(password)) {
        setErrorMessage('A Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.');
        return;
      }
    } else {
      if (!email || !password) {
        setErrorMessage('Por favor, preencha todos os campos.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
    }

    setErrorMessage('');
    setIsSharkEating(true);
    setSharkEatenCount(0);
  };

  const renderAnimatedButtonText = () => {
    const targetText = isRegistering ? 'CADASTRAR' : 'ENTRAR';
    const chars = targetText.split('');
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {chars.map((char, index) => {
          if (index < sharkEatenCount - 1) {
            return (
              <Text key={index} style={[styles.actionButtonText, { fontSize: 16 }]}>
                🫧
              </Text>
            );
          }
          if (index === sharkEatenCount - 1) {
            return (
              <Image 
                key={index}
                source={require('@/assets/images/tuba-1.png')} 
                style={{ width: 24, height: 24 }} 
                resizeMode="contain" 
              />
            );
          }
          return (
            <Text key={index} style={styles.actionButtonText}>
              {char}
            </Text>
          );
        })}
      </View>
    );
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('É necessário conceder permissão de acesso à galeria para enviar uma foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = selectedAsset.base64 ? `data:image/jpeg;base64,${selectedAsset.base64}` : selectedAsset.uri;
        setAvatar(uri);
      }
    } catch (e) {
      console.error('Error picking image:', e);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = (e: any) => {
            setAvatar(e.target.result as string);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    }
  };

  // Quick prefill for testing convenience
  const handlePrefill = (type: 'student' | 'leader' | 'admin') => {
    if (type === 'student') {
      setEmail('estudante@uern.br');
      setPassword('123456');
    } else if (type === 'leader') {
      setEmail('lider@uern.br');
      setPassword('123456');
    } else {
      setEmail('admin@uern.br');
      setPassword('123456');
    }
    setErrorMessage('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Simulate network delay
    setTimeout(async () => {
      try {
        let role: UserRole = 'estudante';
        let resolvedName = 'Visitante';

        // Auto-assign roles based on testing email or fallback
        const lowerEmail = email.toLowerCase().trim();
        if (lowerEmail.includes('admin')) {
          role = 'admin';
          resolvedName = 'Admin UERN';
        } else if (lowerEmail.includes('lider')) {
          role = 'lider';
          resolvedName = 'Líder Computação EJ';
        } else if (lowerEmail.includes('estudante')) {
          role = 'estudante';
          resolvedName = 'Lucas Silva';
        } else {
          // If custom email, default to student or whatever is set
          role = 'estudante';
          resolvedName = email.split('@')[0];
        }

        const session: UserSession = {
          email: lowerEmail,
          name: resolvedName,
          username: lowerEmail.split('@')[0] + '123!',
          role: role,
          avatar: role === 'admin' ? '👩‍💻' : role === 'lider' ? '⚡' : '🎓',
        };

        await AppStorage.setSession(session);
        setIsLoading(false);
        onLoginSuccess(session);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage('Erro ao autenticar. Tente novamente.');
      }
    }, 1200);
  };

  const handleRegister = async () => {
    if (!email || !password || !name || !username) {
      setErrorMessage('Por favor, preencha todos os campos do cadastro.');
      return;
    }

    if (!isStrengthValid(username)) {
      setErrorMessage('O Nome de Usuário deve conter letras maiúsculas, minúsculas, números e caracteres especiais.');
      return;
    }

    if (!isStrengthValid(password)) {
      setErrorMessage('A Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Simulate network delay
    setTimeout(async () => {
      try {
        const session: UserSession = {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          username: username.trim(),
          role: selectedRole,
          avatar: wantsAvatar ? avatar : undefined,
        };

        await AppStorage.setSession(session);
        setIsLoading(false);
        onLoginSuccess(session);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage('Erro ao cadastrar. Tente novamente.');
      }
    }, 1200);
  };

  const [socialPlatform, setSocialPlatform] = useState<'Google' | 'Apple' | null>(null);

  const handleSocialLogin = (platform: 'Google' | 'Apple') => {
    setSocialPlatform(platform);
    setErrorMessage('');
  };

  const handleSocialAccountSelect = (acc: typeof SOCIAL_ACCOUNTS['Google'][0]) => {
    const platform = socialPlatform!;
    setSocialPlatform(null);
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        const session: UserSession = {
          email: acc.email,
          name: acc.name,
          role: acc.role as UserRole,
          avatar: acc.avatar,
        };

        await AppStorage.setSession(session);
        setIsLoading(false);
        onLoginSuccess(session);
      } catch {
        setIsLoading(false);
        setErrorMessage(`Falha ao conectar com ${platform}.`);
      }
    }, 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <RadarPattern />
      <ScrollView style={[styles.scrollContainer, { backgroundColor: 'transparent' }]} contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: isDark ? 'rgba(10, 15, 29, 0.85)' : 'rgba(255, 255, 255, 0.88)', borderColor: theme.border }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/tubarao.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={[styles.title, { color: theme.text }]}>ImpactoEJ</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            A trilha de fundação e conexão do ecossistema MEJ na UERN.
          </Text>
        </View>

        {/* Tab Selector */}
        <Animated.View 
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            setTabContainerWidth(width);
          }}
          style={[styles.tabContainer, { backgroundColor: toggleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.background, '#353C7C'],
          }) }]}
        >
          {tabContainerWidth > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: 4,
                width: (tabContainerWidth - 8) / 2,
                backgroundColor: theme.backgroundSelected,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                transform: [{
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (tabContainerWidth - 8) / 2],
                  }),
                }],
              }}
            />
          )}

          <Pressable
            style={styles.tabButton}
            onPress={() => {
              setIsRegistering(false);
              setErrorMessage('');
            }}>
            <Text style={[styles.tabText, !isRegistering && { color: theme.primary, fontWeight: 'bold' }]}>
              Entrar
            </Text>
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => {
              setIsRegistering(true);
              setErrorMessage('');
            }}>
            <Text style={[styles.tabText, isRegistering && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              Cadastrar-se
            </Text>
          </Pressable>
        </Animated.View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Main Form Fields */}
        <View style={styles.form}>
          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nome Completo</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  focusedField === 'name' && { borderColor: theme.primary },
                ]}
                placeholder="Seu nome"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          )}

          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nome de Usuário</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  focusedField === 'username' && { borderColor: theme.primary },
                ]}
                placeholder="Ex: Lucas123!"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />
              <StrengthIndicator text={username} />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>E-mail Institucional</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                focusedField === 'email' && { borderColor: theme.primary },
              ]}
              placeholder="exemplo@uern.br"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Senha</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                focusedField === 'password' && { borderColor: theme.primary },
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            {isRegistering && <StrengthIndicator text={password} />}
          </View>

          {/* Optional Profile Picture Picker */}
          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Quer adicionar uma foto de perfil?</Text>
              <View style={[styles.avatarToggleContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Pressable
                  style={[
                    styles.avatarToggleBtn, 
                    !wantsAvatar && [styles.avatarToggleBtnActive, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]
                  ]}
                  onPress={() => {
                    setWantsAvatar(false);
                    setAvatar('');
                  }}>
                  <Text style={[styles.avatarToggleText, !wantsAvatar && { color: theme.primary }]}>
                    Não
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.avatarToggleBtn, 
                    wantsAvatar && [styles.avatarToggleBtnActive, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]
                  ]}
                  onPress={() => {
                    setWantsAvatar(true);
                    setAvatar(PRESET_AVATARS[0]);
                  }}>
                  <Text style={[styles.avatarToggleText, wantsAvatar && { color: theme.primary }]}>
                    Sim (Opcional)
                  </Text>
                </Pressable>
              </View>

              {wantsAvatar && (
                <View style={[styles.avatarPickerWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.avatarPickerSub, { color: theme.textSecondary }]}>Escolha um avatar ou escolha da galeria:</Text>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarPresetsList}>
                    {PRESET_AVATARS.map((emoji, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.avatarPresetBtn,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          avatar === emoji && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }
                        ]}
                        onPress={() => setAvatar(emoji)}>
                        <Text style={styles.avatarPresetText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={styles.customUploadRow}>
                    {avatar && (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('data:image')) ? (
                      <Image source={{ uri: avatar }} style={[styles.customAvatarPreview, { borderColor: theme.primary }]} />
                    ) : (
                      <View style={[styles.customAvatarPlaceholder, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                        <Text style={{ fontSize: 24 }}>{avatar || '👤'}</Text>
                      </View>
                    )}
                    
                    <Pressable style={[styles.uploadBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]} onPress={pickImage}>
                      <Text style={[styles.uploadBtnText, { color: theme.text }]}>📸 Escolher da Galeria</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Registration Role Selector */}
          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Selecione seu Perfil</Text>
              <View style={styles.roleSelector}>
                <Pressable
                  style={[
                    styles.roleItem,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    selectedRole === 'estudante' && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
                  ]}
                  onPress={() => setSelectedRole('estudante')}>
                  <Text style={styles.roleEmoji}>🎓</Text>
                  <Text
                    style={[
                      styles.roleText,
                      { color: theme.textSecondary },
                      selectedRole === 'estudante' && { color: theme.primary },
                    ]}>
                    Estudante
                  </Text>
                  <Text style={[styles.roleSub, { color: theme.textSecondary }]}>Aprender</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleItem,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    selectedRole === 'lider' && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
                  ]}
                  onPress={() => setSelectedRole('lider')}>
                  <Text style={styles.roleEmoji}>💼</Text>
                  <Text
                    style={[
                      styles.roleText,
                      { color: theme.textSecondary },
                      selectedRole === 'lider' && { color: theme.primary },
                    ]}>
                    Líder
                  </Text>
                  <Text style={[styles.roleSub, { color: theme.textSecondary }]}>Divulgar</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleItem,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    selectedRole === 'admin' && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
                  ]}
                  onPress={() => setSelectedRole('admin')}>
                  <Text style={styles.roleEmoji}>⚡</Text>
                  <Text
                    style={[
                      styles.roleText,
                      { color: theme.textSecondary },
                      selectedRole === 'admin' && { color: theme.primary },
                    ]}>
                    Admin
                  </Text>
                  <Text style={[styles.roleSub, { color: theme.textSecondary }]}>Gerenciar</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            style={[
              styles.actionButton, 
              { backgroundColor: theme.primary },
              (isLoading || isSharkEating) && styles.actionButtonDisabled
            ]}
            disabled={isLoading || isSharkEating}
            onPress={handleActionButtonPress}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              isSharkEating ? (
                renderAnimatedButtonText()
              ) : (
                <Text style={styles.actionButtonText}>
                  {isRegistering ? 'Criar Minha Conta' : 'Entrar na Plataforma'}
                </Text>
              )
            )}
          </Pressable>
        </View>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={[styles.separatorLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.separatorText, { color: theme.textSecondary }]}>ou conecte com</Text>
          <View style={[styles.separatorLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Social Authentication */}
        <View style={styles.socialContainer}>
          <Pressable
            style={[styles.socialButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handleSocialLogin('Google')}>
            <Image 
              source={require('@/assets/images/google.png')} 
              style={{ width: 18, height: 18 }} 
              resizeMode="contain" 
            />
            <Text style={[styles.socialButtonText, { color: theme.text }]}>Google</Text>
          </Pressable>

          <Pressable
            style={[styles.socialButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handleSocialLogin('Apple')}>
            <Image 
              source={require('@/assets/images/apple.png')} 
              style={{ width: 18, height: 18 }} 
              resizeMode="contain" 
            />
            <Text style={[styles.socialButtonText, { color: theme.text }]}>Apple</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>

    {socialPlatform && (
      <View style={styles.modalOverlay}>
        {socialPlatform === 'Google' ? (
          <View style={[styles.googleSheetContainer, { backgroundColor: isDark ? '#202124' : '#FFFFFF' }]}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Image 
                source={require('@/assets/images/google.png')} 
                style={{ width: 26, height: 26, marginBottom: 8 }} 
                resizeMode="contain" 
              />
              <Text style={[styles.googleSheetTitle, { color: isDark ? '#E8EAED' : '#202124' }]}>Escolher uma conta</Text>
              <Text style={[styles.googleSheetSubtitle, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>para prosseguir no ImpactoEJ</Text>
            </View>
            
            <View style={{ marginVertical: 8 }}>
              {SOCIAL_ACCOUNTS.Google.map((acc, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.googleAccountRow, 
                    { 
                      borderBottomColor: isDark ? '#3C4043' : '#F1F3F4',
                      backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent'
                    }
                  ]}
                  onPress={() => handleSocialAccountSelect(acc)}
                >
                  <View style={[styles.googleAvatarCircle, { backgroundColor: index === 0 ? '#1A73E8' : index === 1 ? '#0F9D58' : '#D56200' }]}>
                    <Text style={styles.googleAvatarText}>{acc.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.googleAccountName, { color: isDark ? '#E8EAED' : '#3C4043' }]}>{acc.name}</Text>
                    <Text style={[styles.googleAccountEmail, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>{acc.email}</Text>
                  </View>
                </Pressable>
              ))}
              
              <Pressable
                style={({ pressed }) => [
                  styles.googleAccountRow,
                  { backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent' }
                ]}
                onPress={() => setSocialPlatform(null)}
              >
                <View style={[styles.googleAvatarCircle, { backgroundColor: isDark ? '#3C4043' : '#F1F3F4' }]}>
                  <Text style={[styles.googleAvatarText, { color: isDark ? '#E8EAED' : '#5F6368', fontSize: 13 }]}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.googleAccountName, { color: isDark ? '#E8EAED' : '#3C4043', fontWeight: '500' }]}>Usar outra conta</Text>
                </View>
              </Pressable>
            </View>

            <Text style={[styles.googleSheetFooter, { color: isDark ? '#9AA0A6' : '#70757A' }]}>
              Para continuar, o Google compartilhará seu nome, endereço de e-mail, foto do perfil e preferências com o aplicativo ImpactoEJ. Antes de usar este app, leia a política de privacidade e os termos de serviço.
            </Text>
            
            <Pressable 
              style={[styles.googleCancelBtn, { borderColor: isDark ? '#5F6368' : '#E8EAED', borderWidth: 1 }]} 
              onPress={() => setSocialPlatform(null)}
            >
              <Text style={{ color: isDark ? '#8AB4F8' : '#1A73E8', fontSize: 13, fontWeight: 'bold' }}>Cancelar</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.appleSheetContainer}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Image 
                source={require('@/assets/images/apple.png')} 
                style={{ width: 36, height: 36, tintColor: '#FFFFFF', marginBottom: 12 }} 
                resizeMode="contain" 
              />
              <Text style={styles.appleSheetTitle}>ID Apple</Text>
              <Text style={styles.appleSheetSubtitle}>Iniciar sessão no ImpactoEJ com o seu ID Apple.</Text>
            </View>
            
            <View style={styles.appleAccountField}>
              <Text style={styles.appleFieldLabel}>CONTA</Text>
              <Text style={styles.appleFieldValue}>{SOCIAL_ACCOUNTS.Apple[0].email}</Text>
            </View>
            
            <View style={styles.appleAccountField}>
              <Text style={styles.appleFieldLabel}>NOME</Text>
              <Text style={styles.appleFieldValue}>{SOCIAL_ACCOUNTS.Apple[0].name}</Text>
            </View>

            <View style={styles.appleShareChoice}>
              <Text style={styles.appleChoiceText}>✓ Compartilhar Meu E-mail</Text>
            </View>
            
            <View style={{ gap: 10, marginTop: 20 }}>
              <Pressable 
                style={({ pressed }) => [styles.appleContinueBtn, pressed && { opacity: 0.8 }]}
                onPress={() => handleSocialAccountSelect(SOCIAL_ACCOUNTS.Apple[0])}
              >
                <Text style={styles.appleContinueText}>Continuar com Face ID / Senha</Text>
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.appleCancelBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setSocialPlatform(null)}
              >
                <Text style={styles.appleCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    paddingVertical: Spacing.six,
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#131C2E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#233554',
    padding: Spacing.six,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoImage: {
    width: 195,
    height: 195,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-condensed',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0E1726',
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.five,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#353C7C',
  },
  errorContainer: {
    backgroundColor: '#EF44441F',
    borderWidth: 1,
    borderColor: '#EF44444D',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Platform.OS === 'ios' ? Spacing.four : Spacing.three,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: '#353C7C',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        boxShadow: '0 0 0 2px rgba(53, 60, 124, 0.2)',
      } as any,
    }),
  } as any,
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  roleItem: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  roleItemActive: {
    borderColor: '#353C7C',
    backgroundColor: 'rgba(53, 60, 124, 0.12)',
  },
  roleEmoji: {
    fontSize: 22,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  roleTextActive: {
    color: '#353C7C',
  },
  roleSub: {
    fontSize: 9,
    color: '#475569',
  },
  actionButton: {
    backgroundColor: '#353C7C',
    borderRadius: 12,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.five,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  separatorText: {
    fontSize: 12,
    color: '#64748B',
    paddingHorizontal: Spacing.three,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  socialIcon: {
    fontSize: 16,
  },
  socialButtonText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
  },
  strengthContainer: {
    marginTop: 6,
    padding: Spacing.two,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  strengthDot: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  strengthDotMet: {
    color: '#10B981',
  },
  strengthDotUnmet: {
    color: '#64748B',
  },
  strengthText: {
    fontSize: 11,
  },
  strengthTextMet: {
    color: '#34D399',
    fontWeight: '500',
  },
  strengthTextUnmet: {
    color: '#64748B',
  },
  avatarToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0A0F1D',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  avatarToggleBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: 9,
  },
  avatarToggleBtnActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarToggleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  avatarToggleTextActive: {
    color: '#353C7C',
  },
  avatarPickerWrapper: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    backgroundColor: '#0A0F1D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: Spacing.three,
  },
  avatarPickerSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  avatarPresetsList: {
    gap: Spacing.two,
    paddingVertical: 4,
  },
  avatarPresetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  avatarPresetBtnActive: {
    borderColor: '#353C7C',
    backgroundColor: 'rgba(53, 60, 124, 0.12)',
  },
  avatarPresetText: {
    fontSize: 22,
  },
  customUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  customAvatarPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#353C7C',
  },
  customAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testingContainer: {
    marginTop: Spacing.five,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  testingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: Spacing.two,
  },
  testingButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  testingBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  testingBtnText: {
    color: '#353C7C',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    zIndex: 9999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    marginTop: Spacing.two,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  accountSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.three,
  },
  accountSelectName: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountSelectEmail: {
    fontSize: 12,
  },
  accountSelectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  radarCenterNative: {
    position: 'absolute',
    top: '26%',
    left: '50%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#353C7C',
    marginLeft: -8,
    marginTop: -8,
    shadowColor: '#353C7C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 3,
  },
  radarRingNative: {
    position: 'absolute',
    top: '26%',
    left: '50%',
    borderWidth: 1,
    borderColor: 'rgba(53, 60, 124, 0.15)',
  },
  radarBeamNative: {
    position: 'absolute',
    top: '26%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: 'rgba(53, 60, 124, 0.3)',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  googleSheetContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: Spacing.five,
    alignSelf: 'center',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  googleSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  googleSheetSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  googleAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  googleAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  googleAccountName: {
    fontSize: 14,
    fontWeight: '600',
  },
  googleAccountEmail: {
    fontSize: 12,
  },
  googleSheetFooter: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: Spacing.two,
    textAlign: 'justify',
  },
  googleCancelBtn: {
    marginTop: Spacing.three,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleSheetContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161617',
    borderRadius: 28,
    padding: Spacing.five,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#333336',
    gap: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  appleSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  appleSheetSubtitle: {
    fontSize: 14,
    color: '#86868B',
    textAlign: 'center',
    marginTop: 4,
  },
  appleAccountField: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    gap: 4,
  },
  appleFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#86868B',
  },
  appleFieldValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appleShareChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  appleChoiceText: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '600',
  },
  appleContinueBtn: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleContinueText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  appleCancelBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleCancelText: {
    color: '#86868B',
    fontSize: 15,
    fontWeight: '600',
  },
});
