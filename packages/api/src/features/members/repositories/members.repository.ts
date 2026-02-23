import { db } from "@spiral/db";
import { members, users } from "@spiral/db/schema/auth";
import { eq, and, or, ilike, isNotNull, isNull, sql, asc, desc } from "drizzle-orm";

import type { ListMembersQueryOptions, ListMembersQueryResult } from "./members.repository.types";

export const membersRepository = {
  async listWithQuery(options: ListMembersQueryOptions): Promise<ListMembersQueryResult> {
    const { organizationId, offset, limit, sortBy, sortDir, q, filters } = options;

    const conditions = [eq(members.organizationId, organizationId)];

    if (q) {
      const searchPattern = `%${q}%`;
      conditions.push(
        or(ilike(users.name, searchPattern), ilike(members.userPublicKey, searchPattern))!,
      );
    }

    if (filters?.role !== undefined) {
      conditions.push(eq(members.role, filters.role));
    }

    if (filters?.hasPda !== undefined) {
      if (filters.hasPda) {
        conditions.push(isNotNull(members.pda));
      } else {
        conditions.push(isNull(members.pda));
      }
    }

    const whereClause = and(...conditions);

    const sortColumn = getSortColumn(sortBy);
    const orderFn = sortDir === "desc" ? desc : asc;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .innerJoin(users, eq(members.userPublicKey, users.publicKey))
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const rows = await db
      .select({
        userPublicKey: members.userPublicKey,
        name: users.name,
        role: members.role,
        pda: members.pda,
        createdAt: members.createdAt,
      })
      .from(members)
      .innerJoin(users, eq(members.userPublicKey, users.publicKey))
      .where(whereClause)
      .orderBy(sortColumn ? orderFn(sortColumn) : asc(members.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      total,
    };
  },
} as const;

function getSortColumn(sortBy: string | null) {
  switch (sortBy) {
    case "name":
      return users.name;
    case "role":
      return members.role;
    case "publicKey":
      return members.userPublicKey;
    case "createdAt":
      return members.createdAt;
    default:
      return null;
  }
}
