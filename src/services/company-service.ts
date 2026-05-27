import * as Crypto from 'expo-crypto';
import type { Company, CompanyMembership } from '@/domain/company';
import { CompanyRepository } from '@/services/company-repository';

function generateId(): string {
  const maybe = (Crypto as any)?.randomUUID?.();
  if (typeof maybe === 'string' && maybe.length > 0) return maybe;
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const CompanyService = {
  async getActiveCompanyForUser(userId: string): Promise<{ company: Company | null; membership: CompanyMembership | null; companyId: string | null }> {
    const companyId = await CompanyRepository.getActiveCompanyIdForUser(userId);
    if (!companyId) return { company: null, membership: null, companyId: null };
    const [company, membership] = await Promise.all([
      CompanyRepository.getCompany(companyId),
      CompanyRepository.getMembership(companyId, userId),
    ]);
    return { company, membership, companyId };
  },

  async createCompanyForUser(input: { userId: string; name: string; description?: string; logo?: string }): Promise<{ company: Company; membership: CompanyMembership }> {
    const now = Date.now();
    const company: Company = {
      id: generateId(),
      name: input.name.trim(),
      description: input.description?.trim() ? input.description.trim() : undefined,
      avatar: input.logo,
      badges: [],
      location: undefined,
      achievements: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    await CompanyRepository.upsertCompany(company);

    const membership: CompanyMembership = {
      companyId: company.id,
      userId: input.userId,
      role: 'leader',
      status: 'active',
      createdAt: now,
    };
    await CompanyRepository.addMember(membership);
    await CompanyRepository.setActiveCompanyIdForUser(input.userId, company.id);
    return { company, membership };
  },

  async updateCompany(
    companyId: string,
    patch: Partial<Pick<Company, 'name' | 'description' | 'avatar' | 'badges' | 'location'>>
  ): Promise<Company | null> {
    const existing = await CompanyRepository.getCompany(companyId);
    if (!existing) return null;
    const updated: Company = {
      ...existing,
      name: patch.name?.trim() ? patch.name.trim() : existing.name,
      description: patch.description !== undefined ? (patch.description.trim() ? patch.description.trim() : undefined) : existing.description,
      avatar: patch.avatar !== undefined ? patch.avatar : existing.avatar,
      badges: patch.badges !== undefined ? patch.badges : existing.badges,
      location: patch.location !== undefined ? (patch.location.trim() ? patch.location.trim() : undefined) : existing.location,
      tags: patch.badges !== undefined ? patch.badges : existing.tags,
      updatedAt: Date.now(),
    };
    await CompanyRepository.upsertCompany(updated);
    return updated;
  },
};

