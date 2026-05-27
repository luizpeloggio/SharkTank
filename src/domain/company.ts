export type CompanyRole = 'leader' | 'member';
export type MembershipStatus = 'active' | 'invited' | 'removed';

export interface Company {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CompanyMembership {
  companyId: string;
  userId: string;
  role: CompanyRole;
  status: MembershipStatus;
  createdAt: number;
}

export function isActiveMembership(m: CompanyMembership | null | undefined): m is CompanyMembership {
  return !!m && m.status === 'active';
}

export function isLeader(m: CompanyMembership | null | undefined): boolean {
  return !!m && m.status === 'active' && m.role === 'leader';
}

