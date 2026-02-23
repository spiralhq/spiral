import { sign } from "hono/jwt";
import { env } from "@spiral/env/server";

import { orgsRepository } from "../repositories/orgs.repository";
import { solanaGateway } from "../../auth/gateways/solana.gateway";
import { AppError } from "../../../core/errors/app-error";

export async function switchOrganizationUseCase(input: {
  publicKey: string;
  organizationId: string;
}): Promise<{ token: string }> {
  const membership = await orgsRepository.findMembershipForSwitch({
    userPublicKey: input.publicKey,
    organizationId: input.organizationId,
  });

  if (!membership) {
    throw new AppError("FORBIDDEN", "errors.orgs.not-a-member");
  }

  // Optional on-chain verification: verify membership exists on-chain
  const memberPda = await solanaGateway.resolveMemberPda({
    organizationPda: membership.organization.pda,
    userPublicKey: input.publicKey,
  });

  const exists = await solanaGateway.memberPdaExists({ memberPda });
  if (!exists) {
    throw new AppError("PRECONDITION_FAILED", "errors.orgs.member-pda-missing", {
      memberPda,
      organizationId: input.organizationId,
    });
  }

  const token = await sign(
    {
      sub: input.publicKey,
      organizationId: membership.organizationId,
      role: membership.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
    env.JWT_SECRET,
  );

  return { token };
}
