import type { db } from "@spiral/db";
import type { MemberFilters, MemberSortBy } from "../dtos/list-members.dto";

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbSession = Db | Tx;

export type ListByOrganizationInput = {
  organizationId: string;
};

export type MemberWithUserProjection = {
  userPublicKey: string;
  name: string | null;
  role: number;
  pda: string | null;
  createdAt?: Date;
};

export type ListMembersQueryOptions = {
  organizationId: string;
  offset: number;
  limit: number;
  sortBy: MemberSortBy | null;
  sortDir: "asc" | "desc";
  q: string | null;
  filters: MemberFilters | null;
};

export type ListMembersQueryResult = {
  items: MemberWithUserProjection[];
  total: number;
};
