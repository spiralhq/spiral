import { describe, it, expect, vi, beforeEach } from "vitest";
import { invitesRouter } from "./invites.trpc";
import { createInviteUseCase } from "../use-cases/create-invite.use-case";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("../use-cases/create-invite.use-case", () => ({
  createInviteUseCase: vi.fn(),
}));

const mockedCreateInvite = vi.mocked(createInviteUseCase);

describe("invitesRouter (tRPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invites.create", () => {
    it("throws UNAUTHORIZED when session is null", async () => {
      const caller = invitesRouter.createCaller({ session: null, hono: {} as any });

      try {
        await caller.create({ email: "test@example.com", role: 2 });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("UNAUTHORIZED");
      }
    });

    it("throws FORBIDDEN when user is not admin", async () => {
      const caller = invitesRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 2 },
        hono: {} as any,
      });

      try {
        await caller.create({ email: "test@example.com", role: 2 });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
        expect(err.cause).toMatchObject({ i18nKey: "errors.auth.forbidden" });
      }
    });

    it("creates invite when admin", async () => {
      mockedCreateInvite.mockResolvedValue({
        success: true,
        inviteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const caller = invitesRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      const result = await caller.create({ email: "test@example.com", role: 2 });

      expect(result.success).toBe(true);
      expect(result.inviteId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("calls use case with correct parameters", async () => {
      mockedCreateInvite.mockResolvedValue({
        success: true,
        inviteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const caller = invitesRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "my-org", role: 1 },
        hono: {} as any,
      });

      await caller.create({ email: "invitee@example.com", role: 1 });

      expect(mockedCreateInvite).toHaveBeenCalledWith({
        email: "invitee@example.com",
        role: 1,
        organizationId: "my-org",
      });
    });

    it("uses default role 2 when not specified", async () => {
      mockedCreateInvite.mockResolvedValue({
        success: true,
        inviteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const caller = invitesRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      await caller.create({ email: "test@example.com" });

      expect(mockedCreateInvite).toHaveBeenCalledWith(expect.objectContaining({ role: 2 }));
    });
  });
});
