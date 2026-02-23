import { db } from "@spiral/db";
import { invites, organizations } from "@spiral/db/schema/auth";
import { eq } from "drizzle-orm";

import type {
  CreateInviteInput,
  FindOrganizationByIdInput,
  OrganizationProjection,
} from "./invites.repository.types";

export const invitesRepository = {
  async createInvite(input: CreateInviteInput): Promise<string> {
    const [result] = await db
      .insert(invites)
      .values({
        token: input.token,
        organizationId: input.organizationId,
        role: input.role,
        status: "pending",
        expiresAt: input.expiresAt,
      })
      .returning({ id: invites.id });

    return result!.id;
  },

  async findOrganizationById(
    input: FindOrganizationByIdInput,
  ): Promise<OrganizationProjection | null> {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, input.organizationId),
      columns: { id: true, name: true, pda: true },
    });

    return org ?? null;
  },
} as const;
