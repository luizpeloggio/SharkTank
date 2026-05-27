export type SystemRole = 'estudante' | 'lider' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  systemRole: SystemRole;
}

