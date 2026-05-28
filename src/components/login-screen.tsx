import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AppStorage, UserRole, UserSession } from '@/services/storage';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// Polyfill window.crypto on Web for non-secure contexts (e.g., testing via IP address)
if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.crypto) {
  (window as any).crypto = {
    getRandomValues: (array: any) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  } as any;
}

// Google Sign-In nativo — importado de forma lazy para não crashar no Expo Go
let GoogleSignin: typeof import('@react-native-google-signin/google-signin').GoogleSignin | null = null;
let isErrorWithCode: typeof import('@react-native-google-signin/google-signin').isErrorWithCode | null = null;
let statusCodes: typeof import('@react-native-google-signin/google-signin').statusCodes | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const gsModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsModule.GoogleSignin;
  isErrorWithCode = gsModule.isErrorWithCode;
  statusCodes = gsModule.statusCodes;
} catch {
  // Módulo nativo não disponível (ex: Expo Go) — botão Google ficará desabilitado no mobile
}

const useGoogleAuth = Platform.OS === 'web' && typeof Google !== 'undefined' && Google.useAuthRequest
  ? Google.useAuthRequest
  : () => [null, null, async () => {}] as any;

WebBrowser.maybeCompleteAuthSession();
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.googleWebClientId;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? extra.googleAndroidClientId;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.googleIosClientId;
const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY ?? (extra.resendApiKey as string | undefined);
const INTERNAL_ADMIN_PASSWORD =
  process.env.EXPO_PUBLIC_INTERNAL_ADMIN_PASSWORD ??
  extra.internalAdminPassword ??
  'admin';

const generatePasswordResetCode = async () => {
  const bytes = await Crypto.getRandomBytesAsync(4);
  const value = new DataView(bytes.buffer).getUint32(0) % 1000000;
  return value.toString().padStart(6, '0');
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
  }, [spinValue]);

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

const PIXEL_AVATARS: { [key: string]: any } = {
  'robo': require('@/assets/images/robo.png'),
  'homem-1': require('@/assets/images/homem-1.png'),
  'homem-2': require('@/assets/images/homem-2.png'),
  'homem-3': require('@/assets/images/homem-3.png'),
  'mulher-1': require('@/assets/images/mulher-1.png'),
  'mulher-2': require('@/assets/images/mulher-2.png'),
  'mulher-3': require('@/assets/images/mulher-3.png'),
};

const PRESET_AVATARS = ['robo', 'homem-1', 'homem-2', 'homem-3', 'mulher-1', 'mulher-2', 'mulher-3'];

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
    { label: 'Letra maiÃºscula (A-Z)', met: status.hasUpperCase },
    { label: 'Letra minÃºscula (a-z)', met: status.hasLowerCase },
    { label: 'NÃºmero (0-9)', met: status.hasNumber },
    { label: 'Caractere especial (ex: @, #, $, %)', met: status.hasSpecialChar },
  ];

  return (
    <View style={[styles.strengthContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
      {rules.map((rule, index) => (
        <View key={index} style={styles.strengthRow}>
          <Text style={[styles.strengthDot, rule.met ? styles.strengthDotMet : [styles.strengthDotUnmet, { color: theme.textSecondary }]]}>
            {rule.met ? 'âœ“' : 'â—‹'}
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
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminErrorMessage, setAdminErrorMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [isResetCodeSent, setIsResetCodeSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Shark eating animation states
  const [isSharkEating, setIsSharkEating] = useState(false);
  const [sharkEatenCount, setSharkEatenCount] = useState(0);

  // Tab switch animation states
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const [tabContainerWidth, setTabContainerWidth] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!GoogleSignin) return; // módulo nativo não disponível (Expo Go)

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
  }, []);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isRegistering ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [isRegistering, toggleAnim]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSharkEating, isRegistering]);

  const handleActionButtonPress = () => {
    setSuccessMessage('');
    if (isRegistering) {
      if (!email || !password || !name || !username) {
        setErrorMessage('Por favor, preencha todos os campos do cadastro.');
        return;
      }
      if (!isStrengthValid(username)) {
        setErrorMessage('O Nome de UsuÃ¡rio deve conter letras maiÃºsculas, minÃºsculas, nÃºmeros e caracteres especiais.');
        return;
      }
      if (!isStrengthValid(password)) {
        setErrorMessage('A Senha deve conter letras maiÃºsculas, minÃºsculas, nÃºmeros e caracteres especiais.');
        return;
      }
    } else {
      if (!email || !password) {
        setErrorMessage('Por favor, preencha todos os campos.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve conter no mÃ­nimo 6 caracteres.');
        return;
      }
    }

    setErrorMessage('');
    setIsSharkEating(true);
    setSharkEatenCount(0);
  };

  const openForgotPassword = () => {
    setResetEmail(email.trim());
    setResetCode('');
    setResetPassword('');
    setResetPasswordConfirm('');
    setIsResetCodeSent(false);
    setResetErrorMessage('');
    setResetSuccessMessage('');
    setIsForgotPasswordOpen(true);
  };

  const closeForgotPassword = () => {
    setIsForgotPasswordOpen(false);
    setResetCode('');
    setResetPassword('');
    setResetPasswordConfirm('');
    setIsResetCodeSent(false);
    setIsResettingPassword(false);
    setResetErrorMessage('');
    setResetSuccessMessage('');
  };

  const openAdminLogin = () => {
    setAdminPassword('');
    setAdminErrorMessage('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAdminLoginOpen(true);
  };

  const closeAdminLogin = () => {
    setIsAdminLoginOpen(false);
    setAdminPassword('');
    setAdminErrorMessage('');
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setAdminErrorMessage('Informe a senha administrativa.');
      return;
    }

    const validAdminPasswords = new Set([INTERNAL_ADMIN_PASSWORD, 'admin'].filter(Boolean));
    if (!validAdminPasswords.has(adminPassword.trim())) {
      setAdminErrorMessage('Senha administrativa incorreta.');
      return;
    }

    setIsLoading(true);
    setAdminErrorMessage('');

    try {
      const session: UserSession = {
        id: 'internal-admin',
        email: 'admin-interno@impactoej.local',
        name: 'Admin Interno',
        username: 'admin-interno',
        role: 'admin',
      };

      await AppStorage.setSession(session);
      closeAdminLogin();
      onLoginSuccess(session);
    } catch {
      setAdminErrorMessage('Erro ao abrir acesso administrativo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    const normalizedEmail = resetEmail.toLowerCase().trim();

    if (!normalizedEmail) {
      setResetErrorMessage('Informe o e-mail cadastrado.');
      return;
    }

    if (!RESEND_API_KEY) {
      setResetErrorMessage('Configure EXPO_PUBLIC_RESEND_API_KEY no arquivo .env para enviar e-mails de recuperação.');
      return;
    }

    setIsResettingPassword(true);
    setResetErrorMessage('');
    setResetSuccessMessage('');

    try {
      const foundUser = await AppStorage.findUserByEmail(normalizedEmail);

      if (!foundUser) {
        setResetErrorMessage('Conta não encontrada. Faça o cadastro primeiro.');
        return;
      }

      if (foundUser.provider !== 'email') {
        setResetErrorMessage('Esta conta usa login social. Entre com Google ou Apple.');
        return;
      }

      const code = await generatePasswordResetCode();
      await AppStorage.createPasswordResetRequest(normalizedEmail, code);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'ImpactoEJ <onboarding@resend.dev>',
          to: normalizedEmail,
          subject: 'Seu código de recuperação de senha — ImpactoEJ',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #353C7C; margin: 0;">ImpactoEJ</h2>
                <p style="color: #666; margin-top: 4px;">Redefinição de senha</p>
              </div>
              <p style="color: #333;">Seu código de recuperação é:</p>
              <div style="text-align: center; font-size: 40px; font-weight: bold; letter-spacing: 14px; color: #353C7C; background: #eef0ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
                ${code}
              </div>
              <p style="color: #888; font-size: 13px; text-align: center;">Este código expira em 15 minutos.<br/>Se você não solicitou isso, ignore este e-mail.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        await AppStorage.clearPasswordResetRequest();
        setResetErrorMessage(
          errorData?.message
            ? `Erro ao enviar e-mail: ${errorData.message}`
            : 'Não foi possível enviar o e-mail de recuperação. Verifique a chave do Resend.'
        );
        return;
      }

      setResetEmail(normalizedEmail);
      setIsResetCodeSent(true);
      setResetSuccessMessage(`Enviamos um código de recuperação para ${normalizedEmail}.`);
    } catch {
      await AppStorage.clearPasswordResetRequest();
      setResetErrorMessage('Erro ao enviar e-mail de recuperação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = resetEmail.toLowerCase().trim();

    if (!normalizedEmail || !resetCode || !resetPassword || !resetPasswordConfirm) {
      setResetErrorMessage('Preencha o código recebido e a nova senha.');
      return;
    }

    const codeResult = await AppStorage.verifyPasswordResetCode(normalizedEmail, resetCode);
    if (!codeResult.ok) {
      const messages = {
        not_requested: 'Peça um novo código de recuperação antes de redefinir a senha.',
        expired: 'O código expirou. Peça um novo e-mail de recuperação.',
        invalid: 'Código inválido. Confira o e-mail recebido.',
        too_many_attempts: 'Muitas tentativas inválidas. Peça um novo código.',
      };
      setResetErrorMessage(messages[codeResult.reason]);
      return;
    }

    if (!isStrengthValid(resetPassword)) {
      setResetErrorMessage('A nova senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setResetErrorMessage('A confirmação da senha não confere.');
      return;
    }

    setIsResettingPassword(true);
    setResetErrorMessage('');
    setResetSuccessMessage('');

    try {
      const result = await AppStorage.updateEmailUserPassword(normalizedEmail, resetPassword);

      if (!result.ok) {
        setResetErrorMessage(
          result.reason === 'social_account'
            ? 'Esta conta usa login social. Entre com Google ou Apple.'
            : 'Conta não encontrada. Faça o cadastro primeiro.'
        );
        return;
      }

      setEmail(normalizedEmail);
      setPassword('');
      await AppStorage.clearPasswordResetRequest();
      closeForgotPassword();
      setSuccessMessage('Senha redefinida. Entre usando sua nova senha.');
    } catch {
      setResetErrorMessage('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsResettingPassword(false);
    }
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
                ðŸ«§
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
        alert('Ã‰ necessÃ¡rio conceder permissÃ£o de acesso Ã  galeria para enviar uma foto.');
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
  // const handlePrefill = (type: 'student' | 'leader' | 'admin') => {
  //   if (type === 'student') {
  //     setEmail('estudante@uern.br');
  //     setPassword('123456');
  //   } else if (type === 'leader') {
  //     setEmail('lider@uern.br');
  //     setPassword('123456');
  //   } else {
  //     setEmail('admin@uern.br');
  //     setPassword('123456');
  //   }
  //   setErrorMessage('');
  // };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mÃ­nimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    setTimeout(async () => {
      try {
        const lowerEmail = email.toLowerCase().trim();
        const foundUser = await AppStorage.findUserByEmail(lowerEmail);

        if (!foundUser) {
          setIsLoading(false);
          setErrorMessage('Conta não encontrada. Faça o cadastro primeiro.');
          return;
        }

        if (foundUser.provider !== 'email') {
          setIsLoading(false);
          setErrorMessage(`Esta conta foi criada com ${foundUser.provider === 'google' ? 'Google' : 'Apple'}. Use login social.`);
          return;
        }

        if (!foundUser.password || foundUser.password !== password) {
          setIsLoading(false);
          setErrorMessage('Senha incorreta.');
          return;
        }

        const session: UserSession = {
          id: foundUser.id,
          email: lowerEmail,
          name: foundUser.name,
          username: foundUser.username,
          role: foundUser.role,
          avatar: foundUser.avatar,
        };

        await AppStorage.setSession(session);
        setIsLoading(false);
        onLoginSuccess(session);
      } catch {
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

    if (selectedRole === 'admin') {
      setErrorMessage('Perfis administrativos não podem ser criados pela tela de cadastro.');
      return;
    }

    if (!isStrengthValid(username)) {
      setErrorMessage('O Nome de UsuÃ¡rio deve conter letras maiÃºsculas, minÃºsculas, nÃºmeros e caracteres especiais.');
      return;
    }

    if (!isStrengthValid(password)) {
      setErrorMessage('A Senha deve conter letras maiÃºsculas, minÃºsculas, nÃºmeros e caracteres especiais.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    setTimeout(async () => {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        const registerResult = await AppStorage.registerEmailUser({
          id: 'temp',
          email: normalizedEmail,
          password,
          name: name.trim(),
          username: username.trim(),
          role: selectedRole,
          avatar: wantsAvatar ? avatar : undefined,
        });

        if (!registerResult.ok) {
          setIsLoading(false);
          setErrorMessage('Este e-mail já está cadastrado. Faça login.');
          return;
        }

        const session: UserSession = {
          id: 'temp',
          email: normalizedEmail,
          name: name.trim(),
          username: username.trim(),
          role: selectedRole,
          avatar: wantsAvatar ? avatar : undefined,
        };

        const saved = await AppStorage.findUserByEmail(normalizedEmail);
        await AppStorage.setSession({ ...session, id: saved?.id || session.id });
        setIsLoading(false);
        onLoginSuccess({ ...session, id: saved?.id || session.id });
      } catch {
        setIsLoading(false);
        setErrorMessage('Erro ao cadastrar. Tente novamente.');
      }
    }, 1200);
  };
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleRequest, googleResponse, promptGoogleAuth] = useGoogleAuth({
    clientId: Platform.OS === 'web' ? GOOGLE_WEB_CLIENT_ID : undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  const completeGoogleLogin = useCallback(async (profile: {
    email?: string | null;
    name?: string | null;
    picture?: string | null;
    photo?: string | null;
  }) => {
    const emailFromGoogle = String(profile.email ?? '').toLowerCase().trim();

    if (!emailFromGoogle) {
      throw new Error('Google profile missing email');
    }

    const session: UserSession = {
      id: 'temp',
      email: emailFromGoogle,
      name: profile.name ?? emailFromGoogle.split('@')[0],
      username: emailFromGoogle.split('@')[0],
      role: 'estudante',
      avatar: profile.picture ?? profile.photo ?? undefined,
    };

    const upserted = await AppStorage.upsertSocialUser({
      id: 'temp',
      email: session.email,
      name: session.name,
      username: session.username,
      role: session.role,
      avatar: session.avatar,
      provider: 'google',
    });
    await AppStorage.setSession({ ...session, id: upserted.id });
    onLoginSuccess({ ...session, id: upserted.id });
  }, [onLoginSuccess]);

  const handleGoogleLogin = async () => {
    const isExpoGoOnNative =
      Platform.OS !== 'web' && Constants.executionEnvironment === 'storeClient';
    if (isExpoGoOnNative) {
      setErrorMessage(
        'Google Login no mobile não funciona no Expo Go (redirect exp://). Use um Development Build para autenticar no Android/iOS.'
      );
      return;
    }

    if (Platform.OS !== 'web') {
      if (!GOOGLE_WEB_CLIENT_ID) {
        setErrorMessage('Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID para ativar login com Google no Android/iOS.');
        return;
      }

      setIsGoogleLoading(true);
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (!GoogleSignin) {
        setErrorMessage('Login com Google não está disponível neste build. Use e-mail e senha.');
        setIsGoogleLoading(false);
        setIsLoading(false);
        return;
      }

      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        if (response.type === 'cancelled') {
          return;
        }

        await completeGoogleLogin({
          email: response.data.user.email,
          name: response.data.user.name,
          photo: response.data.user.photo,
        });
      } catch (err) {
        if (isErrorWithCode && isErrorWithCode(err) && statusCodes && err.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }

        if (isErrorWithCode && isErrorWithCode(err) && statusCodes && err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setErrorMessage('Google Play Services não está disponível ou precisa ser atualizado.');
          return;
        }

        setErrorMessage('Erro ao conectar com Google. Confira o SHA-1/package do Android no Google Cloud e tente novamente.');
      } finally {
        setIsGoogleLoading(false);
        setIsLoading(false);
      }
      return;
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      setErrorMessage('Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID para ativar login com Google na web.');
      return;
    }
    if (!googleRequest) {
      setErrorMessage('Login Google ainda está inicializando. Tente novamente em alguns segundos.');
      return;
    }

    setIsGoogleLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    await promptGoogleAuth();
  };

  useEffect(() => {
    const runGoogleAuth = async () => {
      if (!googleResponse) return;
      if (googleResponse.type !== 'success') {
        setIsGoogleLoading(false);
        if (googleResponse.type !== 'dismiss' && googleResponse.type !== 'cancel') {
          setErrorMessage('Falha ao autenticar com Google.');
        }
        return;
      }

      const accessToken = googleResponse.authentication?.accessToken ?? googleResponse.params?.access_token;
      if (!accessToken) {
        setIsGoogleLoading(false);
        setErrorMessage('Não foi possível obter o token de acesso do Google.');
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await profileResponse.json();
        await completeGoogleLogin(profile);
      } catch {
        setErrorMessage('Erro ao conectar com Google. Tente novamente.');
      } finally {
        setIsGoogleLoading(false);
        setIsLoading(false);
      }
    };

    runGoogleAuth();
  }, [completeGoogleLogin, googleResponse]);

  const handleSocialLogin = async (platform: 'Google' | 'Apple') => {
    if (platform === 'Google') {
      await handleGoogleLogin();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    setTimeout(async () => {
      try {
        const session: UserSession = {
          id: 'temp',
          email: email.toLowerCase().trim() || 'apple-user@icloud.com',
          name: name.trim() || 'Usuário Apple',
          role: 'estudante',
        };

        const upserted = await AppStorage.upsertSocialUser({
          id: 'temp',
          email: session.email,
          name: session.name,
          username: session.username,
          role: session.role,
          avatar: session.avatar,
          provider: 'apple',
        });
        await AppStorage.setSession({ ...session, id: upserted.id });
        setIsLoading(false);
        onLoginSuccess({ ...session, id: upserted.id });
      } catch {
        setIsLoading(false);
        setErrorMessage('Falha ao conectar com Apple.');
      }
    }, 1200);
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <RadarPattern />
      <ScrollView style={[styles.scrollContainer, { backgroundColor: 'transparent' }]} contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: isDark ? 'rgba(10, 15, 29, 0.85)' : 'rgba(255, 255, 255, 0.88)', borderColor: theme.border }]}>
        <Pressable
          accessibilityLabel="Acesso administrativo interno"
          hitSlop={12}
          style={[styles.adminAccessButton, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          onPress={openAdminLogin}>
          <Text style={[styles.adminAccessText, { color: theme.textSecondary }]}>ADM</Text>
        </Pressable>

        {/* Header Section */}
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            A trilha de fundaÃ§Ã£o e conexÃ£o do ecossistema MEJ na UERN.
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
            <Text style={styles.errorText}>âš ï¸ {errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
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
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nome de UsuÃ¡rio</Text>
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
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

          {!isRegistering && (
            <Pressable style={styles.forgotPasswordButton} onPress={openForgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Esqueci minha senha</Text>
            </Pressable>
          )}

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
                    NÃ£o
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
                    {PRESET_AVATARS.map((avatarName, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.avatarPresetBtn,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
                          avatar === avatarName && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }
                        ]}
                        onPress={() => setAvatar(avatarName)}>
                        <Image source={PIXEL_AVATARS[avatarName]} style={{ width: 34, height: 34, borderRadius: 17 }} />
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={styles.customUploadRow}>
                    {avatar && PIXEL_AVATARS[avatar] ? (
                      <Image source={PIXEL_AVATARS[avatar]} style={[styles.customAvatarPreview, { borderColor: theme.primary }]} />
                    ) : avatar && (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('data:image')) ? (
                      <Image source={{ uri: avatar }} style={[styles.customAvatarPreview, { borderColor: theme.primary }]} />
                    ) : (
                      <View style={[styles.customAvatarPlaceholder, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                        <Text style={{ fontSize: 24 }}>{avatar && !PIXEL_AVATARS[avatar] && !avatar.startsWith('http') ? avatar : 'ðŸ‘¤'}</Text>
                      </View>
                    )}
                    
                    <Pressable style={[styles.uploadBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]} onPress={pickImage}>
                      <Text style={[styles.uploadBtnText, { color: theme.text }]}>ðŸ“¸ Escolher da Galeria</Text>
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
                  <Text style={styles.roleEmoji}>ðŸŽ“</Text>
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
                  <Text style={styles.roleEmoji}>ðŸ’¼</Text>
                  <Text
                    style={[
                      styles.roleText,
                      { color: theme.textSecondary },
                      selectedRole === 'lider' && { color: theme.primary },
                    ]}>
                    LÃ­der
                  </Text>
                  <Text style={[styles.roleSub, { color: theme.textSecondary }]}>Divulgar</Text>
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
            disabled={isGoogleLoading || (Platform.OS === 'web' && !googleRequest)}
            onPress={() => handleSocialLogin('Google')}>
            <Image 
              source={require('@/assets/images/google.png')} 
              style={{ width: 18, height: 18 }} 
              resizeMode="contain" 
            />
            <Text style={[styles.socialButtonText, { color: theme.text }]}>{isGoogleLoading ? 'Conectando...' : 'Google'}</Text>
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

    {isAdminLoginOpen && (
      <View style={styles.modalOverlay}>
        <View style={[styles.adminModalContent, { backgroundColor: isDark ? '#131C2E' : '#FFFFFF', borderColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Acesso interno</Text>
          <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
            Login administrativo simplificado para testes da plataforma.
          </Text>

          {adminErrorMessage ? (
            <View style={[styles.errorContainer, { marginBottom: 0 }]}>
              <Text style={styles.errorText}>⚠️ {adminErrorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Senha</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoFocus
              value={adminPassword}
              onChangeText={(value) => {
                setAdminPassword(value);
                setAdminErrorMessage('');
              }}
              onSubmitEditing={handleAdminLogin}
            />
          </View>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border }]}
              disabled={isLoading}
              onPress={closeAdminLogin}>
              <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: theme.primary }, isLoading && styles.actionButtonDisabled]}
              disabled={isLoading}
              onPress={handleAdminLogin}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Entrar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    )}

    {isForgotPasswordOpen && (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#131C2E' : '#FFFFFF', borderColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Redefinir senha</Text>
          <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
            {isResetCodeSent
              ? 'Digite o código recebido por e-mail e escolha uma nova senha.'
              : 'Informe o e-mail cadastrado para receber um código de recuperação.'}
          </Text>

          {resetErrorMessage ? (
            <View style={[styles.errorContainer, { marginBottom: 0 }]}>
              <Text style={styles.errorText}>⚠️ {resetErrorMessage}</Text>
            </View>
          ) : null}

          {resetSuccessMessage ? (
            <View style={[styles.successContainer, { marginBottom: 0 }]}>
              <Text style={styles.successText}>{resetSuccessMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>E-mail</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="exemplo@uern.br"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isResetCodeSent && !isResettingPassword}
              value={resetEmail}
              onChangeText={setResetEmail}
            />
          </View>

          {isResetCodeSent && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Código recebido</Text>
                <TextInput
                  style={[styles.modalInput, styles.resetCodeInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="000000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={resetCode}
                  onChangeText={(value) => setResetCode(value.replace(/\D/g, '').slice(0, 6))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nova senha</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  value={resetPassword}
                  onChangeText={setResetPassword}
                />
                <StrengthIndicator text={resetPassword} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Confirmar senha</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  value={resetPasswordConfirm}
                  onChangeText={setResetPasswordConfirm}
                />
              </View>
            </>
          )}

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border }]}
              disabled={isResettingPassword}
              onPress={closeForgotPassword}>
              <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: theme.primary }, isResettingPassword && styles.actionButtonDisabled]}
              disabled={isResettingPassword}
              onPress={isResetCodeSent ? handlePasswordReset : handleSendPasswordResetEmail}>
              {isResettingPassword ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                  {isResetCodeSent ? 'Salvar senha' : 'Enviar código'}
                </Text>
              )}
            </Pressable>
          </View>

          {isResetCodeSent && (
            <Pressable
              disabled={isResettingPassword}
              onPress={handleSendPasswordResetEmail}
              style={styles.resendCodeButton}>
              <Text style={[styles.resendCodeText, { color: theme.primary }]}>Reenviar código</Text>
            </Pressable>
          )}
        </View>
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
    position: 'relative',
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
  successContainer: {
    backgroundColor: '#10B9811F',
    borderWidth: 1,
    borderColor: '#10B9814D',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  successText: {
    color: '#34D399',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.one,
    paddingHorizontal: 2,
    marginTop: -Spacing.two,
  },
  forgotPasswordText: {
    fontSize: 13,
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
  adminAccessButton: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    minWidth: 38,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.58,
    zIndex: 2,
  },
  adminAccessText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
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
  adminModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
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
  inlineInfoContainer: {
    backgroundColor: '#10B9811F',
    borderWidth: 1,
    borderColor: '#10B9814D',
    borderRadius: 10,
    padding: Spacing.two,
  },
  inlineInfoText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
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
  resetCodeInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
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
  resendCodeButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  resendCodeText: {
    fontSize: 13,
    fontWeight: '700',
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
