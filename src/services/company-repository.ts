import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Company, CompanyMembership, CompanyRole } from '@/domain/company';

const KEYS = {
  COMPANIES: '@uern_impactoej_companies',
  MEMBERSHIPS: '@uern_impactoej_company_memberships',
  ACTIVE_COMPANY_BY_USER: '@uern_impactoej_active_company_by_user',
  COMPANY_POSTS: '@uern_impactoej_company_posts',
};

type ActiveCompanyByUser = Record<string, string | null>;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const CompanyRepository = {
  async listCompanies(): Promise<Company[]> {
    const companies = await readJson<Record<string, Company>>(KEYS.COMPANIES, {});
    return Object.values(companies).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getCompany(companyId: string): Promise<Company | null> {
    const companies = await readJson<Record<string, Company>>(KEYS.COMPANIES, {});
    const company = companies[companyId] ?? null;
    if (!company) return null;

    // Compatibilidade: versões antigas usavam `tags` pra área/localização/conquistas.
    // Agora separamos em `badges` (institucional), `location` (institucional) e `achievements` (sistema).
    const hadBadges = Array.isArray(company.badges);
    if (!hadBadges && Array.isArray(company.tags)) {
      company.badges = company.tags;
    }
    if (!hadBadges && !company.location && Array.isArray(company.tags) && typeof company.tags[1] === 'string') {
      company.location = company.tags[1].replace('#', '').trim() || undefined;
    }
    return company;
  },

  async upsertCompany(company: Company): Promise<Company> {
    const companies = await readJson<Record<string, Company>>(KEYS.COMPANIES, {});
    // Normaliza e mantém compatibilidade: se ainda tiver `tags`, preenche `badges` quando faltar.
    const normalized: Company = {
      ...company,
      badges: company.badges ?? company.tags ?? [],
      achievements: company.achievements ?? [],
      location: company.location?.trim() ? company.location.trim() : undefined,
    };
    companies[company.id] = normalized;
    await writeJson(KEYS.COMPANIES, companies);
    return normalized;
  },

  async listMemberships(): Promise<CompanyMembership[]> {
    return await readJson<CompanyMembership[]>(KEYS.MEMBERSHIPS, []);
  },

  async saveMemberships(memberships: CompanyMembership[]): Promise<void> {
    await writeJson(KEYS.MEMBERSHIPS, memberships);
  },

  async listMembers(companyId: string): Promise<CompanyMembership[]> {
    const memberships = await this.listMemberships();
    return memberships.filter(m => m.companyId === companyId && m.status !== 'removed');
  },

  async getMembership(companyId: string, userId: string): Promise<CompanyMembership | null> {
    const memberships = await this.listMemberships();
    return memberships.find(m => m.companyId === companyId && m.userId === userId) ?? null;
  },

  async addMember(membership: CompanyMembership): Promise<void> {
    const memberships = await this.listMemberships();
    const existsIndex = memberships.findIndex(m => m.companyId === membership.companyId && m.userId === membership.userId);
    if (existsIndex >= 0) {
      memberships[existsIndex] = { ...memberships[existsIndex], ...membership };
    } else {
      memberships.push(membership);
    }
    await this.saveMemberships(memberships);
  },

  async updateMemberRole(companyId: string, userId: string, role: CompanyRole): Promise<void> {
    const memberships = await this.listMemberships();
    const idx = memberships.findIndex(m => m.companyId === companyId && m.userId === userId);
    if (idx < 0) return;
    memberships[idx] = { ...memberships[idx], role };
    await this.saveMemberships(memberships);
  },

  async transferLeadership(companyId: string, fromUserId: string, toUserId: string): Promise<{ ok: true } | { ok: false; reason: 'not_leader' | 'target_not_member' }> {
    const memberships = await this.listMemberships();
    const from = memberships.find(m => m.companyId === companyId && m.userId === fromUserId);
    if (!from || from.status !== 'active' || from.role !== 'leader') {
      return { ok: false, reason: 'not_leader' };
    }
    const to = memberships.find(m => m.companyId === companyId && m.userId === toUserId);
    if (!to || to.status !== 'active') {
      return { ok: false, reason: 'target_not_member' };
    }

    const next = memberships.map(m => {
      if (m.companyId !== companyId) return m;
      if (m.userId === fromUserId) return { ...m, role: 'member' as const };
      if (m.userId === toUserId) return { ...m, role: 'leader' as const };
      return m;
    });
    await this.saveMemberships(next);
    return { ok: true };
  },

  async getActiveCompanyIdForUser(userId: string): Promise<string | null> {
    const map = await readJson<ActiveCompanyByUser>(KEYS.ACTIVE_COMPANY_BY_USER, {});
    return map[userId] ?? null;
  },

  async setActiveCompanyIdForUser(userId: string, companyId: string | null): Promise<void> {
    const map = await readJson<ActiveCompanyByUser>(KEYS.ACTIVE_COMPANY_BY_USER, {});
    map[userId] = companyId;
    await writeJson(KEYS.ACTIVE_COMPANY_BY_USER, map);
  },

  async listCompanyPosts(): Promise<CompanyPost[]> {
    return await readJson<CompanyPost[]>(KEYS.COMPANY_POSTS, []);
  },

  async saveCompanyPosts(posts: CompanyPost[]): Promise<void> {
    await writeJson(KEYS.COMPANY_POSTS, posts);
  },

  async listPostsByCompany(companyId: string): Promise<CompanyPost[]> {
    const posts = await this.listCompanyPosts();
    return posts.filter(p => p.companyId === companyId).sort((a, b) => b.createdAt - a.createdAt);
  },

  async addCompanyPost(post: CompanyPost): Promise<void> {
    const posts = await this.listCompanyPosts();
    const updated = [post, ...posts];
    await this.saveCompanyPosts(updated);
  },

  async updateCompanyPost(postId: string, patch: Partial<Pick<CompanyPost, 'title' | 'content' | 'category'>>): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
    const posts = await this.listCompanyPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index < 0) return { ok: false, reason: 'not_found' };

    posts[index] = {
      ...posts[index],
      title: patch.title?.trim() ? patch.title.trim() : posts[index].title,
      content: patch.content?.trim() ? patch.content.trim() : posts[index].content,
      category: patch.category ?? posts[index].category,
    };
    await this.saveCompanyPosts(posts);
    return { ok: true };
  },

  async deleteCompanyPost(postId: string): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
    const posts = await this.listCompanyPosts();
    const existing = posts.find(p => p.id === postId);
    if (!existing) return { ok: false, reason: 'not_found' };
    await this.saveCompanyPosts(posts.filter(p => p.id !== postId));
    return { ok: true };
  },
};

export type CompanyPostCategory = 'noticia' | 'vaga' | 'evento';

export interface CompanyPost {
  id: string;
  companyId: string;
  title: string;
  content: string;
  category: CompanyPostCategory;
  createdAt: number;
  authorUserId: string;
}

