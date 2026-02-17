import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const memberStatus = pgEnum("member_status", ["active", "revoked"]);
export const inviteStatus = pgEnum("invite_status", ["pending", "accepted", "expired"]);

export const users = pgTable("users", {
  publicKey: text("public_key").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pda: text("pda").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userPublicKey: text("user_public_key")
      .notNull()
      .references(() => users.publicKey, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    pda: text("pda").notNull().unique(),
    role: integer("role").notNull(),
    status: memberStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("member_user_org_unique").on(t.userPublicKey, t.organizationId)],
);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: integer("role").notNull().default(2),
  status: inviteStatus("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicKey: text("public_key").notNull(),
  nonce: text("nonce").notNull().unique(),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(members),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(members),
  invites: many(invites),
}));

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userPublicKey],
    references: [users.publicKey],
  }),
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  organization: one(organizations, {
    fields: [invites.organizationId],
    references: [organizations.id],
  }),
}));
