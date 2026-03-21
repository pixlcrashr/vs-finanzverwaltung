export interface Account {
  id: string;
  name: string;
  code: string;
  description: string;
  depth: number;
  isArchived: boolean;
  parentAccountId: string | null;
  children: Account[];
}
