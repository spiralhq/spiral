import type { db } from "@spiral/db";

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbSession = Db | Tx;

export type CreateInviteInput = {
  token: string;
  organizationId: string;
  role: number;
  expiresAt: Date;
};

export type FindOrganizationByIdInput = {
  organizationId: string;
};

export type OrganizationProjection = {
  id: string;
  name: string;
  pda: string;
};
