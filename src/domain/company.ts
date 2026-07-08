export type CompanyRole = 'leader' | 'member';
export type MembershipStatus = 'active' | 'invited' | 'removed';

export interface Company {
  id: string;
  name: string;
  username?: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  /**
   * Institucional: badges/tags livres editáveis pela empresa.
   * (Não confundir com conquistas do sistema.)
   */
  badges?: string[];
  /** Institucional: localização editável pela empresa (ex: "Mossoró, RN"). */
  location?: string;
  /** Sistema: conquistas geradas automaticamente (não editáveis pela empresa). */
  achievements?: string[];
  /**
   * Campo legado (não usar em novas telas).
   * Mantido apenas para compatibilidade com dados já persistidos.
   */
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CompanyMembership {
  companyId: string;
  userId: string;
  role: CompanyRole;
  status: MembershipStatus;
  title?: string;
  createdAt: number;
}

export function isActiveMembership(m: CompanyMembership | null | undefined): m is CompanyMembership {
  return !!m && m.status === 'active';
}

export function isLeader(m: CompanyMembership | null | undefined): boolean {
  return !!m && m.status === 'active' && m.role === 'leader';
}

