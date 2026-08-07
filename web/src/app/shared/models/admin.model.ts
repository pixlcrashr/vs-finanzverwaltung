export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  groups: UserGroup[];
}

export interface UserGroup {
  id: string;
  customId: string;
  name: string;
  description: string | null;
  isActive?: boolean;
  isSystem?: boolean;
  /** Organization resource names (e.g. "organizations/{id}") or "*" for all. */
  organizations: string[];
  /** Permission strings in "resource:action" format. */
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportSource {
  id: string;
  name: string;
  description: string;
  periodStart: Date;
  periods: ImportSourcePeriod[];
}

export interface ImportSourcePeriod {
  id: string;
  year: number;
  isClosed: boolean;
  closedAt: Date | null;
}

export interface Setting {
  key: string;
  value: string;
  description: string;
}
