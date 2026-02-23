import type { db } from "@spiral/db";

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbSession = Db | Tx;

export type FindOrganizationsByUserInput = {
  userPublicKey: string;
};

export type OrganizationWithRoleProjection = {
  id: string;
  name: string;
  slug: string;
  pda: string;
  role: number;
};

export type FindMembershipInput = {
  userPublicKey: string;
  organizationId: string;
};

export type MembershipForSwitchProjection = {
  organizationId: string;
  role: number;
  organization: {
    id: string;
    pda: string;
  };
};
