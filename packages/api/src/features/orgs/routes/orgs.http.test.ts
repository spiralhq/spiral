import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCookie, setCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { orgsHttp } from "./orgs.http";
import { listMyOrganizationsUseCase } from "../use-cases/list-my-organizations.use-case";
import { switchOrganizationUseCase } from "../use-cases/switch-organization.use-case";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("hono/cookie", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("hono/jwt", () => ({
  verify: vi.fn(),
}));

vi.mock("../use-cases/list-my-organizations.use-case", () => ({
  listMyOrganizationsUseCase: vi.fn(),
}));

vi.mock("../use-cases/switch-organization.use-case", () => ({
  switchOrganizationUseCase: vi.fn(),
}));

const mockedGetCookie = vi.mocked(getCookie);
const mockedVerify = vi.mocked(verify);
const mockedListMine = vi.mocked(listMyOrganizationsUseCase);
const mockedSwitch = vi.mocked(switchOrganizationUseCase);
const mockedSetCookie = vi.mocked(setCookie);

describe("orgsHttp routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /mine", () => {
    it("returns 401 when not authenticated", async () => {
      mockedGetCookie.mockReturnValue(undefined);

      const res = await orgsHttp.request("/mine");
      expect(res.status).toBe(401);
    });

    it("returns organizations list when authenticated", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
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

      const res = await orgsHttp.request("/mine");
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body).toHaveLength(1);
      expect(body[0].isActive).toBe(true);
    });

    it("calls use case with correct parameters", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedListMine.mockResolvedValue([]);

      await orgsHttp.request("/mine");

      expect(mockedListMine).toHaveBeenCalledWith({
        publicKey: "wallet123",
        currentOrganizationId: "org-1",
      });
    });
  });

  describe("POST /switch", () => {
    it("returns 401 when not authenticated", async () => {
      mockedGetCookie.mockReturnValue(undefined);

      const res = await orgsHttp.request("/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "550e8400-e29b-41d4-a716-446655440000" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns success and sets cookie when switch is successful", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });
      mockedSwitch.mockResolvedValue({ token: "new-jwt-token" });

      const res = await orgsHttp.request("/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "550e8400-e29b-41d4-a716-446655440000" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true });
      expect(mockedSetCookie).toHaveBeenCalledWith(
        expect.anything(),
        "session",
        "new-jwt-token",
        expect.any(Object),
      );
    });

    it("returns 400 for invalid organizationId", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });

      const res = await orgsHttp.request("/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "not-a-uuid" }),
      });

      expect(res.status).toBe(400);
    });
  });
});
