import type { db } from "@spiral/db";

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbSession = Db | Tx;

export type ChallengeEntity = {
  message: string;
  publicKey: string;
  id: string;
  expiresAt: Date;
  nonce: string;
};

export type CreateChallengeInput = {
  publicKey: string;
  nonce: string;
  message: string;
  expiresAt: Date;
};

export type FindValidChallengeInput = {
  publicKey: string;
  nonce: string;
  now: Date;
};

export type ConsumeChallengeInput = { id: string };

export type UpsertUserInput = { publicKey: string };

export type CreateMembershipInput = {
  userPublicKey: string;
  organizationId: string;
  role: number;
  pda: string;
};

export type AcceptInviteInput = { inviteId: string };

export type FindMembershipByUserInput = { publicKey: string };

export type FindMeInput = {
  publicKey: string;
  organizationId: string;
};

export type MembershipProjection = {
  organizationId: string;
  role: number;
  pda: string | null;
};

export type MeProjection = {
  publicKey: string;
  name: string | null;
  organization: {
    id: string;
    pda: string;
    name: string;
    slug: string;
    createdAt: Date;
  } | null;
  role: number | null;
};

export type AcceptInviteTransactionInput = {
  publicKey: string;
  organizationId: string;
  role: number;
  pda: string;
  inviteId: string;
};

export type InviteForVerify = {
  id: string;
  organizationId: string;
  role: number;
  status: "pending" | "accepted" | "expired";
  organization: {
    id: string;
    pda: string;
  };
};
