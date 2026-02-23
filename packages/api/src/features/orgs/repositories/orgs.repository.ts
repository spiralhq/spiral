import { db } from "@spiral/db";
import { members, organizations } from "@spiral/db/schema/auth";
import { eq, and } from "drizzle-orm";

import type {
  FindOrganizationsByUserInput,
  FindMembershipInput,
  OrganizationWithRoleProjection,
  MembershipForSwitchProjection,
} from "./orgs.repository.types";

export const orgsRepository = {
  async findOrganizationsByUser(
    input: FindOrganizationsByUserInput,
  ): Promise<OrganizationWithRoleProjection[]> {
    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        pda: organizations.pda,
        role: members.role,
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(eq(members.userPublicKey, input.userPublicKey));

    return rows;
  },

  async findMembershipForSwitch(
    input: FindMembershipInput,
  ): Promise<MembershipForSwitchProjection | null> {
    const rows = await db
      .select({
        organizationId: members.organizationId,
        role: members.role,
        organization: {
          id: organizations.id,
          pda: organizations.pda,
        },
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(
        and(
          eq(members.userPublicKey, input.userPublicKey),
          eq(members.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  },
} as const;
