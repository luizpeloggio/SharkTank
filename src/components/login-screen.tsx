import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppStorage, UserRole, UserSession } from '@/services/storage';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

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

  const handleSocialLogin = (platform: 'Google' | 'Apple') => {
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        const mockEmail = `${platform.toLowerCase()}user@uern.br`;
        const session: UserSession = {
          email: mockEmail,
          name: `${platform} User`,
          role: 'estudante', // Default role for social login
        };

        await AppStorage.setSession(session);
        setIsLoading(false);
        onLoginSuccess(session);
      } catch {
        setIsLoading(false);
        setErrorMessage(`Falha ao conectar com ${platform}.`);
      }
    }, 1000);
  };

  return (
    <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
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
        <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
          <Pressable
            style={[
              styles.tabButton, 
              !isRegistering && [styles.activeTabButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]
            ]}
            onPress={() => {
              setIsRegistering(false);
              setErrorMessage('');
            }}>
            <Text style={[styles.tabText, !isRegistering && { color: theme.primary }]}>
              Entrar
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton, 
              isRegistering && [styles.activeTabButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]
            ]}
            onPress={() => {
              setIsRegistering(true);
              setErrorMessage('');
            }}>
            <Text style={[styles.tabText, isRegistering && { color: theme.primary }]}>
              Cadastrar-se
            </Text>
          </Pressable>
        </View>

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
                    Líder de EJ
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
              isLoading && styles.actionButtonDisabled
            ]}
            disabled={isLoading}
            onPress={isRegistering ? handleRegister : handleLogin}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isRegistering ? 'Criar Minha Conta' : 'Entrar na Plataforma'}
              </Text>
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
            <Text style={styles.socialIcon}>🔍</Text>
            <Text style={[styles.socialButtonText, { color: theme.text }]}>Google</Text>
          </Pressable>

          <Pressable
            style={[styles.socialButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handleSocialLogin('Apple')}>
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={[styles.socialButtonText, { color: theme.text }]}>Apple</Text>
          </Pressable>
        </View>

        {/* Prefills for Testing */}
        {!isRegistering && (
          <View style={[styles.testingContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.testingLabel, { color: theme.textSecondary }]}>💡 Teste Rápido (Prefill):</Text>
            <View style={styles.testingButtons}>
              <Pressable
                style={[styles.testingBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => handlePrefill('student')}>
                <Text style={[styles.testingBtnText, { color: theme.primary }]}>Estudante</Text>
              </Pressable>
              <Pressable
                style={[styles.testingBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => handlePrefill('leader')}>
                <Text style={[styles.testingBtnText, { color: theme.primary }]}>Líder</Text>
              </Pressable>
              <Pressable
                style={[styles.testingBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => handlePrefill('admin')}>
                <Text style={[styles.testingBtnText, { color: theme.primary }]}>Admin</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#090D16',
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
    color: '#003366',
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
    borderColor: '#003366',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        boxShadow: '0 0 0 2px rgba(0, 51, 102, 0.2)',
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
    borderColor: '#003366',
    backgroundColor: '#00336614',
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
    color: '#003366',
  },
  roleSub: {
    fontSize: 9,
    color: '#475569',
  },
  actionButton: {
    backgroundColor: '#003366',
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
    color: '#003366',
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
    borderColor: '#003366',
    backgroundColor: 'rgba(0, 51, 102, 0.12)',
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
    borderColor: '#003366',
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
    color: '#003366',
    fontSize: 11,
    fontWeight: '600',
  },
});
