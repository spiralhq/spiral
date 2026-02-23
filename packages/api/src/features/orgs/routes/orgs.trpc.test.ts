import { describe, it, expect, vi, beforeEach } from "vitest";
import { orgsRouter } from "./orgs.trpc";
import { listMyOrganizationsUseCase } from "../use-cases/list-my-organizations.use-case";
import { switchOrganizationUseCase } from "../use-cases/switch-organization.use-case";
import { setCookie } from "hono/cookie";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("hono/cookie", () => ({
  setCookie: vi.fn(),
}));

vi.mock("../use-cases/list-my-organizations.use-case", () => ({
  listMyOrganizationsUseCase: vi.fn(),
}));

vi.mock("../use-cases/switch-organization.use-case", () => ({
  switchOrganizationUseCase: vi.fn(),
}));

const mockedListMine = vi.mocked(listMyOrganizationsUseCase);
const mockedSwitch = vi.mocked(switchOrganizationUseCase);
const mockedSetCookie = vi.mocked(setCookie);

describe("orgsRouter (tRPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("orgs.listMine", () => {
    it("throws UNAUTHORIZED when session is null", async () => {
      const caller = orgsRouter.createCaller({ session: null, hono: {} as any });

      try {
        await caller.listMine();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns organizations list when authenticated", async () => {
      mockedListMine.mockResolvedValue([
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Org 1",
          slug: "org-1",
          pda: "pda-1",
          role: 1,
          isActive: true,
        },
      ]);

      const caller = orgsRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      const result = await caller.listMine();

      expect(result).toHaveLength(1);
      expect(result[0]?.isActive).toBe(true);
    });

    it("calls use case with correct parameters", async () => {
      mockedListMine.mockResolvedValue([]);

      const caller = orgsRouter.createCaller({
        session: { publicKey: "my-wallet", organizationId: "my-org", role: 2 },
        hono: {} as any,
      });

      await caller.listMine();

      expect(mockedListMine).toHaveBeenCalledWith({
        publicKey: "my-wallet",
        currentOrganizationId: "my-org",
      });
    });
  });

  describe("orgs.switch", () => {
    it("throws UNAUTHORIZED when session is null", async () => {
      const caller = orgsRouter.createCaller({ session: null, hono: {} as any });

      try {
        await caller.switch({ organizationId: "550e8400-e29b-41d4-a716-446655440000" });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns success and sets cookie when switch is successful", async () => {
      mockedSwitch.mockResolvedValue({ token: "new-jwt-token" });

      const mockHono = {} as any;
      const caller = orgsRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 1 },
        hono: mockHono,
      });

      const result = await caller.switch({
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result).toEqual({ success: true });
      expect(mockedSetCookie).toHaveBeenCalledWith(
        mockHono,
        "session",
        "new-jwt-token",
        expect.any(Object),
      );
    });

    it("calls use case with correct parameters", async () => {
      mockedSwitch.mockResolvedValue({ token: "token" });

      const caller = orgsRouter.createCaller({
        session: { publicKey: "wallet123", organizationId: "org-1", role: 1 },
        hono: {} as any,
      });

      await caller.switch({ organizationId: "550e8400-e29b-41d4-a716-446655440000" });

      expect(mockedSwitch).toHaveBeenCalledWith({
        publicKey: "wallet123",
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
      });
    });
  });
});
