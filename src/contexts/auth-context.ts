import { createContext } from 'react';
import type { UserSession } from '@/services/storage';

export const AuthContext = createContext<{
  session: UserSession | null;
  login: (session: UserSession) => void;
  logout: () => void;
  updateSession: (session: UserSession) => Promise<void>;
  isLoading: boolean;
}>({
  session: null,
  login: () => {},
  logout: () => {},
  updateSession: async () => {},
  isLoading: true,
});

