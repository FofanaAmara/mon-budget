export type FinancialSpace = {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
};

export type SpaceMember = {
  userId: string;
  name: string;
  email: string | null;
  joinedAt: string;
  isCurrentUser: boolean;
};

export type SpaceMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
