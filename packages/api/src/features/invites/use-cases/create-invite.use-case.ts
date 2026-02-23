import { randomBytes } from "node:crypto";
import { env } from "@spiral/env/server";

import { invitesRepository } from "../repositories/invites.repository";
import { resendGateway } from "../gateways/resend.gateway";
import { AppError } from "../../../core/errors/app-error";
import type { CreateInviteOutput } from "../dtos/create-invite.dto";

const DEFAULT_WEB_URL = "https://spiralhq.dev";

export async function createInviteUseCase(input: {
  email: string;
  role: number;
  organizationId: string;
}): Promise<CreateInviteOutput> {
  const organization = await invitesRepository.findOrganizationById({
    organizationId: input.organizationId,
  });

  if (!organization) {
    throw new AppError("NOT_FOUND", "errors.orgs.not-found");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const inviteId = await invitesRepository.createInvite({
    token,
    organizationId: input.organizationId,
    role: input.role,
    expiresAt,
  });

  const webUrl = env.WEB_URL ?? DEFAULT_WEB_URL;
  const inviteUrl = `${webUrl}/login?invite=${token}`;

  await resendGateway.sendInviteEmail({
    to: input.email,
    organizationName: organization.name,
    inviteUrl,
  });

  return {
    success: true as const,
    inviteId,
  };
}
