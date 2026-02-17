import { db } from "@spiral/db";
import { challenges, invites, members, organizations, users } from "@spiral/db/schema/auth";
import { and, eq, gt } from "drizzle-orm";

import type {
  AcceptInviteInput,
  AcceptInviteTransactionInput,
  ChallengeEntity,
  ConsumeChallengeInput,
  CreateChallengeInput,
  CreateMembershipInput,
  DbSession,
  FindMeInput,
  FindMembershipByUserInput,
  FindValidChallengeInput,
  InviteForVerify,
  MeProjection,
  MembershipProjection,
  UpsertUserInput,
} from "./auth.repository.types";

export const authRepository = {
  async createChallenge(input: CreateChallengeInput): Promise<void> {
    await db.insert(challenges).values(input);
  },

  async findValidChallenge(input: FindValidChallengeInput): Promise<ChallengeEntity | null> {
    const challenge = await db.query.challenges.findFirst({
      where: and(
        eq(challenges.publicKey, input.publicKey),
        eq(challenges.nonce, input.nonce),
        gt(challenges.expiresAt, input.now),
      ),
    });

    return challenge ?? null;
  },

  async consumeChallenge(input: ConsumeChallengeInput): Promise<void> {
    await db.delete(challenges).where(eq(challenges.id, input.id));
  },

  async findInviteForVerify(input: { token: string }): Promise<InviteForVerify | null> {
    const rows = await db
      .select({
        inviteId: invites.id,
        organizationId: invites.organizationId,
        role: invites.role,
        status: invites.status,
        organization: {
          id: organizations.id,
          pda: organizations.pda,
        },
      })
      .from(invites)
      .innerJoin(organizations, eq(invites.organizationId, organizations.id))
      .where(eq(invites.token, input.token))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.inviteId,
      organizationId: row.organizationId,
      role: row.role,
      status: row.status,
      organization: row.organization,
    };
  },

  async upsertUser(input: UpsertUserInput, session: DbSession = db): Promise<void> {
    await session.insert(users).values({ publicKey: input.publicKey }).onConflictDoNothing();
  },

  async createMembership(input: CreateMembershipInput, session: DbSession = db): Promise<void> {
    await session.insert(members).values({
      userPublicKey: input.userPublicKey,
      organizationId: input.organizationId,
      role: input.role,
      pda: input.pda,
    });
  },

  async acceptInvite(input: AcceptInviteInput, session: DbSession = db): Promise<void> {
    await session.update(invites).set({ status: "accepted" }).where(eq(invites.id, input.inviteId));
  },

  async findMembershipByUser(
    input: FindMembershipByUserInput,
  ): Promise<MembershipProjection | null> {
    const membership = await db.query.members.findFirst({
      where: eq(members.userPublicKey, input.publicKey),
      columns: { organizationId: true, role: true, pda: true },
    });
    return membership ?? null;
  },

  async findMe(input: FindMeInput): Promise<MeProjection | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.publicKey, input.publicKey),
      with: {
        memberships: {
          where: eq(members.organizationId, input.organizationId),
          with: { organization: true },
        },
      },
    });

    if (!user) return null;

    return {
      publicKey: user.publicKey,
      name: user.name,
      organization: user.memberships[0]?.organization ?? null,
      role: user.memberships[0]?.role ?? null,
    };
  },

  async acceptInviteTransaction(input: AcceptInviteTransactionInput): Promise<void> {
    await db.transaction(async (tx) => {
      await authRepository.upsertUser({ publicKey: input.publicKey }, tx);
      await authRepository.createMembership(
        {
          userPublicKey: input.publicKey,
          organizationId: input.organizationId,
          role: input.role,
          pda: input.pda,
        },
        tx,
      );
      await authRepository.acceptInvite({ inviteId: input.inviteId }, tx);
    });
  },
} as const;
