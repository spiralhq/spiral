import { env } from "@spiral/env/server";
import { db } from "./index";
import { members, organizations, users } from "./schema";
import { eq } from "drizzle-orm";

const seedDefaultOrg = async () => {
  if (!env.DEFAULT_ORG_PDA) {
    console.warn("DEFAULT_ORG_PDA is not set. Skipping default organization seeding.");
    return;
  }

  const defaultOrg = {
    name: "Spiral Foundation",
    slug: "spiral",
    pda: env.DEFAULT_ORG_PDA ?? "",
  };

  let existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, defaultOrg.slug),
  });

  if (!existing) {
    const results = await db.insert(organizations).values(defaultOrg).returning();
    existing = results[0];
    console.log("Default organization created.");
  } else {
    console.log("Default organization already exists, skipping.");
  }

  return existing;
};

const seedAdminUser = async (organization: { id: string; pda: string }) => {
  if (!env.ADMIN_PUBLIC_KEY || !env.ADMIN_MEMBERSHIP_PDA) {
    console.warn(
      "ADMIN_PUBLIC_KEY or ADMIN_MEMBERSHIP_PDA is not set. Skipping admin user seeding.",
    );
    return;
  }

  const adminUser = {
    publicKey: env.ADMIN_PUBLIC_KEY,
    name: "Admin User",
  };

  let existingUser = await db.query.users.findFirst({
    where: eq(users.publicKey, adminUser.publicKey),
  });

  if (!existingUser) {
    const results = await db.insert(users).values(adminUser).returning();
    existingUser = results[0];
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  if (!existingUser) {
    console.error("Failed to create or find admin user, skipping membership seeding.");
    return;
  }

  const membership = {
    userPublicKey: existingUser.publicKey,
    organizationId: organization.id,
    pda: env.ADMIN_MEMBERSHIP_PDA,
    role: 1,
  };

  let existingMembership = await db.query.members.findFirst({
    where: eq(members.pda, membership.pda),
  });

  if (!existingMembership) {
    await db.insert(members).values(membership);
    console.log("Admin user added to default organization.");
  } else {
    console.log("Admin user already a member of the default organization, skipping.");
  }
};

async function main() {
  console.log("Seeding database...");
  try {
    const defaultOrg = await seedDefaultOrg();
    if (defaultOrg) {
      await seedAdminUser(defaultOrg);
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }

  console.log("Seeding completed successfully.");
  process.exit(0);
}

main();
