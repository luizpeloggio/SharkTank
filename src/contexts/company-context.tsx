import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Company, CompanyMembership } from '@/domain/company';
import { CompanyService } from '@/services/company-service';
import { CompanyRepository } from '@/services/company-repository';
import { AuthContext } from '@/contexts/auth-context';

type CompanyContextValue = {
  isLoading: boolean;
  companyId: string | null;
  company: Company | null;
  membership: CompanyMembership | null;
  refresh: () => Promise<void>;
  setActiveCompanyId: (companyId: string | null) => Promise<void>;
};

const CompanyContext = createContext<CompanyContextValue>({
  isLoading: true,
  companyId: null,
  company: null,
  membership: null,
  refresh: async () => {},
  setActiveCompanyId: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { session } = useContext(AuthContext);
  const userId = session?.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [membership, setMembership] = useState<CompanyMembership | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCompanyId(null);
      setCompany(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await CompanyService.getActiveCompanyForUser(userId);
    setCompanyId(data.companyId);
    setCompany(data.company);
    setMembership(data.membership);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveCompanyId = useCallback(async (nextCompanyId: string | null) => {
    if (!userId) return;
    await CompanyRepository.setActiveCompanyIdForUser(userId, nextCompanyId);
    await refresh();
  }, [refresh, userId]);

  const value = useMemo(() => ({
    isLoading,
    companyId,
    company,
    membership,
    refresh,
    setActiveCompanyId,
  }), [isLoading, companyId, company, membership, refresh, setActiveCompanyId]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  return useContext(CompanyContext);
}

