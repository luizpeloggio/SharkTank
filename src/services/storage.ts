import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Define TS Types for our application state
export type UserRole = 'estudante' | 'lider' | 'admin';

function generateId(): string {
  const maybe = (Crypto as any)?.randomUUID?.();
  if (typeof maybe === 'string' && maybe.length > 0) return maybe;
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export interface TrailStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  templateUrl?: string;
  checklistItems: string[];
}

export type AchievementTargetType = 'user' | 'company';
export type AchievementScope = AchievementTargetType | 'both';
export type AchievementCategory = 'trail' | 'content' | 'networking' | 'growth' | 'event' | 'community';

export interface AchievementDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: AchievementCategory;
  scope: AchievementScope;
  color: string;
  backgroundColor: string;
  stepId?: number;
}

interface AchievementRecord {
  targetType: AchievementTargetType;
  targetId: string;
  achievementId: string;
  earnedAt: number;
}

export interface EarnedAchievement extends AchievementDefinition {
  targetType: AchievementTargetType;
  targetId: string;
  earnedAt?: number;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  category: 'noticia' | 'vaga' | 'evento';
  tag: string;
  date: string;
  createdAt?: number;
  companyId?: string;
  applyUrl?: string;
  likes: number;
}

export interface SharkProject {
  id: string;
  name: string;
  description: string;
  team: string;
  votes: number;
  logo: string;
}

export interface Shark {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  bio: string;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: UserRole;
  avatar?: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  password?: string;
  name?: string;
  username?: string;
  role: UserRole;
  avatar?: string;
  provider: 'email' | 'google' | 'apple';
}

export interface PasswordResetRequest {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

// Initial Mock Data
export const INITIAL_TRAIL_STEPS: TrailStep[] = [
  {
    id: 1,
    title: 'Ideação & Equipe',
    subtitle: 'Reunir 5 amigos e definir o propósito principal da sua EJ.',
    description: 'Toda Empresa Júnior de sucesso começa com uma equipe de estudantes determinados. Nesta etapa, você deve estruturar o grupo inicial de fundadores e definir qual será a área de atuação da EJ (ex: computação, direito, administração).',
    duration: '1-2 semanas',
    checklistItems: [
      'Reunir no mínimo 5 estudantes matriculados no curso.',
      'Definir a área de atuação e serviços iniciais.',
      'Escolher um nome provisório para a EJ.',
      'Selecionar um professor orientador do curso.'
    ]
  },
  {
    id: 2,
    title: 'Definição de Estatuto',
    subtitle: 'Esboçar o Estatuto Social e o Regimento Interno com base nas referências federais.',
    description: 'O Estatuto Social é a certidão de nascimento da sua EJ. Ele dita os direitos e deveres dos membros, cargos, processos eleitorais e regras de governança de acordo com a Lei das EJs (Lei nº 13.267).',
    duration: '2-3 semanas',
    templateUrl: 'https://brasiljunior.org.br/estatuto-modelo-ej',
    checklistItems: [
      'Esboçar estatuto usando modelo oficial da Brasil Júnior.',
      'Alinhar estatuto com a Lei Federal das EJs.',
      'Redigir o Regimento Interno com detalhes de operação.',
      'Revisar cláusulas com apoio de um mentor ou do curso de Direito.'
    ]
  },
  {
    id: 3,
    title: 'Assembleia de Fundação',
    subtitle: 'Realizar a assembleia geral para aprovação dos documentos e eleição da primeira diretoria.',
    description: 'A assembleia é o evento formal onde todos os fundadores aprovam o Estatuto Social e elegem oficialmente os membros da Diretoria Executiva e Conselho de Administração. Tudo deve ser documentado em uma Ata.',
    duration: '1 semana',
    templateUrl: 'https://brasiljunior.org.br/modelo-ata-fundacao',
    checklistItems: [
      'Convocar todos os fundadores com edital formal.',
      'Realizar a reunião de votação e eleição.',
      'Redigir a Ata da Assembleia Geral de Fundação.',
      'Coletar as assinaturas de todos os presentes e do advogado.'
    ]
  },
  {
    id: 4,
    title: 'Registro & CNPJ',
    subtitle: 'Registrar os documentos em cartório e obter o CNPJ na Receita Federal.',
    description: 'Agora a parte burocrática essencial! Você deve levar a Ata e o Estatuto revisados por um advogado ao Cartório de Registro Civil de Pessoas Jurídicas e, após o registro, dar entrada na solicitação do CNPJ.',
    duration: '3-4 semanas',
    checklistItems: [
      'Reunir Ata, Estatuto e documentos dos diretores.',
      'Obter o visto de um advogado ativo na OAB.',
      'Registrar a documentação no Cartório de Registro Civil.',
      'Solicitar o CNPJ via RedeSim na Receita Federal.'
    ]
  },
  {
    id: 5,
    title: 'Filiação à Federação',
    subtitle: 'Entrar no processo de federação da RN Júnior e ganhar o selo oficial.',
    description: 'Parabéns! Sua EJ está registrada. O passo final para fazer parte de verdade do ecossistema é a federação estadual (RN Júnior). Isso desbloqueia premiações, treinamentos, networking e o selo de EJ Oficial UERN.',
    duration: '2 semanas',
    checklistItems: [
      'Preparar o portfólio de serviços iniciais.',
      'Comprovar regularidade jurídica (CNPJ e conta bancária ativa).',
      'Apresentar a EJ no conselho da RN Júnior.',
      'Completar o processo de onboarding federativo.'
    ]
  }
];

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    id: 'user-trail-step-1',
    stepId: 1,
    name: 'Equipe em Movimento',
    icon: '🤝',
    description: 'Concluiu a ideação e formou a base da sua EJ.',
    category: 'trail',
    scope: 'user',
    color: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  {
    id: 'user-trail-step-2',
    stepId: 2,
    name: 'Guardião do Estatuto',
    icon: '📘',
    description: 'Avançou na estrutura jurídica e nas regras internas.',
    category: 'trail',
    scope: 'user',
    color: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
  },
  {
    id: 'user-trail-step-3',
    stepId: 3,
    name: 'Assembleia Fundadora',
    icon: '🏛️',
    description: 'Formalizou decisões e liderança da empresa júnior.',
    category: 'trail',
    scope: 'user',
    color: '#0891B2',
    backgroundColor: 'rgba(8, 145, 178, 0.14)',
  },
  {
    id: 'user-trail-step-4',
    stepId: 4,
    name: 'CNPJ no Radar',
    icon: '🧾',
    description: 'Dominou a etapa de registro e regularização.',
    category: 'trail',
    scope: 'user',
    color: '#EA580C',
    backgroundColor: 'rgba(234, 88, 12, 0.14)',
  },
  {
    id: 'user-trail-step-5',
    stepId: 5,
    name: 'Completou primeira trilha',
    icon: '🏅',
    description: 'Completou a trilha e chegou ao ecossistema oficial.',
    category: 'trail',
    scope: 'user',
    color: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.14)',
  },
  {
    id: 'user-first-post',
    name: 'Primeiro post',
    icon: '✍️',
    description: 'Publicou sua primeira contribuição no ecossistema.',
    category: 'content',
    scope: 'user',
    color: '#DB2777',
    backgroundColor: 'rgba(219, 39, 119, 0.14)',
  },
  {
    id: 'user-networking',
    name: 'Networking',
    icon: '🌐',
    description: 'Interagiu com pessoas e oportunidades do MEJ.',
    category: 'networking',
    scope: 'user',
    color: '#0D9488',
    backgroundColor: 'rgba(13, 148, 136, 0.14)',
  },
  {
    id: 'company-10-members',
    name: '10 membros',
    icon: '👥',
    description: 'A empresa alcançou uma equipe com 10 membros.',
    category: 'growth',
    scope: 'company',
    color: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  {
    id: 'company-event-held',
    name: 'Evento realizado',
    icon: '🎤',
    description: 'A empresa registrou uma ação ou evento no ecossistema.',
    category: 'event',
    scope: 'company',
    color: '#9333EA',
    backgroundColor: 'rgba(147, 51, 234, 0.14)',
  },
  {
    id: 'company-100-followers',
    name: '100 seguidores',
    icon: '📣',
    description: 'A empresa conquistou uma audiência inicial relevante.',
    category: 'community',
    scope: 'company',
    color: '#EA580C',
    backgroundColor: 'rgba(234, 88, 12, 0.14)',
  },
  {
    id: 'ecosystem-official',
    name: 'Ecossistema UERN',
    icon: '⭐',
    description: 'Reconhecimento geral de presença no ecossistema.',
    category: 'community',
    scope: 'both',
    color: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.14)',
  },
];

export const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    title: 'Processo Seletivo Aberto - Computação EJ',
    content: 'Quer acelerar seu aprendizado em desenvolvimento de software e gerenciamento de projetos? A Computação EJ UERN abriu vagas nas áreas de Frontend (React Native), Backend (Node.js) e Vendas Consultivas. Venha fazer parte do ecossistema e desenvolver projetos reais para clientes de todo o estado! Inscrições abertas até dia 30 de Maio.',
    author: 'Computação EJ',
    category: 'vaga',
    tag: '#VAGA',
    date: 'Hoje',
    applyUrl: 'https://computacaoej.com.br/selecao',
    likes: 12
  },
  {
    id: 'post-2',
    title: 'RN Júnior Anuncia Encontro Regional de EJs',
    content: 'O ENEJ 2026 está chegando! A federação estadual acaba de confirmar que a edição deste ano ocorrerá em Natal, reunindo mais de 500 empresários juniores para um final de semana repleto de mentorias, palestras inspiradoras com fundadores de unicórnios e muito networking. Garanta seu ingresso com desconto de lote promocional!',
    author: 'RN Júnior',
    category: 'evento',
    tag: '#EVENTO',
    date: 'Ontem',
    applyUrl: 'https://rnjunior.org.br/enej',
    likes: 24
  },
  {
    id: 'post-3',
    title: 'UERN aprova novos apoios e bolsas para Empresas Juniores',
    content: 'Excelente notícia para a nossa comunidade acadêmica! A Reitoria da UERN, através da Pró-Reitoria de Extensão (PROEX), aprovou uma nova resolução que concede bolsas de apoio técnico a alunos que estejam liderando EJs em fase de fundação. Isso trará mais fôlego financeiro para as despesas jurídicas e de registro de novos CNPJs!',
    author: 'Portal UERN',
    category: 'noticia',
    tag: '#NOTÍCIA',
    date: '3 dias atrás',
    likes: 38
  },
  {
    id: 'post-4',
    title: 'Oportunidade: Desenvolvedor Mobile Júnior no Sebrae Lab',
    content: 'O Sebrae Mossoró está buscando alunos da UERN para atuar no desenvolvimento de protótipos de aplicativos para microempreendedores locais. Experiência desejável em React Native. Carga horária de 20h/semana, bolsa auxílio atrativa e excelente oportunidade de networking.',
    author: 'Sebrae Mossoró',
    category: 'vaga',
    tag: '#VAGA',
    date: '4 dias atrás',
    applyUrl: 'https://sebrae.com.br/vagas',
    likes: 15
  }
];

export const INITIAL_SHARK_PROJECTS: SharkProject[] = [
  {
    id: 'proj-1',
    name: 'AgroTech Mossoró',
    description: 'Sistema IoT de monitoramento automatizado de irrigação gota a gota para pequenos produtores de melão da região oeste, economizando até 40% de água.',
    team: 'Engenharia de Computação UERN',
    votes: 142,
    logo: '🌱'
  },
  {
    id: 'proj-2',
    name: 'GenBarber',
    description: 'Aplicativo phygital inteligente de gestão, fidelidade e agendamento dinâmico otimizado para barbearias premium locais, maximizando a produtividade dos barbeiros.',
    team: 'Ciência da Computação & Administração UERN',
    votes: 185,
    logo: '💈'
  },
  {
    id: 'proj-3',
    name: 'EduTech UERN',
    description: 'Plataforma gamificada que adapta o currículo escolar público em desafios interativos, combatendo a evasão escolar no ensino fundamental em Mossoró.',
    team: 'Pedagogia & Ciência da Computação UERN',
    votes: 98,
    logo: '🎓'
  },
  {
    id: 'proj-4',
    name: 'EcoCycle',
    description: 'Rede de logística reversa que recompensa moradores de Mossoró com cupons de desconto no comércio local a cada quilo de plástico reciclável descartado nos hubs.',
    team: 'Gestão Ambiental UERN',
    votes: 114,
    logo: '♻️'
  }
];

export const SHARKS: Shark[] = [
  {
    id: 'shark-1',
    name: 'Amanda',
    role: 'Investidora Anjo e Venture Capitalist',
    company: 'UERN Startups',
    avatar: 'Amanda.jpg',
    bio: 'Especialista em scale-ups de tecnologia focada no crescimento e captação de recursos para startups do ecossistema do RN.'
  },
  {
    id: 'shark-2',
    name: 'Karina',
    role: 'Co-Fundadora e Diretora de Tecnologia',
    company: 'Mossoró Tech',
    avatar: 'Karina.jpg',
    bio: 'Líder técnica com mais de 10 anos de experiência em engenharia de software e desenvolvimento de novos produtos inovadores.'
  },
  {
    id: 'shark-3',
    name: 'Luiza',
    role: 'Diretora de Inovação',
    company: 'Sebrae Mossoró',
    avatar: 'Luiza.jpg',
    bio: 'Mentora de aceleração e modelagem de negócios. Já ajudou dezenas de startups locais a estruturarem suas primeiras rodadas de validação.'
  }
];

// Keys for AsyncStorage
const KEYS = {
  ROLE: '@uern_impactoej_role',
  TRAIL_PROGRESS: '@uern_impactoej_trail_progress',
  FEED_POSTS: '@uern_impactoej_feed_posts',
  SHARK_VOTES: '@uern_impactoej_shark_votes',
  SHARK_PROJECTS: '@uern_impactoej_shark_projects',
  SESSION: '@uern_impactoej_user_session',
  CHECKED_SUBITEMS: '@uern_impactoej_checked_subitems',
  USERS: '@uern_impactoej_users',
  PASSWORD_RESET_REQUEST: '@uern_impactoej_password_reset_request',
  ACHIEVEMENTS: '@uern_impactoej_achievements',
};

export const AppStorage = {
  // --- CHECKED SUBITEMS ---
  async getCheckedSubItems(): Promise<{ [key: string]: boolean }> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHECKED_SUBITEMS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async setCheckedSubItems(checked: { [key: string]: boolean }): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CHECKED_SUBITEMS, JSON.stringify(checked));
    } catch (e) {
      console.error('Error saving checked subitems', e);
    }
  },

  // --- USER SESSION ---
  async getSession(): Promise<UserSession | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SESSION);
      const session = data ? (JSON.parse(data) as UserSession) : null;
      if (!session) return null;

      // Migration: older sessions didn't store `id`
      if (!(session as any).id) {
        const found = await this.findUserByEmail(session.email);
        if (found?.id) {
          const upgraded = { ...session, id: found.id } as UserSession;
          await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(upgraded));
          return upgraded;
        }
      }

      return session;
    } catch {
      return null;
    }
  },

  async setSession(session: UserSession): Promise<void> {
    try {
      // Ensure id is present (e.g. callers created a temp session)
      const ensured = session.id ? session : { ...session, id: (await this.findUserByEmail(session.email))?.id ?? 'temp' };
      await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(ensured));
      await this.setRole(session.role);
    } catch (e) {
      console.error('Error saving session', e);
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.SESSION);
    } catch (e) {
      console.error('Error clearing session', e);
    }
  },

  // --- USERS ---
  async getUsers(): Promise<RegisteredUser[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USERS);
      const parsed = (data ? JSON.parse(data) : []) as RegisteredUser[];
      let changed = false;
      const normalized = parsed.map((u: any) => {
        if (u?.id) return u as RegisteredUser;
        changed = true;
        return { ...u, id: generateId() } as RegisteredUser;
      });
      if (changed) {
        await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  },

  async saveUsers(users: RegisteredUser[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users', e);
    }
  },

  async findUserByEmail(email: string): Promise<RegisteredUser | null> {
    const normalized = email.toLowerCase().trim();
    const users = await this.getUsers();
    return users.find(user => user.email.toLowerCase().trim() === normalized) ?? null;
  },

  async registerEmailUser(user: Omit<RegisteredUser, 'provider'>): Promise<{ ok: true } | { ok: false; reason: 'email_exists' }> {
    const normalized = user.email.toLowerCase().trim();
    const users = await this.getUsers();
    const exists = users.some(existing => existing.email.toLowerCase().trim() === normalized);
    if (exists) {
      return { ok: false, reason: 'email_exists' };
    }

    users.push({ ...user, id: user.id || generateId(), email: normalized, provider: 'email' });
    await this.saveUsers(users);
    return { ok: true };
  },

  async upsertSocialUser(user: Omit<RegisteredUser, 'provider' | 'password'> & { provider: 'google' | 'apple' }): Promise<RegisteredUser> {
    const normalized = user.email.toLowerCase().trim();
    const users = await this.getUsers();
    const index = users.findIndex(existing => existing.email.toLowerCase().trim() === normalized);
    const upserted: RegisteredUser = {
      ...user,
      id: (user as any).id || (index >= 0 ? users[index].id : generateId()),
      email: normalized,
      provider: user.provider,
    };

    if (index >= 0) {
      users[index] = {
        ...users[index],
        ...upserted,
        password: users[index].provider === 'email' ? users[index].password : undefined,
      };
    } else {
      users.push(upserted);
    }

    await this.saveUsers(users);
    return upserted;
  },

  async updateEmailUserPassword(email: string, password: string): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'social_account' }> {
    const normalized = email.toLowerCase().trim();
    const users = await this.getUsers();
    const index = users.findIndex(existing => existing.email.toLowerCase().trim() === normalized);

    if (index < 0) {
      return { ok: false, reason: 'not_found' };
    }

    if (users[index].provider !== 'email') {
      return { ok: false, reason: 'social_account' };
    }

    users[index] = {
      ...users[index],
      password,
    };
    await this.saveUsers(users);
    return { ok: true };
  },

  async createPasswordResetRequest(email: string, code: string): Promise<void> {
    const normalized = email.toLowerCase().trim();
    const codeHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${normalized}:${code}`
    );
    const request: PasswordResetRequest = {
      email: normalized,
      codeHash,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
    };

    await AsyncStorage.setItem(KEYS.PASSWORD_RESET_REQUEST, JSON.stringify(request));
  },

  async verifyPasswordResetCode(email: string, code: string): Promise<{ ok: true } | { ok: false; reason: 'not_requested' | 'expired' | 'invalid' | 'too_many_attempts' }> {
    const normalized = email.toLowerCase().trim();
    const data = await AsyncStorage.getItem(KEYS.PASSWORD_RESET_REQUEST);

    if (!data) {
      return { ok: false, reason: 'not_requested' };
    }

    const request = JSON.parse(data) as PasswordResetRequest;

    if (request.email !== normalized) {
      return { ok: false, reason: 'invalid' };
    }

    if (request.expiresAt < Date.now()) {
      await AsyncStorage.removeItem(KEYS.PASSWORD_RESET_REQUEST);
      return { ok: false, reason: 'expired' };
    }

    if (request.attempts >= 5) {
      await AsyncStorage.removeItem(KEYS.PASSWORD_RESET_REQUEST);
      return { ok: false, reason: 'too_many_attempts' };
    }

    const codeHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${normalized}:${code.trim()}`
    );

    if (codeHash !== request.codeHash) {
      await AsyncStorage.setItem(
        KEYS.PASSWORD_RESET_REQUEST,
        JSON.stringify({ ...request, attempts: request.attempts + 1 })
      );
      return { ok: false, reason: 'invalid' };
    }

    return { ok: true };
  },

  async clearPasswordResetRequest(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.PASSWORD_RESET_REQUEST);
  },
  // --- USER ROLE ---
  async getRole(): Promise<UserRole> {
    try {
      const role = await AsyncStorage.getItem(KEYS.ROLE);
      return (role as UserRole) || 'estudante';
    } catch {
      return 'estudante';
    }
  },

  async setRole(role: UserRole): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ROLE, role);
    } catch (e) {
      console.error('Error saving role', e);
    }
  },

  // --- TRAIL PROGRESS ---
  async getTrailProgress(): Promise<number[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRAIL_PROGRESS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async toggleTrailStep(stepId: number): Promise<number[]> {
    try {
      const current = await this.getTrailProgress();
      let updated: number[];
      if (current.includes(stepId)) {
        updated = current.filter(id => id !== stepId);
      } else {
        updated = [...current, stepId].sort((a, b) => a - b);
      }
      await AsyncStorage.setItem(KEYS.TRAIL_PROGRESS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error toggling step progress', e);
      return [];
    }
  },

  // --- ACHIEVEMENTS ---
  async getAchievementRecords(): Promise<AchievementRecord[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item: any) => (
        item?.targetType &&
        item?.targetId &&
        item?.achievementId &&
        typeof item?.earnedAt === 'number'
      ));
    } catch {
      return [];
    }
  },

  async saveAchievementRecords(records: AchievementRecord[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(records));
  },

  getAchievementDefinitions(targetType?: AchievementTargetType): AchievementDefinition[] {
    if (!targetType) return ACHIEVEMENT_CATALOG;
    return ACHIEVEMENT_CATALOG.filter(item => item.scope === targetType || item.scope === 'both');
  },

  async getAchievementsForTarget(targetType: AchievementTargetType, targetId: string): Promise<EarnedAchievement[]> {
    try {
      const records = await this.getAchievementRecords();
      return records
        .filter(record => record.targetType === targetType && record.targetId === targetId)
        .map(record => {
          const definition = ACHIEVEMENT_CATALOG.find(item => item.id === record.achievementId);
          if (!definition) return null;
          return {
            ...definition,
            targetType,
            targetId,
            earnedAt: record.earnedAt,
          } as EarnedAchievement;
        })
        .filter((item): item is EarnedAchievement => Boolean(item));
    } catch {
      return [];
    }
  },

  async awardAchievement(
    targetType: AchievementTargetType,
    targetId: string,
    achievementId: string
  ): Promise<EarnedAchievement | null> {
    try {
      const definition = ACHIEVEMENT_CATALOG.find(item => item.id === achievementId);
      if (!definition) return null;
      if (definition.scope !== 'both' && definition.scope !== targetType) return null;

      const current = await this.getAchievementRecords();
      const existing = current.find(item => (
        item.targetType === targetType &&
        item.targetId === targetId &&
        item.achievementId === achievementId
      ));
      if (existing) {
        return { ...definition, targetType, targetId, earnedAt: existing.earnedAt };
      }

      const record: AchievementRecord = {
        targetType,
        targetId,
        achievementId,
        earnedAt: Date.now(),
      };
      await this.saveAchievementRecords([...current, record]);
      return { ...definition, targetType, targetId, earnedAt: record.earnedAt };
    } catch (e) {
      console.error('Error awarding achievement', e);
      return null;
    }
  },

  async awardTrailStepAchievement(userId: string, stepId: number): Promise<EarnedAchievement | null> {
    const definition = ACHIEVEMENT_CATALOG.find(item => item.scope === 'user' && item.stepId === stepId);
    if (!definition) return null;
    return this.awardAchievement('user', userId, definition.id);
  },

  async syncUserAchievements(userId: string, completedStepIds: number[]): Promise<EarnedAchievement[]> {
    for (const stepId of completedStepIds) {
      await this.awardTrailStepAchievement(userId, stepId);
    }
    return this.getAchievementsForTarget('user', userId);
  },

  async syncCompanyAchievements(
    companyId: string,
    stats: { membersCount: number; eventCount: number; followersCount: number }
  ): Promise<EarnedAchievement[]> {
    if (stats.membersCount >= 10) {
      await this.awardAchievement('company', companyId, 'company-10-members');
    }
    if (stats.eventCount >= 1) {
      await this.awardAchievement('company', companyId, 'company-event-held');
    }
    if (stats.followersCount >= 100) {
      await this.awardAchievement('company', companyId, 'company-100-followers');
    }
    return this.getAchievementsForTarget('company', companyId);
  },

  // --- FEED POSTS ---
  async getFeedPosts(): Promise<FeedPost[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FEED_POSTS);
      if (!data) {
        // Initialize with default posts
        await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(INITIAL_FEED_POSTS));
        return INITIAL_FEED_POSTS;
      }
      const parsed = JSON.parse(data) as FeedPost[];
      let changed = false;
      const normalized = parsed.map(p => {
        if (p.createdAt) return p;
        changed = true;
        return { ...p, createdAt: Date.now() };
      });
      if (changed) {
        await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return INITIAL_FEED_POSTS;
    }
  },

  async addFeedPost(post: Omit<FeedPost, 'id' | 'date' | 'likes'>): Promise<FeedPost[]> {
    try {
      const current = await this.getFeedPosts();
      const newPost: FeedPost = {
        ...post,
        id: `post-${Date.now()}`,
        date: 'Agora mesmo',
        createdAt: Date.now(),
        likes: 0,
      };
      const updated = [newPost, ...current];
      await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(updated));
      const session = await this.getSession();
      if (session?.id) {
        await this.awardAchievement('user', session.id, 'user-first-post');
      }
      return updated;
    } catch (e) {
      console.error('Error adding feed post', e);
      return INITIAL_FEED_POSTS;
    }
  },

  async toggleLikePost(postId: string): Promise<FeedPost[]> {
    try {
      const current = await this.getFeedPosts();
      const updated = current.map(post => {
        if (post.id === postId) {
          return { ...post, likes: post.likes + 1 };
        }
        return post;
      });
      await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error liking post', e);
      return [];
    }
  },

  // --- SHARK TANK VOTES ---
  async getUserVotes(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SHARK_VOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async getSharkProjects(): Promise<SharkProject[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SHARK_PROJECTS);
      if (!data) {
        await AsyncStorage.setItem(KEYS.SHARK_PROJECTS, JSON.stringify(INITIAL_SHARK_PROJECTS));
        return INITIAL_SHARK_PROJECTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SHARK_PROJECTS;
    }
  },

  async voteForProject(projectId: string): Promise<{ projects: SharkProject[]; userVotes: string[] }> {
    try {
      const userVotes = await this.getUserVotes();
      const projects = await this.getSharkProjects();

      // Check if user has already voted for this project (limit 1 vote per project for engagement)
      if (userVotes.includes(projectId)) {
        return { projects, userVotes };
      }

      const updatedUserVotes = [...userVotes, projectId];
      const updatedProjects = projects.map(proj => {
        if (proj.id === projectId) {
          return { ...proj, votes: proj.votes + 1 };
        }
        return proj;
      });

      await AsyncStorage.setItem(KEYS.SHARK_VOTES, JSON.stringify(updatedUserVotes));
      await AsyncStorage.setItem(KEYS.SHARK_PROJECTS, JSON.stringify(updatedProjects));

      return { projects: updatedProjects, userVotes: updatedUserVotes };
    } catch (e) {
      console.error('Error voting for project', e);
      return { projects: INITIAL_SHARK_PROJECTS, userVotes: [] };
    }
  },

  // --- RESET APP STATE ---
  async resetAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.ROLE);
      await AsyncStorage.removeItem(KEYS.TRAIL_PROGRESS);
      await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(INITIAL_FEED_POSTS));
      await AsyncStorage.setItem(KEYS.SHARK_PROJECTS, JSON.stringify(INITIAL_SHARK_PROJECTS));
      await AsyncStorage.removeItem(KEYS.SHARK_VOTES);
      await AsyncStorage.removeItem(KEYS.SESSION);
      await AsyncStorage.removeItem(KEYS.CHECKED_SUBITEMS);
      await AsyncStorage.removeItem(KEYS.USERS);
      await AsyncStorage.removeItem(KEYS.ACHIEVEMENTS);
    } catch (e) {
      console.error('Error resetting AppStorage', e);
    }
  }
};
