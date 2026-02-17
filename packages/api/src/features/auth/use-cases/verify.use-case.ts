import nacl from "tweetnacl";
import bs58 from "bs58";
import { sign } from "hono/jwt";
import { env } from "@spiral/env/server";

import { authRepository } from "../repositories/auth.repository";
import { solanaGateway } from "../gateways/solana.gateway";
import { AppError } from "../../../core/errors/app-error";

function verifySignature(params: { message: string; signature: string; publicKey: string }) {
  return nacl.sign.detached.verify(
    new TextEncoder().encode(params.message),
    bs58.decode(params.signature),
    bs58.decode(params.publicKey),
  );
}

export async function verifyUseCase(input: {
  publicKey: string;
  signature: string;
  nonce: string;
  inviteToken?: string;
}) {
  const challenge = await authRepository.findValidChallenge({
    publicKey: input.publicKey,
    nonce: input.nonce,
    now: new Date(),
  });

  if (!challenge) {
    throw new AppError("BAD_REQUEST", "errors.auth.invalid-or-expired-challenge");
  }

  const ok = verifySignature({
    message: challenge.message,
    signature: input.signature,
    publicKey: input.publicKey,
  });

  if (!ok) {
    throw new AppError("BAD_REQUEST", "errors.auth.invalid-signature");
  }

  await authRepository.consumeChallenge({ id: challenge.id });

  let organizationId: string | null = null;
  let role: number = 2;

  if (input.inviteToken) {
    const invite = await authRepository.findInviteForVerify({ token: input.inviteToken });

    if (!invite) throw new AppError("NOT_FOUND", "errors.invite.not-found");

    if (invite.status === "accepted") {
      throw new AppError("CONFLICT", "errors.invite.already-accepted");
    }

    const memberPda = await solanaGateway.resolveMemberPda({
      organizationPda: invite.organization.pda,
      userPublicKey: input.publicKey,
    });

    const exists = await solanaGateway.memberPdaExists({ memberPda });
    if (!exists) {
      throw new AppError("PRECONDITION_FAILED", "errors.auth.member-pda-missing", {
        memberPda,
        organizationId: invite.organizationId,
      });
    }

    await authRepository.acceptInviteTransaction({
      publicKey: input.publicKey,
      organizationId: invite.organizationId,
      role: invite.role,
      pda: memberPda,
      inviteId: invite.id,
    });

    organizationId = invite.organizationId;
    role = invite.role;
  } else {
    const membership = await authRepository.findMembershipByUser({ publicKey: input.publicKey });
    if (!membership) throw new AppError("NOT_FOUND", "errors.auth.no-org-for-user");

    organizationId = membership.organizationId;
    role = membership.role;
  }

  const token = await sign(
    {
      sub: input.publicKey,
      organizationId,
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
    env.JWT_SECRET,
  );

  return { token };
}
