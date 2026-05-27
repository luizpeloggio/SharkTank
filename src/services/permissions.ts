import type { CompanyMembership } from '@/domain/company';
import { isLeader, isActiveMembership } from '@/domain/company';
import type { SystemRole } from '@/domain/user';

export function canViewCompanyArea(membership: CompanyMembership | null): boolean {
  return isActiveMembership(membership);
}

export function canSeeCompanyAdmin(membership: CompanyMembership | null): boolean {
  return isLeader(membership);
}

export function canEditCompanyProfile(membership: CompanyMembership | null): boolean {
  return isLeader(membership);
}

export function canTransferLeadership(membership: CompanyMembership | null): boolean {
  return isLeader(membership);
}

export function canManageCompanyPosts(args: { membership: CompanyMembership | null; systemRole?: SystemRole | null }): boolean {
  return args.systemRole === 'admin' || isLeader(args.membership);
}

